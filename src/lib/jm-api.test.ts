import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  apiGet,
  publicCacheKey,
  validSlug,
  validProgramId,
  validSitemapPage,
  getMasjidPage,
  getProgram,
} from './jm-api'
afterEach(() => vi.unstubAllGlobals())
describe('public API boundary', () => {
  it('validates slug, id and sitemap without normalization', async () => {
    expect(validSlug('surau-test')).toBe(true)
    expect(validSlug('a-1')).toBe(true)
    for (const v of ['', 'a', 'ab', '-test', 'test-', '../foo', 'Test', 'a_b', 'a b', 'a--b', 'a---b', '--', 'test\n', 'test\r', 'a\u0000b', 'café'])
      expect(validSlug(v)).toBe(false)
    expect(validProgramId('a_-1')).toBe(true)
    expect(validProgramId('a/b')).toBe(false)
    expect(validSitemapPage('0')).toBe(false)
    expect(validSitemapPage('01')).toBe(false)
    expect(validSitemapPage('999')).toBe(true)
    expect((await getMasjidPage('../x')).status).toBe(404)
    expect((await getProgram('a/b')).status).toBe(404)
  })
  it('accepts a 100-character slug', () => {
    const slug = `${'a'.repeat(98)}-1`
    expect(slug).toHaveLength(100)
    expect(validSlug(slug)).toBe(true)
  })
  it('rejects a 101-character slug', () => {
    const slug = `${'a'.repeat(99)}-1`
    expect(slug).toHaveLength(101)
    expect(validSlug(slug)).toBe(false)
  })
  it('accepts the real 94-character slug from the Round 3 dry run', () => {
    const slug =
      'surau-simpang-tiga-permatang-tengah-permatang-pauh-bukit-mertajam-seberang-prai-seberang-perai'
    expect(slug).toHaveLength(94)
    expect(validSlug(slug)).toBe(true)
  })
  it('flag off never fetches', async () => {
    const f = vi.fn()
    vi.stubGlobal('fetch', f)
    expect((await apiGet('/api/x', { ttl: 300 }, {})).status).toBe(404)
    expect(f).not.toHaveBeenCalled()
  })
  it('gives stats reads a 1500 ms cap and every other read 5000 ms unless it overrides, and does not special-case old discovery paths', async () => {
    const timeout = vi.spyOn(AbortSignal, 'timeout').mockReturnValue(new AbortController().signal)
    const env = { MASJID_PAGES_ENABLED: 'true', JM_API: { fetch: vi.fn(async () => Response.json({})) } }
    await apiGet('/api/public/stats', { ttl: 0, timeoutMs: 6000 }, env)
    expect(timeout).toHaveBeenLastCalledWith(1500)
    await apiGet('/api/x', { ttl: 0 }, env)
    expect(timeout).toHaveBeenLastCalledWith(5000)
    await apiGet('/api/x', { ttl: 0, timeoutMs: 700 }, env)
    expect(timeout).toHaveBeenLastCalledWith(700)
    // The old discovery paths are ordinary reads now: gated by the masjid-pages flag like any other.
    const f = vi.fn()
    vi.stubGlobal('fetch', f)
    expect((await apiGet('/api/public/discovery/areas', { ttl: 60 }, {})).status).toBe(404)
    expect(f).not.toHaveBeenCalled()
    timeout.mockRestore()
  })
  it('uses binding and caches full URL with TTL', async () => {
    const f = vi.fn().mockResolvedValue(new Response('{"ok":true}'))
    const put = vi.fn()
    vi.stubGlobal('caches', { default: { match: vi.fn(), put } })
    const r = await apiGet(
      '/api/x',
      { ttl: 300 },
      {
        MASJID_PAGES_ENABLED: 'true',
        JM_API_BASE: 'http://localhost:8797',
        JM_API: { fetch: f },
      },
    )
    expect(r.body).toEqual({ ok: true })
    expect(f.mock.calls[0][0].url).toBe('http://localhost:8797/api/x')
    expect(put.mock.calls[0][0]).toBe(
      publicCacheKey('http://localhost:8797/api/x'),
    )
    expect(put.mock.calls[0][1].headers.get('cache-control')).toContain('60')
  })
  it('timeouts become 503; not cached', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new DOMException('timeout', 'TimeoutError')),
    )
    expect(
      (await apiGet('/api/x', { ttl: 1 }, { MASJID_PAGES_ENABLED: 'true' }))
        .status,
    ).toBe(503)
  })
  it('404 remains 404; upstream failures are 503', async () => {
    const f = vi
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 404 }))
      .mockResolvedValueOnce(new Response('', { status: 500 }))
    vi.stubGlobal('fetch', f)
    expect(
      (await apiGet('/api/x', { ttl: 1 }, { MASJID_PAGES_ENABLED: 'true' }))
        .status,
    ).toBe(404)
    expect(
      (await apiGet('/api/x', { ttl: 1 }, { MASJID_PAGES_ENABLED: 'true' }))
        .status,
    ).toBe(503)
  })
})
