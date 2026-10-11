import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  handleInterest,
  notifyInterest,
  hashIp,
  readInput,
  verifyTurnstile,
} from './ajk-interest-server'
const request = (body = '{}', type = 'application/json') =>
  new Request('https://jejakmasjid.my/api/ajk-interest', {
    method: 'POST',
    headers: {
      Origin: 'https://jejakmasjid.my',
      Accept: 'application/json',
      'Content-Type': type,
    },
    body,
  })
afterEach(() => vi.unstubAllGlobals())
describe('notification', () => {
  const data = {
    name: 'QA',
    role: 'ajk',
    masjid_name: 'Masjid Ujian',
    venue_type: 'masjid',
    area: 'Putrajaya',
    state: 'W.P. Putrajaya',
    phone: '60123456789',
    email: '',
    needs: ['lain'],
    congregation_size: '',
    notes: '',
    source: 'web',
  }
  it('silently skips notification without recipient', async () => {
    const send = vi.fn()
    await notifyInterest({ EMAIL: { send } }, data, 'id', 'now', 'qa')
    expect(send).not.toHaveBeenCalled()
  })
  it('sends the structured Email Service payload', async () => {
    const send = vi.fn().mockResolvedValue({})
    await notifyInterest(
      { EMAIL: { send }, AJK_INTEREST_NOTIFY_TO: 'qa@example.test' },
      data,
      'id',
      'now',
      'qa',
    )
    expect(send).toHaveBeenCalledOnce()
    const message = send.mock.calls[0][0]
    expect(message).toMatchObject({
      to: 'qa@example.test',
      from: { email: 'ajk@notify.jejakmasjid.my' },
      subject: 'Minat AJK: Masjid Ujian (Putrajaya)',
    })
    expect(message.text).toContain('masjid_name: Masjid Ujian')
  })
  it('rejects a recipient containing CR/LF', async () => {
    const send = vi.fn()
    await notifyInterest(
      { EMAIL: { send }, AJK_INTEREST_NOTIFY_TO: 'a@b.test\r\nBcc: x@y.test' },
      data,
      'id',
      'now',
      'qa',
    )
    expect(send).not.toHaveBeenCalled()
  })
  it('contains send failure and logs without PII', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    const send = vi.fn().mockRejectedValue(new Error('mail rejected'))
    await expect(
      notifyInterest(
        { EMAIL: { send }, AJK_INTEREST_NOTIFY_TO: 'qa@example.test' },
        data,
        'id',
        'now',
        'qa',
      ),
    ).resolves.toBeUndefined()
    expect(log).toHaveBeenCalledWith(
      '[ajk-interest] notify failed',
      'Error: mail rejected',
    )
    log.mockRestore()
  })
})
describe('valid-submission rate limit', () => {
  const valid = {
    name: 'Penguji Tempatan', role: 'ajk', masjid_name: 'Masjid Ujian',
    venue_type: 'masjid', area: 'Kampung Baru', state: 'W.P. Kuala Lumpur',
    phone: '0123456789', needs: ['hebahan_program'], consent: 'on',
  }
  // Stateful D1 boundary double; real SQL is also exercised by local Wrangler proof.
  function database() {
    let attempts = 0
    let leads = 0
    const prepare = vi.fn((sql: string) => {
      const statement = {
        bind: (..._values: unknown[]) => statement,
        first: async <T>() => ({ salt: 'local-test-salt' }) as T,
        run: async () => {
          if (sql.startsWith('INSERT INTO ajk_interest_attempts')) {
            const changes = attempts < 5 ? 1 : 0
            attempts += changes
            return { meta: { changes } }
          }
          if (sql.startsWith('INSERT INTO ajk_interest\n')) leads++
          return { meta: { changes: 1 } }
        },
      }
      return statement
    })
    return {
      env: { WEB_DB: { prepare, batch: async () => [] } },
      prepare, counts: () => ({ attempts, leads }),
    }
  }
  function submission(input: Record<string, unknown>) {
    const req = request(JSON.stringify(input))
    req.headers.set('CF-Connecting-IP', '192.0.2.80')
    return req
  }
  it('six invalid submissions do not consume quota before a valid correction', async () => {
    const db = database()
    for (let n = 0; n < 6; n++) {
      expect((await handleInterest(submission({ ...valid, phone: 'bad' }), db.env)).status).toBe(422)
    }
    expect(db.prepare).not.toHaveBeenCalled()
    expect((await handleInterest(submission(valid), db.env)).status).toBe(200)
    expect(db.counts()).toEqual({ attempts: 1, leads: 1 })
  })
  it('rejects the sixth valid submission from the same IP', async () => {
    const db = database()
    const statuses = []
    for (let n = 0; n < 6; n++) {
      statuses.push((await handleInterest(submission({ ...valid, masjid_name: `Masjid Ujian ${n}` }), db.env)).status)
    }
    expect(statuses).toEqual([200, 200, 200, 200, 200, 429])
    expect(db.counts()).toEqual({ attempts: 5, leads: 5 })
  })
  it('failed Turnstile checks do not consume quota', async () => {
    const db = database()
    const env = { ...db.env, TURNSTILE_SITE_KEY: 'test-site', TURNSTILE_SECRET_KEY: 'test-secret' }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ success: false })))
    for (let n = 0; n < 6; n++) {
      expect((await handleInterest(submission({ ...valid, 'cf-turnstile-response': 'rejected' }), env)).status).toBe(422)
    }
    expect(db.prepare).not.toHaveBeenCalled()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ success: true, hostname: 'jejakmasjid.my' })))
    expect((await handleInterest(submission({ ...valid, 'cf-turnstile-response': 'verified' }), env)).status).toBe(200)
    expect(db.counts()).toEqual({ attempts: 1, leads: 1 })
  })
})
describe('request boundary', () => {
  it('reads JSON and repeated native needs', async () => {
    expect(await readInput(request('{"name":"QA"}'))).toEqual({ name: 'QA' })
    expect(
      await readInput(
        request(
          'needs=lain&needs=laporan_dana',
          'application/x-www-form-urlencoded',
        ),
      ),
    ).toEqual({ needs: ['lain', 'laporan_dana'] })
  })
  it('limits actual bytes without trusting Content-Length', async () => {
    await expect(readInput(request('a'.repeat(8193)))).rejects.toThrow('413')
    await expect(
      readInput(request(JSON.stringify({ notes: 'é'.repeat(5000) }))),
    ).rejects.toThrow('413')
  })
  it.each(['[]', 'null', 'true', '{'])(
    'rejects non-object JSON %s',
    async (body) => {
      await expect(readInput(request(body))).rejects.toThrow()
    },
  )
  it('rejects unsupported content type', async () => {
    await expect(readInput(request('x', 'text/plain'))).rejects.toThrow('415')
  })
  it('honeypot never touches missing D1 or enabled challenge', async () => {
    const response = await handleInterest(
      request('{"website":"bot","name":"QA"}'),
      { TURNSTILE_SITE_KEY: 'test-site', TURNSTILE_SECRET_KEY: 'test-secret' },
    )
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true, name: 'QA' })
  })
  it('D1 unavailable fails without exposing input', async () => {
    const response = await handleInterest(request('{"phone":"0123456789"}'), {})
    expect(response.status).toBe(503)
    expect(await response.text()).not.toContain('0123456789')
  })
  it('hash is stable per salt and rotates daily', async () => {
    const first = await hashIp('192.0.2.1', 'salt-1')
    expect(first).toMatch(/^[a-f0-9]{64}$/)
    expect(await hashIp('192.0.2.1', 'salt-1')).toBe(first)
    expect(await hashIp('192.0.2.1', 'salt-2')).not.toBe(first)
  })
})
describe('optional Turnstile fails closed when both keys exist', () => {
  const env = {
    TURNSTILE_SITE_KEY: 'test-site',
    TURNSTILE_SECRET_KEY: 'test-secret',
  }
  it('does not run for absent or partial config', async () => {
    const fetcher = vi.fn()
    vi.stubGlobal('fetch', fetcher)
    expect(await verifyTurnstile(request(), {}, {})).toBe(true)
    expect(
      await verifyTurnstile(request(), {}, { TURNSTILE_SITE_KEY: 'test-site' }),
    ).toBe(true)
    expect(fetcher).not.toHaveBeenCalled()
  })
  it('requires token', async () =>
    expect(await verifyTurnstile(request(), {}, env)).toBe(false))
  it.each([
    { success: false, hostname: 'jejakmasjid.my' },
    { success: true, hostname: 'evil.test' },
    {},
  ])('rejects %j', async (result) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(result)))
    expect(
      await verifyTurnstile(
        request(),
        { 'cf-turnstile-response': 'test-token' },
        env,
      ),
    ).toBe(false)
  })
  it('handles provider outage', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('outage')))
    expect(
      await verifyTurnstile(
        request(),
        { 'cf-turnstile-response': 'test-token' },
        env,
      ),
    ).toBe(false)
  })
  it('accepts verified token for request host', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          Response.json({ success: true, hostname: 'jejakmasjid.my' }),
        ),
    )
    expect(
      await verifyTurnstile(
        request(),
        { 'cf-turnstile-response': 'test-token' },
        env,
      ),
    ).toBe(true)
  })
})
