// Test helper: real Protomaps basemap v4 z15 tiles (pruned to the layers the masjid
// map draws, gzipped) saved under fixtures/map. Tests never touch the network.
import { readFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import type { MapWindow } from './masjid-map'

export const MASJID_NEGARA = { lat: 3.1424, lng: 101.6918, set: 'negara' }
export const COAST = { lat: 2.1859, lng: 102.2106, set: 'coast' }

export function fixtureTile(set: string, x: number, y: number): Uint8Array {
  const file = new URL(`./fixtures/map/${set}-15-${x}-${y}.mvt.gz`, import.meta.url)
  return new Uint8Array(gunzipSync(readFileSync(file)))
}
export function fixtureTiles(set: string, win: MapWindow) {
  return new Map(win.tiles.map((t) => [`${t.x}/${t.y}`, fixtureTile(set, t.x, t.y)] as const))
}
