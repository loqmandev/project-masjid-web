import StoreBadges from '@/components/ui/StoreBadges'
import Reveal from '@/components/ui/Reveal'
import { Container } from '@/components/ui/Section'
import { t, type Locale } from '@/lib/i18n'

export default function Cta({ locale = 'ms' }: { locale?: Locale }) {
  const copy = t(locale).cta
  return <section className="pb-20 sm:pb-28"><Container>
    <Reveal className="on-deep rounded-[20px] bg-deep px-6 py-16 text-center sm:px-12">
      <h2 className="text-3xl text-deep-foreground sm:text-4xl">{copy.title}</h2>
      <p className="mt-4 leading-relaxed text-deep-muted">{copy.line}</p>
      <StoreBadges locale={locale} className="mt-8 justify-center" />
    </Reveal>
  </Container></section>
}
