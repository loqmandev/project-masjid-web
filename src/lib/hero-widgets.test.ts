import { existsSync, readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
vi.mock('@/components/Header', () => ({ default: () => null }))
vi.mock('@/components/Footer', () => ({ default: () => null }))
import Features from '@/components/Features'
import Hero from '@/components/Hero'
import Homepage, { homepageHead } from '@/components/Homepage'
import { LogoMark, Wordmark } from '@/components/ui/Logo'
import { t } from './i18n'

// Owner decision 2026-10-29 (performance): the hero is a deep-teal band with the app's home-screen
// widgets built in HTML/CSS. No hero image, no script. These tests keep the painting, its preload
// and any hero animation outside `html[data-motion="on"]` from coming back.
const root = new URL('../../', import.meta.url)
const read = (path: string) => readFileSync(new URL(path, root), 'utf8')
const publicFile = (src: string) => new URL(`public${src}`, root)
const tags = (html: string, name: string) => [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'g'))].map(match => match[0])
const attr = (tag: string, name: string) => tag.match(new RegExp(`\\s${name}="([^"]*)"`, 'i'))?.[1]
const descriptors = (srcSet: string) => srcSet.split(',').map(part => part.trim().split(/\s+/))
const css = read('src/hero.css')
const cssRules = css.replace(/\/\*[\s\S]*?\*\//g, '')

describe('widget hero', () => {
  for (const locale of ['ms', 'en'] as const) describe(locale, () => {
    const html = renderToStaticMarkup(createElement(Hero, { locale }))
    const copy = t(locale).hero
    const widgets = html.match(/<div class="hero-widgets"[^>]*>([\s\S]*)<\/div><\/div><\/section>/)

    it('renders the H1 with every line, the supporting line and the two store badges', () => {
      expect(html.match(/<h1\b/g)).toHaveLength(1)
      for (const line of copy.lines) expect(html).toContain(line)
      expect(html).toContain(copy.supporting)
      expect(html).toContain('id="hero-title"')
      expect(html).toContain('on-deep')
      expect(tags(html, 'img')).toHaveLength(2)
    })

    it('keeps the hero text within four elements (h1, supporting line, badges)', () => {
      const copyColumn = html.match(/<div class="hero-copy">([\s\S]*?)<\/div><div class="hero-widgets"/)![1]
      expect(copyColumn.match(/<(h1|p)\b/g)).toHaveLength(2)
    })

    it('renders the three widgets, decorative, in English with the sketch values', () => {
      expect(widgets).not.toBeNull()
      expect(html).toMatch(/<div class="hero-widgets" aria-hidden="true">/)
      expect(html.match(/class="wg wg-(today|pt|st)"/g)).toHaveLength(3)
      for (const text of ['Next · Maghrib 7:07', '☾ Kuala Lumpur', '✓ Done today', 'Subuh', 'Zohor', 'Asar', 'Maghrib', 'Isyak', '5:50', '1:06', '4:14', '7:07', '8:17']) expect(widgets![1]).toContain(text)
      expect(html.match(/1:12:40/g)).toHaveLength(2)
      expect(widgets![1]).toContain('<div class="n">12</div>')
      expect(html.match(/<i class="(done|miss|upnext)"/g)).toHaveLength(4)
      expect(html).toContain('<li class="on">Maghrib')
      // Only the aria-hidden stage carries the widget text: the pattern svg is hidden too.
      expect(html).toMatch(/<svg class="hero-pattern" aria-hidden="true"/)
      expect(widgets![1]).not.toMatch(/<img|<picture|<canvas|url\(/)
    })

    it('has no picture, painting, sprite, preload or caption left', () => {
      expect(html).not.toMatch(/<picture|<source|city-art|masjid-sprite|floating-phone|map-paths|art-pane|art-caption|\/hero\/|<canvas/)
      expect(html).not.toContain('AI')
    })

    it('has no image in the head either', () => {
      const links = homepageHead(locale).links
      expect(links.filter(link => link.rel === 'preload')).toEqual([])
      expect(links.some(link => link.rel === 'canonical')).toBe(true)
      expect(links.filter(link => link.rel === 'alternate')).toHaveLength(3)
    })
  })

  it('floats only under html[data-motion="on"], with transform alone, and never for reduced motion', () => {
    expect(css.match(/@keyframes/g)).toHaveLength(1)
    const keyframes = css.match(/@keyframes hero-float\{([\s\S]*?)\}\}/)![1]
    expect(keyframes.match(/transform:/g)).toHaveLength(2)
    expect(keyframes).not.toMatch(/opacity|left|top|width|height/)
    const withoutRules = cssRules.replace(/@keyframes hero-float\{[\s\S]*?\}\}/, '').replace(/@media \(prefers-reduced-motion:reduce\)\{[^\n]*\n/, '')
    for (const [, selector] of withoutRules.matchAll(/([^{}]+)\{[^}]*animation:[^}]*\}/g)) expect(selector.trim()).toMatch(/^html\[data-motion="on"\] /)
    expect(css).toMatch(/@media \(prefers-reduced-motion:reduce\)\{html\[data-motion="on"\] \.wg\{animation:none\}\}/)
    // The resting frame is complete: nothing starts transparent or hidden.
    expect(css).not.toMatch(/opacity:\s*0\b|visibility:\s*hidden|gradient\(/)
  })

  it('ships no script, image or painting code for the hero', () => {
    expect(existsSync(new URL('public/hero', root))).toBe(false)
    expect(existsSync(new URL('src/lib/hero-art.ts', root))).toBe(false)
    const source = read('src/components/Hero.tsx') + css
    expect(source).not.toMatch(/hero-motion|useEffect|mountHero|<canvas|<picture|\/hero\/|hero-art/)
  })
})

