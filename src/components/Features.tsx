import PhoneFrame from '@/components/ui/PhoneFrame'
import Reveal from '@/components/ui/Reveal'
import { Container, SectionHeading } from '@/components/ui/Section'

type Feature = {
  id: string
  title: string
  body: string
  points: string[]
  screen: string
  alt: string
}

/** Rows 1 and 2: the alternating split. Two is the cap before the eye tires. */
const SPLIT: Feature[] = [
  {
    id: 'explore',
    title: 'Find the masjid nearest you',
    body:
      'Open the map to see masjids and surau around you, or switch to the list when you only want the closest one. Distance, state and facilities are there before you set off.',
    points: [
      'Masjids and surau across all 13 states and 3 federal territories',
      'Missing a place you know? Add it, and the next visitor finds it',
    ],
    screen: '/screens/02-explore.webp',
    alt: 'Jejak Masjid Explore map showing nearby surau with distances',
  },
  {
    id: 'visit',
    title: 'Check in, stay a while, complete the visit',
    body:
      'Check in when you arrive. Stay at least ten minutes, then complete the visit and it joins your record. Presence is confirmed by where you actually are. Nothing to type, nothing to prove.',
    points: [
      'A gentle bonus when your visit falls inside a prayer window',
      'Prayer times for your JAKIM zone, right on the home screen',
    ],
    screen: '/screens/03-visit-complete.webp',
    alt: 'Visit complete screen showing points earned for a Subuh prayer visit',
  },
]

/** Rows 4 and 5: a paired grid, to break the split rhythm for good. */
const PAIR: Feature[] = [
  {
    id: 'contribute',
    title: 'Leave the place easier for the next person',
    body:
      'Confirm what you saw with your own eyes: parking, a women-friendly prayer area, air conditioning, a water dispenser, wudhu access. Small notes that spare someone else a difficult morning.',
    points: ['Everything shared is reviewed before it reaches other visitors'],
    screen: '/screens/05-facilities.webp',
    alt: 'Update Facilities screen with toggles for parking, prayer and amenities',
  },
  {
    id: 'passport',
    title: 'Look back on how far you have come',
    body:
      'Your passport holds every masjid you have visited, an activity calendar of the days you were present, and milestones marked quietly as the journey grows.',
    points: ['Share a public profile only if and when you want to'],
    screen: '/screens/07-profile.webp',
    alt: 'Explorer passport showing masjids visited and a monthly activity calendar',
  },
]

function Points({ points }: { points: string[] }) {
  return (
    <ul className="mt-6 space-y-3">
      {points.map((point) => (
        <li key={point} className="flex gap-3 text-[0.95rem] text-muted-foreground">
          <span aria-hidden className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
          {point}
        </li>
      ))}
    </ul>
  )
}

function Plinth({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div
        aria-hidden
        className="absolute inset-x-2 inset-y-8 rounded-[3rem] bg-[radial-gradient(70%_55%_at_50%_45%,var(--color-primary-tint)_0%,transparent_72%)]"
      />
      {children}
    </>
  )
}

export default function Features() {
  return (
    <section id="features" className="scroll-mt-24 bg-surface-sunken py-20 sm:py-28">
      <Container>
        <Reveal>
          <SectionHeading
            title="Everything a visit needs, and nothing else"
            lede="Five quiet things, done carefully."
          />
        </Reveal>

        {/* Family 1: alternating split, twice. */}
        <div className="mt-16 flex flex-col gap-16 sm:gap-20">
          {SPLIT.map((feature, index) => {
            const reversed = index % 2 === 1
            return (
              <article
                key={feature.id}
                className="grid items-center gap-10 sm:grid-cols-2 sm:gap-14"
              >
                <Reveal className={reversed ? 'sm:order-2' : ''}>
                  <h3 className="text-2xl leading-snug text-foreground sm:text-3xl">
                    {feature.title}
                  </h3>
                  <p className="mt-4 leading-relaxed text-muted-foreground">{feature.body}</p>
                  <Points points={feature.points} />
                </Reveal>

                <Reveal
                  delay={140}
                  className={`relative flex justify-center ${reversed ? 'sm:order-1' : ''}`}
                >
                  <Plinth>
                    <PhoneFrame
                      src={feature.screen}
                      alt={feature.alt}
                      className="jm-lift relative w-52 sm:w-60"
                    />
                  </Plinth>
                </Reveal>
              </article>
            )
          })}
        </div>

        {/* Family 2: one centred, full-width moment for the social feature. */}
        <article className="mt-20 rounded-3xl border border-border bg-background px-6 py-14 text-center sm:mt-24 sm:px-12">
          <Reveal className="mx-auto max-w-2xl">
            <h3 className="text-2xl leading-snug text-foreground sm:text-3xl">
              Pray together, privately
            </h3>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Build a Prayer Circle with up to ten people you trust. Verified check-ins appear
              in the shared activity, and a short word of encouragement is all anyone needs to
              send. Invitation only, never a public feed, and no rankings inside a Circle.
            </p>
          </Reveal>
          <Reveal delay={140} className="relative mt-12 flex justify-center">
            <Plinth>
              <PhoneFrame
                src="/screens/04-prayer-circle.webp"
                alt="A Prayer Circle group showing verified check-ins and supportive replies"
                className="jm-lift relative w-52 sm:w-60"
              />
            </Plinth>
          </Reveal>
        </article>

        {/* Family 3: a paired grid, screenshot above copy. */}
        <div className="mt-20 grid gap-12 sm:mt-24 sm:grid-cols-2 sm:gap-10">
          {PAIR.map((feature, index) => (
            <Reveal as="article" key={feature.id} delay={index * 120}>
              <div className="relative flex justify-center">
                <Plinth>
                  <PhoneFrame
                    src={feature.screen}
                    alt={feature.alt}
                    className="jm-lift relative w-44 sm:w-48"
                  />
                </Plinth>
              </div>
              <h3 className="mt-8 text-xl leading-snug text-foreground sm:text-2xl">
                {feature.title}
              </h3>
              <p className="mt-3 leading-relaxed text-muted-foreground">{feature.body}</p>
              <Points points={feature.points} />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  )
}
