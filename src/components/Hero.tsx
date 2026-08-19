import PhoneFrame from '@/components/ui/PhoneFrame'
import StoreBadges from '@/components/ui/StoreBadges'
import { Container } from '@/components/ui/Section'

/** Orders a child within a .jm-enter cascade. */
const step = (i: number) => ({ '--i': i }) as React.CSSProperties

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-10 pb-14 sm:pt-16 sm:pb-20">
      {/* A soft teal wash at the top, fading into paper. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(120%_100%_at_50%_0%,var(--color-primary-tint)_0%,transparent_70%)]"
      />

      <Container className="relative">
        {/* Four text elements only: headline, subtext, brand line, CTAs. */}
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          <div className="jm-enter text-center lg:text-left">
            <h1
              style={step(0)}
              className="text-[2.6rem] leading-[1.08] text-foreground sm:text-6xl"
            >
              Remember where
              <br className="hidden sm:block" /> you prayed.
            </h1>

            <p
              style={step(1)}
              className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground lg:mx-0"
            >
              Jejak Masjid helps you find the masjid nearest you, check in when you arrive,
              and keep a private record of the places that have become part of your prayer
              journey.
            </p>

            <p style={step(2)} className="mt-5 font-display text-xl italic text-primary">
              Langkah kecil, jejak yang bermakna.
            </p>

            <StoreBadges
              style={step(3)}
              className="mt-9 justify-center lg:justify-start"
            />
          </div>

          <div className="jm-enter relative mx-auto flex w-full max-w-md justify-center lg:max-w-none">
            <div aria-hidden className="path-rule absolute inset-x-0 top-1/2 hidden lg:block" />
            <div style={step(3)} className="relative flex items-end gap-4 sm:gap-6">
              <PhoneFrame
                src="/screens/02-explore.webp"
                alt="Jejak Masjid map view showing masjids and surau near the user"
                className="jm-lift mb-[-1.5rem] hidden w-40 sm:block sm:w-44"
              />
              <PhoneFrame
                src="/screens/01-today.webp"
                alt="The Jejak Masjid Today screen with an active check-in, prayer times and a visit streak"
                className="jm-lift w-56 sm:w-64"
                priority
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
