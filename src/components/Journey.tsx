import Reveal from '@/components/ui/Reveal'
import { Container, SectionHeading } from '@/components/ui/Section'

const PRINCIPLES = [
  {
    term: 'Ikhlas',
    title: 'Sincerity, not streak panic',
    body:
      'No shaming, no guilt, no red warnings when a day passes. If you miss one, nothing is lost. The path is still there tomorrow.',
  },
  {
    term: 'Hadir',
    title: 'Presence over performance',
    body:
      'A short visit still counts. What matters is that you singgah at all, not how long you stayed or how many places you reached.',
  },
  {
    term: 'Peribadi',
    title: 'A journey that stays yours',
    body:
      'Your visit history is private by default. Rankings exist, but quietly: you can take part anonymously, or not at all.',
  },
]

export default function Journey() {
  return (
    <section id="journey" className="scroll-mt-24 py-20 sm:py-28">
      <Container>
        <Reveal>
          <SectionHeading
            title="Built to encourage, never to pressure"
            lede="Jejak Masjid is not a productivity tracker and not a social feed. It is a
              quiet record of intention, kept the way a journal is kept."
          />
        </Reveal>

        <Reveal className="relative mt-16 grid gap-10 sm:grid-cols-3 sm:gap-8">
          <div
            aria-hidden
            className="path-rule absolute inset-x-8 top-3 hidden sm:block"
          />
          {PRINCIPLES.map((item, index) => (
            <Reveal key={item.term} delay={index * 110} className="relative">
              <span
                aria-hidden
                className="mb-6 hidden h-6 w-6 items-center justify-center rounded-full border border-border-strong bg-background sm:flex"
              >
                <span className="h-2 w-2 rounded-full bg-primary" />
              </span>
              <h3 className="font-display text-2xl text-foreground">{item.term}</h3>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                <span className="text-foreground">{item.title}.</span> {item.body}
              </p>
            </Reveal>
          ))}
        </Reveal>
      </Container>
    </section>
  )
}
