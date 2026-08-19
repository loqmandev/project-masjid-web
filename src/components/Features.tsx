import { BadgeCheck, CalendarDays, MapPin, Sparkles, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import PhoneFrame from '@/components/ui/PhoneFrame'
import { Container, SectionHeading } from '@/components/ui/Section'

type Feature = {
  id: string
  icon: LucideIcon
  eyebrow: string
  title: string
  body: string
  points: string[]
  screen: string
  alt: string
}

const FEATURES: Feature[] = [
  {
    id: 'explore',
    icon: MapPin,
    eyebrow: 'Explore',
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
    icon: BadgeCheck,
    eyebrow: 'Ziarah',
    title: 'Check in, stay a while, complete the visit',
    body:
      'Check in when you arrive. Stay at least ten minutes, then complete the visit and it joins your record. Presence is confirmed by where you actually are — nothing to type, nothing to prove.',
    points: [
      'A gentle bonus when your visit falls inside a prayer window',
      'Prayer times for your JAKIM zone, right on the home screen',
    ],
    screen: '/screens/03-visit-complete.webp',
    alt: 'Visit complete screen showing points earned for a Subuh prayer visit',
  },
  {
    id: 'circle',
    icon: Users,
    eyebrow: 'Bersama',
    title: 'Pray together, privately',
    body:
      'Build a Prayer Circle with up to ten people you trust. Verified check-ins appear in the shared activity, and a short word of encouragement is all anyone needs to send.',
    points: [
      'Private by invitation — never a public feed',
      'Encouragement, not comparison: no rankings inside a Circle',
    ],
    screen: '/screens/04-prayer-circle.webp',
    alt: 'A Prayer Circle group showing verified check-ins and supportive replies',
  },
  {
    id: 'contribute',
    icon: Sparkles,
    eyebrow: 'Amanah',
    title: 'Leave the place easier for the next person',
    body:
      'Confirm what you saw with your own eyes: parking, a women-friendly prayer area, air conditioning, a water dispenser, wudhu access. Small notes that spare someone else a difficult morning.',
    points: [
      'Add photos and correct information that has gone out of date',
      'Everything shared is reviewed before it reaches other visitors',
    ],
    screen: '/screens/05-facilities.webp',
    alt: 'Update Facilities screen with toggles for parking, prayer and amenities',
  },
  {
    id: 'passport',
    icon: CalendarDays,
    eyebrow: 'Jejak',
    title: 'Look back on how far you have come',
    body:
      'Your passport holds every masjid you have visited, an activity calendar of the days you were present, and milestones marked quietly as the journey grows.',
    points: [
      'A private record you can return to, month by month',
      'Share a public profile only if and when you want to',
    ],
    screen: '/screens/07-profile.webp',
    alt: 'Explorer passport showing masjids visited and a monthly activity calendar',
  },
]

export default function Features() {
  return (
    <section id="features" className="scroll-mt-24 bg-surface-sunken py-20 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="What it does"
          title="Everything a visit needs — and nothing else"
          lede="Five quiet things, done carefully."
        />

        <div className="mt-16 flex flex-col gap-16 sm:gap-20">
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon
            const reversed = index % 2 === 1

            return (
              <article
                key={feature.id}
                className="grid items-center gap-10 sm:grid-cols-2 sm:gap-14"
              >
                <div className={reversed ? 'sm:order-2' : ''}>
                  <span className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary-tint text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <p className="eyebrow mb-2">{feature.eyebrow}</p>
                  <h3 className="text-2xl leading-snug text-foreground sm:text-3xl">
                    {feature.title}
                  </h3>
                  <p className="mt-4 leading-relaxed text-muted-foreground">{feature.body}</p>
                  <ul className="mt-6 space-y-3">
                    {feature.points.map((point) => (
                      <li key={point} className="flex gap-3 text-[0.95rem] text-muted-foreground">
                        <span
                          aria-hidden
                          className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                        />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>

                <div
                  className={`relative flex justify-center ${reversed ? 'sm:order-1' : ''}`}
                >
                  <div
                    aria-hidden
                    className="absolute inset-x-2 inset-y-8 rounded-[3rem] bg-[radial-gradient(70%_55%_at_50%_45%,var(--color-primary-tint)_0%,transparent_72%)]"
                  />
                  <PhoneFrame
                    src={feature.screen}
                    alt={feature.alt}
                    className="relative w-52 sm:w-60"
                  />
                </div>
              </article>
            )
          })}
        </div>
      </Container>
    </section>
  )
}
