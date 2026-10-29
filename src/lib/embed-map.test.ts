import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import PrivacyPolicy from '@/components/PrivacyPolicy'
import { googleMapEmbedUrl, validEmbedKey } from './embed-map'

const KEY = 'AIzaSyDummyDummyDummyDummy12345_-'

describe('validEmbedKey', () => {
  it('accepts 20 to 60 characters of letters, digits, underscore and dash', () => {
    expect(validEmbedKey(KEY)).toBe(KEY)
    expect(validEmbedKey('a'.repeat(20))).toBe('a'.repeat(20))
    expect(validEmbedKey('A-_9'.repeat(15))).toBe('A-_9'.repeat(15)) // 60
  })
  it.each([undefined, null, 5, {}, '', 'a'.repeat(19), 'a'.repeat(61), `${KEY} `, ` ${KEY}`, `${KEY}\n`, 'AIza&key=other_abcdefghijk', 'AIza?q=x_abcdefghijklmnop', 'AIza/..%2F_abcdefghijklm', 'AIzaébcdefghijklmnopqrstu'])(
    'rejects %s',
    (value) => expect(validEmbedKey(value)).toBeNull(),
  )
})

describe('googleMapEmbedUrl', () => {
  it('builds the place-mode URL from coordinates with URLSearchParams encoding', () => {
    const url = googleMapEmbedUrl(KEY, 3.1424, 101.6918)!
    expect(url).toBe(`https://www.google.com/maps/embed/v1/place?key=${KEY}&q=3.1424%2C101.6918&zoom=16&language=en`)
    const parsed = new URL(url)
    expect(parsed.searchParams.get('q')).toBe('3.1424,101.6918')
    expect([...parsed.searchParams.keys()]).toEqual(['key', 'q', 'zoom', 'language'])
  })
  it('keeps negative coordinates', () => {
    expect(new URL(googleMapEmbedUrl(KEY, -6.2, -106.8)!).searchParams.get('q')).toBe('-6.2,-106.8')
  })
  it.each([[NaN, 1], [1, Infinity], [90.1, 0], [-91, 0], [0, 180.5], [0, -181]])('is null for %s, %s', (lat, lng) => {
    expect(googleMapEmbedUrl(KEY, lat, lng)).toBeNull()
  })
  it('is null for an invalid key', () => {
    expect(googleMapEmbedUrl('short', 3, 101)).toBeNull()
    expect(googleMapEmbedUrl('bad key bad key bad key bad', 3, 101)).toBeNull()
  })
})

describe('privacy policy', () => {
  it('discloses the Google Maps embed next to the automatic-collection text', () => {
    const html = renderToStaticMarkup(createElement(PrivacyPolicy))
    const text = html.replace(/<[^>]+>/g, '').replace(/&#x27;/g, "'")
    expect(text).toContain(
      "Masjid pages can show a map from Google Maps. When the map loads, Google receives your IP address and may set cookies, under Google's Privacy Policy.",
    )
    expect(html.indexOf('automatically collect')).toBeLessThan(html.indexOf('Masjid pages can show a map'))
    expect(html).toContain('href="https://policies.google.com/privacy"')
  })
})

describe('the server-rendered map is gone', () => {
  const root = process.cwd()
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const path = join(dir, name)
      return statSync(path).isDirectory() ? walk(path) : [path]
    })
  it('leaves no SVG map route, tile binding, tile vars, map flag or MVT dependency in code or config', () => {
    const files = [...walk(join(root, 'src')), join(root, 'wrangler.jsonc'), join(root, 'package.json')].filter(
      (f) => !f.endsWith('embed-map.test.ts') && !f.endsWith('.png') && !f.endsWith('.woff2'),
    )
    const banned = /map\.svg|masjid-map|TILES_BASE|\bTILES\b|MASJID_MAP_ENABLED|project-masjid-tiles|@mapbox\/vector-tile|"pbf"|\.mvt\b/
    const offenders = files.filter((f) => banned.test(readFileSync(f, 'utf8')))
    expect(offenders).toEqual([])
  })
  it('does not ship an embed key value in wrangler.jsonc (the owner provides it)', () => {
    const wrangler = readFileSync(join(root, 'wrangler.jsonc'), 'utf8')
    expect(wrangler).not.toContain('GOOGLE_MAPS_EMBED_KEY')
    expect(wrangler).not.toMatch(/AIza/)
    expect(wrangler).not.toContain('services')
  })
  it('sets no Content-Security-Policy that could block the embed (none exists to extend)', () => {
    const headers = readFileSync(join(root, 'public/_headers'), 'utf8')
    expect(headers).not.toMatch(/content-security-policy|frame-src/i)
  })
})
