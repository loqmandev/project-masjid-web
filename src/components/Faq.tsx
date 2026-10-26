import { Plus } from 'lucide-react'
import Reveal from '@/components/ui/Reveal'
import { Container, SectionHeading } from '@/components/ui/Section'
import { SITE } from '@/lib/site'
import { t, type Locale } from '@/lib/i18n'

export default function Faq({ locale = 'ms' }: { locale?: Locale }) {
  const copy = t(locale).faq
  return <section id="faq" className="py-20 sm:py-28"><Container>
    <Reveal><SectionHeading title={copy.title} /></Reveal>
    <Reveal className="mx-auto mt-12 max-w-3xl divide-y divide-border border-y border-border">
      {copy.items.map(item => <details key={item.q} className="group py-5">
        <summary className="flex min-h-11 cursor-pointer list-none items-start justify-between gap-6 text-left font-display text-lg font-bold marker:content-none">{item.q}<Plus aria-hidden="true" className="mt-1 size-4 shrink-0 transition-transform group-open:rotate-45" /></summary>
        <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">{item.a}</p>
      </details>)}
    </Reveal>
    <p className="mt-9 text-center text-sm leading-7 text-muted-foreground">{copy.help} <a className="underline underline-offset-4" href={`mailto:${SITE.email}`}>{SITE.email}</a> · <a className="underline underline-offset-4" href="/support">{copy.support}</a></p>
  </Container></section>
}
