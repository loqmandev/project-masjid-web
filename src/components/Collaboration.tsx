import Header from './Header'
import Footer from './Footer'
import { Container } from './ui/Section'
import { COLLABORATION_ALTERNATES, t, type Locale } from '@/lib/i18n'
import { seo } from '@/lib/seo'
import CollaborationContact from './CollaborationContact'

export function collaborationHead(locale: Locale) {
  const { title, description } = t(locale).collaboration
  return seo({ title, description, path: COLLABORATION_ALTERNATES[locale], alternates: COLLABORATION_ALTERNATES })
}

export default function Collaboration({ locale }: { locale: Locale }) {
  const copy = t(locale).collaboration
  return <><Header /><main id="main-content">
    <Container className="py-16 sm:py-24"><div className="max-w-2xl"><h1 className="text-4xl leading-tight sm:text-5xl">{copy.title}</h1><p className="mt-6 text-lg leading-relaxed text-muted-foreground">{copy.intro}</p></div>
      <CollaborationContact locale={locale} />
      <div className="mt-10 grid gap-6 md:grid-cols-3">{copy.cards.map(card => <article key={card.title} className="rounded-[20px] border border-border bg-surface p-7 sm:p-9"><h2 className="text-2xl">{card.title}</h2><p className="mt-4 leading-relaxed text-muted-foreground">{card.body}</p></article>)}</div>
    </Container>
  </main><Footer /></>
}
