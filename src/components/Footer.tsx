import { useLocation } from '@tanstack/react-router'
import { Wordmark } from '@/components/ui/Logo'
import { Container } from '@/components/ui/Section'
import { APP_STORE_URL, PLAY_STORE_URL, PRODUCTS, productHref, SITE } from '@/lib/site'
import { localeForPath, t } from '@/lib/i18n'

export default function Footer() {
  const path = useLocation({ select: location => location.pathname })
  const locale = localeForPath(path)
  const copy = t(locale)
  return (
    <footer className="on-deep bg-deep py-14">
      <Container>
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_.8fr_1fr]">
          <div>
            <Wordmark tone="dark" className="block" />
            <p className="mt-5 max-w-sm leading-relaxed text-deep-muted">{copy.footer.note}</p>
            <p className="mt-6 font-display text-lg font-bold text-deep-foreground">{copy.footer.thanks}</p>
          </div>
          <nav aria-label={copy.footer.products}>
            <h2 className="mb-4 text-lg text-deep-foreground">{copy.footer.products}</h2>
            <ul className="space-y-3 text-sm text-deep-muted">
              {PRODUCTS.map(product => <li key={product.id}><a className="hover:text-deep-foreground" href={productHref(product, locale)}>{copy.products[product.id].name}{product.external ? <><span aria-hidden="true"> ↗</span><span className="sr-only"> ({copy.nav.external}: {new URL(product.href).hostname})</span></> : null}</a></li>)}
            </ul>
          </nav>
          <nav aria-label={copy.footer.app}>
            <h2 className="mb-4 text-lg text-deep-foreground">{copy.footer.app}</h2>
            <ul className="space-y-3 text-sm text-deep-muted">
              <li><a href={APP_STORE_URL} className="hover:text-deep-foreground">App Store</a></li>
              <li><a href={PLAY_STORE_URL} className="hover:text-deep-foreground">Google Play</a></li>
              <li><a href="/download" className="hover:text-deep-foreground">{copy.nav.download}</a></li>
            </ul>
          </nav>
          <nav aria-label={copy.footer.company}>
            <h2 className="mb-4 text-lg text-deep-foreground">{copy.footer.company}</h2>
            <ul className="space-y-3 text-sm text-deep-muted">
              <li><a href="/support">Support</a></li><li><a href="/privacy">Privacy Policy</a></li><li><a href="/tos">Terms of Service</a></li>
              <li><a className="break-words" href={`mailto:${SITE.email}`}>{SITE.email}</a></li>
            </ul>
          </nav>
        </div>
        <div className="path-rule my-10" />
        <div className="space-y-2 text-sm leading-relaxed text-deep-muted">
          <p>© {new Date().getFullYear()} {SITE.name}. {copy.footer.built} {SITE.legalName}.</p>
          <p>SSM: {SITE.registrationNumber}</p>
          <p>Developer: Loqman Al Hakim Aripin</p>
        </div>
      </Container>
    </footer>
  )
}
