import { describe, expect, it } from 'vitest'
import { COAST, MASJID_NEGARA, fixtureTiles } from './map-fixtures'
import {
  MAP_COLORS,
  fallbackMapSvg,
  mapCacheKey,
  mapWindow,
  renderMapSvg,
  tilePath,
  validCoordinates,
} from './masjid-map'

describe('mapWindow', () => {
  it('covers an 800 x 500 window at zoom 16 with z15 tiles', () => {
    const win = mapWindow(MASJID_NEGARA.lat, MASJID_NEGARA.lng)
    expect(win.tiles.map(tilePath)).toEqual([
      '/15/25639/16097.mvt',
      '/15/25640/16097.mvt',
      '/15/25639/16098.mvt',
      '/15/25640/16098.mvt',
    ])
    // The masjid sits at the window centre.
    const size = 256 * 2 ** 16
    expect(win.originX + 400).toBeCloseTo(((MASJID_NEGARA.lng + 180) / 360) * size, 6)
  })
  it('needs at most three by two tiles and stays inside the tile grid', () => {
    for (const [lat, lng] of [[2.1859, 102.2106], [5.9, 102.28], [1.4, 103.7], [-6.2, 106.8], [84.9, 179.9], [-84.9, -179.9]]) {
      const { tiles } = mapWindow(lat, lng)
      expect(tiles.length).toBeLessThanOrEqual(6)
      for (const t of tiles) {
        expect(t.x).toBeGreaterThanOrEqual(0)
        expect(t.x).toBeLessThan(2 ** 15)
        expect(t.y).toBeGreaterThanOrEqual(0)
        expect(t.y).toBeLessThan(2 ** 15)
      }
    }
  })
  it('validates coordinates', () => {
    expect(validCoordinates(3.1, 101.7)).toBe(true)
    for (const [a, b] of [[NaN, 1], [1, Infinity], [90, 0], [0, 181], ['1', 2], [null, 2]] as [unknown, unknown][])
      expect(validCoordinates(a, b)).toBe(false)
  })
  it('keys the cache by slug and coordinates rounded to four decimals', () => {
    expect(mapCacheKey('masjid-negara', 3.14241, 101.69183)).toBe(
      'https://jejakmasjid.my/__jm-internal-cache/map/v1/masjid-negara/3.1424,101.6918',
    )
  })
})

describe('renderMapSvg with real tiles', () => {
  const win = mapWindow(MASJID_NEGARA.lat, MASJID_NEGARA.lng)
  const svg = renderMapSvg(win, fixtureTiles(MASJID_NEGARA.set, win), { buildings: true })
  it('draws land, green, water, buildings, roads, rail and the pin', () => {
    expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500"')).toBe(true)
    expect(svg).toContain(`fill="${MAP_COLORS.land}"`)
    for (const color of [MAP_COLORS.green, MAP_COLORS.water, MAP_COLORS.building, MAP_COLORS.casing, MAP_COLORS.rail])
      expect(svg).toContain(color)
    expect(svg).toContain('stroke="#ffffff"')
    expect(svg).toContain('stroke-dasharray="10 8"')
    expect(svg).toContain(`fill="${MAP_COLORS.pin}"`)
    expect(svg).toContain(`fill="${MAP_COLORS.gold}"`)
    // The credit is an HTML overlay (the page crops the image), never part of the SVG.
    expect(svg).not.toMatch(/OpenStreetMap|<text/)
  })
  it('stays under the 80 KB budget in the densest part of Kuala Lumpur', () => {
    expect(Buffer.byteLength(svg)).toBeLessThan(80_000)
  })
  it('is well-formed, has no script, no labels from user data and no duplicate attributes', () => {
    expect(svg).not.toMatch(/<script|onload|href=/i)
    expect(svg.match(/<svg/g)).toHaveLength(1)
    for (const tag of svg.match(/<[a-z]+ [^>]*>/g) ?? []) {
      const names = [...tag.matchAll(/ ([a-z-]+)=/g)].map((m) => m[1])
      expect(new Set(names).size).toBe(names.length)
    }
    expect(svg.endsWith('</svg>')).toBe(true)
  })
  it('is deterministic', () => {
    expect(renderMapSvg(win, fixtureTiles(MASJID_NEGARA.set, win), { buildings: true })).toBe(svg)
  })
  it('skips buildings when asked and gets smaller', () => {
    const plain = renderMapSvg(win, fixtureTiles(MASJID_NEGARA.set, win))
    expect(plain).not.toContain(MAP_COLORS.building)
    expect(plain.length).toBeLessThan(svg.length)
  })
  it('keeps path coordinates close to the window (no far-away geometry)', () => {
    for (const d of svg.match(/ d="[^"]+"/g) ?? []) {
      const start = d.match(/M(-?\d+) (-?\d+)/)
      if (!start) continue
      expect(Math.abs(Number(start[1]))).toBeLessThan(3000)
      expect(Math.abs(Number(start[2]))).toBeLessThan(3000)
    }
  })
})

describe('coastal window', () => {
  const win = mapWindow(COAST.lat, COAST.lng)
  const svg = renderMapSvg(win, fixtureTiles(COAST.set, win), { buildings: true })
  it('paints the sea from the water polygons and stays tiny', () => {
    expect(svg).toContain(`fill="${MAP_COLORS.water}"`)
    expect(Buffer.byteLength(svg)).toBeLessThan(8_000)
  })
})

describe('renderMapSvg edge cases', () => {
  const win = mapWindow(COAST.lat, COAST.lng)
  it('treats empty tiles as empty land', () => {
    const empty = new Map(win.tiles.map((t) => [`${t.x}/${t.y}`, new Uint8Array(0)] as const))
    const svg = renderMapSvg(win, empty, { buildings: true })
    expect(svg).toBe(fallbackMapSvg())
  })
  it('throws when a tile is missing, so the caller can fall back', () => {
    expect(() => renderMapSvg(win, new Map())).toThrow(/missing tile/)
  })
  it('throws on a corrupt tile', () => {
    const bad = new Map(win.tiles.map((t) => [`${t.x}/${t.y}`, new Uint8Array([0x1a, 0xff, 0xff, 0xff, 0xff, 0x0f, 1])] as const))
    expect(() => renderMapSvg(win, bad)).toThrow()
  })
  it('fallback map is land and pin only (the credit is HTML)', () => {
    const svg = fallbackMapSvg()
    expect(svg).toContain(MAP_COLORS.land)
    expect(svg).toContain(MAP_COLORS.pin)
    expect(svg).not.toContain('OpenStreetMap')
    expect(svg).not.toContain('stroke=')
  })
})
