import backendFixture from './fixtures/discovery-backend.json'
import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { areaPath, discoverySearch, discoveryAreaSearch, searchPath, validAreas, validAreaList, validNearby, validSearch, type Areas, type AreaList, type DiscoveryItem, type SearchResults } from './discovery'
import { areaHead, itemList, landingHead } from './discovery-seo'
import { htmlLangForPath, twinForPath } from './i18n'
import { areaSitemap } from './discovery-sitemap'
import { DiscoveryAvailability } from '@/components/DiscoveryAvailability'
import { HeaderContent } from '@/components/Header'
import Hero from '@/components/Hero'
import PublicStats from '@/components/PublicStats'
import { apiGet } from './jm-api'
import { getAreas, getAreaList, getSearch, getNearby } from './discovery-api.server'
const fixture = () => JSON.parse(readFileSync(new URL('./fixtures/discovery.json', import.meta.url), 'utf8')) as { areas: Areas; items: DiscoveryItem[] }
const list = (): AreaList => ({ payloadVersion: 1, area: { country: 'malaysia', region: 'selangor', district: 'petaling', names: { country: 'Malaysia', region: 'Selangor', district: 'Petaling' } }, total: 51, page: 1, pageSize: 50, items: fixture().items.slice(0, 50) })
const searchResults = (page = 1, total = 51): SearchResults => ({ payloadVersion: 1, q: 'masjid', page, pageSize: 20, total, items: fixture().items.slice((page - 1) * 20, Math.min(page * 20, total)) })
const stats = JSON.parse(readFileSync(new URL('./fixtures/public-stats.json', import.meta.url), 'utf8'))
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks() })

describe('strict discovery contracts', () => {
  it('accepts the unchanged backend samples and rejects the historical unpaginated search sample', () => {
    expect(validAreas(backendFixture.areas)).toEqual(backendFixture.areas)
    expect(validAreaList(backendFixture.masjids)).toEqual(backendFixture.masjids)
    expect(validSearch(backendFixture.search)).toBeNull()
    expect(validNearby(backendFixture.nearby)).toEqual(backendFixture.nearby)
  })
  it('accepts all four public response shapes', () => {
    expect(validAreas(fixture().areas)).toEqual(fixture().areas)
    expect(validAreaList(list())).toEqual(list())
    expect(validSearch(searchResults(), 'masjid')).toEqual(searchResults())
    expect(validNearby({ payloadVersion: 1, items: [{ ...fixture().items[0], distanceM: 150 }] })).toBeTruthy()
  })
  it.each([
    (v: Areas) => { v.payloadVersion = 2 as 1 },
    (v: Areas) => { v.countries[0].count = -1 },
    (v: Areas) => { v.countries.push(v.countries[0]) },
    (v: Areas) => { v.countries[0].regions[0].slug = '../selangor' },
    (v: Areas) => { v.countries[0].regions[0].districts[0].count = 0.1 },
    (v: Areas) => { v.countries[0].regions[0].districts.push(v.countries[0].regions[0].districts[0]) },
    (v: Areas) => { v.countries[1].regions = v.countries[0].regions },
    (v: Areas) => { Object.assign(v, { userId: 'private' }) },
    (v: Areas) => { v.generatedAt = 'yesterday' },
  ])('rejects invalid trees and schema drift %#', mutate => {
    const v = fixture().areas; mutate(v); expect(validAreas(v)).toBeNull()
  })
  it('rejects incomplete, mismatched and private list/search payloads', () => {
    expect(validAreaList({ ...list(), page: 0 })).toBeNull()
    expect(validAreaList({ ...list(), page: 2 })).toBeNull()
    expect(validAreaList(list(), { country: 'singapore' })).toBeNull()
    const v = list(); Object.assign(v.items[0], { lat: 3.1 }); expect(validAreaList(v)).toBeNull()
    expect(validSearch({ ...searchResults(), items: fixture().items.slice(0, 21) })).toBeNull()
    expect(validSearch(searchResults(), 'surau')).toBeNull()
    expect(validNearby({ payloadVersion: 1, items: [{ ...fixture().items[0], distanceM: 151 }] })).toBeNull()
    expect(validNearby({ payloadVersion: 1, items: [{ ...fixture().items[0], distanceM: 500 }, { ...fixture().items[1], distanceM: 150 }] })).toBeNull()
  })
  it('accepts empty, full, last and capped search pages', () => {
    for (const value of [searchResults(1, 0), searchResults(1, 20), searchResults(2), searchResults(3), { ...searchResults(), page: 10, total: 200 }]) expect(validSearch(value)).toEqual(value)
  })
  it.each([
    { page: 0 }, { page: -1 }, { page: 1.5 }, { page: '2' }, { page: 4 }, { page: NaN },
    { pageSize: 50 }, { pageSize: '20' }, { total: -1 }, { total: 201 }, { total: 20.5 }, { total: '51' }, { total: Infinity },
    { items: [] }, { items: fixture().items.slice(0, 19) }, { items: fixture().items.slice(0, 21) },
    { payloadVersion: 2 }, { q: ' masjid' }, { q: 'a' }, { q: 'a'.repeat(81) }, { extra: true },
  ])('rejects malformed search pagination or schema drift: %j', patch => {
    expect(validSearch({ ...searchResults(), ...patch })).toBeNull()
  })
  it('requires the complete last-page count and all strict search keys', () => {
    expect(validSearch({ ...searchResults(3), items: fixture().items.slice(40, 50) })).toBeNull()
    expect(validSearch({ ...searchResults(3), items: fixture().items.slice(40, 52) })).toBeNull()
    expect(validSearch({ ...searchResults(1, 0), items: fixture().items.slice(0, 1) })).toBeNull()
    for (const key of Object.keys(searchResults())) {
      const value = { ...searchResults() } as Record<string, unknown>
      delete value[key]
      expect(validSearch(value)).toBeNull()
    }
  })
})

