import { createRouter, createMemoryHistory } from '@tanstack/react-router'
import { beforeEach, expect, it, vi } from 'vitest'
vi.mock('./discovery-server', () => ({
  loadDiscoveryAreas: vi.fn(),
  loadDiscoveryLanding: vi.fn(),
  loadDiscoveryArea: vi.fn(),
  loadDiscoveryNearby: vi.fn(),
}))
import { routeTree } from '@/routeTree.gen'
import { twinForPath } from './i18n'
import fixture from './fixtures/discovery.json'
import type { Areas, DiscoveryItem, SearchResults } from './discovery'
import { loadDiscoveryAreas, loadDiscoveryLanding, loadDiscoveryArea } from './discovery-server'

const areas = fixture.areas as Areas
beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(loadDiscoveryAreas).mockResolvedValue(areas)
  vi.mocked(loadDiscoveryLanding).mockImplementation(async ({ data }) => ({ areas, q: data.q, results: null, stats: null }))
  vi.mocked(loadDiscoveryArea).mockImplementation(async ({ data }) => ({
    areas,
    list: {
      payloadVersion: 1,
      area: { country: data.country, region: data.region, district: data.district, names: { country: 'Malaysia', region: 'Selangor', district: 'Petaling' } },
      page: data.page, total: 51, pageSize: 50,
      items: fixture.items.slice((data.page - 1) * 50, data.page * 50) as DiscoveryItem[],
    },
  }))
})

// Exercise the same URL rebuilding and loader/head path as a native server GET.
async function serverGet(path: string) {
  const requestRouter = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: [path] }), isServer: true })
  await requestRouter.load()
  return requestRouter
}

const router = createRouter({ routeTree, history: createMemoryHistory() })
it('matches landing and static area prefixes before the existing masjid slug route', () => {
  for (const [path, id] of [
    ['/masjid', '/masjid/'], ['/en/mosques', '/en_/mosques'],
    ['/masjid/di/malaysia', '/masjid/di/$country'],
    ['/masjid/di/malaysia/selangor', '/masjid/di/$country_/$region'],
    ['/masjid/di/malaysia/selangor/petaling', '/masjid/di/$country_/$region_/$district'],
    ['/en/mosques/in/malaysia/selangor/petaling', '/en_/mosques_/in/$country_/$region_/$district'],
    ['/masjid/masjid-negara', '/masjid/$slug'],
    ['/masjid/masjid-negara/p/program-1', '/masjid/$slug_/p/$programId'],
  ]) expect(router.matchRoutes(path).at(-1)!.routeId).toBe(id)
})
it('preserves search and translates the page parameter across language twins', () => {
  const bm = '/masjid/di/malaysia/selangor?halaman=2'
  const en = '/en/mosques/in/malaysia/selangor?page=2'
  expect(twinForPath(bm)).toBe(en); expect(twinForPath(en)).toBe(bm)
  expect(twinForPath('/masjid?q=Masjid+Negara')).toBe('/en/mosques?q=Masjid+Negara')
  expect(twinForPath('/masjid?q=Masjid+Negara&halaman=2')).toBe('/en/mosques?q=Masjid+Negara&page=2')
  expect(twinForPath('/en/mosques?q=Masjid+Negara&page=2')).toBe('/masjid?q=Masjid+Negara&halaman=2')
})

it.each(['/masjid', '/en/mosques'])('keeps native search GETs on %s working without redirects and a bare canonical', async landing => {
  for (const query of ['', '?q=', '?q=Petaling']) {
    const q = query === '?q=Petaling' ? 'Petaling' : ''
    const requestRouter = await serverGet(landing + query)
    expect(requestRouter.state.statusCode).toBe(200)
    expect(requestRouter.state.redirect).toBeUndefined()
    expect(requestRouter.state.location.href).toBe(landing + query)
    expect(requestRouter.state.matches.at(-1)!.search).toEqual(query ? { q } : {})
    expect(loadDiscoveryLanding).toHaveBeenLastCalledWith({ data: { q, page: 1 } })
    expect(requestRouter.state.matches.at(-1)!.links).toContainEqual({ rel: 'canonical', href: 'https://jejakmasjid.my' + landing })
    expect(requestRouter.state.matches.at(-1)!.meta).toContainEqual({ name: 'robots', content: query ? 'noindex, follow' : 'index, follow, max-image-preview:large' })
  }
})

