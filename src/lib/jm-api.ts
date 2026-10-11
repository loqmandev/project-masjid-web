import { getWorkerEnv, type WebEnv } from './worker-env'
import type { PublicMasjidPage, PublicProgramDetail, SitemapPage } from './masjid-types'
export const validSlug = (s: string) => /^[a-z0-9](?:[a-z0-9-]{1,94}[a-z0-9])$/.test(s)
export const validProgramId = (s: string) => /^[A-Za-z0-9_-]{1,64}$/.test(s)
export const validSitemapPage = (s: string) => /^[1-9][0-9]{0,2}$/.test(s)
export type ApiResult<T> = {status: number; body: T | null}
// Called only by server functions / server route handlers. No credentials propagated.
export async function apiGet<T>(path: string, opts: {ttl: number}, supplied?: WebEnv): Promise<ApiResult<T>> {
  const env = supplied ?? await getWorkerEnv()
  if (env.MASJID_PAGES_ENABLED !== 'true') return {status: 404, body: null}
  if (!path.startsWith('/api/') || path.includes('..')) return {status: 404, body: null}
  const url = new URL(path, env.JM_API_BASE || 'https://apiv2.jejakmasjid.my').toString()
  const cache = typeof caches !== 'undefined' ? (caches as CacheStorage & {default?: Cache}).default : undefined
  try {
    let response = await cache?.match(url)
    if (!response) {
      const request = new Request(url, {signal: AbortSignal.timeout(5000), redirect: 'manual'})
      response = await (env.JM_API ? env.JM_API.fetch(request) : fetch(request))
      if (response.status !== 200 && response.status !== 404) return {status: 503, body: null}
      if (cache) {
        const copy = new Response(response.clone().body, response)
        copy.headers.set('Cache-Control', `public, max-age=${opts.ttl}`)
        await cache.put(url, copy)
      }
    }
    return {status: response.status, body: response.status === 200 ? await response.json() as T : null}
  } catch { return {status: 503, body: null} }
}
export const getMasjidPage = (slug: string) => validSlug(slug) ? apiGet<PublicMasjidPage | {redirect: string}>(`/api/public/masjids/by-slug/${slug}`, {ttl: 300}) : Promise.resolve({status: 404, body: null})
export const getProgram = (id: string) => validProgramId(id) ? apiGet<PublicProgramDetail>(`/api/public/programs/${id}`, {ttl: 300}) : Promise.resolve({status: 404, body: null})
// Backend pages are zero-based, public sitemap URLs are one-based.
export const getSitemapPage = (n: string) => validSitemapPage(n) ? apiGet<SitemapPage>(`/api/public/masjid-sitemap?page=${Number(n)-1}`, {ttl: 3600}) : Promise.resolve({status: 404, body: null})
export const getPrayerTimes = (lat: number, lng: number) => apiGet<unknown>(`/api/prayer-times?lat=${lat}&lng=${lng}`, {ttl: 300})
