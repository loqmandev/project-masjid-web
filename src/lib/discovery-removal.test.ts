import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createMemoryHistory, createRouter } from '@tanstack/react-router'
import { describe, expect, it, vi } from 'vitest'
vi.mock('@tanstack/react-router', async original => ({
  ...await original<typeof import('@tanstack/react-router')>(),
  useLocation: ({ select }: { select: (location: { pathname: string; searchStr: string }) => unknown }) => select({ pathname: '/', searchStr: '' }),
}))
import Footer from '@/components/Footer'
import Header, { HeaderContent } from '@/components/Header'
import Hero from '@/components/Hero'
import PublicStats from '@/components/PublicStats'
import { routeTree } from '@/routeTree.gen'
import stats from './fixtures/public-stats.json'
import { htmlLangForPath, localeForPath, twinForPath } from './i18n'

// Owner decision 2026-10-29: masjid search and area browsing were removed so
// the masjid list cannot be scraped. These tests keep it from coming back by accident.
const REMOVED = /\/masjid(?:["'?#/]|$)|\/masjid\/di\/|\/en\/mosques|\/sitemaps\/areas/
const hrefs = (html: string) => [...html.matchAll(/href="([^"]*)"/g)].map(match => match[1])
const isRemovedHref = (href: string) => /^\/masjid(?:[?#]|$)/.test(href) || href.startsWith('/masjid/di/') || href.startsWith('/en/mosques') || href.startsWith('/sitemaps/areas')

describe('masjid search and browse removal', () => {
  it('has no discovery route in the generated route tree, and keeps the masjid and program routes', () => {
    const tree = readFileSync(new URL('../routeTree.gen.ts', import.meta.url), 'utf8')
    expect(tree).not.toMatch(/masjid\/di|mosques|sitemaps\/areas|MasjidIndex|MasjidDi|EnMosques|SitemapsAreas/)
    expect(tree).toContain("'/masjid/$slug'")
    expect(tree).toContain("'/masjid/$slug/p/$programId'")
    expect(tree).toContain("'/sitemaps/masjid/$page'")
  })

  it('resolves only real masjid and program paths: landing, area and mosque paths become global not-found', () => {
    const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: ['/'] }) })
    // TanStack matches fuzzily (extra segments land on the nearest parent with a `**` rest param) and marks the
    // root match globalNotFound, which renders the not-found page with a real 404.
    const resolve = (path: string) => {
      const matches = router.matchRoutes(path, {})
      return { notFound: matches[0].globalNotFound === true, leaf: matches.at(-1)!.routeId, params: router.getMatchedRoutes(path).routeParams }
    }
    expect(resolve('/masjid/surau-test')).toMatchObject({ notFound: false, leaf: '/masjid/$slug', params: { slug: 'surau-test' } })
    expect(resolve('/masjid/surau-test/p/prog_1')).toMatchObject({ notFound: false, leaf: '/masjid/$slug_/p/$programId' })
    for (const path of [
      '/masjid', '/masjid/', '/masjid/di/malaysia', '/masjid/di/malaysia/selangor', '/masjid/di/malaysia/selangor/petaling',
      '/en/mosques', '/en/mosques/in/malaysia', '/en/mosques/in/malaysia/selangor', '/en/mosques/in/malaysia/selangor/petaling',
      '/sitemaps/areas',
    ]) expect(resolve(path).notFound, path).toBe(true)
    // `/masjid/di` still matches the slug route; validSlug (3+ characters) makes its loader answer 404.
    expect(resolve('/masjid/di')).toMatchObject({ notFound: false, leaf: '/masjid/$slug', params: { slug: 'di' } })
  })

  it('keeps no language twin or language-only document lang for removed paths', () => {
    for (const path of ['/masjid', '/masjid/di/malaysia', '/en/mosques', '/en/mosques/in/malaysia']) {
      expect(twinForPath(path), path).toBeUndefined()
      expect(htmlLangForPath(path), path).toBe('en-MY')
      expect(localeForPath(path), path).toBe('en')
    }
  })

  it('renders no link to a removed URL in the header, footer, hero or state table (both languages)', () => {
    for (const locale of ['ms', 'en'] as const) {
      const html = renderToStaticMarkup(createElement('div', null,
        createElement(HeaderContent, { path: locale === 'ms' ? '/' : '/en' }),
        createElement(Hero, { locale }),
        createElement(PublicStats, { locale, stats }),
        createElement(Footer),
      ))
      expect(hrefs(html).filter(isRemovedHref), locale).toEqual([])
      expect(html, locale).not.toMatch(/\/masjid\/di\/|\/en\/mosques|\/sitemaps\/areas/)
      expect(html, locale).not.toMatch(/href="\/masjid"/)
      // State names are plain text again.
      expect(html, locale).toContain('<th scope="row"')
      expect(html, locale).not.toMatch(/<th[^>]*><a /)
    }
    expect(renderToStaticMarkup(createElement(Header))).not.toMatch(REMOVED)
  })

  it('keeps the homepage hero within four text elements', () => {
    for (const locale of ['ms', 'en'] as const) {
      const html = renderToStaticMarkup(createElement(Hero, { locale }))
      const copy = html.slice(html.indexOf('class="hero-copy"'), html.indexOf('class="art-pane"'))
      // h1, supporting paragraph and the two store badge links: four, with no search link.
      expect(copy).not.toContain('hero-discovery')
      expect(copy.match(/<(h1|p|a)\b/g)).toHaveLength(4)
    }
  })
})
