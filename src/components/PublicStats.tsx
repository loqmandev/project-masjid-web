import { useDiscoveryAreas } from './DiscoveryAvailability'
import { areaPath } from '@/lib/discovery'
import { Container } from './ui/Section'
import { t, type Locale } from '@/lib/i18n'
import { COUNTRY_NAMES, STATE_NAMES, statsDate, statsNumber, validPublicStats } from '@/lib/public-stats'

export default function PublicStats({ locale, stats }: { locale: Locale; stats: unknown }) {
  const areas = useDiscoveryAreas()
  const malaysia = areas?.countries.find(country => country.code === 'MY')
  const data = validPublicStats(stats)
  if (!data) return null
  const copy = t(locale).stats
  const number = statsNumber(locale)
  const visits = (value: number | null) => value === null ? '< 10' : number.format(value)
  const tiles = [
    [data.masjids.total, copy.total],
    [data.masjids.byCountry.filter(row => row.code !== null && row.count > 0).length, copy.countries],
    [data.visits30d.completed, copy.completed],
    [data.visits30d.uniqueMasjids, copy.uniqueMasjids],
    [data.visits30d.activeVisitors, copy.activeVisitors],
  ] as const
  const countries = [...data.masjids.byCountry].sort((a, b) => b.count - a.count)
  const states = [...data.masjids.byState].sort((a, b) => b.count - a.count)
  const maximum = Math.max(1, ...countries.map(row => row.count))

  return <section id="angka" aria-labelledby="stats-heading" className="public-stats border-b border-border bg-background py-20 text-foreground sm:py-28">
    <Container>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 id="stats-heading" className="max-w-xl text-3xl leading-tight sm:text-4xl">{copy.title}</h2>
        <p className="text-sm text-muted-foreground">{copy.updated} <time dateTime={data.computedAt}>{statsDate(data.computedAt, locale)} MYT</time></p>
      </div>
      <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
        {tiles.map(([value, label]) => <div key={label} className="min-w-0 border-t border-border-strong pt-5">
          <dt className="text-sm leading-relaxed text-muted-foreground">{label}</dt>
          <dd className="mt-3 break-words font-display text-3xl font-extrabold sm:text-4xl">{number.format(value)}</dd>
        </div>)}
      </dl>
      <div className="mt-14 grid min-w-0 items-start gap-12 lg:grid-cols-2">
        <div>
          <h3 className="text-2xl">{copy.byCountry}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{copy.countryNote}</p>
          <ul className="mt-7 space-y-6">
            {countries.map(row => {
              const visit = data.visits30d.byCountry.find(visit => visit.code === row.code)!
              return <li key={row.code ?? 'unknown'}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm">
                <span className="font-semibold">{row.code === null ? copy.unknown : COUNTRY_NAMES[row.code][locale]}</span>
                <span>{number.format(row.count)} {copy.masjids}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-sunken" aria-hidden="true"><div className="stats-bar h-full rounded-full" style={{ width: `${row.count / maximum * 100}%` }} /></div>
              <p className="mt-2 text-xs text-muted-foreground">{visits(visit.completed)} {copy.visits}</p>
            </li>})}
          </ul>
        </div>
        <div className="min-w-0">
          <h3 className="text-2xl">{copy.byState}</h3>
          <table className="mt-5 w-full table-fixed text-left text-sm">
            <caption className="sr-only">{copy.byState}</caption>
            <thead><tr className="border-b border-border-strong"><th scope="col" className="w-1/2 py-3 pr-2 font-semibold">{copy.state}</th><th scope="col" className="px-1 py-3 text-right font-semibold">{copy.masjids}</th><th scope="col" className="py-3 pl-2 text-right font-semibold">{copy.visits}</th></tr></thead>
            <tbody>{states.map(row => <tr key={row.stateCode} data-state-code={row.stateCode} className="border-b border-border">
              <th scope="row" className="break-words py-3 pr-2 font-medium">{malaysia?.regions.some(region => region.code === row.stateCode) ? <a className="underline underline-offset-4" href={areaPath(locale, { country: malaysia.slug, region: malaysia.regions.find(region => region.code === row.stateCode)!.slug })}>{STATE_NAMES[row.stateCode][locale]}</a> : STATE_NAMES[row.stateCode][locale]}</th>
              <td className="px-1 py-3 text-right">{number.format(row.count)}</td>
              <td className="py-3 pl-2 text-right">{visits(data.visits30d.byState.find(visit => visit.stateCode === row.stateCode)!.completed)}</td>
            </tr>)}</tbody>
          </table>
        </div>
      </div>
      <p className="mt-9 max-w-3xl text-sm leading-relaxed text-muted-foreground">{copy.definitions}</p>
    </Container>
  </section>
}
