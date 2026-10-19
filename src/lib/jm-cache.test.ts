import { afterEach, beforeEach, expect, it, vi } from 'vitest'
vi.mock('./worker-env', () => ({
  getWorkerEnv: vi.fn(async () => ({ MASJID_PAGES_ENABLED: 'true' })),
}))
import {
  apiGet,
  getMasjidPage,
  getFacilityCatalogue,
  getProgram,
  getSitemapPage,
  getSitemapCount,
  getPrayerTimes,
  PUBLIC_CACHE_TAG,
} from './jm-api'
import { facilityCatalogue } from './masjid-fixture'

const entries = new Map<string, Response>()
const fetcher = vi.fn()
const put = vi.fn(async (key: string, response: Response) => {
  entries.set(key, response.clone())
})
beforeEach(() => {
  entries.clear()
  fetcher.mockReset()
  put.mockClear()
  vi.stubGlobal('fetch', fetcher)
  vi.stubGlobal('caches', {
    default: {
      match: vi.fn(async (key: string) => entries.get(key)?.clone()),
      put,
    },
  })
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})
it('all mutable caches including 404 and count share the purge tag, web zone and <=60s TTL', async () => {
  fetcher.mockImplementation(async () =>
    Response.json({ total: 9725, pageSize: 5000, masjids: [] }),
  )
  await getMasjidPage('surau-test')
  await getProgram('program-1')
  await getSitemapPage('1')
  await getSitemapCount()
  fetcher.mockResolvedValue(new Response(null, { status: 404 }))
  await getMasjidPage('surau-missing')
  expect(entries.size).toBe(5)
  for (const [key, response] of entries) {
    expect(key).toMatch(
      /^https:\/\/jejakmasjid.my\/__jm-internal-cache\/ajk-public\/v1\//,
    )
    expect(response.headers.get('Cache-Tag')).toBe(PUBLIC_CACHE_TAG)
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=60')
  }
  expect([...entries.values()].some((r) => r.status === 404)).toBe(true)
  expect(fetcher.mock.calls.map((c) => c[0].url)).toContain(
    'https://apiv2.jejakmasjid.my/api/public/masjid-sitemap?countOnly=1',
  )
})
it('a modeled zone tag purge evicts stale positives and negatives but not prayers', async () => {
  fetcher.mockResolvedValue(Response.json({ version: 1 }))
  await getProgram('program-1')
  await getPrayerTimes(2.9, 101.7)
  fetcher.mockResolvedValue(new Response(null, { status: 404 }))
  await getMasjidPage('surau-new')
  expect(fetcher).toHaveBeenCalledTimes(3)
  await getProgram('program-1')
  await getMasjidPage('surau-new')
  expect(fetcher).toHaveBeenCalledTimes(3)
  for (const [key, response] of entries)
    if (response.headers.get('Cache-Tag') === PUBLIC_CACHE_TAG)
      entries.delete(key)
  fetcher.mockImplementation(async () => Response.json({ version: 2 }))
  expect((await getProgram('program-1')).body).toEqual({ version: 2 })
  expect((await getMasjidPage('surau-new')).body).toEqual({ version: 2 })
  await getPrayerTimes(2.9, 101.7)
  expect(fetcher).toHaveBeenCalledTimes(5)
})
it.each([404, 503, 302])(
  'negative prayer response %s uses separate 300s sentinel and 1500ms deadline',
  async (status) => {
    const timeout = vi.spyOn(AbortSignal, 'timeout')
    fetcher.mockResolvedValue(new Response(null, { status }))
    expect(await getPrayerTimes(2.9, 101.7)).toEqual({
      status: 503,
      body: null,
    })
    expect(await getPrayerTimes(2.9, 101.7)).toEqual({
      status: 503,
      body: null,
    })
    expect(fetcher).toHaveBeenCalledOnce()
    expect(timeout).toHaveBeenCalledWith(1500)
    const [key, r] = [...entries][0]
    expect(key).toContain('/prayer/')
    expect(r.status).toBe(200)
    expect(r.headers.get('Cache-Control')).toBe('public, max-age=300')
    expect(r.headers.get('Cache-Tag')).toBeNull()
    expect(await r.json()).toBeNull()
  },
)
it('prayer network timeouts are cached; mutable 5xx are not', async () => {
  fetcher.mockRejectedValue(new DOMException('timeout', 'TimeoutError'))
  await getPrayerTimes(2.9, 101.7)
  await getPrayerTimes(2.9, 101.7)
  expect(fetcher).toHaveBeenCalledOnce()
  await getProgram('program-1')
  await getProgram('program-1')
  expect(fetcher).toHaveBeenCalledTimes(3)
  expect(entries.size).toBe(1)
})
it('cache failures never turn healthy content into an outage', async () => {
  vi.stubGlobal('caches', {
    default: {
      match: vi.fn().mockRejectedValue(new Error('cache')),
      put: vi.fn().mockRejectedValue(new Error('cache')),
    },
  })
  fetcher.mockResolvedValue(Response.json({ ok: true }))
  expect(await apiGet('/api/x', { ttl: 5000 })).toEqual({
    status: 200,
    body: { ok: true },
  })
})

it('caches the raw facility catalogue for 60 seconds under the existing public purge tag', async () => {
  fetcher.mockImplementation(async () => Response.json(facilityCatalogue))
  expect(await getFacilityCatalogue()).toEqual({ status: 200, body: facilityCatalogue })
  expect((await getFacilityCatalogue()).body).toEqual(facilityCatalogue)
  expect(fetcher).toHaveBeenCalledOnce()
  expect(fetcher.mock.calls[0][0].url).toBe('https://apiv2.jejakmasjid.my/api/facilities')
  const [key, response] = [...entries][0]
  expect(key).toContain('/ajk-public/v1/')
  expect(response.headers.get('Cache-Control')).toBe('public, max-age=60')
  expect(response.headers.get('Cache-Tag')).toBe(PUBLIC_CACHE_TAG)
})
