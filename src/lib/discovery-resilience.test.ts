import { afterEach, expect, it, vi } from 'vitest'
import fixture from './fixtures/discovery.json'
import { apiGet, discoveryCacheKey, discoveryStaleCacheKey } from './jm-api'
import { getAreas, getAreaList } from './discovery-api.server'
import type { AreaList, DiscoveryItem } from './discovery'

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.useRealTimers() })
const origin = 'http://127.0.0.1:9999'
const areasUrl = origin + '/api/public/discovery/areas'
const list: AreaList = { payloadVersion: 1, area: { country: 'malaysia', names: { country: 'Malaysia' } }, page: 1, total: 51, pageSize: 50, items: fixture.items.slice(0, 50) as DiscoveryItem[] }
function cache() {
  vi.useFakeTimers({ toFake: ['Date'] })
  const entries = new Map<string, { response: Response; expires: number }>()
  const put = vi.fn(async (key: string, response: Response) => {
    const ttl = Number(response.headers.get('Cache-Control')?.match(/max-age=(\d+)/)?.[1])
    entries.set(key, { response: response.clone(), expires: Date.now() + ttl * 1000 })
  })
  vi.stubGlobal('caches', { default: {
    put,
    match: vi.fn(async (key: string) => {
      const entry = entries.get(key)
      return entry && entry.expires > Date.now() ? entry.response.clone() : undefined
    }),
  } })
  return { entries, put }
}
it('defaults discovery to 4000ms and stats to 1500ms, preserving per-call timeout overrides', async () => {
  const timeout = vi.spyOn(AbortSignal, 'timeout').mockReturnValue(new AbortController().signal)
  const env = { JM_API: { fetch: vi.fn(async () => Response.json({})) } }
  for (const endpoint of ['areas', 'masjids?country=malaysia&page=1', 'search?q=masjid&page=1', 'nearby?lat=3&lng=101']) {
    await apiGet('/api/public/discovery/' + endpoint, { ttl: 0 }, env)
    expect(timeout).toHaveBeenLastCalledWith(4000)
  }
  for (const timeoutMs of [700, 6000]) {
    await apiGet('/api/public/discovery/areas', { ttl: 0, timeoutMs }, env)
    expect(timeout).toHaveBeenLastCalledWith(timeoutMs)
  }
  await apiGet('/api/public/stats', { ttl: 0, timeoutMs: 6000 }, env)
  expect(timeout).toHaveBeenLastCalledWith(1500)
})
it.each(['timeout', 'network', '500', 'invalid-json', 'invalid-payload'])('serves validated areas and lists from stale cache on %s, without extending their 24h lifetime', async failure => {
  const c = cache()
  let failing = false
  const fetcher = vi.fn(async (request: Request) => {
    if (!failing) return Response.json(request.url.includes('/areas') ? fixture.areas : list)
    if (failure === 'timeout' || failure === 'network') throw new Error(failure)
    if (failure === '500') return new Response(null, { status: 500 })
    return failure === 'invalid-json' ? new Response('{') : Response.json({ payloadVersion: 1 })
  })
  const env = { JM_API_BASE: origin, JM_API: { fetch: fetcher } }
  const expected = { status: 'ok', data: fixture.areas }
  expect(await getAreas(env)).toEqual(expected)
  expect(await getAreaList(list.area, 1, env)).toEqual({ status: 'ok', data: list })
  expect(c.entries.get(discoveryCacheKey(areasUrl))?.response.headers.get('Cache-Control')).toBe('public, max-age=3600')
  expect(c.entries.get(discoveryStaleCacheKey(areasUrl))?.response.headers.get('Cache-Control')).toBe('public, max-age=86400')
  failing = true
  vi.setSystemTime(Date.now() + 3600_001)
  expect(await getAreas(env)).toEqual(expected)
  expect(await getAreaList(list.area, 1, env)).toEqual({ status: 'ok', data: list })
  expect(c.put).toHaveBeenCalledTimes(4)
  expect(await getAreaList(list.area, 2, env)).toEqual({ status: 'unavailable' })
  expect(await getAreas({ ...env, JM_API_BASE: 'http://127.0.0.1:9998' })).toEqual({ status: 'unavailable' })
  vi.setSystemTime(Date.now() + 86400_000)
  expect(await getAreas(env)).toEqual({ status: 'unavailable' })
  expect(await getAreaList(list.area, 1, env)).toEqual({ status: 'unavailable' })
  expect(c.put).toHaveBeenCalledTimes(4)
})
it('preserves authoritative 404s instead of serving stale entries, and distinguishes area_not_found', async () => {
  cache()
  const fetcher = vi.fn(async (request: Request) => Response.json(request.url.includes('/areas') ? fixture.areas : list))
  const env = { JM_API_BASE: origin, JM_API: { fetch: fetcher } }
  await getAreas(env); await getAreaList(list.area, 1, env)
  vi.setSystemTime(Date.now() + 3600_001)
  fetcher.mockImplementation(async () => Response.json({ error: 'area_not_found' }, { status: 404 }))
  expect(await getAreas(env)).toEqual({ status: 'missing' })
  expect(await getAreaList(list.area, 1, env)).toEqual({ status: 'missing' })
  fetcher.mockImplementation(async () => new Response(null, { status: 404 }))
  expect(await getAreaList(list.area, 1, env)).toEqual({ status: 'unavailable' })
})
it('rejects invalid stale payloads and tolerates Cache API read/write failures', async () => {
  const c = cache()
  const fetcher = vi.fn(async () => Response.json({ payloadVersion: 1 }))
  const env = { JM_API_BASE: origin, JM_API: { fetch: fetcher } }
  c.entries.set(discoveryStaleCacheKey(areasUrl), { response: Response.json({ payloadVersion: 1 }), expires: Infinity })
  expect(await getAreas(env)).toEqual({ status: 'unavailable' })
  expect(c.put).not.toHaveBeenCalled()
  vi.stubGlobal('caches', { default: { match: () => { throw new Error('read') }, put: () => { throw new Error('write') } } })
  fetcher.mockImplementation(async () => Response.json(fixture.areas))
  expect(await getAreas(env)).toEqual({ status: 'ok', data: fixture.areas })
})
