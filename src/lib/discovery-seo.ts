import { seo } from './seo'
import { jsonLdScript } from './jsonld'
import { absoluteUrl } from './site'
import { t, type Locale } from './i18n'
import { areaPath, countryName, discoveryHome, resolveArea, type Areas, type AreaList, type DiscoveryItem, type SearchResults } from './discovery'
export const itemList = (items: DiscoveryItem[], start = 0) => ({
  '@context': 'https://schema.org', '@type': 'ItemList',
  itemListElement: items.map((item, index) => ({ '@type': 'ListItem', position: start + index + 1, item: { '@type': 'Place', name: item.name, url: absoluteUrl(`/masjid/${item.slug}`) } })),
})
export function areaBreadcrumbs(areas: Areas, list: AreaList, locale: Locale) {
  const q = list.area
  const area = resolveArea(areas, q)!
  return [
    { name: locale === 'ms' ? 'Masjid' : 'Mosques', href: discoveryHome(locale) },
    { name: countryName(area.country.code, locale), href: areaPath(locale, { country: q.country }) },
    ...(area.region ? [{ name: area.region.name, href: areaPath(locale, { country: q.country, region: q.region }) }] : []),
    ...(area.district ? [{ name: area.district.name, href: areaPath(locale, q) }] : []),
  ]
}
export function landingHead(locale: Locale, data?: { q: string; results: SearchResults | null }, hasQuery = Boolean(data?.q)) {
  if (!data) return { meta: [{ name: 'robots', content: 'noindex, nofollow' }], links: [], scripts: [] }
  const copy = t(locale).discovery
  const head = seo({ title: copy.title, description: copy.intro, path: discoveryHome(locale), alternates: { ms: discoveryHome('ms'), en: discoveryHome('en') } })
  if (hasQuery) head.meta = head.meta.map(meta => meta.name === 'robots' ? { name: 'robots', content: 'noindex, follow' } : meta)
  return { ...head,
    scripts: data.results ? [{ type: 'application/ld+json', children: jsonLdScript(itemList(data.results.items, (data.results.page - 1) * data.results.pageSize)) }] : [],
  }
}
export function areaHead(locale: Locale, data?: { areas: Areas; list: AreaList }) {
  if (!data) return { meta: [{ name: 'robots', content: 'noindex, nofollow' }], links: [], scripts: [] }
  const copy = t(locale).discovery
  const { areas, list } = data
  const crumbs = areaBreadcrumbs(areas, list, locale)
  const name = crumbs.at(-1)!.name
  const path = areaPath(locale, list.area, list.page)
  const alternates = { ms: areaPath('ms', list.area, list.page), en: areaPath('en', list.area, list.page) }
  return {
    ...seo({ title: `${copy.metaTitle} ${name}`, description: `${new Intl.NumberFormat(locale).format(list.total)} ${copy.count} ${locale === 'ms' ? 'di' : 'in'} ${name}.`, path, alternates, noindex: list.total < 3 }),
    scripts: [{ type: 'application/ld+json', children: jsonLdScript([
      { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: crumbs.map((c, index) => ({ '@type': 'ListItem', position: index + 1, name: c.name, item: absoluteUrl(c.href) })) },
      itemList(list.items, (list.page - 1) * 50),
    ]) }],
  }
}
