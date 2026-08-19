import { Plus } from 'lucide-react'
import { Container, SectionHeading } from '@/components/ui/Section'
import { SITE } from '@/lib/site'
import { FAQ } from '@/lib/faq'

export default function Faq() {
  return (
    <section id="faq" className="scroll-mt-24 bg-surface-sunken py-20 sm:py-28">
      <Container>
        <SectionHeading eyebrow="Questions" title="Things people ask" />

        <div className="mx-auto mt-14 max-w-3xl divide-y divide-border border-y border-border">
          {FAQ.map((item) => (
            <details key={item.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-left text-lg text-foreground marker:content-none">
                {item.q}
                <Plus
                  aria-hidden
                  className="mt-1 h-4 w-4 shrink-0 text-primary transition-transform duration-200 group-open:rotate-45"
                />
              </summary>
              <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-subtle-foreground">
          Still stuck?{' '}
          <a
            href={`mailto:${SITE.email}`}
            className="text-primary underline underline-offset-4"
          >
            {SITE.email}
          </a>{' '}
          — or read the{' '}
          <a href="/support" className="text-primary underline underline-offset-4">
            full support page
          </a>
          .
        </p>
      </Container>
    </section>
  )
}
