import { ArrowUpRight, Handshake, ShoppingBag, Store } from 'lucide-react'
import { Container, SectionHeading } from '@/components/ui/Section'
import Reveal from '@/components/ui/Reveal'
import { PRODUCTS, productHref } from '@/lib/site'
import { t, type Locale } from '@/lib/i18n'

const icons = { shop: ShoppingBag, merchant: Store, collaboration: Handshake }
export default function Ecosystem({ locale }: { locale: Locale }) {
  const copy = t(locale)
  return <section className="border-y border-border bg-surface-sunken py-20 sm:py-28"><Container>
    <Reveal><SectionHeading align="left" title={copy.ecosystem.title} lede={copy.ecosystem.intro} /></Reveal>
    <div className="mt-10 grid gap-x-12 gap-y-8 md:grid-cols-3">
      {PRODUCTS.filter(product => product.id !== 'app').map(product => {
        const Icon = icons[product.id as keyof typeof icons]
        const item = copy.products[product.id]
        return <article key={product.id} className="border-t border-border-strong pt-7">
          <Icon className="mb-5 size-7" strokeWidth={1.5} aria-hidden="true" />
          <h3 className="text-2xl">{item.name}</h3><p className="mt-2 text-xs font-semibold">{item.status}</p><p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">{item.description}</p>
          <a className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline underline-offset-4" href={productHref(product, locale)}>{copy.ecosystem.more} <ArrowUpRight className="size-4" aria-hidden="true" />{product.external ? <span className="sr-only">({copy.nav.external}: {new URL(product.href).hostname})</span> : null}</a>
        </article>
      })}
    </div>
  </Container></section>
}
