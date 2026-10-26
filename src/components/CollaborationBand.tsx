import { Container } from './ui/Section'
import CollaborationContact from './CollaborationContact'
import { t, type Locale } from '@/lib/i18n'

export default function CollaborationBand({ locale }: { locale: Locale }) {
  const copy = t(locale).collaboration
  return <section id="kolaborasi" aria-labelledby="collaboration-heading" className="on-deep bg-deep py-20 text-deep-foreground sm:py-28">
    <Container>
      <div className="max-w-2xl">
        <h2 id="collaboration-heading" className="text-3xl leading-tight sm:text-4xl">{copy.bandTitle}</h2>
        <p className="mt-5 text-lg leading-relaxed text-deep-foreground/80">{copy.intro}</p>
        <CollaborationContact locale={locale} onDeep />
      </div>
      <div className="mt-9 grid gap-5 md:grid-cols-3">
        {copy.cards.map(card => <article key={card.title} className="rounded-[20px] bg-surface p-7 text-foreground">
          <h3 className="text-xl">{card.title}</h3>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{card.body}</p>
        </article>)}
      </div>
    </Container>
  </section>
}
