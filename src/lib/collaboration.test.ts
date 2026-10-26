// @vitest-environment jsdom
import { readFileSync, existsSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import CollaborationContact from '@/components/CollaborationContact'
import Collaboration from '@/components/Collaboration'
import Homepage from '@/components/Homepage'
import { SITE, WHATSAPP_URL } from './site'
import { t } from './i18n'

vi.mock('@/components/Header', () => ({ default: () => null }))
vi.mock('@/components/Footer', () => ({ default: () => null }))
afterEach(() => { cleanup(); vi.restoreAllMocks() })

for (const locale of ['ms', 'en'] as const) it(`offers selectable email, copy, localized mailto and WhatsApp in ${locale}`, async () => {
  const writeText = vi.fn().mockResolvedValue(undefined)
  Object.defineProperty(navigator, 'clipboard', { configurable: true, get: () => ({ writeText }) })
  const { container } = render(createElement(CollaborationContact, { locale }))
  expect(screen.getByText(SITE.email)).toBeTruthy()
  expect(screen.getByRole('link', { name: t(locale).collaboration.contact }).getAttribute('href')).toBe(`mailto:${SITE.email}?subject=${encodeURIComponent(t(locale).collaboration.subject)}`)
  expect(screen.getByRole('link', { name: t(locale).collaboration.whatsapp }).getAttribute('href')).toBe(WHATSAPP_URL)
  fireEvent.click(screen.getByRole('button', { name: t(locale).collaboration.copy }))
  await screen.findByText(t(locale).collaboration.copied)
  expect(writeText).toHaveBeenCalledWith(SITE.email)
  expect(container.querySelector('form')).toBeNull()
})

it.each(['denied', 'unavailable'])('selects the email when clipboard is %s', async mode => {
  Object.defineProperty(navigator, 'clipboard', { configurable: true, get: () => mode === 'denied' ? { writeText: vi.fn().mockRejectedValue(new Error('denied')) } : undefined })
  render(createElement(CollaborationContact, { locale: 'ms' }))
  fireEvent.click(screen.getByRole('button', { name: 'Salin e-mel' }))
  await screen.findByText(t('ms').collaboration.select)
  expect(window.getSelection()?.toString()).toBe(SITE.email)
})

for (const locale of ['ms', 'en'] as const) it(`puts the contact block above three collaboration cards in ${locale}`, () => {
  const { container } = render(createElement(Collaboration, { locale }))
  expect(container.querySelectorAll('article')).toHaveLength(3)
  expect(container.textContent).not.toMatch(/AJK|dashboard|pilot|rintis/)
  expect(container.querySelector('.collaboration-contact')!.compareDocumentPosition(container.querySelector('article')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
})

it('places stats before features and collaboration after reviews/media before the ecosystem', () => {
  const stats = JSON.parse(readFileSync('src/lib/fixtures/public-stats.json', 'utf8'))
  const container = document.createElement('div')
  container.innerHTML = renderToStaticMarkup(createElement(Homepage, { locale: 'en', stats }))
  const ids = [...container.querySelectorAll('main > section')].map(section => section.id)
  expect(ids.indexOf('angka')).toBeLessThan(ids.indexOf('ciri'))
  const band = container.querySelector('#kolaborasi')!
  expect(container.querySelector('#ulasan')!.compareDocumentPosition(band) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  expect(band.nextElementSibling?.textContent).toContain(t('en').ecosystem.title)
  expect(band.querySelectorAll('article')).toHaveLength(3)
  expect(band.querySelector('.collaboration-contact')).toBeTruthy()
  expect(container.querySelector('a[href="/ajk"]')).toBeNull()
})

it('removes the AJK page and interest endpoint from the route tree and sitemap', () => {
  for (const name of ['ajk.tsx', 'api.ajk-interest.ts']) expect(existsSync(`src/routes/${name}`)).toBe(false)
  const tree = readFileSync('src/routeTree.gen.ts', 'utf8')
  expect(tree).not.toMatch(/['"]\/ajk['"]|\/api\/ajk-interest/)
  expect(readFileSync('public/sitemap-pages.xml', 'utf8')).not.toContain('/ajk')
})
