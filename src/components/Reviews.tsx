import { useState } from 'react'
import { Container, SectionHeading } from '@/components/ui/Section'
import Reveal from '@/components/ui/Reveal'
import { REVIEWS } from '@/lib/social-proof'
import { t, type Locale } from '@/lib/i18n'

export default function Reviews({ locale }: { locale: Locale }) {
  const copy = t(locale).reviews
  const [filter, setFilter] = useState('all')
  return <section id="ulasan" className="py-20 sm:py-28"><Container>
    <Reveal><SectionHeading align="left" title={copy.title} lede={copy.intro} /></Reveal>
    <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label={copy.filter}>
      {[['all', copy.all], ['App Store', 'App Store'], ['Google Play', 'Google Play']].map(([value, label]) => <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)} className={`min-h-11 rounded-full border px-5 py-2 text-sm ${filter === value ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-surface text-foreground hover:border-primary'}`}>{label}</button>)}
    </div>
    <div className="mt-7 grid gap-5 md:grid-cols-2">
      {REVIEWS.filter(review => filter === 'all' || review.store === filter).map(review => <figure key={review.name} className="flex flex-col rounded-[20px] border border-border bg-surface p-7 sm:p-8">
        <blockquote lang="en" className="mb-8 text-lg leading-relaxed">“{review.quote}”</blockquote>
        <figcaption className="mt-auto text-sm"><span className="block font-semibold">{review.name}</span><span className="mt-1 block text-xs text-muted-foreground">{review.store} · {review.date}</span><a className="mt-3 inline-block text-xs underline underline-offset-4" href={review.sourceUrl}>{copy.source} {review.store}<span aria-hidden="true"> ↗</span></a></figcaption>
      </figure>)}
    </div>
  </Container></section>
}
