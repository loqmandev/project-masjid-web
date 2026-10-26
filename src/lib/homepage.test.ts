import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
vi.mock('@/components/Header', () => ({ default: () => null }))
vi.mock('@/components/Footer', () => ({ default: () => null }))
import Homepage from '@/components/Homepage'
import { t } from './i18n'

describe('SSR homepage content', () => {
  for (const locale of ['ms', 'en'] as const) it(`renders complete ${locale} copy and rest art without running client effects`, () => {
    const html = renderToStaticMarkup(createElement(Homepage, { locale }))
    const copy = t(locale)
    expect(html.match(/<h1\b/g)).toHaveLength(1)
    for (const line of copy.hero.lines) expect(html).toContain(line)
    expect(html).toContain('data-state="rest"')
    expect(html).toContain('data-art-src="/hero/l4-city.webp"')
    expect(html).not.toMatch(/<img[^>]*\ssrc="\/hero\//)
    expect(html.match(/class="destination /g)).toHaveLength(4)
    expect(html).toContain(copy.hero.caption)
    expect(html).toContain('"@type":"FAQPage"')
    expect(html).toContain(copy.faq.items[0].q)
    for (const id of ['ciri', 'ulasan', 'faq']) expect(html).toContain(`id="${id}"`)
    for (const forbidden of ['05-facilities', 'id="committees"', 'id="journey"', 'id="how"', 'id="features"']) expect(html).not.toContain(forbidden)
    expect(html.match(/class="feature-tile-copy"/g)).toHaveLength(5)
    for (const name of ['02-explore', '03-visit-complete', '01-today', '04-prayer-circle', '06-achievements']) expect(html).toContain(`/screens/${name}@2x.webp 720w`)
    expect(html.indexOf('id="ciri"')).toBeLessThan(html.indexOf('id="ulasan"'))
    expect(html.indexOf('id="ulasan"')).toBeLessThan(html.indexOf('id="faq"'))
  })
})