const landingRoutes = [
  { path: '/masjid', param: 'halaman', stray: 'page', twin: '/en/mosques' },
  { path: '/en/mosques', param: 'page', stray: 'halaman', twin: '/masjid' },
]
it.each(landingRoutes)('passes localized search pagination through $path loaderDeps', async ({ path, param }) => {
  const requestRouter = await serverGet(`${path}?q=Petaling&${param}=2`)
  expect(requestRouter.state.statusCode).toBe(200)
  expect(requestRouter.state.redirect).toBeUndefined()
  expect(requestRouter.state.matches.at(-1)!.search).toEqual({ q: 'Petaling', [param]: 2 })
  expect(requestRouter.state.matches.at(-1)!.loaderDeps).toEqual({ q: 'Petaling', page: 2 })
  expect(loadDiscoveryLanding).toHaveBeenLastCalledWith({ data: { q: 'Petaling', page: 2 } })
  expect(requestRouter.state.matches.at(-1)!.links).toContainEqual({ rel: 'canonical', href: 'https://jejakmasjid.my' + path })
})
it.each(landingRoutes)('drops invalid and stray pagination from $path search URLs and language links', async ({ path, param, stray, twin }) => {
  for (const value of ['1', '0', '-1', '1.5', 'nope', '9007199254740992']) {
    const requestRouter = await serverGet(`${path}?q=Petaling&${param}=${value}`)
    expect(requestRouter.state.redirect?.options.href).toBe(path + '?q=Petaling')
    expect(twinForPath(`${path}?q=Petaling&${param}=${value}`)).toBe(twin + '?q=Petaling')
  }
  for (const query of [`?q=Petaling&${stray}=2`, `?q=Petaling&${param}=2&${stray}=3`]) {
    const clean = path + '?q=Petaling' + (query.includes(`${param}=`) ? `&${param}=2` : '')
    expect((await serverGet(path + query)).state.redirect?.options.href).toBe(clean)
    const responseRouter = await serverGet(clean)
    expect(responseRouter.state.statusCode).toBe(200)
    expect(responseRouter.state.matches.at(-1)!.links).toContainEqual({ rel: 'canonical', href: 'https://jejakmasjid.my' + path })
  }
})
it.each(landingRoutes)('302 redirects clamped $path search pages, preserving q and omitting page 1', async ({ path, param }) => {
  for (const total of [0, 2, 51]) {
    const page = Math.max(1, Math.ceil(total / 20))
    const q = 'Masjid & Surau'
    const results: SearchResults = { payloadVersion: 1, q, page, pageSize: 20, total, items: fixture.items.slice((page - 1) * 20, Math.min(page * 20, total)) as DiscoveryItem[] }
    vi.mocked(loadDiscoveryLanding).mockResolvedValueOnce({ areas, q, results, stats: null })
    const requestRouter = await serverGet(`${path}?q=Masjid+%26+Surau&${param}=999`)
    const destination = path + '?q=Masjid+%26+Surau' + (page > 1 ? `&${param}=${page}` : '')
    expect(loadDiscoveryLanding).toHaveBeenLastCalledWith({ data: { q, page: 999 } })
    expect(requestRouter.state.redirect?.status).toBe(302)
    expect(requestRouter.state.redirect?.options.href).toBe(destination)
    vi.mocked(loadDiscoveryLanding).mockResolvedValueOnce({ areas, q, results, stats: null })
    const responseRouter = await serverGet(destination)
    expect(responseRouter.state.statusCode).toBe(200)
    expect(responseRouter.state.redirect).toBeUndefined()
    expect(responseRouter.state.matches.at(-1)!.loaderData).toEqual(expect.objectContaining({ results: expect.objectContaining({ page }) }))
  }
})

const areaRoutes = [
  ...['malaysia', 'malaysia/selangor', 'malaysia/selangor/petaling'].map(area => ({ path: '/masjid/di/' + area, param: 'halaman', stray: 'page' })),
  ...['malaysia', 'malaysia/selangor', 'malaysia/selangor/petaling'].map(area => ({ path: '/en/mosques/in/' + area, param: 'page', stray: 'halaman' })),
]
it.each([...landingRoutes, ...areaRoutes])('keeps $path outage pages noindex with their own canonical', async ({ path, param }) => {
  vi.mocked(loadDiscoveryLanding).mockResolvedValue({ unavailable: true, areas: null, q: 'Petaling', results: null, stats: null })
  vi.mocked(loadDiscoveryArea).mockResolvedValue({ unavailable: true })
  const requestRouter = await serverGet(path + `?${param}=2`)
  const match = requestRouter.state.matches.at(-1)!
  expect(match.meta).toContainEqual({ name: 'robots', content: 'noindex, nofollow' })
  expect(match.links).toContainEqual({ rel: 'canonical', href: 'https://jejakmasjid.my' + path })
  expect(requestRouter.state.redirect).toBeUndefined()
})
it.each(areaRoutes)('renders $path with only $param, and a clean canonical for page 1', async ({ path, param, stray }) => {
  for (const query of ['', `?${param}=1`, `?${param}=2`]) {
    const requestRouter = await serverGet(path + query)
    const page = query.endsWith('2') ? 2 : 1
    expect(requestRouter.state.statusCode).toBe(200)
    // Explicit page 1 renders as requested; its canonical omits the parameter.
    expect(requestRouter.state.redirect).toBeUndefined()
    expect(requestRouter.state.location.href).toBe(path + query)
    expect(requestRouter.state.matches.at(-1)!.search).toEqual(query ? { [param]: page } : {})
    expect(requestRouter.state.matches.at(-1)!.loaderDeps).toEqual({ page })
    expect(loadDiscoveryArea).toHaveBeenLastCalledWith({ data: expect.objectContaining({ page }) })
    const links = requestRouter.state.matches.at(-1)!.links!
    expect(links).toContainEqual({ rel: 'canonical', href: 'https://jejakmasjid.my' + path + (page === 1 ? '' : query) })
    for (const link of links) {
      if (!link) continue
      expect(link.href).not.toMatch(/[?&](?:page|halaman)=1(?:&|$)/)
      if (page === 2) expect(link.href).toContain(link.href!.includes('/en/') ? '?page=2' : '?halaman=2')
    }
  }
  for (const query of [`?${stray}=2`, `?${param}=2&${stray}=3`]) {
    const requestRouter = await serverGet(path + query)
    expect(requestRouter.state.redirect?.options.href).toBe(path + (query.includes(`${param}=`) ? `?${param}=2` : ''))
  }
})
