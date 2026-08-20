import Reveal from '@/components/ui/Reveal'
import { Container } from '@/components/ui/Section'

/**
 * The trust strip that used to sit inside the hero. It belongs directly below
 * it, so the hero stays a single moment: message plus one way to act on it.
 */
const ASSURANCES = [
  { stat: '8,000+', label: 'masjids and surau, across all 13 states and 3 federal territories' },
  { stat: 'Free', label: 'to download and to use, on both iOS and Android' },
  { stat: 'Private', label: 'visit history by default, visible only to you' },
]

export default function Assurances() {
  return (
    <section className="border-y border-border bg-surface-sunken py-10">
      <Container>
        <Reveal className="grid gap-8 sm:grid-cols-3 sm:gap-10">
          {ASSURANCES.map((item) => (
            <div key={item.stat} className="flex gap-4">
              <span aria-hidden className="mt-2 h-px w-8 shrink-0 bg-accent" />
              <p className="text-[0.95rem] leading-relaxed text-muted-foreground">
                <span className="font-display text-lg text-foreground">{item.stat}</span>{' '}
                {item.label}
              </p>
            </div>
          ))}
        </Reveal>
      </Container>
    </section>
  )
}
