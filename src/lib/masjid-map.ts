import Pbf from 'pbf'
import { VectorTile, type VectorTileLayer } from '@mapbox/vector-tile'

/**
 * Server-rendered SVG map for the public masjid page. Pure functions only: tile
 * bytes in, SVG text out. No network, no Worker bindings (see
 * masjid-map-response.ts for those).
 *
 * The OpenStreetMap credit is deliberately NOT drawn here: the page crops the
 * image (object-fit: cover) in the phone and desktop heroes, which would cut an
 * in-image credit off. It is an HTML overlay in components/masjid/MapImage.tsx.
 *
 * Tiles are Protomaps basemap schema v4 vector tiles (max zoom 15). The map is
 * drawn as if at zoom 16 (each z15 tile covers 512 px), centred on the masjid in
 * an 800 x 500 window, so a window needs at most six z15 tiles (3 x 2).
 */

export const MAP_WIDTH = 800
export const MAP_HEIGHT = 500
export const TILE_ZOOM = 15
export const VIEW_ZOOM = 16
const TILE_PX = 256 * 2 ** (VIEW_ZOOM - TILE_ZOOM) // one z15 tile drawn at zoom 16
const PAD = 40 // keep geometry slightly outside the window so strokes meet the edge
const SIMPLIFY = 0.55 // px tolerance
// Buildings are context only: largest first, tiny ones dropped, hard size budget
// (path characters) so a dense city centre cannot blow the SVG past ~80 KB.
const BUILDING_MIN_AREA = 28 // px^2
const BUILDING_BUDGET = 22_000

export const MAP_COLORS = {
  land: '#edf1ea',
  green: '#d6e9d4',
  water: '#bfe1de',
  building: '#e1e8e2',
  casing: '#d5e2dc',
  road: '#ffffff',
  rail: '#b4cfcc',
  pin: '#003130',
  gold: '#ffcc00',
} as const

export type MapTileRef = { z: number; x: number; y: number }
export type MapWindow = {
  /** World pixel (zoom 16) of the window's top-left corner. */
  originX: number
  originY: number
  tiles: MapTileRef[]
}

export function validCoordinates(lat: unknown, lng: unknown): lat is number {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 85 &&
    Math.abs(lng) <= 180
  )
}

export function mapWindow(lat: number, lng: number): MapWindow {
  const size = 256 * 2 ** VIEW_ZOOM
  const sin = Math.sin((lat * Math.PI) / 180)
  const worldX = ((lng + 180) / 360) * size
  const worldY = (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * size
  const originX = worldX - MAP_WIDTH / 2
  const originY = worldY - MAP_HEIGHT / 2
  const max = 2 ** TILE_ZOOM - 1
  const clamp = (n: number) => Math.min(max, Math.max(0, n))
  const x0 = clamp(Math.floor(originX / TILE_PX))
  const x1 = clamp(Math.floor((originX + MAP_WIDTH) / TILE_PX))
  const y0 = clamp(Math.floor(originY / TILE_PX))
  const y1 = clamp(Math.floor((originY + MAP_HEIGHT) / TILE_PX))
  const tiles: MapTileRef[] = []
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) tiles.push({ z: TILE_ZOOM, x, y })
  return { originX, originY, tiles }
}

export const tilePath = ({ z, x, y }: MapTileRef) => `/${z}/${x}/${y}.mvt`

/** Cache API key: slug plus coordinates rounded to ~11 m. */
export const mapCacheKey = (slug: string, lat: number, lng: number) =>
  `https://jejakmasjid.my/__jm-internal-cache/map/v1/${slug}/${lat.toFixed(4)},${lng.toFixed(4)}`

type Pt = [number, number]

