import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, expect, it, vi } from 'vitest'
import fixture from './fixtures/discovery.json'
import type { Areas } from './discovery'
vi.mock('@tanstack/react-router', async original => ({
  ...await original<typeof import('@tanstack/react-router')>(),
  useLocation: ({ select }: { select: (location: { pathname: string; searchStr: string }) => unknown }) => select({ pathname: '/', searchStr: '' }),
}))
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { DiscoveryAvailability } from '@/components/DiscoveryAvailability'
import Hero from '@/components/Hero'
import PublicStats from '@/components/PublicStats'
import stats from './fixtures/public-stats.json'
import { getAreas } from './discovery-api.server'
import { discoveryCacheKey } from './jm-api'
afterEach(() => vi.unstubAllGlobals())
it('header and footer fail closed during SSR without a valid areas context', () => {
  for (const value of [null, fixture.areas as Areas]) {
    const html = renderToStaticMarkup(createElement(DiscoveryAvailability.Provider, { value }, createElement(Header), createElement(Footer)))
    expect(html.includes('href="/masjid"')).toBe(value !== null)
    if (value) expect(html.match(/href="\/masjid"/g)).toHaveLength(3)
  }
})
it('keeps header, hero, footer and stats links after the fresh areas entry expires and upstream fails', async () => {
  const stored = new Map<string, Response>()
  vi.stubGlobal('caches', { default: {
    match: async (key: string) => stored.get(key)?.clone(),
    put: async (key: string, response: Response) => { stored.set(key, response.clone()) },
  } })
  const fetcher = vi.fn(async () => Response.json(fixture.areas))
  const env = { JM_API_BASE: 'http://127.0.0.1:9999', JM_API: { fetch: fetcher } }
  await getAreas(env)
  stored.delete(discoveryCacheKey(env.JM_API_BASE + '/api/public/discovery/areas'))
  fetcher.mockRejectedValue(new Error('offline'))
  const result = await getAreas(env)
  expect(result.status).toBe('ok')
  const value = result.status === 'ok' ? result.data : null
  const html = renderToStaticMarkup(createElement(DiscoveryAvailability.Provider, { value }, createElement(Header), createElement(Hero), createElement(PublicStats, { locale: 'ms', stats }), createElement(Footer)))
  expect(html.match(/href="\/masjid"/g)).toHaveLength(4)
  expect(html).toContain('href="/masjid/di/malaysia/selangor"')
})
