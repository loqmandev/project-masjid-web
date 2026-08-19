import { LogoMark } from '@/components/ui/Logo'
import StoreBadges from '@/components/ui/StoreBadges'
import Reveal from '@/components/ui/Reveal'
import { Container } from '@/components/ui/Section'

export default function Cta() {
  return (
    <section className="py-20 sm:py-28">
      <Container>
        <Reveal className="relative overflow-hidden rounded-3xl border border-border bg-[radial-gradient(120%_120%_at_50%_0%,var(--color-primary-tint)_0%,var(--color-surface)_65%)] px-6 py-16 text-center sm:px-12">
          <div
            aria-hidden
            className="path-rule absolute inset-x-10 bottom-10 hidden sm:block"
          />
          <LogoMark className="mx-auto h-11 w-auto text-primary" />

          <h2 className="mt-7 text-3xl leading-tight text-foreground sm:text-4xl">
            Singgah sebentar?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-lg leading-relaxed text-muted-foreground">
            Start with the masjid nearest you. The rest of the journey can take as long as it
            takes.
          </p>

          <StoreBadges className="mt-9 justify-center" />

          <p className="mt-8 text-sm text-subtle-foreground">
            Free on iOS and Android · Bahasa Melayu &amp; English
          </p>
        </Reveal>
      </Container>
    </section>
  )
}