// Douglas-Peucker (iterative) on an open polyline.
function simplify(points: Pt[], tolerance: number): Pt[] {
  if (points.length < 3) return points
  const keep = new Uint8Array(points.length)
  keep[0] = keep[points.length - 1] = 1
  const stack: [number, number][] = [[0, points.length - 1]]
  const tol2 = tolerance * tolerance
  while (stack.length) {
    const [a, b] = stack.pop()!
    const [ax, ay] = points[a]
    const [bx, by] = points[b]
    const dx = bx - ax
    const dy = by - ay
    const len2 = dx * dx + dy * dy
    let max = 0
    let index = -1
    for (let i = a + 1; i < b; i++) {
      const [px, py] = points[i]
      let d2: number
      if (len2 === 0) d2 = (px - ax) ** 2 + (py - ay) ** 2
      else {
        const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2))
        d2 = (px - (ax + t * dx)) ** 2 + (py - (ay + t * dy)) ** 2
      }
      if (d2 > max) {
        max = d2
        index = i
      }
    }
    if (index !== -1 && max > tol2) {
      keep[index] = 1
      stack.push([a, index], [index, b])
    }
  }
  return points.filter((_, i) => keep[i])
}

// Absolute move then relative line segments with integer pixels.
function encode(points: Pt[], close: boolean): string {
  let px = Math.round(points[0][0])
  let py = Math.round(points[0][1])
  let out = `M${px} ${py}`
  let seg = ''
  for (let i = 1; i < points.length; i++) {
    const x = Math.round(points[i][0])
    const y = Math.round(points[i][1])
    if (x === px && y === py) continue
    seg += `${seg ? ' ' : ''}${x - px},${y - py}`
    px = x
    py = y
  }
  if (!seg) return ''
  out += `l${seg}`
  return close ? out + 'z' : out
}

const inWindow = (minX: number, minY: number, maxX: number, maxY: number) =>
  maxX >= -PAD && minX <= MAP_WIDTH + PAD && maxY >= -PAD && minY <= MAP_HEIGHT + PAD

// Keep only the runs of a polyline whose segments touch the padded window.
function clipRuns(points: Pt[]): Pt[][] {
  const runs: Pt[][] = []
  let current: Pt[] | null = null
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]
    const b = points[i + 1]
    if (
      inWindow(
        Math.min(a[0], b[0]),
        Math.min(a[1], b[1]),
        Math.max(a[0], b[0]),
        Math.max(a[1], b[1]),
      )
    ) {
      if (!current) {
        current = [a]
        runs.push(current)
      }
      current.push(b)
    } else current = null
  }
  return runs
}

type RoadTier = 0 | 1 | 2 | 3 | 4
// Widths in window pixels (zoom 16). Casing is drawn for the first three tiers.
const ROAD_FILL = [15, 11, 9, 6, 3.5] as const
const ROAD_CASING = [20, 15, 12.5] as const
const WATERWAY_WIDTH: Record<string, number> = { river: 9, canal: 6, stream: 3, drain: 2.5 }
const GREEN_LANDUSE = new Set([
  'park',
  'garden',
  'grass',
  'forest',
  'wood',
  'scrub',
  'nature_reserve',
  'recreation_ground',
  'golf_course',
  'meadow',
  'village_green',
  'allotments',
  'orchard',
  'cemetery',
  'pitch',
  'playground',
  'zoo',
  'farmland',
  'grassland',
])
const WATER_POLYGON_SKIP = new Set(['swimming_pool', 'fountain'])
const RAIL_DETAIL = new Set(['rail', 'light_rail', 'monorail', 'tram', 'narrow_gauge'])

function roadTier(kind: string, detail: string): RoadTier | null {
  const link = detail.endsWith('_link')
  const base = link ? detail.slice(0, -5) : detail
  let tier: RoadTier
  if (kind === 'highway') tier = 0
  else if (kind === 'major_road') {
    tier = base === 'trunk' || base === 'primary' ? 0 : base === 'secondary' ? 1 : 2
  } else if (kind === 'medium_road') tier = 2
  else if (kind === 'minor_road') tier = base === 'service' ? 4 : 3
  else return null // path, other, ferry, rail handled elsewhere
  if (link && tier < 2) tier = (tier + 1) as RoadTier
  return tier
}

