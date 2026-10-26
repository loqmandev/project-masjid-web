import { Container } from '@/components/ui/Section'
import { MEDIA } from '@/lib/social-proof'
import { t, type Locale } from '@/lib/i18n'

export default function Media({ locale }: { locale: Locale }) {
  const copy = t(locale).media
  return <section className="pb-20 sm:pb-28"><Container>
    <h2 className="mb-8 text-2xl">{copy.title}</h2>
    <div className="grid gap-8 md:grid-cols-2">{MEDIA.map(item => <article key={item.publisher} className="border-l-2 border-brand-teal pl-6">
      <p className="text-xs font-semibold">{item.publisher}</p><h3 lang="ms" className="mt-3 text-xl leading-snug"><a href={item.sourceUrl} className="hover:underline">{item.headline}</a></h3>
      <p className="mt-4 text-xs text-muted-foreground">{item.author} · {item.date}</p><a href={item.sourceUrl} className="mt-4 inline-block text-sm underline underline-offset-4">{copy.source}<span aria-hidden="true"> ↗</span></a>
    </article>)}</div>
  </Container></section>
}
