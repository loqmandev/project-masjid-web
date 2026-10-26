import { createServerFn } from '@tanstack/react-start'
import { notFound } from '@tanstack/react-router'
import { setResponseHeader } from '@tanstack/react-start/server'
import { areaSlug, resolveArea, type AreaQuery } from './discovery'
const missing = (): never => { setResponseHeader('Cache-Control', 'no-store'); throw notFound() }
export const loadDiscoveryAreas = createServerFn({ method: 'GET' }).handler(async () => {
  const { getAreas } = await import('./discovery-api.server')
  return getAreas()
})
export const loadDiscoveryLanding = createServerFn({ method: 'GET' })
  .inputValidator((v: { q: string }) => ({ q: typeof v?.q === 'string' ? v.q.trim().slice(0, 81) : '' }))
  .handler(async ({ data }) => {
    const { getAreas, getSearch } = await import('./discovery-api.server')
    const areas = await getAreas()
    if (!areas) return missing()
    const [results, stats] = await Promise.all([
      data.q.length >= 2 && data.q.length <= 80 ? getSearch(data.q) : null,
      import('./public-stats-api.server').then(m => m.getPublicStats()),
    ])
    return { areas, q: data.q, results, stats }
  })
export const loadDiscoveryArea = createServerFn({ method: 'GET' })
  .inputValidator((v: AreaQuery & { page: number }) => {
    if (!v || !areaSlug(v.country) || v.region !== undefined && !areaSlug(v.region) || v.district !== undefined && (!v.region || !areaSlug(v.district)) || !Number.isSafeInteger(v.page) || v.page < 1) return missing()
    return { country: v.country, region: v.region, district: v.district, page: v.page }
  })
  .handler(async ({ data }) => {
    const { getAreas, getAreaList } = await import('./discovery-api.server')
    const areas = await getAreas()
    if (!areas || !resolveArea(areas, data)) return missing()
    const list = await getAreaList(data, data.page)
    if (!list) return missing()
    return { areas, list }
  })
export const loadDiscoveryNearby = createServerFn({ method: 'POST' })
  .inputValidator((v: { lat: number; lng: number }) => {
    if (!v || !Number.isFinite(v.lat) || !Number.isFinite(v.lng) || Math.abs(v.lat) > 90 || Math.abs(v.lng) > 180) throw new Error('Invalid location')
    return { lat: Math.round(v.lat * 1000) / 1000, lng: Math.round(v.lng * 1000) / 1000 }
  })
  .handler(async ({ data }) => {
    setResponseHeader('Cache-Control', 'private, no-store')
    const { getAreas, getNearby } = await import('./discovery-api.server')
    if (!await getAreas()) return null
    return getNearby(data.lat, data.lng)
  })
