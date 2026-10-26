import { beforeEach, expect, it, vi } from 'vitest'
import { isNotFound } from '@tanstack/react-router'
import fixture from './fixtures/discovery.json'
// Run the real validators and handlers, replacing only Start's HTTP transport.
vi.mock('@tanstack/react-start', () => ({ createServerFn: () => ({
  handler: (handler: () => unknown) => handler,
  inputValidator: (validate: (data: unknown) => unknown) => ({ handler: (handler: (ctx: { data: unknown }) => unknown) => async ({ data }: { data: unknown }) => handler({ data: validate(data) }) }),
}) }))
vi.mock('@tanstack/react-start/server', () => ({ setResponseHeader: vi.fn(), setResponseStatus: vi.fn() }))
vi.mock('./discovery-api.server', () => ({ getAreas: vi.fn(), getAreaList: vi.fn(), getSearch: vi.fn(), getNearby: vi.fn() }))
vi.mock('./public-stats-api.server', () => ({ getPublicStats: vi.fn(async () => null) }))
import { getAreas, getAreaList, getSearch, getNearby } from './discovery-api.server'
import { loadDiscoveryArea, loadDiscoveryLanding, loadDiscoveryNearby, loadDiscoveryAreas } from './discovery-server'
import { setResponseHeader, setResponseStatus } from '@tanstack/react-start/server'
import type { Areas, AreaList } from './discovery'
beforeEach(() => { vi.clearAllMocks(); vi.mocked(getAreas).mockResolvedValue({ status: 'ok', data: fixture.areas as Areas }) })
it('gates all discovery handlers on the cached areas read', async () => {
  vi.mocked(getAreas).mockResolvedValue({ status: 'missing' })
  expect(await loadDiscoveryAreas()).toBeNull()
  expect(isNotFound(await loadDiscoveryLanding({ data: { q: 'masjid', page: 1 } }).catch(e => e))).toBe(true)
  expect(isNotFound(await loadDiscoveryArea({ data: { country: 'malaysia', page: 1 } }).catch(e => e))).toBe(true)
  expect(await loadDiscoveryNearby({ data: { lat: 3, lng: 101 } })).toBeNull()
  expect(getSearch).not.toHaveBeenCalled(); expect(getAreaList).not.toHaveBeenCalled(); expect(getNearby).not.toHaveBeenCalled()
  expect(setResponseHeader).toHaveBeenCalledWith('Cache-Control', 'no-store')
})
it('shows short-query hints without calling search and keeps invalid search data as unavailable', async () => {
  for (const q of ['', 'a', 'a'.repeat(81)]) {
    const data = await loadDiscoveryLanding({ data: { q, page: 1 } })
    expect(data.results).toBeNull(); expect(getSearch).not.toHaveBeenCalled()
  }
  vi.mocked(getSearch).mockResolvedValue(null)
  expect((await loadDiscoveryLanding({ data: { q: 'masjid', page: 1 } })).results).toBeNull()
})
it('passes search pages through to the backend and returns the backend clamped page', async () => {
  const results = { payloadVersion: 1 as const, q: 'masjid', page: 3, pageSize: 20 as const, total: 51, items: fixture.items.slice(40, 51) as import('./discovery').DiscoveryItem[] }
  vi.mocked(getSearch).mockResolvedValue(results)
  const data = await loadDiscoveryLanding({ data: { q: ' masjid ', page: 999 } })
  expect(getSearch).toHaveBeenLastCalledWith('masjid', 999)
  expect(data.results).toEqual(results)
  for (const page of [0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    await loadDiscoveryLanding({ data: { q: 'masjid', page } })
    expect(getSearch).toHaveBeenLastCalledWith('masjid', 1)
  }
})
it('returns 404 for unknown areas, malformed inputs or backend area_not_found', async () => {
  for (const country of ['unknown', '../malaysia']) expect(isNotFound(await loadDiscoveryArea({ data: { country, page: 1 } }).catch(e => e))).toBe(true)
  expect(getAreaList).not.toHaveBeenCalled()
  vi.mocked(getAreaList).mockResolvedValue({ status: 'missing' })
  expect(isNotFound(await loadDiscoveryArea({ data: { country: 'malaysia', page: 1 } }).catch(e => e))).toBe(true)
  const list = { payloadVersion: 1, area: { country: 'malaysia', names: { country: 'Malaysia' } }, page: 2, total: 55, pageSize: 50, items: fixture.items.slice(50, 55) } as AreaList
  vi.mocked(getAreaList).mockResolvedValue({ status: 'ok', data: list })
  expect(await loadDiscoveryArea({ data: { country: 'malaysia', page: 999 } })).toEqual({ areas: fixture.areas, list })
})
it.each([
  { country: 'malaysia' },
  { country: 'malaysia', region: 'selangor' },
  { country: 'malaysia', region: 'selangor', district: 'petaling' },
])('returns 503 and retry/no-store/noindex headers for unavailable areas or lists: %j', async query => {
  for (const failAreas of [false, true]) {
    vi.mocked(getAreas).mockResolvedValue(failAreas ? { status: 'unavailable' } : { status: 'ok', data: fixture.areas as Areas })
    vi.mocked(getAreaList).mockResolvedValue({ status: 'unavailable' })
    expect(await loadDiscoveryArea({ data: { ...query, page: 1 } })).toEqual({ unavailable: true })
    expect(setResponseStatus).toHaveBeenLastCalledWith(503)
    expect(setResponseHeader).toHaveBeenCalledWith('Retry-After', '120')
    expect(setResponseHeader).toHaveBeenCalledWith('Cache-Control', 'no-store')
    expect(setResponseHeader).toHaveBeenCalledWith('X-Robots-Tag', 'noindex, nofollow')
  }
})
it.each(['', 'masjid'])('returns a recoverable 503 landing/search page for an areas outage (q=%s)', async q => {
  vi.mocked(getAreas).mockResolvedValue({ status: 'unavailable' })
  expect(await loadDiscoveryLanding({ data: { q, page: 2 } })).toEqual({ unavailable: true, areas: null, q, results: null, stats: null })
  expect(setResponseStatus).toHaveBeenCalledWith(503)
  expect(setResponseHeader).toHaveBeenCalledWith('Retry-After', '120')
  expect(await loadDiscoveryAreas()).toBeNull()
})
it('returns 503 for a failed search, while an unknown slug in a valid tree stays 404', async () => {
  vi.mocked(getSearch).mockResolvedValue(null)
  expect(await loadDiscoveryLanding({ data: { q: 'masjid', page: 2 } })).toMatchObject({ unavailable: true })
  expect(setResponseStatus).toHaveBeenCalledWith(503)
  vi.mocked(setResponseStatus).mockClear()
  for (const query of [{ country: 'unknown' }, { country: 'malaysia', region: 'unknown' }, { country: 'malaysia', region: 'selangor', district: 'unknown' }]) {
    expect(isNotFound(await loadDiscoveryArea({ data: { ...query, page: 1 } }).catch(e => e))).toBe(true)
  }
  expect(setResponseStatus).not.toHaveBeenCalled()
})
it('validates and rounds location on the server and makes its response private/no-store', async () => {
  vi.mocked(getNearby).mockResolvedValue({ payloadVersion: 1, items: [] })
  await loadDiscoveryNearby({ data: { lat: 3.1234567, lng: 101.678912 } })
  expect(getNearby).toHaveBeenCalledWith(3.123, 101.679)
  expect(setResponseHeader).toHaveBeenCalledWith('Cache-Control', 'private, no-store')
  for (const lat of [NaN, Infinity, 91]) await expect(loadDiscoveryNearby({ data: { lat, lng: 101 } })).rejects.toThrow('Invalid location')
  expect(getNearby).toHaveBeenCalledOnce()
})
