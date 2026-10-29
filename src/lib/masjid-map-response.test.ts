import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { gzipSync } from 'node:zlib'
import { MASJID_NEGARA, fixtureTile } from './map-fixtures'
import { fallbackMapSvg, mapCacheKey } from './masjid-map'
import { page } from './masjid-fixture'

let env: Record<string, unknown> = {}
vi.mock('./worker-env', () => ({ getWorkerEnv: async () => env }))
vi.mock('./jm-api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./jm-api')>()),
  getMasjidPage: vi.fn(),
}))
import { getMasjidPage } from './jm-api'
import { masjidMapResponse } from './masjid-map-response'

const negara = {
  ...page,
  masjid: { ...page.masjid, slug: 'masjid-negara', lat: MASJID_NEGARA.lat, lng: MASJID_NEGARA.lng },
}
const tileUrl = (input: Request | URL | string) => new URL(input instanceof Request ? input.url : String(input))
const tileFromUrl = (url: URL) => {
  const [, z, x, y] = url.pathname.match(/^\/(\d+)\/(\d+)\/(\d+)\.mvt$/) ?? []
  if (z !== '15') throw new Error(`unexpected tile ${url.pathname}`)
  return fixtureTile(MASJID_NEGARA.set, Number(x), Number(y))
}
const mvt = (bytes: Uint8Array, init: ResponseInit = {}) => new Response(bytes as BodyInit, { status: 200, ...init })

function fakeCache() {
  const store = new Map<string, Response>()
  return {
    store,
    match: vi.fn(async (key: string) => store.get(key)?.clone()),
    put: vi.fn(async (key: string, res: Response) => void store.set(key, res)),
  }
}

beforeEach(() => {
  env = {}
  vi.mocked(getMasjidPage).mockReset()
  vi.mocked(getMasjidPage).mockResolvedValue({ status: 200, body: negara })
})
afterEach(() => vi.unstubAllGlobals())

