import { getWorkerEnv, type WebEnv } from './worker-env'
import type {
  PublicMasjidPage,
  PublicProgramDetail,
  SitemapPage,
} from './masjid-types'

export const validSlug = (s: string) =>
  s.length >= 3 && s.length <= 100 && !/[^a-z0-9-]|^-|-$|--/.test(s)
export const validProgramId = (s: string) => /^[A-Za-z0-9_-]{1,64}$/.test(s)
export const validSitemapPage = (s: string) => /^[1-9][0-9]{0,2}$/.test(s)
export type ApiResult<T> = { status: number; body: T | null }
export const PUBLIC_CACHE_TAG = 'jm-ajk-public'
// Cache API custom keys must belong to the web zone for zone tag purges.
// Including the upstream URL isolates service-binding/local environments.
export const publicCacheKey = (url: string, prayer = false) =>
  `https://jejakmasjid.my/__jm-internal-cache/${prayer ? 'prayer' : 'ajk-public'}/v1/${encodeURIComponent(url)}`

// Server-only. Never forward visitor credentials. Cache failures are best-effort.
export async function apiGet<T>(
  path: string,
  opts: { ttl: number; timeoutMs?: number; cacheNegative?: boolean },
  supplied?: WebEnv,
): Promise<ApiResult<T>> {
  const env = supplied ?? (await getWorkerEnv())
  if (env.MASJID_PAGES_ENABLED !== 'true') return { status: 404, body: null }
  if (!path.startsWith('/api/') || path.includes('..'))
    return { status: 404, body: null }
  const url = new URL(
    path,
    env.JM_API_BASE || 'https://apiv2.jejakmasjid.my',
  ).toString()
  const prayer = path.startsWith('/api/prayer-times?')
  const negative = prayer && opts.cacheNegative === true
  const key = publicCacheKey(url, prayer)
  const cache =
    typeof caches !== 'undefined'
      ? (caches as CacheStorage & { default?: Cache }).default
      : undefined
  const ttl = Math.min(opts.ttl, prayer ? 300 : 60)
  const put = async (response: Response) => {
    if (!cache) return
    const copy = response.clone()
    copy.headers.set('Cache-Control', `public, max-age=${ttl}`)
    if (!prayer) copy.headers.set('Cache-Tag', PUBLIC_CACHE_TAG)
    try {
      await cache.put(key, copy)
    } catch {
      /* Never fail a public read for a cache write. */
    }
  }
  try {
    let cached: Response | undefined
    try {
      cached = await cache?.match(key)
    } catch {
      /* Read through on cache failure. */
    }
    if (cached) {
      return {
        status: cached.headers.has('X-JM-Prayer-Unavailable')
          ? 503
          : cached.status,
        body: cached.status === 200 ? ((await cached.json()) as T) : null,
      }
    }
    const request = new Request(url, {
      signal: AbortSignal.timeout(opts.timeoutMs ?? 5000),
      redirect: 'manual',
    })
    const response = await (env.JM_API
      ? env.JM_API.fetch(request)
      : fetch(request))
    if (response.status === 200) {
      const body = (await response.json()) as T
      await put(Response.json(body))
      return { status: 200, body }
    }
    if (!negative && response.status === 404) {
      await put(new Response(null, { status: 404 }))
      return { status: 404, body: null }
    }
  } catch {
    /* Timeout, invalid JSON or network failure. Optional prayers hide. */
  }
  if (negative) {
    // Cache API cannot cache errors: an explicit 200/null sentinel remembers failure.
    await put(
      new Response('null', {
        headers: {
          'Content-Type': 'application/json',
          'X-JM-Prayer-Unavailable': '1',
        },
      }),
    )
  }
  return { status: 503, body: null }
}
export const getMasjidPage = (slug: string) =>
  validSlug(slug)
    ? apiGet<PublicMasjidPage | { redirect: string }>(
        `/api/public/masjids/by-slug/${slug}`,
        { ttl: 60 },
      )
    : Promise.resolve({ status: 404, body: null })
export const getProgram = (id: string) =>
  validProgramId(id)
    ? apiGet<PublicProgramDetail>(`/api/public/programs/${id}`, { ttl: 60 })
    : Promise.resolve({ status: 404, body: null })
// Backend pages are zero-based, public sitemap URLs are one-based.
export const getSitemapPage = (n: string) =>
  validSitemapPage(n)
    ? apiGet<SitemapPage>(`/api/public/masjid-sitemap?page=${Number(n) - 1}`, {
        ttl: 60,
      })
    : Promise.resolve({ status: 404, body: null })
export const getSitemapCount = () =>
  apiGet<{ total: number; pageSize: number; masjids: [] }>(
    '/api/public/masjid-sitemap?countOnly=1',
    { ttl: 60 },
  )
export const getPrayerTimes = (lat: number, lng: number) =>
  apiGet<unknown>(`/api/prayer-times?lat=${lat}&lng=${lng}`, {
    ttl: 300,
    timeoutMs: 1500,
    cacheNegative: true,
  })
