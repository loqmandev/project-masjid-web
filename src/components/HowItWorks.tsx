import Reveal from '@/components/ui/Reveal'
import { Container, SectionHeading } from '@/components/ui/Section'

const STEPS = [
  {
    n: '01',
    title: 'See what is near',
    body: 'Open the app and the masjids and surau around you appear, closest first.',
  },
  {
    n: '02',
    title: 'Check in when you arrive',
    body:
      'Tap check in once you are at the masjid. Your location confirms it, so you never have to explain yourself.',
  },
  {
    n: '03',
    title: 'Stay, then complete the visit',
    body:
      'After ten minutes you can complete the visit. It joins your private record, and any prayer-time bonus is added quietly.',
  },
  {
    n: '04',
    title: 'Leave something useful behind',
    body:
      'If you noticed something worth knowing, like parking, a wudhu area or a photo, share it for whoever comes next.',
  },
]

export default function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-24 py-20 sm:py-28">
      <Container>
        <Reveal>
          <SectionHeading
            title="Four steps, and none of them are loud"
          />
        </Reveal>

        <ol className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <Reveal as="li" key={step.n} delay={index * 90} className="bg-background p-7">
              <span className="font-display text-2xl text-accent">{step.n}</span>
              <h3 className="mt-4 text-lg text-foreground">{step.title}</h3>
              <p className="mt-2.5 text-[0.95rem] leading-relaxed text-muted-foreground">
                {step.body}
              </p>
            </Reveal>
          ))}
        </ol>

        <Reveal as="p" className="mx-auto mt-10 max-w-2xl text-center text-sm text-subtle-foreground">
          Precise location is required for check-in, so a visit can be confirmed rather than
          claimed. It is used at that moment only. Jejak Masjid does not track you in the
          background.
        </Reveal>
      </Container>
    </section>
  )
}