describe('discovery URLs and search metadata', () => {
  it('uses localized pagination, one canonical per page and reciprocal alternates', () => {
    const data = list(); data.page = 2; data.items = fixture().items.slice(50, 51)
    expect(validAreaList(data)).toBeTruthy()
    for (const locale of ['ms', 'en'] as const) {
      const path = areaPath(locale, data.area, 2)
      expect(path).toContain(locale === 'ms' ? '?halaman=2' : '?page=2')
      const head = areaHead(locale, { areas: fixture().areas, list: data })
      expect(head.links!.filter(l => l.rel === 'canonical')).toEqual([{ rel: 'canonical', href: 'https://jejakmasjid.my' + path }])
      expect(head.links!.filter(l => l.rel === 'alternate').map(l => l.hrefLang)).toEqual(['ms', 'en', 'x-default'])
      expect(head.meta).toContainEqual({ name: 'robots', content: 'index, follow, max-image-preview:large' })
      expect(htmlLangForPath(path.split('?')[0])).toBe(locale)
      expect(twinForPath(path.split('?')[0])).toBe(areaPath(locale === 'ms' ? 'en' : 'ms', data.area))
      const ld = JSON.parse(head.scripts![0].children)
      expect(ld[0]['@type']).toBe('BreadcrumbList')
      expect(ld[0].itemListElement).toHaveLength(4)
      expect(ld[1].itemListElement[0].position).toBe(51)
      expect(ld[1].itemListElement[0].item['@type']).toBe('Place')
      expect(JSON.stringify(ld)).not.toContain('rating')
    }
  })
  it('indexes at 3 and excludes only thin areas', () => {
    for (const total of [2, 3]) {
      const v = { ...list(), total, items: fixture().items.slice(0, total) }
      expect(areaHead('ms', { areas: fixture().areas, list: v }).meta).toContainEqual({ name: 'robots', content: total < 3 ? 'noindex, nofollow' : 'index, follow, max-image-preview:large' })
    }
    expect(itemList(fixture().items.slice(0, 1)).itemListElement[0].item.url).toContain('/masjid/')
    expect(landingHead('en', { q: 'Masjid & Surau', results: null }).links[0].href).toBe('https://jejakmasjid.my/en/mosques')
  })
  it.each(['ms', 'en'] as const)('keeps %s search pages noindex, follow with bare landing canonicals and continued JSON-LD positions', locale => {
    for (const q of ['a', 'Masjid & Surau', 'a'.repeat(81)]) for (const results of [null, searchResults(2)]) {
      const head = landingHead(locale, { q, results })
      expect(head.meta).toContainEqual({ name: 'robots', content: 'noindex, follow' })
      expect(head.links.filter(link => link.rel === 'canonical')).toEqual([{ rel: 'canonical', href: 'https://jejakmasjid.my' + (locale === 'ms' ? '/masjid' : '/en/mosques') }])
      expect(head.links.filter(link => link.rel === 'alternate').map(link => link.href)).toEqual(['https://jejakmasjid.my/masjid', 'https://jejakmasjid.my/en/mosques', 'https://jejakmasjid.my/en/mosques'])
      if (results) expect(JSON.parse(head.scripts[0].children).itemListElement[0].position).toBe(21)
    }
    expect(landingHead(locale, { q: '', results: null }).meta).toContainEqual({ name: 'robots', content: 'index, follow, max-image-preview:large' })
  })
  it('normalizes search safely and never emits unknown-area sitemap entries', () => {
    expect(discoverySearch({ q: '  masjid  ', halaman: '2', page: 3 }, 'ms')).toEqual({ q: 'masjid', halaman: 2 })
    expect(discoverySearch({ q: '  masjid  ', halaman: '2', page: 3 }, 'en')).toEqual({ q: 'masjid', page: 3 })
    expect(discoverySearch({}, 'ms')).toEqual({})
    expect(discoveryAreaSearch({ halaman: '2', page: 3 }, 'ms')).toEqual({ halaman: 2 })
    expect(discoveryAreaSearch({ halaman: '3', page: 2 }, 'en')).toEqual({ page: 2 })
    expect(discoveryAreaSearch({ page: 2 }, 'ms')).toEqual({})
    expect(discoveryAreaSearch({ halaman: 2 }, 'en')).toEqual({})
    for (const page of ['0', '-1', '1e2', 'NaN', '9007199254740992']) expect(discoveryAreaSearch({ page }, 'en').page).toBe(1)
    const xml = areaSitemap(fixture().areas)
    expect(xml).toContain('/masjid/di/malaysia/selangor/petaling')
    expect(xml).toContain('/en/mosques/in/singapore')
    expect(xml).toContain('hreflang="x-default"')
    expect(xml).toContain('/petaling?halaman=2')
    expect(xml).toContain('/petaling?page=2')
    expect(xml).not.toContain('/selangor/klang')
    expect(xml).not.toContain('/other')
  })
  it.each(['ms', 'en'] as const)('drops invalid %s search pages and keeps only the localized positive integer', locale => {
    const param = locale === 'ms' ? 'halaman' : 'page'
    const parse = (value: unknown) => locale === 'ms' ? discoverySearch({ q: 'masjid', [param]: value }, 'ms') : discoverySearch({ q: 'masjid', [param]: value }, 'en')
    for (const value of [undefined, null, '', 0, '0', -1, '-1', 1.5, '1.5', '01', '+2', ' 2 ', '1e2', 'NaN', Infinity, true, [], [2], {}, '9007199254740992', 1, '1']) expect(parse(value)).toEqual({ q: 'masjid' })
    for (const value of [2, '2', 10, '10', Number.MAX_SAFE_INTEGER]) expect(parse(value)).toEqual({ q: 'masjid', [param]: Number(value) })
    expect(searchPath(locale, 'Masjid & Surau', 2)).toBe(`${locale === 'ms' ? '/masjid' : '/en/mosques'}?q=Masjid+%26+Surau&${param}=2`)
    expect(searchPath(locale, 'masjid', 1)).not.toMatch(/(?:page|halaman)=1/)
  })
})

