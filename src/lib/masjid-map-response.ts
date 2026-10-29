import { getWorkerEnv, type WebEnv } from './worker-env'
import { getMasjidPage, validSlug } from './jm-api'
import {
  fallbackMapSvg,
  mapCacheKey,
  mapWindow,
  renderMapSvg,
  tilePath,
  validCoordinates,
  type MapTileRef,
} from './masjid-map'

/**
 * Server route logic for /masjid/<slug>/map.svg. The map is drawn from our own
 * vector tiles (service binding TILES, or tiles.jejakmasjid.my when the binding
 * is absent). Any tile problem returns a plain fallback SVG, never an error
 * image, so the page's <img> always shows something.
 */

const CACHE_OK = 'public, max-age=2592000'
// A fallback is not a real map: let browsers and the edge retry soon.
const CACHE_FALLBACK = 'public, max-age=300'
const TILE_TIMEOUT_MS = 3000
const TILE_MAX_BYTES = 2_000_000
const DEFAULT_TILES_BASE = 'https://tiles.jejakmasjid.my'

const headers = (cacheControl: string) => ({
  'Content-Type': 'image/svg+xml; charset=utf-8',
  'Cache-Control': cacheControl,
  'X-Content-Type-Options': 'nosniff',
  // The file is only ever used as an <img>; if opened directly it can run nothing.
  'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox",
})
const svgResponse = (svg: string, cacheControl: string, method: string) =>
  new Response(method === 'HEAD' ? null : svg, { headers: headers(cacheControl) })

async function gunzip(bytes: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new DecompressionStream('gzip'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

export async function fetchTile(env: WebEnv, ref: MapTileRef): Promise<Uint8Array> {
  const url = new URL(tilePath(ref), env.TILES_BASE || DEFAULT_TILES_BASE)
  const request = new Request(url, { signal: AbortSignal.timeout(TILE_TIMEOUT_MS) })
  const response = await (env.TILES ? env.TILES.fetch(request) : fetch(request))
  if (response.status !== 200) throw new Error(`tile ${ref.x}/${ref.y}: ${response.status}`)
  let bytes: Uint8Array = new Uint8Array(await response.arrayBuffer())
  // The tiles Worker only labels a tile gzip when the bytes still are; both cases
  // are handled so a double-encoded or already-decoded body never breaks the map.
  if (bytes.length > 1 && bytes[0] === 0x1f && bytes[1] === 0x8b) bytes = await gunzip(bytes)
  if (bytes.length > TILE_MAX_BYTES) throw new Error('tile too large')
  return bytes
}

export async function renderMasjidMap(env: WebEnv, lat: number, lng: number): Promise<string> {
  const win = mapWindow(lat, lng)
  const entries = await Promise.all(
    win.tiles.map(async (ref) => [`${ref.x}/${ref.y}`, await fetchTile(env, ref)] as const),
  )
  return renderMapSvg(win, new Map(entries), { buildings: true })
}

const notFound = () =>
  new Response('Not Found', { status: 404, headers: { 'Cache-Control': 'no-store' } })

export async function masjidMapResponse(
  slug: string,
  method: string,
  supplied?: WebEnv,
): Promise<Response> {
  if (!validSlug(slug)) return notFound()
  const env = supplied ?? (await getWorkerEnv())
  // The tile source can be unavailable: with the switch off there is no map at all.
  if (env.MASJID_MAP_ENABLED !== 'true') return notFound()
  const page = await getMasjidPage(slug)
  if (page.status === 404) return notFound()
  if (!page.body || page.status !== 200)
    return new Response('Unavailable', { status: 503, headers: { 'Cache-Control': 'no-store' } })
  if ('redirect' in page.body) {
    if (!validSlug(page.body.redirect)) return notFound()
    return new Response(null, {
      status: 301,
      headers: { Location: `/masjid/${page.body.redirect}/map.svg`, 'Cache-Control': 'no-store' },
    })
  }
  const { lat, lng } = page.body.masjid
  if (!validCoordinates(lat, lng)) return svgResponse(fallbackMapSvg(), CACHE_FALLBACK, method)

  const cache =
    typeof caches !== 'undefined'
      ? (caches as CacheStorage & { default?: Cache }).default
      : undefined
  const key = mapCacheKey(slug, lat, lng)
  try {
    const cached = await cache?.match(key)
    if (cached) return svgResponse(await cached.text(), CACHE_OK, method)
  } catch {
    /* Render again on a cache failure. */
  }
  let svg: string
  try {
    svg = await renderMasjidMap(env, lat, lng)
  } catch {
    return svgResponse(fallbackMapSvg(), CACHE_FALLBACK, method)
  }
  try {
    await cache?.put(key, new Response(svg, { headers: headers(CACHE_OK) }))
  } catch {
    /* A cache write never fails the map. */
  }
  return svgResponse(svg, CACHE_OK, method)
}
