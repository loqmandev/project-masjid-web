import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
vi.mock('@/components/Header', () => ({ default: () => null }))
vi.mock('@/components/Footer', () => ({ default: () => null }))
import Features from '@/components/Features'
import Hero from '@/components/Hero'
import Homepage, { homepageHead } from '@/components/Homepage'
import { HERO_CITY, HERO_PHONE, heroPreloadLink } from './hero-art'
import { t } from './i18n'

// Owner decision 2026-10-29 (performance): the homepage hero is static for everyone.
// These tests keep the canvas animation, its images and its CSS from coming back by accident.
const root = new URL('../../', import.meta.url)
const read = (path: string) => readFileSync(new URL(path, root), 'utf8')
const publicFile = (src: string) => new URL(`public${src}`, root)
const tags = (html: string, name: string) => [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'g'))].map(match => match[0])
const attr = (tag: string, name: string) => tag.match(new RegExp(`\\s${name}="([^"]*)"`, 'i'))?.[1]
const descriptors = (srcSet: string) => srcSet.split(',').map(part => part.trim().split(/\s+/))

describe('static hero', () => {
  for (const locale of ['ms', 'en'] as const) describe(locale, () => {
    const html = renderToStaticMarkup(createElement(Hero, { locale }))
    const copy = t(locale).hero

    it('renders the city painting as a <picture>: AVIF source, then the one high-priority, eager WebP fallback img', () => {
      const picture = html.match(/<picture>(<source[^>]*>)(<img[^>]*class="city-art"[^>]*>)<\/picture>/)
      expect(picture).not.toBeNull()
      const [, source, tag] = picture!
      expect(attr(source, 'type')).toBe('image/avif')
      expect(attr(source, 'srcset')).toBe(HERO_CITY.avifSrcSet)
      expect(descriptors(attr(source, 'srcset')!).map(([url, width]) => [url.replace(/^.*\./, ''), width])).toEqual([['avif', '640w'], ['avif', '800w'], ['avif', '960w'], ['avif', '1254w']])
      expect(attr(source, 'sizes')).toBe(HERO_CITY.sizes)
      expect(tags(html, 'img').filter(img => attr(img, 'class') === 'city-art')).toHaveLength(1)
      expect(attr(tag, 'src')).toBe('/hero/l4-city-960.webp')
      expect(attr(tag, 'srcset')).toBe(HERO_CITY.srcSet)
      expect(descriptors(attr(tag, 'srcset')!).map(([, width]) => width)).toEqual(['640w', '800w', '960w', '1254w'])
      expect(attr(tag, 'sizes')).toBe(HERO_CITY.sizes)
      expect(attr(tag, 'fetchpriority')).toBe('high')
      expect(attr(tag, 'decoding')).toBe('async')
      expect(attr(tag, 'loading')).toBeUndefined()
      expect(attr(tag, 'width')).toBe('1254')
      expect(attr(tag, 'height')).toBe('1254')
      expect(attr(tag, 'alt')).toBe(copy.city)
      // Nothing else in the hero competes for high priority.
      expect(tags(html, 'img').filter(img => attr(img, 'fetchpriority') === 'high')).toHaveLength(1)
    })

    it('renders the four sprites and the phone screen as real <img>s with explicit sizes, never CSS backgrounds', () => {
      const sprites = tags(html, 'img').filter(tag => /^\/hero\/(condo-surau|shophouse-surau|modern-masjid|city-masjid)\.webp$/.test(attr(tag, 'src') ?? ''))
      expect(sprites).toHaveLength(4)
      for (const sprite of sprites) {
        expect(attr(sprite, 'width')).toMatch(/^\d+$/)
        expect(attr(sprite, 'height')).toMatch(/^\d+$/)
        expect(attr(sprite, 'loading')).toBeUndefined()
        expect(attr(sprite, 'fetchpriority')).toBe('low')
      }
      const phone = tags(html, 'img').find(tag => attr(tag, 'src') === HERO_PHONE.src)!
      expect(attr(phone, 'srcset')).toBe(HERO_PHONE.srcSet)
      expect(attr(phone, 'sizes')).toBe(HERO_PHONE.sizes)
      expect(attr(phone, 'width')).toBe('720')
      expect(attr(phone, 'height')).toBe('1600')
      // Hidden on phones, so it must not download there.
      expect(attr(phone, 'loading')).toBe('lazy')
      expect(html).not.toMatch(/url\(/)
    })

    it('keeps the full rest composition: four destinations, drawn routes, locator, phone and caption', () => {
      expect(html.match(/class="destination /g)).toHaveLength(4)
      expect(html.match(/<svg class="pin"/g)).toHaveLength(4)
      expect(html.match(/class="distance"/g)).toHaveLength(4)
      expect(html.match(/<g class="route-ink">(<path d="[^"]+"><\/path>){4}<\/g>/g)).toHaveLength(1)
      expect(html).toContain('class="locator-dot"')
      expect(html).toContain('class="floating-phone"')
      expect(html).toContain(copy.caption)
      for (const label of copy.destinations) expect(html).toContain(`aria-label="${label}"`)
    })

    it('has no canvas, motion state, replay control or animation hooks', () => {
      expect(html).not.toMatch(/<canvas|<button|data-art|data-state|data-zoom|data-target|data-x=|data-y=|<mask|radar|light-beam|shockwave|zoom-hero|origin-track/)
    })
  })

  it('keeps the hero text within four elements', () => {
    const html = renderToStaticMarkup(createElement(Hero, { locale: 'ms' }))
    const copy = html.slice(html.indexOf('class="hero-copy"'), html.indexOf('class="art-pane"'))
    expect(copy.match(/<(h1|p|a)\b/g)).toHaveLength(4)
  })

  it('ships no hero animation code, styles or images', () => {
    expect(existsSync(new URL('src/lib/hero-motion.js', root))).toBe(false)
    expect(existsSync(new URL('src/lib/hero-motion.d.ts', root))).toBe(false)
    const hero = read('src/components/Hero.tsx')
    expect(hero).not.toMatch(/hero-motion|mountHero|useEffect|useRef/)
    const css = read('src/hero.css')
    expect(css).not.toMatch(/@keyframes|animation|transition|canvas|data-zoom|data-art|data-state|canvas-art|url\(/)
    const heroFiles = readdirSync(new URL('public/hero/', root)).filter(name => name.endsWith('.webp')).sort()
    expect(heroFiles).toEqual([
      'city-masjid.webp', 'condo-surau.webp', 'l4-city-640.webp', 'l4-city-800.webp', 'l4-city-960.webp', 'l4-city.webp',
      'modern-masjid.webp', 'shophouse-surau.webp',
    ])
    expect(readdirSync(new URL('public/hero/', root)).filter(name => name.endsWith('.avif')).sort())
      .toEqual(['l4-city-1254.avif', 'l4-city-640.avif', 'l4-city-800.avif', 'l4-city-960.avif'])
    expect(readdirSync(new URL('public/screens/', root)).filter(name => /occlusion|splash/.test(name))).toEqual([])
  })

  it('serves only files that exist, with every variant smaller than the original', () => {
    const urls = [...HERO_CITY.avifSrcSet.split(','), ...HERO_CITY.srcSet.split(','), ...HERO_PHONE.srcSet.split(',')].map(part => part.trim().split(/\s+/)[0])
    for (const url of urls) expect(existsSync(publicFile(url)), url).toBe(true)
    const size = (src: string) => statSync(publicFile(src)).size
    expect(size('/hero/l4-city-640.webp')).toBeLessThan(size('/hero/l4-city-800.webp'))
    expect(size('/hero/l4-city-800.webp')).toBeLessThan(size('/hero/l4-city-960.webp'))
    expect(size('/hero/l4-city-960.webp')).toBeLessThan(size('/hero/l4-city.webp'))
    expect(size('/screens/02-explore-320.webp')).toBeLessThan(size('/screens/02-explore.webp'))
    // AVIF is the smaller format at every width (and the 1254 px AVIF beats the original WebP).
    for (const width of ['640', '800', '960']) expect(size(`/hero/l4-city-${width}.avif`)).toBeLessThan(size(`/hero/l4-city-${width}.webp`))
    expect(size('/hero/l4-city-1254.avif')).toBeLessThan(size('/hero/l4-city.webp'))
    expect(size('/hero/l4-city-640.avif')).toBeLessThan(size('/hero/l4-city-800.avif'))
    expect(size('/hero/l4-city-800.avif')).toBeLessThan(size('/hero/l4-city-960.avif'))
    expect(size('/hero/l4-city-960.avif')).toBeLessThan(size('/hero/l4-city-1254.avif'))
  })
})

describe('LCP preload', () => {
  it('matches the AVIF <source> (type, candidates, sizes) with high fetch priority, and has no href', () => {
    expect(heroPreloadLink()).toEqual({
      rel: 'preload', as: 'image', type: 'image/avif', imageSrcSet: HERO_CITY.avifSrcSet, imageSizes: HERO_CITY.sizes, fetchPriority: 'high',
    })
  })

  it('is in the head of both homepages only, next to the canonical and language links', () => {
    for (const locale of ['ms', 'en'] as const) {
      const links = homepageHead(locale).links
      expect(links.filter(link => link.rel === 'preload')).toEqual([heroPreloadLink()])
      // Exactly one city preload: React adds none for an <img> inside <picture>.
      expect(links.some(link => link.rel === 'canonical')).toBe(true)
      expect(links.filter(link => link.rel === 'alternate')).toHaveLength(3)
    }
    // Only the two homepage routes call homepageHead; the root and every other route have no hero preload.
    const withPreload = readdirSync(new URL('src/routes/', root)).filter(name => /heroPreloadLink|homepageHead|l4-city/.test(read(`src/routes/${name}`)))
    expect(withPreload.sort()).toEqual(['en.tsx', 'index.tsx'])
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