type Buckets = {
  green: string[]
  water: string[]
  waterLines: Record<string, string[]>
  buildings: { d: string; area: number }[]
  casing: string[][]
  fill: string[][]
  rail: string[]
}

function newBuckets(): Buckets {
  return {
    green: [],
    water: [],
    waterLines: {},
    buildings: [],
    casing: [[], [], []],
    fill: [[], [], [], [], []],
    rail: [],
  }
}

export type RenderOptions = { buildings?: boolean }

function project(
  layer: VectorTileLayer,
  rings: { x: number; y: number }[][],
  dx: number,
  dy: number,
): Pt[][] {
  const k = TILE_PX / layer.extent
  return rings.map((ring) => ring.map((p) => [dx + p.x * k, dy + p.y * k] as Pt))
}

function addPolygon(into: string[], rings: Pt[][], buildings?: Buckets['buildings']) {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const ring of rings)
    for (const [x, y] of ring) {
      if (x < minX) minX = x
      if (y < minY) minY = y
      if (x > maxX) maxX = x
      if (y > maxY) maxY = y
    }
  if (!inWindow(minX, minY, maxX, maxY)) return
  let d = ''
  for (const ring of rings) {
    const pts = ring.length > 1 && ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1] ? ring.slice(0, -1) : ring
    if (pts.length < 3) continue
    const simplified = simplify(pts, SIMPLIFY)
    if (simplified.length < 3) continue
    d += encode(simplified, true)
  }
  if (!d) return
  if (buildings) {
    const area = (maxX - minX) * (maxY - minY)
    if (area >= BUILDING_MIN_AREA) buildings.push({ d, area })
  } else into.push(d)
}

function addLine(into: string[], lines: Pt[][]) {
  for (const line of lines)
    for (const run of clipRuns(line)) {
      const d = encode(simplify(run, SIMPLIFY), false)
      if (d) into.push(d)
    }
}

function collect(
  buckets: Buckets,
  tile: VectorTile,
  ref: MapTileRef,
  win: MapWindow,
  options: RenderOptions,
) {
  const dx = ref.x * TILE_PX - win.originX
  const dy = ref.y * TILE_PX - win.originY

  const landuse = tile.layers.landuse
  if (landuse)
    for (let i = 0; i < landuse.length; i++) {
      const f = landuse.feature(i)
      if (f.type !== 3 || !GREEN_LANDUSE.has(String(f.properties.kind))) continue
      addPolygon(buckets.green, project(landuse, f.loadGeometry(), dx, dy))
    }
  const landcover = tile.layers.landcover
  if (landcover)
    for (let i = 0; i < landcover.length; i++) {
      const f = landcover.feature(i)
      if (f.type !== 3 || !GREEN_LANDUSE.has(String(f.properties.kind))) continue
      addPolygon(buckets.green, project(landcover, f.loadGeometry(), dx, dy))
    }

  const water = tile.layers.water
  if (water)
    for (let i = 0; i < water.length; i++) {
      const f = water.feature(i)
      const kind = String(f.properties.kind)
      if (f.type === 3) {
        if (WATER_POLYGON_SKIP.has(kind)) continue
        addPolygon(buckets.water, project(water, f.loadGeometry(), dx, dy))
      } else if (f.type === 2 && WATERWAY_WIDTH[kind]) {
        addLine((buckets.waterLines[kind] ??= []), project(water, f.loadGeometry(), dx, dy))
      }
    }

  const buildings = tile.layers.buildings
  if (options.buildings && buildings)
    for (let i = 0; i < buildings.length; i++) {
      const f = buildings.feature(i)
      if (f.type !== 3 || f.properties.kind !== 'building') continue
      addPolygon([], project(buildings, f.loadGeometry(), dx, dy), buckets.buildings)
    }

  const roads = tile.layers.roads
  if (roads)
    for (let i = 0; i < roads.length; i++) {
      const f = roads.feature(i)
      if (f.type !== 2 || f.properties.is_tunnel) continue
      const kind = String(f.properties.kind)
      const detail = String(f.properties.kind_detail ?? '')
      if (kind === 'rail') {
        if (RAIL_DETAIL.has(detail)) addLine(buckets.rail, project(roads, f.loadGeometry(), dx, dy))
        continue
      }
      const tier = roadTier(kind, detail)
      if (tier === null) continue
      const lines = project(roads, f.loadGeometry(), dx, dy)
      if (tier <= 2) addLine(buckets.casing[tier], lines)
      addLine(buckets.fill[tier], lines)
    }
}

