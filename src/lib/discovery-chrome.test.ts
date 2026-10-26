import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it, vi } from 'vitest'
import fixture from './fixtures/discovery.json'
import type { Areas } from './discovery'
vi.mock('@tanstack/react-router', async original => ({
  ...await original<typeof import('@tanstack/react-router')>(),
  useLocation: ({ select }: { select: (location: { pathname: string; searchStr: string }) => unknown }) => select({ pathname: '/', searchStr: '' }),
}))
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { DiscoveryAvailability } from '@/components/DiscoveryAvailability'
it('header and footer fail closed during SSR without a valid areas context', () => {
  for (const value of [null, fixture.areas as Areas]) {
    const html = renderToStaticMarkup(createElement(DiscoveryAvailability.Provider, { value }, createElement(Header), createElement(Footer)))
    expect(html.includes('href="/masjid"')).toBe(value !== null)
    if (value) expect(html.match(/href="\/masjid"/g)).toHaveLength(3)
  }
})
