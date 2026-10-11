import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  handleInterest,
  encodeSubject,
  notifyInterest,
  hashIp,
  readInput,
  verifyTurnstile,
} from './ajk-interest-server'
vi.mock('cloudflare:email', () => ({
  EmailMessage: class {
    constructor(
      public from: string,
      public to: string,
      public raw: string,
    ) {}
  },
}))
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
  it.each([
    'Minat AJK: Masjid Sultan Mizan Zainal Abidin (Presint 3, Putrajaya)',
    'Minat AJK: ' + 'éم😀'.repeat(80),
  ])('folds MIME subject safely: %s', (subject) => {
    const encoded = encodeSubject(subject)
    const words = encoded.split('\r\n ')
    expect(words.every((word) => word.length <= 75)).toBe(true)
    expect(
      ('Subject: ' + encoded).split('\r\n').every((line) => line.length <= 78),
    ).toBe(true)
    expect(
      words
        .map((word) =>
          Buffer.from(word.slice(10, -2), 'base64').toString('utf8'),
        )
        .join(''),
    ).toBe(subject)
  })
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
  it('uses EmailMessage and contains send failure', async () => {
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
    expect(send).toHaveBeenCalledOnce()
    expect(send.mock.calls[0][0]).toMatchObject({
      from: 'noreply@jejakmasjid.my',
      to: 'qa@example.test',
      raw: expect.stringContaining('Content-Type: text/plain; charset=utf-8'),
    })
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
