import { useEffect, useRef, useState, type ReactNode } from 'react'
import Header from './Header'
import Footer from './Footer'
import { Container } from './ui/Section'
import StoreBadges from './ui/StoreBadges'
import { t, type Locale } from '@/lib/i18n'
import { areaPath, countryName, discoveryHome, searchPath, resolveArea, type Areas, type AreaList, type AreaQuery, type DiscoveryItem, type NearbyItem } from '@/lib/discovery'
import { areaBreadcrumbs } from '@/lib/discovery-seo'
import { loadDiscoveryNearby } from '@/lib/discovery-server'
import type { loadDiscoveryLanding } from '@/lib/discovery-server'
const number = (n: number, locale: Locale) => new Intl.NumberFormat(locale).format(n)
export function DiscoveryList({ items, locale, start }: { items: (DiscoveryItem | NearbyItem)[]; locale: Locale; start?: number }) {
  const List = start === undefined ? 'ul' : 'ol'
  return <List start={start} className={`discovery-list divide-y divide-border border-y border-border${start === undefined ? '' : ' list-decimal pl-8 marker:text-muted-foreground marker:tabular-nums'}`}>
    {items.map(item => <li key={item.slug} className="py-5 sm:py-6">
      <a className="group flex min-w-0 items-start justify-between gap-4" href={`/masjid/${item.slug}`}>
        <div className="min-w-0"><h3 className="break-words text-lg group-hover:underline sm:text-xl">{item.name}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{[item.type === 'masjid' ? (locale === 'ms' ? 'Masjid' : 'Mosque') : 'Surau', item.districtName, item.stateName, item.country ? countryName(item.country, locale) : null].filter(Boolean).join(' · ')}</p>
        </div>
        {'distanceM' in item ? <span className="shrink-0 pt-1 text-sm tabular-nums">{item.distanceM < 1000 ? `${number(item.distanceM, locale)} m` : `${number(item.distanceM / 1000, locale)} km`}</span> : <span className="pt-1" aria-hidden="true">↗</span>}
      </a>
    </li>)}
  </List>
}
function DiscoveryPager({ locale, page, pages, href }: { locale: Locale; page: number; pages: number; href: (page: number) => string }) {
  const copy = t(locale).discovery
  return <nav className="discovery-pagination mt-8 flex max-w-4xl flex-wrap items-center justify-between gap-4" aria-label={copy.pagination}>
    {page > 1 ? <a rel="prev" className="discovery-button discovery-secondary" href={href(page - 1)}>← {copy.previous}</a> : <span />}
    <span className="text-sm">{copy.page} {number(page, locale)} {copy.of} {number(pages, locale)}</span>
    {page < pages ? <a rel="next" className="discovery-button discovery-secondary" href={href(page + 1)}>{copy.next} →</a> : <span />}
  </nav>
}
export function NearbySearch({ locale }: { locale: Locale }) {
  const copy = t(locale).discovery
  const [ready, setReady] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'done'>('idle')
  const [items, setItems] = useState<NearbyItem[]>([])
  const mounted = useRef(false)
  useEffect(() => { mounted.current = true; setReady(true); return () => { mounted.current = false } }, [])
  const locate = () => {
    setStatus('loading'); setItems([])
    const fail = () => { if (mounted.current) setStatus('error') }
    if (!navigator.geolocation) return fail()
    try { navigator.geolocation.getCurrentPosition(async position => {
      try {
        const result = await loadDiscoveryNearby({ data: { lat: Math.round(position.coords.latitude * 1000) / 1000, lng: Math.round(position.coords.longitude * 1000) / 1000 } })
        if (!mounted.current) return
        if (!result) return fail()
        setItems(result.items); setStatus('done')
      } catch { fail() }
    }, fail, { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }) } catch { fail() }
  }
  if (!ready) return null
  return <div className="nearby-search mt-6">
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2"><button className="discovery-button discovery-secondary" type="button" disabled={status === 'loading'} onClick={locate}>{status === 'loading' ? copy.locating : copy.near}</button><p className="text-sm text-muted-foreground">{copy.privacy}</p></div>
    <div role="status" aria-live="polite" className="mt-4 text-sm leading-relaxed">{status === 'error' ? copy.denied : status === 'done' && !items.length ? copy.nearEmpty : null}</div>
    {items.length ? <section aria-labelledby="nearby-heading" className="mt-8"><h2 id="nearby-heading" className="mb-5 text-2xl">{copy.nearby}</h2><DiscoveryList items={items} locale={locale} /></section> : null}
  </div>
}
function AreaLinks({ entries, locale, label }: { entries: { name: string; count: number; query: AreaQuery }[]; locale: Locale; label: string }) {
  return <nav aria-label={label}><ul className="area-grid mt-5 grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">{entries.map(entry => <li key={areaPath(locale, entry.query)} className="border-b border-border"><a href={areaPath(locale, entry.query)} className="flex min-h-16 items-center justify-between gap-4 py-4 hover:underline"><span>{entry.name}</span><span className="text-sm tabular-nums text-muted-foreground">{number(entry.count, locale)} <span aria-hidden="true">→</span></span></a></li>)}</ul></nav>
}
function Frame({ children }: { locale: Locale; children: ReactNode }) {
  return <><Header /><main id="main-content" className="discovery-page">{children}</main><Footer /></>
}
export function DiscoveryLanding({ locale, data }: { locale: Locale; data: Awaited<ReturnType<typeof loadDiscoveryLanding>> }) {
  const copy = t(locale).discovery
  const malaysia = data.areas.countries.find(c => c.code === 'MY')
  const other = data.areas.countries.filter(c => c.code !== 'MY')
  return <Frame locale={locale}>
    <div className="on-deep bg-deep py-12 sm:py-20"><Container><h1 className="max-w-3xl text-4xl leading-tight text-deep-foreground sm:text-5xl">{copy.title}</h1><p className="mt-5 max-w-2xl leading-relaxed text-deep-muted">{copy.intro}</p></Container></div>
    <Container className="py-10 sm:py-14">
      <section className="max-w-3xl" aria-label={copy.submit}>
        <form method="get" action={discoveryHome(locale)} role="search" className="discovery-search">
          <label className="mb-3 block font-semibold" htmlFor="masjid-search">{copy.label}</label>
          <div className="flex flex-col gap-3 sm:flex-row"><input id="masjid-search" name="q" type="search" maxLength={80} defaultValue={data.q} placeholder={copy.placeholder} className="min-w-0 flex-1 rounded-xl border border-border-strong bg-card px-4 py-3.5" /><button className="discovery-button" type="submit">{copy.submit}</button></div>
        </form>
        {data.q.length < 2 ? <p className="mt-3 text-sm text-muted-foreground">{copy.hint}</p> : data.q.length > 80 ? <p className="mt-3 text-sm text-muted-foreground">{copy.long}</p> : null}
        <NearbySearch locale={locale} />
      </section>
      {data.q.length >= 2 && data.q.length <= 80 ? <section className="mt-10 max-w-3xl" aria-labelledby="search-heading">
        <h2 id="search-heading" className="mb-5 text-2xl">{copy.results}</h2>
        {data.results?.items.length ? <DiscoveryList items={data.results.items} locale={locale} start={(data.results.page - 1) * data.results.pageSize + 1} /> : <p className="leading-relaxed text-muted-foreground">{data.results ? copy.empty : copy.unavailable}</p>}
        {data.results ? <DiscoveryPager locale={locale} page={data.results.page} pages={Math.max(1, Math.ceil(data.results.total / data.results.pageSize))} href={page => searchPath(locale, data.q, page)} /> : null}
        {data.results?.total === 200 ? <p className="mt-6 text-sm leading-relaxed text-muted-foreground">{copy.refine}</p> : null}
      </section> : null}
      <section className="mt-14 border-t border-border-strong pt-10 sm:mt-20" aria-labelledby="browse-heading"><h2 id="browse-heading" className="text-3xl">{copy.browse}</h2>
        {malaysia ? <><a className="mt-7 inline-flex min-h-11 items-center text-lg font-semibold underline underline-offset-4" href={areaPath(locale, { country: malaysia.slug })}>Malaysia <span className="ml-3 text-sm font-normal">{number(malaysia.count, locale)}</span></a><h3 className="sr-only">{copy.states}</h3><AreaLinks locale={locale} label={copy.states} entries={malaysia.regions.map(r => ({ name: r.name, count: r.count, query: { country: malaysia.slug, region: r.slug } }))} /></> : null}
        {other.length ? <div className="mt-10"><h3 className="text-xl">{copy.countries}</h3><ul className="mt-5 flex flex-wrap gap-3">{other.map(c => <li key={c.slug}>{c.code === null ? <span className="inline-flex min-h-11 items-center gap-3 px-1 text-sm text-muted-foreground">{countryName(null, locale)} · {number(c.count, locale)}</span> : <a className="inline-flex min-h-11 items-center gap-3 rounded-full border border-border-strong px-5 py-2 text-sm hover:bg-surface-sunken" href={areaPath(locale, { country: c.slug })}>{countryName(c.code, locale)}<span className="text-muted-foreground">{number(c.count, locale)}</span></a>}</li>)}</ul></div> : null}
      </section>
      {data.stats ? <a className="mt-12 inline-block min-h-11 text-sm underline underline-offset-4" href={`${locale === 'ms' ? '/' : '/en'}#angka`}>{number(data.stats.masjids.total, locale)} {copy.count} · {copy.stats} →</a> : null}
    </Container>
  </Frame>
}
export function DiscoveryArea({ locale, data }: { locale: Locale; data: { areas: Areas; list: AreaList } }) {
  const copy = t(locale).discovery
  const { list, areas } = data
  const crumbs = areaBreadcrumbs(areas, list, locale)
  const resolved = resolveArea(areas, list.area)!
  const children = resolved.district ? [] : resolved.region ? resolved.region.districts : resolved.country.regions
  const pages = Math.max(1, Math.ceil(list.total / 50))
  return <Frame locale={locale}>
    <div className="on-deep bg-deep py-10 sm:py-16"><Container>
      <nav aria-label={locale === 'ms' ? 'Jejak halaman' : 'Breadcrumb'}><ol className="flex flex-wrap gap-x-2 gap-y-3 text-sm text-deep-muted">{crumbs.map((c, i) => <li key={c.href} className="flex gap-2">{i ? <span aria-hidden="true">›</span> : null}{i === crumbs.length - 1 ? <span aria-current="page" className="text-deep-foreground">{c.name}</span> : <a className="underline underline-offset-4" href={c.href}>{c.name}</a>}</li>)}</ol></nav>
      <h1 className="mt-7 max-w-4xl text-3xl leading-tight text-deep-foreground sm:text-5xl">{copy.areaTitle} {crumbs.at(-1)!.name}</h1><p className="mt-5 text-deep-muted">{number(list.total, locale)} {copy.count}</p>
    </Container></div>
    <Container className="py-10 sm:py-14">
      {children.length ? <section className="mb-12" aria-labelledby="child-heading"><h2 id="child-heading" className="text-2xl">{copy.children}</h2><AreaLinks locale={locale} label={copy.children} entries={children.map(c => ({ name: c.name, count: c.count, query: resolved.region ? { country: list.area.country, region: list.area.region, district: c.slug } : { country: list.area.country, region: c.slug } }))} /></section> : null}
      <section className="max-w-4xl" aria-label={copy.results}><DiscoveryList items={list.items} locale={locale} /></section>
      <DiscoveryPager locale={locale} page={list.page} pages={pages} href={page => areaPath(locale, list.area, page)} />
      <aside className="mt-14 max-w-4xl border-t border-border pt-8"><p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{copy.add}</p><StoreBadges locale={locale} className="mt-5" size="compact" /></aside>
    </Container>
  </Frame>
}
export function DiscoveryMissing({ locale }: { locale: Locale }) {
  const copy = t(locale).discovery
  return <Frame locale={locale}><Container className="py-24"><h1 className="text-3xl text-foreground">{copy.missing}</h1><a href={locale === 'ms' ? '/' : '/en'} className="mt-6 inline-block min-h-11 underline">{copy.back}</a></Container></Frame>
}
