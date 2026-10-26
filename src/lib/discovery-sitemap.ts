import { areaPath, discoveryHome, type Areas, type AreaQuery } from './discovery'
import { SITE } from './site'
import { xmlEscape } from './sitemap'
export function areaSitemap(areas: Areas) {
  const pages: { query: AreaQuery | null; page: number }[] = [{ query: null, page: 1 }]
  const add = (query: AreaQuery, count: number) => {
    if (count < 3) return
    for (let page = 1; page <= Math.ceil(count / 50); page++) pages.push({ query, page })
  }
  for (const c of areas.countries) {
    if (!c.code) continue
    add({ country: c.slug }, c.count)
    for (const r of c.regions) {
      add({ country: c.slug, region: r.slug }, r.count)
      for (const d of r.districts) add({ country: c.slug, region: r.slug, district: d.slug }, d.count)
    }
  }
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${pages.flatMap(({ query: q, page }) => {
    const paths = { ms: q ? areaPath('ms', q, page) : discoveryHome('ms'), en: q ? areaPath('en', q, page) : discoveryHome('en') }
    return [paths.ms, paths.en].map(path => `<url><loc>${xmlEscape(SITE.url + path)}</loc>${[['ms', paths.ms], ['en', paths.en], ['x-default', paths.en]].map(([lang, twin]) => `<xhtml:link rel="alternate" hreflang="${lang}" href="${xmlEscape(SITE.url + twin)}"/>`).join('')}</url>`)
  }).join('')}</urlset>`
}
export async function areaSitemapResponse() {
  const { getAreas } = await import('./discovery-api.server')
  const areas = await getAreas()
  return new Response(areas ? areaSitemap(areas) : null, { status: areas ? 200 : 404, headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'no-store' } })
}
