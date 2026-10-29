import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { startInstance } from '../start'
import { HTML_CACHE_HEADER } from './html-cache'

// The request middleware registered in src/start.ts, called the way TanStack Start calls it.
type Server = (options: { request: Request; next: () => Promise<unknown> }) => Promise<unknown>

function stubCache() {
  const store = new Map<string, Response>()
  const cache = {
    match: vi.fn(async (key: string) => store.get(key)?.clone()),
    put: vi.fn(async (key: string, response: Response) => { store.set(key, new Response(await response.text(), { status: response.status, headers: response.headers })) }),
  }
  vi.stubGlobal('caches', { default: cache })
  return { cache, store }
}

const page = () => new Response('<!DOCTYPE html><html><body>home</body></html>', { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
const get = (path: string, init: RequestInit = {}) => new Request(`https://jejakmasjid.my${path}`, init)

describe('homepage HTML cache middleware (src/start.ts)', () => {
  let server: Server
  beforeEach(async () => {
    const options = await startInstance.getOptions()
    const [middleware] = options.requestMiddleware ?? []
    expect(options.requestMiddleware).toHaveLength(1)
    server = (middleware as unknown as { options: { server: Server } }).options.server
  })
  // Vitest runs with DEV=true; the middleware only caches in production builds.
  beforeEach(() => { vi.stubEnv('DEV', false) })
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs() })

  it('never caches under `vite dev`', async () => {
    vi.stubEnv('DEV', true)
    const { cache } = stubCache()
    const result = { response: page() }
    expect(await server({ request: get('/'), next: async () => result })).toBe(result)
    expect(cache.match).not.toHaveBeenCalled()
  })

  it('caches GET / and /en: the second request never reaches the router', async () => {
    const { cache } = stubCache()
    for (const path of ['/', '/en']) {
      const next = vi.fn(async () => ({ response: page() }))
      const miss = await server({ request: get(path), next }) as Response
      expect(miss.headers.get(HTML_CACHE_HEADER)).toBe('miss')
      expect(await miss.text()).toContain('home')
      const again = vi.fn(async () => ({ response: page() }))
      const hit = await server({ request: get(path), next: again }) as Response
      expect(again).not.toHaveBeenCalled()
      expect(hit.headers.get(HTML_CACHE_HEADER)).toBe('hit')
      expect(hit.headers.get('Cache-Control')).toBe('public, max-age=60')
    }
    expect(cache.put).toHaveBeenCalledTimes(2)
  })

  it('passes everything else straight to the router and leaves the cache alone', async () => {
    const { cache } = stubCache()
    const requests = [
      get('/', { method: 'HEAD' }), get('/', { method: 'POST' }), get('/?x=1'), get('/en?utm=a'), get('/en/'),
      get('/privacy'), get('/masjid/surau-test'), get('/_serverFn/abc'), get('/', { headers: { Range: 'bytes=0-1' } }),
    ]
    for (const request of requests) {
      const result = { response: page() }
      const next = vi.fn(async () => result)
      expect(await server({ request, next }), `${request.method} ${request.url}`).toBe(result)
      expect(next).toHaveBeenCalledTimes(1)
    }
    expect(cache.match).not.toHaveBeenCalled()
    expect(cache.put).not.toHaveBeenCalled()
  })

  it('does not cache a non-200 homepage response', async () => {
    const { cache } = stubCache()
    const failing = new Response('error', { status: 500, headers: { 'Content-Type': 'text/html' } })
    const response = await server({ request: get('/'), next: async () => ({ response: failing }) })
    expect(response).toBe(failing)
    expect(cache.put).not.toHaveBeenCalled()
  })

  it('passes through when the Cache API is unavailable', async () => {
    vi.stubGlobal('caches', undefined)
    const result = { response: page() }
    expect(await server({ request: get('/'), next: async () => result })).toBe(result)
  })
})
