import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import PublicStatsSection from '@/components/PublicStats'
import { statsDate, validPublicStats, type PublicStats } from './public-stats'
import { statsCacheKey } from './jm-api'
import { t } from './i18n'

vi.mock('@tanstack/react-start', () => ({ createServerFn: () => ({ handler: (fn: unknown) => fn }) }))
vi.mock('./worker-env', () => ({ getWorkerEnv: async () => ({}) }))
import { getPublicStats } from './public-stats-api.server'
import { loadPublicStats } from './public-stats-server'

const fixture = (): PublicStats => JSON.parse(readFileSync(new URL('./fixtures/public-stats.json', import.meta.url), 'utf8'))
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.useRealTimers() })

describe('public stats payload validation', () => {
  it('accepts v1, canonical states, exact totals and suppressed nulls', () => {
    expect(validPublicStats(fixture())).toEqual(fixture())
  })
  const invalid: [string, (v: PublicStats) => void][] = [
    ['unsupported version', v => { v.payloadVersion = 2 as 1 }],
    ['missing property', v => { delete (v as Partial<PublicStats>).windowStart }],
    ['extra private data', v => { Object.assign(v, { userId: 'private' }) }],
    ['negative total', v => { v.masjids.total = -1 }],
    ['fractional total', v => { v.visits30d.completed = 0.5 }],
    ['unsafe total', v => { v.masjids.total = Number.MAX_SAFE_INTEGER + 1 }],
    ['NaN', v => { v.masjids.total = NaN }],
    ['infinity', v => { v.visits30d.completed = Infinity }],
    ['partial state list', v => { v.masjids.byState.pop() }],
    ['partial visit state list', v => { v.visits30d.byState.pop() }],
    ['partial country visits', v => { v.visits30d.byCountry.pop() }],
    ['duplicate state', v => { v.masjids.byState[1] = v.masjids.byState[0] }],
    ['unknown state', v => { v.masjids.byState[0].stateCode = 'SGR' as 'SELANGOR' }],
    ['duplicate country', v => { v.masjids.byCountry[1] = v.masjids.byCountry[0] }],
    ['unknown country code', v => { v.masjids.byCountry[0].code = 'XX' as 'MY' }],
    ['missing visit fields', v => { delete (v.visits30d.byCountry[0] as { suppressed?: boolean }).suppressed }],
    ['suppressed value exposed', v => { v.visits30d.byCountry[0] = { code: 'MY', completed: 7, suppressed: true } }],
    ['small unsuppressed value', v => { v.visits30d.byState[0].completed = 9 }],
    ['null without suppression', v => { v.visits30d.byState[0].completed = null }],
    ['extra row metadata', v => { Object.assign(v.visits30d.byState[0], { userId: 'private' }) }],
    ['non-ISO date', v => { v.computedAt = 'tomorrow' }],
    ['impossible date', v => { v.computedAt = '2026-02-30T18:40:12Z' }],
    ['snapshot before window end', v => { v.computedAt = '2026-10-26T18:40:12Z' }],
    ['wrong window length', v => { v.windowStart = '2026-09-28T16:00:00Z' }],
    ['wrong MYT day boundary', v => { v.windowStart = '2026-09-27T00:00:00Z'; v.windowEnd = '2026-10-27T00:00:00Z' }],
    ['inconsistent venue totals', v => { v.masjids.masjid++ }],
    ['inconsistent country totals', v => { v.masjids.byCountry[0].count++ }],
    ['inconsistent visit totals', v => { v.visits30d.completed += 20 }],
    ['state counts above Malaysia', v => { v.masjids.byState[0].count = 20000 }],
    ['unclassified double counted', v => { v.masjids.unclassified = v.masjids.masjid + 1 }],
    ['visitors above visits', v => { v.visits30d.activeVisitors = v.visits30d.completed + 1 }],
    ['unique venues above visits', v => { v.visits30d.uniqueMasjids = v.visits30d.completed + 1 }],
  ]
  it.each(invalid)('rejects %s', (_name, change) => {
    const value = fixture(); change(value)
    expect(validPublicStats(value)).toBeNull()
  })
  it.each([null, undefined, [], {}, 'stats', 200])('rejects non-payload %j', value => {
    expect(validPublicStats(value)).toBeNull()
  })
  it('accepts 0 and 10 but never exposes unsuppressed values 1–9', () => {
    for (let n = 0; n <= 10; n++) {
      const value = fixture(); value.visits30d.byState[0].completed = n
      expect(validPublicStats(value) !== null).toBe(n === 0 || n === 10)
    }
  })
  it('accepts a complete zero snapshot', () => {
    const value = fixture()
    value.masjids.total = value.masjids.masjid = value.masjids.surau = value.masjids.unclassified = 0
    for (const row of [...value.masjids.byCountry, ...value.masjids.byState]) row.count = 0
    value.visits30d.completed = value.visits30d.uniqueMasjids = value.visits30d.activeVisitors = 0
    for (const row of [...value.visits30d.byCountry, ...value.visits30d.byState]) { row.completed = 0; row.suppressed = false }
    expect(validPublicStats(value)).toEqual(value)
    expect(renderToStaticMarkup(createElement(PublicStatsSection, { locale: 'en', stats: value }))).not.toContain('NaN')
  })
})