describe('server-gated links', () => {
  for (const available of [false, true]) it(`renders all entry points only when available=${available}`, () => {
    const areas = available ? fixture().areas : null
    const nav = renderToStaticMarkup(createElement(HeaderContent, { path: '/', discovery: available }))
    expect(nav.includes('href="/masjid"')).toBe(available)
    const hero = renderToStaticMarkup(createElement(DiscoveryAvailability.Provider, { value: areas }, createElement(Hero)))
    expect(hero.includes('href="/masjid"')).toBe(available)
    // Hero copy: headline, supporting line, discovery link; illustration caption is fourth.
    expect((hero.match(/class="hero-discovery/g) || []).length).toBe(available ? 1 : 0)
    const table = renderToStaticMarkup(createElement(DiscoveryAvailability.Provider, { value: areas }, createElement(PublicStats, { locale: 'ms', stats })))
    expect(table.includes('href="/masjid/di/malaysia/selangor"')).toBe(available)
  })
})

describe('API caching and closed availability', () => {
  const cache = () => {
    const stored = new Map<string, Response>()
    const match = vi.fn(async (k: string) => stored.get(k)?.clone())
    const put = vi.fn(async (k: string, r: Response) => { stored.set(k, r.clone()) })
    vi.stubGlobal('caches', { default: { match, put } })
    return { stored, match, put }
  }
  it('uses a separate 1h cache independent of the masjid-pages flag; revalidates hits', async () => {
    const c = cache(), fetcher = vi.fn(async () => Response.json(fixture().areas))
    const env = { MASJID_PAGES_ENABLED: 'false', JM_API_BASE: 'http://127.0.0.1:9999', JM_API: { fetch: fetcher } }
    expect(await getAreas(env)).toEqual({ status: 'ok', data: fixture().areas })
    await getAreas(env); expect(fetcher).toHaveBeenCalledOnce()
    const [key, stored] = [...c.stored][0]
    expect(key).toContain('/discovery/v1/')
    expect(stored.headers.get('Cache-Control')).toBe('public, max-age=3600')
    c.stored.set(key, Response.json({ payloadVersion: 1 }))
    expect(await getAreas(env)).toEqual({ status: 'ok', data: fixture().areas })
    await getAreas({ ...env, JM_API_BASE: 'http://127.0.0.1:9998' }); expect(fetcher).toHaveBeenCalledTimes(3)
  })
  it.each(['404', 'invalid', 'timeout'])('fails closed on %s and caches no failed response', async mode => {
    const c = cache()
    const fetcher = vi.fn(async () => { if (mode === 'timeout') throw new DOMException('timeout', 'TimeoutError'); return mode === '404' ? new Response(null, { status: 404 }) : Response.json({ payloadVersion: 1 }) })
    const env = { JM_API: { fetch: fetcher } }
    expect(await getAreas(env)).toEqual({ status: mode === '404' ? 'missing' : 'unavailable' }); expect(await getAreas(env)).toEqual({ status: mode === '404' ? 'missing' : 'unavailable' })
    expect(c.put).not.toHaveBeenCalled(); expect(fetcher).toHaveBeenCalledTimes(2)
  })
  it('caches lists 1h, search per full q/page/upstream URL for 60s, and never caches nearby', async () => {
    const c = cache()
    const fetcher = vi.fn(async (req: Request) => Response.json(req.url.includes('/masjids?') ? list() : req.url.includes('/search?') ? { ...searchResults(Number(new URL(req.url).searchParams.get('page'))), q: new URL(req.url).searchParams.get('q') } : { payloadVersion: 1, items: [] }))
    const env = { JM_API: { fetch: fetcher } }
    await getAreaList(list().area, 1, env)
    for (const [q, page] of [['masjid', 1], ['surau', 1], ['masjid', 2]] as const) {
      expect(await getSearch(q, page, env)).toEqual({ ...searchResults(page), q })
      expect(new URL(fetcher.mock.calls.at(-1)![0].url).searchParams).toEqual(new URLSearchParams({ q, page: String(page) }))
    }
    await getSearch('masjid', 2, env)
    expect(fetcher).toHaveBeenCalledTimes(4)
    await getSearch('masjid', 2, { ...env, JM_API_BASE: 'http://127.0.0.1:9998' })
    expect(fetcher).toHaveBeenCalledTimes(5)
    expect([...c.stored.values()].map(r => r.headers.get('Cache-Control'))).toEqual(['public, max-age=3600', 'public, max-age=86400', ...Array(4).fill('public, max-age=60')])
    const reads = c.match.mock.calls.length
    await getNearby(3.123, 101.678, env); await getNearby(3.123, 101.678, env)
    expect(c.match).toHaveBeenCalledTimes(reads); expect(c.put).toHaveBeenCalledTimes(6)
    expect(fetcher.mock.calls.at(-1)![0].url).toContain('lat=3.123&lng=101.678')
    expect(fetcher.mock.calls.at(-1)![0].headers.has('Cookie')).toBe(false)
  })
  it('rejects old search responses on cache hits and never caches upstream old or malformed search data', async () => {
    const c = cache()
    const fetcher = vi.fn(async () => Response.json(backendFixture.search))
    const env = { JM_API: { fetch: fetcher } }
    expect(await getSearch('Al Hidayah', 1, env)).toBeNull()
    expect(c.put).not.toHaveBeenCalled()
    const key = c.match.mock.calls[0][0]
    c.stored.set(key, Response.json(backendFixture.search))
    expect(await getSearch('Al Hidayah', 1, env)).toBeNull()
    expect(fetcher).toHaveBeenCalledOnce()
  })
  it('keeps the old mutable/prayer cache limits and tags intact', async () => {
    const c = cache(), env = { MASJID_PAGES_ENABLED: 'true', JM_API: { fetch: vi.fn(async () => Response.json({})) } }
    await apiGet('/api/public/programs/test', { ttl: 3600 }, env)
    expect([...c.stored.values()][0].headers.get('Cache-Control')).toBe('public, max-age=60')
  })
})
