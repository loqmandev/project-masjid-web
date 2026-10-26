// @vitest-environment jsdom
import fixture from './fixtures/discovery.json'
import type { Areas, AreaList, DiscoveryItem, SearchResults } from './discovery'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
vi.mock('./discovery-server', () => ({ loadDiscoveryNearby: vi.fn() }))
vi.mock('@/components/Header', () => ({ default: () => null }))
vi.mock('@/components/Footer', () => ({ default: () => null }))
import { loadDiscoveryNearby } from './discovery-server'
import { DiscoveryArea, DiscoveryLanding, DiscoveryMissing, NearbySearch } from '@/components/Discovery'
import { t } from './i18n'
afterEach(() => { cleanup(); vi.restoreAllMocks() })
it.each(['ms', 'en'] as const)('server-renders %s discovery headings with the on-deep foreground', locale => {
  const list: AreaList = { payloadVersion: 1, area: { country: 'malaysia', region: 'selangor', district: 'petaling', names: { country: 'Malaysia', region: 'Selangor', district: 'Petaling' } }, total: 51, page: 1, pageSize: 50, items: fixture.items.slice(0, 50) as DiscoveryItem[] }
  const pages = [
    createElement(DiscoveryLanding, { locale, data: { areas: fixture.areas as Areas, q: '', results: null, stats: null } }),
    createElement(DiscoveryArea, { locale, data: { areas: fixture.areas as Areas, list } }),
  ]
  for (const page of pages) {
    const doc = new DOMParser().parseFromString(renderToStaticMarkup(page), 'text/html')
    expect(doc.querySelector('.on-deep.bg-deep h1')?.classList.contains('text-deep-foreground')).toBe(true)
    expect(doc.querySelector('.on-deep.bg-deep p')?.classList.contains('text-deep-muted')).toBe(true)
    const current = doc.querySelector('[aria-current="page"]')
    if (current) expect(current.classList.contains('text-deep-foreground')).toBe(true)
  }
})
it.each(['ms', 'en'] as const)('keeps the %s missing-page heading dark on its light surface', locale => {
  const doc = new DOMParser().parseFromString(renderToStaticMarkup(createElement(DiscoveryMissing, { locale })), 'text/html')
  const heading = doc.querySelector('main h1')!
  expect(heading.classList.contains('text-foreground')).toBe(true)
  expect(heading.closest('.on-deep')).toBeNull()
  expect(doc.querySelector('main a')?.getAttribute('href')).toBe(locale === 'ms' ? '/' : '/en')
})
it.each(['ms', 'en'] as const)('server-renders a native %s GET form with only q and search results without a nearby button', locale => {
  const html = renderToStaticMarkup(createElement(DiscoveryLanding, { locale, data: { areas: fixture.areas as Areas, q: 'Petaling', results: { payloadVersion: 1, q: 'Petaling', page: 1, pageSize: 20, total: 2, items: fixture.items.slice(0, 2) as DiscoveryItem[] }, stats: null } }))
  const form = new DOMParser().parseFromString(html, 'text/html').querySelector('form')!
  expect(form.getAttribute('method')).toBe('get')
  expect(form.getAttribute('action')).toBe(locale === 'ms' ? '/masjid' : '/en/mosques')
  expect(form.getAttribute('role')).toBe('search')
  expect(html).toContain('name="q"')
  expect([...new FormData(form).entries()]).toEqual([['q', 'Petaling']])
  expect(html).toContain('Masjid Contoh Petaling 01')
  expect(html).not.toContain(locale === 'ms' ? 'Dekat saya' : 'Near me')
  expect(html).not.toContain('href="/masjid/di/other"')
})
it.each(['ms', 'en'] as const)('server-renders %s search pagination, continued numbering and a form that restarts at page 1', locale => {
  const landing = locale === 'ms' ? '/masjid' : '/en/mosques'
  const param = locale === 'ms' ? 'halaman' : 'page'
  const copy = t(locale).discovery
  for (const page of [1, 2, 3]) {
    const results: SearchResults = { payloadVersion: 1, q: 'Masjid & Surau', page, pageSize: 20, total: 51, items: fixture.items.slice((page - 1) * 20, Math.min(page * 20, 51)) as DiscoveryItem[] }
    const doc = new DOMParser().parseFromString(renderToStaticMarkup(createElement(DiscoveryLanding, { locale, data: { areas: fixture.areas as Areas, q: results.q, results, stats: null } })), 'text/html')
    expect([...new FormData(doc.querySelector('form')!).entries()]).toEqual([['q', results.q]])
    expect(doc.querySelector('ol.discovery-list')?.getAttribute('start')).toBe(String((page - 1) * 20 + 1))
    expect(doc.querySelectorAll('.discovery-list li')).toHaveLength(page === 3 ? 11 : 20)
    const pager = doc.querySelector('nav.discovery-pagination')!
    expect(pager.textContent).toContain(`${copy.page} ${page} ${copy.of} 3`)
    expect(pager.querySelector('a[rel="prev"]')?.getAttribute('href')).toBe(page === 1 ? undefined : `${landing}?q=Masjid+%26+Surau${page === 2 ? '' : `&${param}=${page - 1}`}`)
    expect(pager.querySelector('a[rel="next"]')?.getAttribute('href')).toBe(page === 3 ? undefined : `${landing}?q=Masjid+%26+Surau&${param}=${page + 1}`)
    for (const link of pager.querySelectorAll('a')) expect(link.getAttribute('href')).not.toMatch(/[?&](?:halaman|page)=1(?:&|$)/)
  }
})
it.each(['ms', 'en'] as const)('shows one calm %s refinement hint only at the 200-result cap', locale => {
  for (const total of [51, 200]) {
    const results: SearchResults = { payloadVersion: 1, q: 'masjid', page: 1, pageSize: 20, total, items: fixture.items.slice(0, 20) as DiscoveryItem[] }
    const html = renderToStaticMarkup(createElement(DiscoveryLanding, { locale, data: { areas: fixture.areas as Areas, q: results.q, results, stats: null } }))
    expect(html.split(t(locale).discovery.refine).length - 1).toBe(total === 200 ? 1 : 0)
  }
})
it.each(['ms', 'en'] as const)('handles empty and unavailable %s search results without dead pager links', locale => {
  for (const results of [null, { payloadVersion: 1 as const, q: 'masjid', page: 1, pageSize: 20 as const, total: 0, items: [] }]) {
    const doc = new DOMParser().parseFromString(renderToStaticMarkup(createElement(DiscoveryLanding, { locale, data: { areas: fixture.areas as Areas, q: 'masjid', results, stats: null } })), 'text/html')
    expect(doc.querySelector('#search-heading')?.parentElement?.textContent).toContain(results ? t(locale).discovery.empty : t(locale).discovery.unavailable)
    expect(doc.querySelectorAll('.discovery-pagination a')).toHaveLength(0)
  }
})
it.each(['ms', 'en'] as const)('links from %s page 2 back to page 1 without a query parameter', locale => {
  const list: AreaList = { payloadVersion: 1, area: { country: 'malaysia', region: 'selangor', district: 'petaling', names: { country: 'Malaysia', region: 'Selangor', district: 'Petaling' } }, total: 51, page: 2, pageSize: 50, items: fixture.items.slice(50, 51) as DiscoveryItem[] }
  const html = renderToStaticMarkup(createElement(DiscoveryArea, { locale, data: { areas: fixture.areas as Areas, list } }))
  const doc = new DOMParser().parseFromString(html, 'text/html')
  expect(doc.querySelector('a[rel="prev"]')!.getAttribute('href')).toBe(locale === 'ms' ? '/masjid/di/malaysia/selangor/petaling' : '/en/mosques/in/malaysia/selangor/petaling')
  for (const link of doc.querySelectorAll('a')) expect(link.getAttribute('href')).not.toMatch(/[?&](?:halaman|page)=1(?:&|$)/)
})
it('requests location only after a tap, rounds it before POST, and renders distances', async () => {
  const locate = vi.fn((success: PositionCallback) => success({ coords: { latitude: 3.123456, longitude: 101.678901 } } as GeolocationPosition))
  Object.defineProperty(navigator, 'geolocation', { configurable: true, value: { getCurrentPosition: locate } })
  vi.mocked(loadDiscoveryNearby).mockResolvedValue({ payloadVersion: 1, items: [{ ...fixture.items[0], type: 'masjid', distanceM: 150 }] })
  render(createElement(NearbySearch, { locale: 'ms' }))
  expect(locate).not.toHaveBeenCalled(); expect(screen.getByText('Lokasi anda tidak disimpan')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Dekat saya' }))
  await waitFor(() => expect(screen.getByText('150 m')).toBeTruthy())
  expect(locate).toHaveBeenCalledOnce()
  expect(loadDiscoveryNearby).toHaveBeenCalledWith({ data: { lat: 3.123, lng: 101.679 } })
})
it('keeps search available when permission is denied or the service fails', async () => {
  const locate = vi.fn((_success: PositionCallback, error: PositionErrorCallback) => error({ code: 1 } as GeolocationPositionError))
  Object.defineProperty(navigator, 'geolocation', { configurable: true, value: { getCurrentPosition: locate } })
  render(createElement(NearbySearch, { locale: 'en' }))
  fireEvent.click(screen.getByRole('button', { name: 'Near me' }))
  expect(screen.getByRole('status').textContent).toContain('search by name')
  expect(screen.getByRole('button', { name: 'Near me' })).toBeTruthy()
})
it('handles synchronous location failures and empty nearby results calmly', async () => {
  Object.defineProperty(navigator, 'geolocation', { configurable: true, value: { getCurrentPosition: () => { throw new Error('Blocked location') } } })
  const view = render(createElement(NearbySearch, { locale: 'en' }))
  fireEvent.click(screen.getByRole('button', { name: 'Near me' }))
  expect(screen.getByRole('status').textContent).toContain('search by name')
  view.unmount()
  Object.defineProperty(navigator, 'geolocation', { configurable: true, value: { getCurrentPosition: (success: PositionCallback) => success({ coords: { latitude: 3, longitude: 101 } } as GeolocationPosition) } })
  vi.mocked(loadDiscoveryNearby).mockResolvedValue({ payloadVersion: 1, items: [] })
  render(createElement(NearbySearch, { locale: 'en' }))
  fireEvent.click(screen.getByRole('button', { name: 'Near me' }))
  await waitFor(() => expect(screen.getByRole('status').textContent).toContain('within 10 km'))
})
