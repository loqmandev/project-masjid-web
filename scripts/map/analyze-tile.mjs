// Prints per-layer feature counts and kind distribution for decoded MVT files.
import fs from 'node:fs'
import Pbf from 'pbf'
import { VectorTile } from '@mapbox/vector-tile'
for (const file of process.argv.slice(2)) {
  const tile = new VectorTile(new Pbf(fs.readFileSync(file)))
  console.log('==', file)
  for (const [name, layer] of Object.entries(tile.layers)) {
    const kinds = {}
    for (let i = 0; i < layer.length; i++) {
      const f = layer.feature(i)
      const k = `${f.properties.kind ?? ''}${f.properties.kind_detail ? '/' + f.properties.kind_detail : ''}|t${f.type}`
      kinds[k] = (kinds[k] ?? 0) + 1
    }
    console.log(name, 'extent', layer.extent, 'n', layer.length, JSON.stringify(kinds).slice(0, 600))
  }
}
