import PhoneFrame from '@/components/ui/PhoneFrame'
import StoreBadges from '@/components/ui/StoreBadges'
import { Container } from '@/components/ui/Section'

const ASSURANCES = [
  '2,000+ masjids & surau across Malaysia',
  'Free to download',
  'Your visit history stays private',
]

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-10 pb-16 sm:pt-16 sm:pb-24">
      {/* A soft teal wash at the top, fading into paper. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(120%_100%_at_50%_0%,var(--color-primary-tint)_0%,transparent_70%)]"
      />

      <Container className="relative">
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          <div className="jm-rise text-center lg:text-left">
            <p className="eyebrow">A masjid journal, not a scoreboard</p>

            <h1 className="mt-4 text-[2.6rem] leading-[1.08] text-foreground sm:text-6xl">
              Remember where
              <br className="hidden sm:block" /> you prayed.
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground lg:mx-0 mx-auto">
              Jejak Masjid helps you find the masjid nearest you, check in when you arrive,
              and keep a private record of the places that have become part of your prayer
              journey.
            </p>

            <p className="mt-5 font-display text-xl italic text-primary">
              Langkah kecil, jejak yang bermakna.
            </p>

            <StoreBadges className="mt-9 justify-center lg:justify-start" />

            <ul className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-subtle-foreground lg:justify-start">
              {ASSURANCES.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto flex w-full max-w-md justify-center lg:max-w-none">
            <div
              aria-hidden
              className="path-rule absolute inset-x-0 top-1/2 hidden lg:block"
            />
            <div className="relative flex items-end gap-4 sm:gap-6">
              <PhoneFrame
                src="/screens/02-explore.webp"
                alt="Jejak Masjid map view showing masjids and surau near the user"
                className="hidden w-40 translate-y-6 sm:block sm:w-44"
              />
              <PhoneFrame
                src="/screens/01-today.webp"
                alt="The Jejak Masjid Today screen with an active check-in, prayer times and a visit streak"
                className="w-56 sm:w-64"
                priority
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
