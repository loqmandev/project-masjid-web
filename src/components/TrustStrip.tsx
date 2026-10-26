import { Container } from '@/components/ui/Section'
import { MEDIA, STORE_RATINGS } from '@/lib/social-proof'
import { t, type Locale } from '@/lib/i18n'

export default function TrustStrip({ locale }: { locale: Locale }) {
  const copy = t(locale).trust
  return <aside className="trust-strip border-y border-border bg-background" aria-label={copy.label}>
    <Container className="flex flex-wrap items-center gap-x-10 gap-y-4 py-6">
      {STORE_RATINGS.map(rating => <div key={rating.store} className="text-xs leading-6">
        <a href={rating.sourceUrl} className="hover:underline"><strong className="font-display text-lg">{rating.score} <span aria-hidden="true">★</span></strong> · {rating.count} {copy[rating.unit]}<br />{rating.store} ({rating.locale})</a>
        <p className="text-[11px] text-muted-foreground">{copy.checked} <time dateTime={rating.fetchedAt}>{rating.fetchedAt}</time></p>
      </div>)}
      <div className="text-xs leading-6 text-muted-foreground sm:ml-auto"><p>{copy.featured}</p><div className="flex flex-wrap gap-x-5">{MEDIA.map(item => <a key={item.publisher} href={item.sourceUrl} className="font-semibold text-foreground underline underline-offset-4">{item.publisher}</a>)}</div></div>
    </Container>
  </aside>
}
