import type { ReactNode } from 'react'
import Reveal from '@/components/ui/Reveal'
import { PUTRAJAYA_SNAPSHOT as S } from '@/lib/putrajaya-snapshot'

const nf = new Intl.NumberFormat('en-MY')
const pct = (value: number, max: number) => `${Math.max(2, (value / max) * 100)}%`
const TRACK = 'color-mix(in srgb, var(--brand-teal) 20%, var(--deep))'
const PARTIAL = 'color-mix(in srgb, var(--brand-teal) 45%, var(--deep))'

function Panel({ title, sub, children, className = '' }: { title: string; sub?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl bg-deep-tile p-5 sm:p-6 ${className}`}>
      <h4 className="font-display text-base font-extrabold uppercase tracking-wide text-deep-foreground">{title}</h4>
      {sub && <p className="mt-1 text-sm text-deep-muted">{sub}</p>}
      {children}
    </section>
  )
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div aria-hidden="true" className="h-2.5 overflow-hidden rounded-full" style={{ background: TRACK }}>
      <div className="snap-bar-x h-full rounded-full" style={{ width: pct(value, max), background: color }} />
    </div>
  )
}

export default function CommitteeSnapshot() {
  const prayerMax = Math.max(...S.prayer.items.map((i) => i.value))
  const locMax = Math.max(...S.topLocations.items.map((i) => i.value))
  const venueMax = Math.max(...S.venueTypes.map((i) => i.value))
  const monthMax = Math.max(...S.monthly.items.map((i) => i.value))

  return (
    <div className="mt-12 sm:mt-16">
      <h3 id="snapshot-heading" className="text-2xl text-foreground">Gambaran awal: Putrajaya</h3>
      <p className="mt-2 max-w-2xl leading-relaxed text-muted-foreground">
        Contoh laporan yang boleh dikongsi bersama AJK — kunjungan, waktu solat dan lokasi yang aktif di kawasan anda.
      </p>

      <Reveal as="figure" className="on-deep mt-6 rounded-[20px] bg-deep p-5 text-deep-foreground sm:p-8">
        <div aria-labelledby="snapshot-heading" role="group">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <span aria-hidden="true" className="block h-1 w-12 rounded-full bg-accent" />
              <p className="mt-4 font-display text-2xl font-extrabold uppercase leading-tight sm:text-3xl">
                Jejak Masjid / {S.area}
              </p>
              <p className="mt-1 text-deep-muted">Tanpa {S.excluded}</p>
            </div>
            <p className="text-sm text-deep-muted sm:text-right">
              <time dateTime={S.asOfIso} className="font-display text-base font-extrabold text-accent">{S.asOf}</time>
            </p>
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            {S.stats.map((stat, i) => (
              <div key={stat.label} className="min-w-0 rounded-2xl bg-deep-tile p-4 sm:p-5">
                <dt className="eyebrow">{stat.label}</dt>
                <dd className={`mt-2 font-display text-4xl font-extrabold leading-none sm:text-5xl ${i === 3 ? 'text-accent' : 'text-deep-foreground'}`}>
                  {nf.format(stat.value)}
                </dd>
                <dd className="mt-3 text-sm text-deep-muted">{stat.caption}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <Panel title="Waktu solat" sub={S.prayer.subtitle}>
              <ul className="mt-5 space-y-4">
                {S.prayer.items.map((p) => (
                  <li key={p.label}>
                    <div className="mb-1.5 flex items-baseline justify-between gap-3">
                      <span>{p.label}</span>
                      <span className="font-display font-extrabold">{nf.format(p.value)}</span>
                    </div>
                    <Bar value={p.value} max={prayerMax} color="var(--brand-teal)" />
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-sm text-deep-muted">{S.prayer.footnote}</p>
            </Panel>

            <Panel title="Lokasi paling aktif" sub={S.topLocations.subtitle}>
              <ol className="mt-5 space-y-4">
                {S.topLocations.items.map((l) => (
                  <li key={l.name}>
                    <div className="mb-1.5 flex items-baseline justify-between gap-3">
                      <span className="min-w-0 break-words">{l.name}</span>
                      <span className="font-display font-extrabold text-accent">{nf.format(l.value)}</span>
                    </div>
                    <Bar value={l.value} max={locMax} color="var(--accent)" />
                    <p className="mt-1 text-xs text-deep-muted">{l.unique} pengunjung unik</p>
                  </li>
                ))}
              </ol>
            </Panel>

            <Panel title="Corak kunjungan">
              <ul className="mt-5 space-y-4">
                {S.venueTypes.map((v) => (
                  <li key={v.label}>
                    <div className="mb-1.5 flex items-baseline justify-between gap-3">
                      <span>{v.label}</span>
                      <span className="font-display font-extrabold">{nf.format(v.value)}</span>
                    </div>
                    <Bar value={v.value} max={venueMax} color="var(--brand-teal)" />
                  </li>
                ))}
              </ul>
              <div className="mt-6 border-t border-deep-line pt-5">
                <p className="flex items-baseline gap-3">
                  <span className="font-display text-4xl font-extrabold leading-none">{S.returning.repeat.value}</span>
                  <span>{S.returning.repeat.label}</span>
                </p>
                <p className="mt-3 text-sm text-deep-muted">
                  {S.returning.multi.value} {S.returning.multi.label}
                </p>
              </div>
            </Panel>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[2fr_1fr]">
            <Panel title="Kunjungan mengikut bulan" sub={S.monthly.note}>
              <ol className="mt-6 flex h-48 items-end justify-between gap-1.5 sm:gap-3">
                {S.monthly.items.map((m) => (
                  <li key={m.label} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end">
                    <span className="mb-1.5 text-sm font-bold">
                      {m.value}
                      {m.partial && <span aria-hidden="true">*</span>}
                    </span>
                    <div aria-hidden="true" className="flex w-full max-w-12 flex-1 items-end">
                      <div
                        className="snap-bar-y w-full rounded-t-lg"
                        style={{ height: pct(m.value, monthMax), background: m.partial ? PARTIAL : 'var(--brand-teal)' }}
                      />
                    </div>
                    <span className="mt-2 text-xs text-deep-muted">
                      {m.label}
                      {m.partial && <span className="sr-only"> (bulan separa)</span>}
                    </span>
                  </li>
                ))}
              </ol>
            </Panel>

            <Panel title="Foto komuniti">
              <ul className="mt-5 space-y-4">
                <li className="flex items-baseline gap-4">
                  <span className="w-16 shrink-0 font-display text-3xl font-extrabold leading-none text-accent">{S.photos.mosque.value}</span>
                  <span>{S.photos.mosque.label}</span>
                </li>
                <li className="flex items-baseline gap-4">
                  <span className="w-16 shrink-0 font-display text-3xl font-extrabold leading-none">{S.photos.surau.value}</span>
                  <span>{S.photos.surau.label}</span>
                </li>
              </ul>
              <p className="mt-5 text-sm text-deep-muted">{S.photos.missing}</p>
            </Panel>
          </div>

          <figcaption className="mt-6 border-t border-deep-line pt-4 text-xs leading-relaxed text-deep-muted">
            {S.source}
          </figcaption>
        </div>
      </Reveal>
    </div>
  )
}