describe('/masjid/<slug>/map.svg', () => {
  it('404s invalid slugs before any upstream call, and unknown masjids', async () => {
    for (const slug of ['../bad', 'Bad', 'ab', 'a--b'])
      expect((await masjidMapResponse(slug, 'GET')).status).toBe(404)
    expect(getMasjidPage).not.toHaveBeenCalled()
    vi.mocked(getMasjidPage).mockResolvedValue({ status: 404, body: null })
    const res = await masjidMapResponse('masjid-negara', 'GET')
    expect(res.status).toBe(404)
    expect(res.headers.get('Content-Type')).not.toContain('svg')
  })
  it('503s without caching when the backend is unavailable and redirects aliases', async () => {
    vi.mocked(getMasjidPage).mockResolvedValue({ status: 503, body: null })
    const down = await masjidMapResponse('masjid-negara', 'GET')
    expect(down.status).toBe(503)
    expect(down.headers.get('Cache-Control')).toBe('no-store')
    vi.mocked(getMasjidPage).mockResolvedValue({ status: 200, body: { redirect: 'masjid-negara-baru' } })
    const moved = await masjidMapResponse('masjid-negara-lama', 'GET')
    expect(moved.status).toBe(301)
    expect(moved.headers.get('Location')).toBe('/masjid/masjid-negara-baru/map.svg')
    vi.mocked(getMasjidPage).mockResolvedValue({ status: 200, body: { redirect: 'https://evil.test' } })
    expect((await masjidMapResponse('masjid-negara-lama', 'GET')).status).toBe(404)
  })

  it('renders through the TILES service binding with a 30 day cache and safe SVG headers', async () => {
    const fetched: string[] = []
    env = {
      TILES: {
        fetch: async (req: Request) => {
          fetched.push(tileUrl(req).pathname)
          return mvt(tileFromUrl(tileUrl(req)))
        },
      },
    }
    const publicFetch = vi.fn()
    vi.stubGlobal('fetch', publicFetch)
    const res = await masjidMapResponse('masjid-negara', 'GET')
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toContain('image/svg+xml')
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=2592000')
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff')
    expect(res.headers.get('Content-Security-Policy')).toContain("default-src 'none'")
    expect(fetched.sort()).toEqual([
      '/15/25639/16097.mvt',
      '/15/25639/16098.mvt',
      '/15/25640/16097.mvt',
      '/15/25640/16098.mvt',
    ])
    expect(publicFetch).not.toHaveBeenCalled()
    const svg = await res.text()
    expect(svg).toContain('stroke="#ffffff"')
    expect(svg).toContain('OpenStreetMap')
  })

  it('answers HEAD with the same headers and no body', async () => {
    env = { TILES: { fetch: async (req: Request) => mvt(tileFromUrl(tileUrl(req))) } }
    const get = await masjidMapResponse('masjid-negara', 'GET')
    const head = await masjidMapResponse('masjid-negara', 'HEAD')
    expect(head.status).toBe(200)
    expect(await head.text()).toBe('')
    for (const name of ['Content-Type', 'Cache-Control', 'Content-Security-Policy'])
      expect(head.headers.get(name)).toBe(get.headers.get(name))
  })

  it('falls back to the public tile host (or TILES_BASE) when the binding is absent', async () => {
    const urls: string[] = []
    vi.stubGlobal('fetch', async (req: Request) => {
      urls.push(tileUrl(req).origin)
      return mvt(tileFromUrl(tileUrl(req)))
    })
    expect((await masjidMapResponse('masjid-negara', 'GET')).status).toBe(200)
    env = { TILES_BASE: 'http://127.0.0.1:8797' }
    expect((await masjidMapResponse('masjid-negara', 'GET')).status).toBe(200)
    expect(new Set(urls)).toEqual(new Set(['https://tiles.jejakmasjid.my', 'http://127.0.0.1:8797']))
  })

  it('accepts gzip tiles and tiles the runtime already decoded', async () => {
    let n = 0
    env = {
      TILES: {
        fetch: async (req: Request) => {
          const raw = tileFromUrl(tileUrl(req))
          return n++ % 2 ? mvt(raw) : mvt(new Uint8Array(gzipSync(raw)))
        },
      },
    }
    const svg = await (await masjidMapResponse('masjid-negara', 'GET')).text()
    expect(n).toBe(4)
    expect(svg).toContain('stroke="#ffffff"')
  })

  it('serves the fallback SVG (never an error image) on any tile failure, with a short cache', async () => {
    const failures: Array<() => Promise<Response>> = [
      async () => new Response('Tile source unavailable', { status: 502 }),
      async () => new Response(null, { status: 404 }),
      async () => {
        throw new Error('network')
      },
      async () => mvt(new Uint8Array([0x1a, 0xff, 0xff, 0xff, 0xff, 0x0f])),
      async () => mvt(new Uint8Array([0x1f, 0x8b, 1, 2, 3])), // gzip magic, corrupt body
    ]
    for (const fail of failures) {
      env = { TILES: { fetch: fail } }
      const res = await masjidMapResponse('masjid-negara', 'GET')
      expect(res.status).toBe(200)
      expect(res.headers.get('Content-Type')).toContain('image/svg+xml')
      expect(res.headers.get('Cache-Control')).toBe('public, max-age=300')
      expect(await res.text()).toBe(fallbackMapSvg())
    }
  })

  it('does not let one missing tile produce a map with holes', async () => {
    let n = 0
    env = {
      TILES: {
        fetch: async (req: Request) =>
          ++n === 3 ? new Response('x', { status: 502 }) : mvt(tileFromUrl(tileUrl(req))),
      },
    }
    expect(await (await masjidMapResponse('masjid-negara', 'GET')).text()).toBe(fallbackMapSvg())
  })

  it('serves the fallback for impossible coordinates without touching tiles', async () => {
    const fetchTiles = vi.fn()
    env = { TILES: { fetch: fetchTiles } }
    vi.mocked(getMasjidPage).mockResolvedValue({
      status: 200,
      body: { ...negara, masjid: { ...negara.masjid, lat: 0, lng: 400 } },
    })
    expect(await (await masjidMapResponse('masjid-negara', 'GET')).text()).toBe(fallbackMapSvg())
    expect(fetchTiles).not.toHaveBeenCalled()
  })

  it('caches a real map by slug and rounded coordinates, and never caches a fallback', async () => {
    const cache = fakeCache()
    vi.stubGlobal('caches', { default: cache })
    const tiles = vi.fn(async (req: Request) => mvt(tileFromUrl(tileUrl(req))))
    env = { TILES: { fetch: tiles } }
    const first = await masjidMapResponse('masjid-negara', 'GET')
    const key = mapCacheKey('masjid-negara', MASJID_NEGARA.lat, MASJID_NEGARA.lng)
    expect(cache.put).toHaveBeenCalledTimes(1)
    expect(cache.put.mock.calls[0][0]).toBe(key)
    expect(cache.put.mock.calls[0][1].headers.get('Cache-Control')).toBe('public, max-age=2592000')
    const calls = tiles.mock.calls.length
    const second = await masjidMapResponse('masjid-negara', 'GET')
    expect(tiles.mock.calls.length).toBe(calls) // served from the Cache API
    expect(await second.text()).toBe(await first.text())
    expect(second.headers.get('Cache-Control')).toBe('public, max-age=2592000')

    cache.store.clear()
    cache.put.mockClear()
    env = { TILES: { fetch: async () => new Response('x', { status: 502 }) } }
    await masjidMapResponse('masjid-negara', 'GET')
    expect(cache.put).not.toHaveBeenCalled()
  })

  it('survives a broken cache', async () => {
    vi.stubGlobal('caches', {
      default: { match: async () => { throw new Error('cache') }, put: async () => { throw new Error('cache') } },
    })
    env = { TILES: { fetch: async (req: Request) => mvt(tileFromUrl(tileUrl(req))) } }
    const res = await masjidMapResponse('masjid-negara', 'GET')
    expect(res.status).toBe(200)
    expect(await res.text()).toContain('stroke="#ffffff"')
  })
})
