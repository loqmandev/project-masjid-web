// Test-fixture builder. Takes raw decoded z15 tiles (15-X-Y.bin, e.g. fetched with
// the `pmtiles` package from a public Protomaps build), keeps only the layers the
// masjid map draws and writes gzipped copies under src/lib/fixtures/map/.
// usage: node scripts/map/make-fixtures.mjs <input dir> <prefix>
import fs from 'node:fs'
import { gzipSync } from 'node:zlib'
import Pbf from 'pbf'

const KEEP = new Set(['landuse', 'landcover', 'water', 'roads', 'buildings'])
const [input, prefix] = process.argv.slice(2)
const out = new URL('../../src/lib/fixtures/map/', import.meta.url)
fs.mkdirSync(out, { recursive: true })
const varint = (n) => {
  const b = []
  while (n > 127) { b.push((n & 127) | 128); n = Math.floor(n / 128) }
  b.push(n)
  return Buffer.from(b)
}
for (const file of fs.readdirSync(input).filter((f) => f.endsWith('.bin'))) {
  const buf = fs.readFileSync(`${input}/${file}`)
  const pbf = new Pbf(buf)
  const layers = []
  pbf.readFields((tag, _o, p) => {
    if (tag !== 3) return
    const len = p.readVarint()
    const bytes = buf.subarray(p.pos, p.pos + len)
    let name = ''
    new Pbf(bytes).readFields((t, _x, q) => { if (t === 1) name = q.readString() }, null)
    if (KEEP.has(name)) layers.push(Buffer.concat([Buffer.from([0x1a]), varint(len), bytes]))
    p.pos += len
  }, null)
  const pruned = Buffer.concat(layers)
  fs.writeFileSync(new URL(`${prefix}-${file.replace('.bin', '.mvt.gz')}`, out), gzipSync(pruned, { level: 9 }))
  console.log(file, buf.length, '->', pruned.length)
}
