/**
 * Edge cache for the two homepage documents (`/` and `/en`).
 *
 * The homepage HTML is identical for every visitor, but rendering it means an
 * SSR pass plus an optional public-stats read, and document TTFB was measured
 * swinging between 0.2 s and 1.2 s. The request middleware in `src/start.ts`
 * serves these two paths from the Workers Cache API for 300 s.
 *
 * Safety rules:
 * - Only GET, exact path `/` or `/en`, no query string, no Range header.
 *   HEAD and everything else pass straight through.
 * - Only a 200 `text/html` response without `Set-Cookie`, `no-store` or `private`
 *   is stored.
 * - The key carries a build id that changes on every build (`vite.config.ts`
 *   defines it), so a deploy never serves HTML that points at old asset hashes.
 * - Every cache failure falls back to a normal render.
 */

/** Replaced at build time by `define` in vite.config.ts; absent under Vitest. */
declare const __JM_BUILD_ID__: string | undefined

export const HTML_CACHE_TTL = 300
/** What browsers (and any shared cache in front) may keep. */
export const HTML_BROWSER_MAX_AGE = 60
export const HTML_CACHE_HEADER = 'X-JM-Html-Cache'

const CACHEABLE_PATHS: ReadonlySet<string> = new Set(['/', '/en'])

export const currentBuildId = () =>
  typeof __JM_BUILD_ID__ === 'string' && __JM_BUILD_ID__ !== '' ? __JM_BUILD_ID__ : 'dev'

// Cache API custom keys must be on a zone host; the path is internal and never routed.
export const htmlCacheKey = (path: string, buildId = currentBuildId()) =>
  `https://jejakmasjid.my/__jm-internal-cache/html/${encodeURIComponent(buildId)}${path}`

/** The cacheable path for this request, or null when it must bypass the cache. */
export function cacheablePath(request: Request): string | null {
  if (request.method !== 'GET') return null
  if (request.headers.has('Range')) return null
  const url = new URL(request.url)
  if (url.search !== '' || !CACHEABLE_PATHS.has(url.pathname)) return null
  return url.pathname
}

/** True only for a complete, public, cookie-free HTML page. */
export function isStorableHtml(response: unknown): response is Response {
  if (!(response instanceof Response) || response.status !== 200) return false
  if (!(response.headers.get('Content-Type') ?? '').toLowerCase().includes('text/html')) return false
  if (response.headers.has('Set-Cookie')) return false
  return !/\b(no-store|private)\b/i.test(response.headers.get('Cache-Control') ?? '')
}

function withHeaders(response: Response, cacheControl: string, state?: 'hit' | 'miss', body: BodyInit | null = response.body) {
  const headers = new Headers(response.headers)
  headers.set('Cache-Control', cacheControl)
  if (state) headers.set(HTML_CACHE_HEADER, state)
  return new Response(body, { status: response.status, statusText: response.statusText, headers })
}

export type HtmlCacheEnv = {
  cache: Pick<Cache, 'match' | 'put'> | undefined
  /** Keeps the cache write alive after the response is sent. Awaited inline when absent. */
  waitUntil?: (promise: Promise<unknown>) => void
  buildId?: string
}

/**
 * Serves `path` from the cache, or renders it and stores the result. `render`
 * must produce the normal response and is called at most once.
 */
export async function serveHtmlFromCache<T>(
  path: string,
  render: () => Promise<T>,
  { cache, waitUntil, buildId }: HtmlCacheEnv,
): Promise<T | Response> {
  if (!cache) return render()
  const key = htmlCacheKey(path, buildId)
  try {
    const hit = await cache.match(key)
    if (hit) return withHeaders(hit, `public, max-age=${HTML_BROWSER_MAX_AGE}`, 'hit')
  } catch {
    /* Read through on cache failure. */
  }
  const rendered = await render()
  if (!isStorableHtml(rendered)) return rendered
  const stored = withHeaders(rendered, `public, max-age=${HTML_CACHE_TTL}`, undefined, rendered.clone().body)
  const write = Promise.resolve()
    .then(() => cache.put(key, stored))
    .catch(() => {
      /* Never fail a page for a cache write. */
    })
  if (waitUntil) waitUntil(write)
  else await write
  return withHeaders(rendered, `public, max-age=${HTML_BROWSER_MAX_AGE}`, 'miss')
}
