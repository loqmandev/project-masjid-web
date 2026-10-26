import { beforeEach, expect, it, vi } from 'vitest'
vi.mock('./jm-api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./jm-api')>()),
  getSitemapCount: vi.fn(),
  getSitemapPage: vi.fn(),
}))
vi.mock('./discovery-api.server', () => ({ getAreas: vi.fn() }))
vi.mock('./worker-env', () => ({ getWorkerEnv: vi.fn() }))
import { getSitemapCount, getSitemapPage } from './jm-api'
import { getWorkerEnv } from './worker-env'
import { sitemapIndexResponse, sitemapPageResponse } from './sitemap'
import { getAreas } from './discovery-api.server'
import { areaSitemapResponse } from './discovery-sitemap'
beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getAreas).mockResolvedValue({ status: 'missing' })
  vi.mocked(getWorkerEnv).mockResolvedValue({ MASJID_PAGES_ENABLED: 'true' })
  vi.mocked(getSitemapCount).mockResolvedValue({
    status: 200,
    body: { total: 9725, pageSize: 5000, masjids: [] },
  })
  vi.mocked(getSitemapPage).mockResolvedValue({
    status: 200,
    body: {
      total: 9725,
      pageSize: 5000,
      page: 0,
      items: [{ slug: 'surau-test', lastmod: '2026-10-12' }],
    },
  })
})
it('flag on uses count-only, serves two pages and no outer cache', async () => {
  const r = await sitemapIndexResponse()
  expect(r.status).toBe(200)
  expect(r.headers.get('Cache-Control')).toBe('no-store')
  const text = await r.text()
  expect(text).toContain('/sitemaps/masjid/2')
  expect(text).not.toContain('/sitemaps/masjid/3')
  expect(getSitemapCount).toHaveBeenCalledOnce()
  expect(getSitemapPage).not.toHaveBeenCalled()
})
it('uses backend page size for both index and bounds', async () => {
  vi.mocked(getSitemapCount).mockResolvedValue({
    status: 200,
    body: { total: 5, pageSize: 2, masjids: [] },
  })
  expect(await (await sitemapIndexResponse()).text()).toContain(
    '/sitemaps/masjid/3',
  )
  vi.mocked(getSitemapPage).mockResolvedValue({
    status: 200,
    body: { total: 5, pageSize: 2, page: 2, items: [] },
  })
  expect((await sitemapPageResponse('3')).status).toBe(200)
  expect((await sitemapPageResponse('4')).status).toBe(404)
})
it('third page for 9725 rows is 404; first page has no-store XML', async () => {
  expect((await sitemapPageResponse('3')).status).toBe(404)
  const r = await sitemapPageResponse('1')
  expect(r.headers.get('Cache-Control')).toBe('no-store')
  expect(await r.text()).toContain('/masjid/surau-test')
})
it('backend 503 keeps static index accessible for 300s but dynamic page is 503/no-store', async () => {
  vi.mocked(getSitemapCount).mockResolvedValue({ status: 503, body: null })
  vi.mocked(getSitemapPage).mockResolvedValue({ status: 503, body: null })
  const index = await sitemapIndexResponse()
  expect(index.status).toBe(200)
  expect(index.headers.get('Cache-Control')).toBe('public, max-age=300')
  const xml = await index.text()
  expect(xml).toContain('sitemap-pages.xml')
  expect(xml).not.toContain('/sitemaps/masjid/')
  const r = await sitemapPageResponse('1')
  expect(r.status).toBe(503)
  expect(r.headers.get('Cache-Control')).toBe('no-store')
})
it('flag off does not request the backend', async () => {
  vi.mocked(getWorkerEnv).mockResolvedValue({ MASJID_PAGES_ENABLED: 'false' })
  expect(await (await sitemapIndexResponse()).text()).not.toContain(
    '/sitemaps/masjid/',
  )
  expect(getSitemapCount).not.toHaveBeenCalled()
})

it('includes the area sitemap only for a valid cached discovery tree, independently of masjid pages', async () => {
  const { getAreas } = await import('./discovery-api.server')
  const { default: fixture } = await import('./fixtures/discovery.json')
  vi.mocked(getWorkerEnv).mockResolvedValue({ MASJID_PAGES_ENABLED: 'false' })
  vi.mocked(getAreas).mockResolvedValue({ status: 'ok', data: fixture.areas as import('./discovery').Areas })
  expect(await (await sitemapIndexResponse()).text()).toContain('/sitemaps/areas')
  vi.mocked(getAreas).mockResolvedValue({ status: 'missing' })
  expect(await (await sitemapIndexResponse()).text()).not.toContain('/sitemaps/areas')
})
it('returns 503 with Retry-After for an unavailable discovery sitemap, and 404 when disabled', async () => {
  vi.mocked(getAreas).mockResolvedValue({ status: 'unavailable' })
  const r = await areaSitemapResponse()
  expect(r.status).toBe(503)
  expect(r.headers.get('Retry-After')).toBe('120')
  expect(r.headers.get('Cache-Control')).toBe('no-store')
  expect(r.headers.get('X-Robots-Tag')).toContain('noindex')
  vi.mocked(getAreas).mockResolvedValue({ status: 'missing' })
  expect((await areaSitemapResponse()).status).toBe(404)
})
