// W0 spike: render the saved Masjid Negara tiles, report CPU time and SVG size.
// usage: node scripts/map/render-spike.mjs <dir with 15-X-Y.bin> <lat> <lng> <out.svg> [buildings]
import fs from 'node:fs'
import { mapWindow, renderMapSvg } from '../../src/lib/masjid-map.ts'
import { gzipSync } from 'node:zlib'
const [dir, lat, lng, out, buildings] = process.argv.slice(2)
const win = mapWindow(Number(lat), Number(lng))
const tiles = new Map()
for (const t of win.tiles) tiles.set(`${t.x}/${t.y}`, new Uint8Array(fs.readFileSync(`${dir}/15-${t.x}-${t.y}.bin`)))
console.log('tiles', win.tiles.map((t) => `${t.x}/${t.y}`).join(' '))
const opts = { buildings: buildings === 'buildings' }
const times = []
let svg = ''
for (let i = 0; i < 30; i++) {
  const t0 = process.cpuUsage()
  const w0 = performance.now()
  svg = renderMapSvg(win, tiles, opts)
  const c = process.cpuUsage(t0)
  times.push({ cpu: (c.user + c.system) / 1000, wall: performance.now() - w0 })
}
const sorted = (k) => times.map((t) => t[k]).sort((a, b) => a - b)
console.log('first run cpu ms', times[0].cpu.toFixed(1), 'wall', times[0].wall.toFixed(1))
console.log('warm cpu ms median', sorted('cpu')[15].toFixed(1), 'min', sorted('cpu')[0].toFixed(1), 'max', sorted('cpu')[29].toFixed(1))
console.log('svg bytes', Buffer.byteLength(svg), 'gzip', gzipSync(svg).length, 'brotli-ish n/a')
fs.writeFileSync(out, svg)
