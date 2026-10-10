import { LogoMark } from '@/components/ui/Logo'
import StoreBadges from '@/components/ui/StoreBadges'
import Reveal from '@/components/ui/Reveal'
import { Container } from '@/components/ui/Section'

export default function Cta() {
  return (
    <section className="py-20 sm:py-28">
      <Container>
        <Reveal className="relative overflow-hidden on-deep rounded-[20px] bg-deep px-6 py-16 text-center sm:px-12">
          <div
            aria-hidden
            className="path-rule absolute inset-x-10 bottom-10 hidden sm:block"
          />
          <LogoMark tone="dark" className="mx-auto h-16 w-16" />

          <h2 className="mt-7 text-3xl leading-tight text-deep-foreground sm:text-4xl">
            Singgah sebentar?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-lg leading-relaxed text-deep-muted">
            Start with the masjid nearest you. The rest of the journey can take as long as it
            takes.
          </p>

          <StoreBadges className="mt-9 justify-center" />

          <p className="mt-8 text-sm text-deep-muted">
            Free on iOS and Android · Bahasa Melayu &amp; English
          </p>
        </Reveal>
      </Container>
    </section>
  )
}
