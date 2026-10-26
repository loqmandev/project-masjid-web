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
import type { Areas, DiscoveryItem } from './discovery'
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
})

it.each(['/masjid', '/en/mosques'])('keeps native search GETs on %s free of pagination and redirects', async landing => {
  for (const query of ['', '?q=Petaling']) {
    const requestRouter = await serverGet(landing + query)
    expect(requestRouter.state.statusCode).toBe(200)
    expect(requestRouter.state.redirect).toBeUndefined()
    expect(requestRouter.state.location.href).toBe(landing + query)
    expect(requestRouter.state.matches.at(-1)!.search).toEqual(query ? { q: 'Petaling' } : {})
    expect(loadDiscoveryLanding).toHaveBeenLastCalledWith({ data: { q: query ? 'Petaling' : '' } })
    expect(requestRouter.state.matches.at(-1)!.links).toContainEqual({ rel: 'canonical', href: 'https://jejakmasjid.my' + landing + query })
  }
})

it.each(['/masjid', '/en/mosques'])('drops stray pagination from %s URLs, canonicals and language links', async landing => {
  for (const query of ['?q=Petaling&page=1', '?q=Petaling&halaman=2', '?q=Petaling&page=2&halaman=3', '?page=2&halaman=3']) {
    const clean = landing + (query.includes('q=') ? '?q=Petaling' : '')
    const requestRouter = await serverGet(landing + query)
    expect(requestRouter.state.redirect?.options.href).toBe(clean)
    const responseRouter = await serverGet(clean)
    expect(responseRouter.state.statusCode).toBe(200)
    expect(responseRouter.state.matches.at(-1)!.links).toContainEqual({ rel: 'canonical', href: 'https://jejakmasjid.my' + clean })
    expect(twinForPath(landing + query)).toBe((landing === '/masjid' ? '/en/mosques' : '/masjid') + (query.includes('q=') ? '?q=Petaling' : ''))
  }
})

const areaRoutes = [
  ...['malaysia', 'malaysia/selangor', 'malaysia/selangor/petaling'].map(area => ({ path: '/masjid/di/' + area, param: 'halaman', stray: 'page' })),
  ...['malaysia', 'malaysia/selangor', 'malaysia/selangor/petaling'].map(area => ({ path: '/en/mosques/in/' + area, param: 'page', stray: 'halaman' })),
]
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
