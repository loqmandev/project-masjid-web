import { apiGet } from './jm-api'
import { validAreas, validAreaList, validSearch, validNearby, type Areas, type AreaList, type SearchResults, type NearbyResults, type AreaQuery } from './discovery'
import type { WebEnv } from './worker-env'
export type DiscoveryResult<T> = { status: 'ok'; data: T } | { status: 'missing' } | { status: 'unavailable' }
export async function getAreas(env?: WebEnv): Promise<DiscoveryResult<Areas>> {
  try {
    const r = await apiGet<Areas>('/api/public/discovery/areas', { ttl: 3600, validate: v => validAreas(v) !== null }, env)
    const data = r.status === 200 ? validAreas(r.body) : null
    return data ? { status: 'ok', data } : { status: r.status === 404 ? 'missing' : 'unavailable' }
  } catch {
    return { status: 'unavailable' }
  }
}
export async function getAreaList(query: AreaQuery, page: number, env?: WebEnv): Promise<DiscoveryResult<AreaList>> {
  const params = new URLSearchParams({ country: query.country, page: String(page) })
  if (query.region) params.set('region', query.region)
  if (query.district) params.set('district', query.district)
  try {
    const r = await apiGet<AreaList>(`/api/public/discovery/masjids?${params}`, { ttl: 3600, validate: v => validAreaList(v, query) !== null }, env)
    const data = r.status === 200 ? validAreaList(r.body, query) : null
    return data ? { status: 'ok', data } : { status: r.status === 404 && r.error === 'area_not_found' ? 'missing' : 'unavailable' }
  } catch {
    return { status: 'unavailable' }
  }
}
export async function getSearch(q: string, page: number, env?: WebEnv) {
  const r = await apiGet<SearchResults>(`/api/public/discovery/search?${new URLSearchParams({ q, page: String(page) })}`, { ttl: 60, validate: v => validSearch(v, q) !== null }, env)
  return r.status === 200 ? validSearch(r.body, q) : null
}
export async function getNearby(lat: number, lng: number, env?: WebEnv) {
  // The rounded location travels in a POST server-function body, never the page URL.
  const r = await apiGet<NearbyResults>(`/api/public/discovery/nearby?lat=${lat.toFixed(3)}&lng=${lng.toFixed(3)}`, { ttl: 0, validate: v => validNearby(v) !== null }, env)
  return r.status === 200 ? validNearby(r.body) : null
}
