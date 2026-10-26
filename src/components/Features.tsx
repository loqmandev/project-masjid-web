import { ShieldCheck } from 'lucide-react'
import PhoneFrame from '@/components/ui/PhoneFrame'
import Reveal from '@/components/ui/Reveal'
import { Container, SectionHeading } from '@/components/ui/Section'
import { t, type Locale } from '@/lib/i18n'

const screenshots = ['02-explore', '03-visit-complete', '01-today', '04-prayer-circle', '06-achievements'] as const

export default function Features({ locale = 'ms' }: { locale?: Locale }) {
  const copy = t(locale).features
  return <section id="ciri" className="bg-surface-sunken py-20 sm:py-28">
    <Container>
      <Reveal><SectionHeading align="left" title={copy.title} lede={copy.intro} /></Reveal>
      <div className="feature-bento mt-10">
        {copy.tiles.map((tile, index) => <Reveal key={screenshots[index]} className={`feature-tile feature-tile-${index}`}>
          <div className="feature-tile-copy"><h3 className="text-2xl leading-tight">{tile.title}</h3><p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">{tile.body}</p></div>
          <div className="feature-screen" aria-hidden="true"><PhoneFrame src={`/screens/${screenshots[index]}.webp`} alt={tile.alt} /></div>
        </Reveal>)}
      </div>
      <p className="mt-8 flex max-w-3xl items-start gap-3 text-sm leading-relaxed text-muted-foreground"><ShieldCheck className="mt-1 size-5 shrink-0" aria-hidden="true" />{copy.privacy}</p>
    </Container>
  </section>
}