describe('logos stay out of the LCP window', () => {
  const wordmark = (tone: 'light' | 'dark') => tags(renderToStaticMarkup(createElement(Wordmark, { tone, className: 'hidden sm:block' })), 'img')[0]

  it('loads both lockups lazily (a hidden lazy image is never fetched; footer is below the fold)', () => {
    for (const tone of ['light', 'dark'] as const) {
      expect(attr(wordmark(tone), 'loading')).toBe('lazy')
      expect(attr(wordmark(tone), 'decoding')).toBe('async')
      expect(attr(wordmark(tone), 'width')).toBe('387')
      expect(attr(wordmark(tone), 'height')).toBe('174')
    }
    expect(attr(wordmark('light'), 'src')).toBe('/brand/jm-lockup-on-light.svg')
    expect(attr(wordmark('dark'), 'src')).toBe('/brand/jm-lockup-on-dark.svg')
  })

  it('keeps the compact symbol eager and the header lockup hidden on phones', () => {
    expect(attr(tags(renderToStaticMarkup(createElement(LogoMark, {})), 'img')[0], 'loading')).toBeUndefined()
    expect(read('src/components/Header.tsx')).toContain('<Wordmark className="hidden sm:block" />')
    expect(read('src/components/Footer.tsx')).toContain('<Wordmark tone="dark"')
  })

  it('drops the AI-illustration disclosure from the footer in both languages', () => {
    for (const locale of ['ms', 'en'] as const) {
      expect(Object.keys(t(locale).footer)).not.toContain('disclosure')
      expect(Object.keys(t(locale).hero)).not.toEqual(expect.arrayContaining(['caption']))
    }
    expect(read('src/components/Footer.tsx')).not.toContain('disclosure')
  })
})

describe('bento screenshots', () => {
  const bento = tags(renderToStaticMarkup(createElement(Features, { locale: 'ms' })), 'img')

  it('is on the homepage in both languages', () => {
    for (const locale of ['ms', 'en'] as const) expect(renderToStaticMarkup(createElement(Homepage, { locale }))).toContain('-320.webp 320w')
  })

  it('offers 320, 480 and 720 px files with the real rendered width in sizes', () => {
    expect(bento).toHaveLength(5)
    for (const tag of bento) {
      const src = attr(tag, 'src')!
      expect(descriptors(attr(tag, 'srcset')!)).toEqual([
        [src.replace('.webp', '-320.webp'), '320w'], [src, '480w'], [src.replace('.webp', '@2x.webp'), '720w'],
      ])
      expect(attr(tag, 'sizes')).toMatch(/^\(max-width: 760px\) \d+px, \d+px$/)
      expect(attr(tag, 'loading')).toBe('lazy')
      expect(existsSync(publicFile(src.replace('.webp', '-320.webp')))).toBe(true)
    }
  })

  it('sizes the large map tile separately from the four small tiles', () => {
    expect(attr(bento[0], 'sizes')).toBe('(max-width: 760px) 210px, 225px')
    for (const tag of bento.slice(1)) expect(attr(tag, 'sizes')).toBe('(max-width: 760px) 150px, 126px')
  })
})
