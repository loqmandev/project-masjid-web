import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
vi.mock('./worker-env', () => ({ getWorkerEnv: vi.fn() }))
import { Route } from '../routes/sitemaps.areas'
import { getWorkerEnv } from './worker-env'
import { sitemapIndexResponse } from './sitemap'
import { discoveryCacheKey } from './jm-api'
import fixture from './fixtures/discovery.json'

const origin = 'http://127.0.0.1:9999'
const areasUrl = origin + '/api/public/discovery/areas'
const entries = new Map<string, Response>()
const fetcher = vi.fn<(request: Request) => Promise<Response>>()
const put = vi.fn(async (key: string, response: Response) => {
  entries.set(key, response.clone())
})

beforeEach(() => {
  entries.clear()
  fetcher.mockReset()
  put.mockClear()
  vi.mocked(getWorkerEnv).mockResolvedValue({ MASJID_PAGES_ENABLED: 'false', JM_API_BASE: origin })
  vi.stubGlobal('fetch', fetcher)
  vi.stubGlobal('caches', { default: {
    match: vi.fn(async (key: string) => entries.get(key)?.clone()),
    put,
  } })
})
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks() })

// Keep getAreas and apiGet real: mocking the discriminated result misses failures
// between the upstream response, cache validation and the registered raw route.
describe.each(['GET', 'HEAD'] as const)('%s /sitemaps/areas', method => {
  const respond = async () => {
    const handlers = Route.options.server!.handlers!
    if (typeof handlers === 'function') throw new Error('Expected raw sitemap handlers')
    const handler = handlers[method]
    if (!handler) throw new Error(`Missing ${method} sitemap handler`)
    const response = await handler({
      request: new Request('https://jejakmasjid.my/sitemaps/areas', { method }),
      pathname: '/sitemaps/areas',
      context: {},
    } as never)
    if (!(response instanceof Response)) throw new Error('Expected a raw sitemap Response')
    return response
  }

  it.each(['invalid-payload', 'timeout', 'down'])('returns 503 with retry/no-store/noindex on %s, even after the sitemap index', async failure => {
    const timeout = vi.spyOn(AbortSignal, 'timeout')
    fetcher.mockImplementation(async () => {
      if (failure === 'timeout') throw new DOMException('The operation timed out', 'TimeoutError')
      return failure === 'down'
        ? new Response(null, { status: 503 })
        : Response.json({ payloadVersion: 1 })
    })
    const index = await sitemapIndexResponse()
    expect(await index.text()).not.toContain('/sitemaps/areas')
    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await respond()
      expect(response.status).toBe(503)
      expect(response.headers.get('Retry-After')).toBe('120')
      expect(response.headers.get('Cache-Control')).toBe('no-store')
      expect(response.headers.get('X-Robots-Tag')).toContain('noindex')
      expect(await response.text()).toBe('')
    }
    expect(fetcher).toHaveBeenCalledTimes(3)
    expect(fetcher.mock.calls.every(([request]) => request.url === areasUrl)).toBe(true)
    expect(timeout).toHaveBeenCalledWith(4000)
    expect(put).not.toHaveBeenCalled()
  })

  it('returns 404 only for a real backend 404, without negatively caching it', async () => {
    fetcher.mockImplementation(async () => Response.json({ error: 'not_found' }, { status: 404 }))
    const response = await respond()
    expect(response.status).toBe(404)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(response.headers.has('Retry-After')).toBe(false)
    expect(put).not.toHaveBeenCalled()
    fetcher.mockImplementation(async () => Response.json(fixture.areas))
    expect((await respond()).status).toBe(200)
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it.each(['invalid-payload', 'timeout'])('serves a previous valid sitemap on %s without extending its fallback lifetime', async failure => {
    fetcher.mockImplementation(async () => Response.json(fixture.areas))
    expect((await respond()).status).toBe(200)
    entries.delete(discoveryCacheKey(areasUrl))
    fetcher.mockImplementation(async () => {
      if (failure === 'timeout') throw new DOMException('The operation timed out', 'TimeoutError')
      return Response.json({ payloadVersion: 1 })
    })
    const response = await respond()
    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toContain('application/xml')
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(response.headers.has('Retry-After')).toBe(false)
    expect(await response.text()).toContain('/en/mosques/in/singapore')
    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(put).toHaveBeenCalledTimes(2)
  })
})