describe('SSR public numbers section', () => {
  for (const locale of ['ms', 'en'] as const) it(`renders ${locale} counts, suppression, unknown country, MYT and state order`, () => {
    const stats = fixture()
    // A deliberately shuffled input still renders largest counts first.
    stats.masjids.byState.reverse()
    const html = renderToStaticMarkup(createElement(PublicStatsSection, { locale, stats }))
    const copy = t(locale).stats
    expect(html).toContain(copy.title)
    expect(html).toContain('12,000')
    expect(html).toContain('2,400')
    expect(html).toMatch(/<dd\b[^>]*>6<\/dd>/)
    expect(html).toContain(copy.unknown)
    expect(html).toContain('&lt; 10')
    expect(html).not.toContain('>null<')
    expect(html).toContain('28') // computedAt is on the next day in MYT.
    expect(html).toContain('MYT')
    expect(html).toContain('<table')
    expect(html.match(/scope="row"/g)).toHaveLength(16)
    expect(html.indexOf('data-state-code="SELANGOR"')).toBeLessThan(html.indexOf('data-state-code="JOHOR"'))
    expect(html).toContain(copy.definitions)
    expect(html).not.toContain('data-reveal')
  })
  it('formats the snapshot date in MYT, regardless of server timezone', () => {
    expect(statsDate(fixture().computedAt, 'en')).toBe('28 October 2026')
  })
  it.each([null, {}, { status: 404, body: null }])('renders no shell or error for %j', stats => {
    expect(renderToStaticMarkup(createElement(PublicStatsSection, { locale: 'ms', stats }))).toBe('')
  })
  it('renders no partial section for invalid data', () => {
    const stats = fixture(); stats.visits30d.byState.pop()
    expect(renderToStaticMarkup(createElement(PublicStatsSection, { locale: 'en', stats }))).toBe('')
  })
})

describe('SSR stats read and cache', () => {
  const fetcher = vi.fn()
  const entries = new Map<string, Response>()
  const put = vi.fn(async (key: string, response: Response) => { entries.set(key, response.clone()) })
  beforeEach(() => {
    entries.clear(); fetcher.mockReset(); put.mockClear()
    vi.stubGlobal('fetch', fetcher)
    vi.stubGlobal('caches', { default: { match: vi.fn(async (key: string) => entries.get(key)?.clone()), put } })
  })
  it('SSR loader reads without a masjid-page flag and caches validated data for one hour', async () => {
    fetcher.mockResolvedValue(Response.json(fixture()))
    expect(await loadPublicStats()).toEqual(fixture())
    expect(await getPublicStats()).toEqual(fixture())
    expect(fetcher).toHaveBeenCalledOnce()
    const [request] = fetcher.mock.calls[0]
    expect(request.url).toBe('https://apiv2.jejakmasjid.my/api/public/stats')
    expect(request.redirect).toBe('manual')
    expect([...request.headers]).toEqual([])
    const [key, response] = put.mock.calls[0]
    expect(key).toBe(statsCacheKey(request.url))
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600')
  })
  it('isolates cache keys by JM_API_BASE and uses the service binding when supplied', async () => {
    const binding = vi.fn().mockResolvedValue(Response.json(fixture()))
    await getPublicStats({ JM_API_BASE: 'http://127.0.0.1:8799', JM_API: { fetch: binding } })
    expect(binding.mock.calls[0][0].url).toBe('http://127.0.0.1:8799/api/public/stats')
    expect([...entries.keys()][0]).toContain(encodeURIComponent('http://127.0.0.1:8799/api/public/stats'))
    expect(fetcher).not.toHaveBeenCalled()
  })
  it.each([204, 206, 301, 302, 404, 429, 500, 503])('hides HTTP %s and does not cache it', async status => {
    fetcher.mockResolvedValue(new Response(null, { status }))
    expect(await getPublicStats()).toBeNull()
    expect(put).not.toHaveBeenCalled()
  })
  it.each(['{', '{}', 'null', '{"payloadVersion":2}'])('hides invalid JSON/payload %s without caching it', async body => {
    fetcher.mockResolvedValue(new Response(body))
    expect(await getPublicStats()).toBeNull()
    expect(put).not.toHaveBeenCalled()
  })
  it('revalidates cached JSON and hides an invalid cached snapshot', async () => {
    entries.set(statsCacheKey('https://apiv2.jejakmasjid.my/api/public/stats'), Response.json({ payloadVersion: 1 }))
    expect(await getPublicStats()).toBeNull()
    expect(fetcher).not.toHaveBeenCalled()
  })
  it('hides network failures', async () => {
    fetcher.mockRejectedValue(new Error('offline'))
    expect(await getPublicStats()).toBeNull()
  })
  it('aborts a slow upstream at 1500 ms and renders nothing', async () => {
    vi.useFakeTimers()
    vi.spyOn(AbortSignal, 'timeout').mockImplementation(ms => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), ms)
      return controller.signal
    })
    fetcher.mockImplementation((request: Request) => new Promise((_resolve, reject) => {
      request.signal.addEventListener('abort', () => reject(new Error('timeout')))
    }))
    const pending = getPublicStats()
    await vi.advanceTimersByTimeAsync(1500)
    expect(await pending).toBeNull()
    expect(AbortSignal.timeout).toHaveBeenCalledWith(1500)
    expect(put).not.toHaveBeenCalled()
  })
  it('reads through cache failures without breaking the homepage', async () => {
    vi.stubGlobal('caches', { default: { match: vi.fn().mockRejectedValue(new Error('read')), put: vi.fn().mockRejectedValue(new Error('write')) } })
    fetcher.mockResolvedValue(Response.json(fixture()))
    expect(await getPublicStats()).toEqual(fixture())
  })
})
