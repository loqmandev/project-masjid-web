import appLogo from '@/logo.svg'
import { useEffect, useState } from 'react'

const Hero = () => {
  const slides = [
    { id: 'mock-1', label: 'App screenshot 1', src: '/1.png' },
    { id: 'mock-2', label: 'App screenshot 2', src: '/2.png' },
    { id: 'mock-3', label: 'App screenshot 3', src: '/3.png' },
  ]
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length)
    }, 3500)

    return () => window.clearInterval(intervalId)
  }, [slides.length])

  return (
    <section className="min-h-[100svh] bg-[linear-gradient(180deg,_rgba(0,169,165,0.12)_0%,_var(--color-background)_55%,_rgba(255,204,0,0.12)_100%)] py-14 sm:py-16">
      <div className="mx-auto flex min-h-[100svh] max-w-240 items-center px-4 sm:px-6">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
          <div className="text-center lg:text-left">
            <img
              src={appLogo}
              alt="Jejak Masjid logo"
              className="mx-auto mb-6 h-14 w-14 sm:h-16 sm:w-16 lg:mx-0 lg:h-20 lg:w-20"
            />
            <h1 className="mb-4 text-4xl font-bold leading-[1.15] text-foreground sm:text-5xl lg:text-6xl">
              A blessed journey begins with a single step.
            </h1>
            <p className="mb-8 text-base text-secondary-foreground sm:text-[1.1rem] lg:text-[1.2rem]">
              Jejak Masjid is your personal journey companion to record and cherish every visit to a mosque. It's not about competition, but about sincerity in every step.
            </p>
            <a
              href="#waitlist"
              className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-6 py-[0.85rem] font-medium text-primary-foreground no-underline shadow-[0_12px_24px_rgba(0,169,165,0.25)] transition-all duration-300 hover:bg-primary/90 hover:shadow-[0_16px_28px_rgba(0,169,165,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-auto"
            >
              Join Waitlist
            </a>
          </div>
          <div className="flex justify-center lg:justify-end">
            <div className="relative w-full max-w-72 rounded-[2.25rem] border border-border bg-card/70 p-5 shadow-[0_30px_60px_rgba(0,79,77,0.15)] backdrop-blur sm:max-w-80 sm:p-6">
              <div className="mb-6 h-3 w-16 rounded-full bg-muted" />
              <div className="relative aspect-[9/19.5] w-full overflow-hidden rounded-[1.75rem] border border-border bg-[linear-gradient(160deg,_rgba(0,169,165,0.08),_rgba(255,204,0,0.12))] p-0">
                {slides.map((slide, index) => (
                  <div
                    key={slide.id}
                    className={`absolute inset-0 rounded-[1.6rem] bg-background/80 transition-opacity duration-700 ${
                      index === activeIndex ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    <img
                      src={slide.src}
                      alt={slide.label}
                      className="h-full w-full rounded-[1.25rem] object-cover"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
                <span>Jejak Masjid</span>
                <span>Coming soon</span>
              </div>
              <div className="mt-4 flex items-center justify-center gap-3">
                {slides.map((slide, index) => (
                  <button
                    key={`${slide.id}-dot`}
                    type="button"
                    aria-label={`Go to ${slide.label}`}
                    onClick={() => setActiveIndex(index)}
                    className={`h-3.5 w-3.5 rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background hover:scale-110 ${
                      index === activeIndex
                        ? 'bg-primary shadow-[0_0_0_6px_rgba(0,169,165,0.15)]'
                        : 'bg-border hover:bg-primary/40'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