const stroke = (
  paths: string[],
  color: string,
  width: number,
  dash?: string,
): string =>
  paths.length
    ? `<path d="${paths.join('')}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="${dash ? 'butt' : 'round'}" stroke-linejoin="round"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`
    : ''
function budgeted(items: Buckets['buildings']): string[] {
  const out: string[] = []
  let size = 0
  for (const item of items.sort((a, b) => b.area - a.area)) {
    if (size + item.d.length > BUILDING_BUDGET) continue
    size += item.d.length
    out.push(item.d)
  }
  return out
}
const fill = (paths: string[], color: string): string =>
  paths.length ? `<path d="${paths.join('')}" fill="${color}"/>` : ''

// Pin tip at the window centre, matching sketch 108.
const PIN = `<ellipse cx="400" cy="252" rx="15" ry="5" fill="${MAP_COLORS.pin}" opacity=".18"/><path d="M400 250C378 224 366 206 366 190a34 34 0 1 1 68 0C434 206 422 224 400 250z" fill="${MAP_COLORS.pin}"/><circle cx="400" cy="190" r="12" fill="${MAP_COLORS.gold}"/>`

const wrap = (body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${MAP_WIDTH} ${MAP_HEIGHT}" width="${MAP_WIDTH}" height="${MAP_HEIGHT}" role="img"><rect width="${MAP_WIDTH}" height="${MAP_HEIGHT}" fill="${MAP_COLORS.land}"/>${body}${PIN}</svg>`

/** Plain land colour, the pin and the attribution. Used whenever tiles fail. */
export const fallbackMapSvg = () => wrap('')

export function decodeTile(bytes: Uint8Array): VectorTile {
  return new VectorTile(new Pbf(bytes))
}

/**
 * tiles: decoded or raw MVT bytes keyed by `${x}/${y}` of the z15 tile. An empty
 * Uint8Array is a valid empty tile (open water or nothing mapped).
 */
export function renderMapSvg(
  win: MapWindow,
  tiles: Map<string, VectorTile | Uint8Array>,
  options: RenderOptions = {},
): string {
  const buckets = newBuckets()
  for (const ref of win.tiles) {
    const data = tiles.get(`${ref.x}/${ref.y}`)
    if (!data) throw new Error(`missing tile ${ref.x}/${ref.y}`)
    if (data instanceof Uint8Array && data.length === 0) continue
    const tile = data instanceof Uint8Array ? decodeTile(data) : data
    collect(buckets, tile, ref, win, options)
  }
  let body = fill(buckets.green, MAP_COLORS.green) + fill(buckets.water, MAP_COLORS.water)
  for (const [kind, paths] of Object.entries(buckets.waterLines))
    body += stroke(paths, MAP_COLORS.water, WATERWAY_WIDTH[kind])
  body += fill(budgeted(buckets.buildings), MAP_COLORS.building)
  for (let t = 2; t >= 0; t--) body += stroke(buckets.casing[t], MAP_COLORS.casing, ROAD_CASING[t])
  for (let t = 4; t >= 0; t--) body += stroke(buckets.fill[t], MAP_COLORS.road, ROAD_FILL[t])
  body += stroke(buckets.rail, MAP_COLORS.rail, 3, '10 8')
  return wrap(body)
}
