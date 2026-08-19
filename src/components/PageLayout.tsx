import type { ReactNode } from 'react'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import { Container } from '@/components/ui/Section'

/** Shell for the long-form pages: privacy, terms and support. */
export default function PageLayout({
  eyebrow,
  title,
  updated,
  intro,
  children,
}: {
  eyebrow?: string
  title: string
  updated?: string
  intro?: ReactNode
  children: ReactNode
}) {
  return (
    <>
      <Header />
      <main>
        <header className="border-b border-border bg-[radial-gradient(110%_100%_at_50%_0%,var(--color-primary-tint)_0%,transparent_70%)] py-16 sm:py-20">
          <Container className="max-w-3xl text-center">
            {eyebrow ? <p className="eyebrow mb-3">{eyebrow}</p> : null}
            <h1 className="text-3xl leading-tight text-foreground sm:text-5xl">{title}</h1>
            {intro ? (
              <p className="mx-auto mt-5 max-w-xl leading-relaxed text-muted-foreground">
                {intro}
              </p>
            ) : null}
            {updated ? (
              <p className="mt-6 text-sm text-subtle-foreground">Last updated: {updated}</p>
            ) : null}
          </Container>
        </header>

        <Container className="max-w-3xl py-14 sm:py-20">
          <article className="prose-jm">{children}</article>
        </Container>
      </main>
      <Footer />
    </>
  )
}
