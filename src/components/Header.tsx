import { useDiscoveryAreas } from './DiscoveryAvailability'
import { discoveryHome } from '@/lib/discovery'
import { useLocation } from '@tanstack/react-router'
import { ChevronDown, Menu, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { LogoMark, Wordmark } from '@/components/ui/Logo'
import { Container } from '@/components/ui/Section'
import { PRODUCTS, productHref } from '@/lib/site'
import { localeForPath, t, twinForPath } from '@/lib/i18n'

export default function Header() {
  const path = useLocation({ select: location => location.pathname })
  const search = useLocation({ select: location => location.searchStr })
  const areas = useDiscoveryAreas()
  return <HeaderContent path={path} search={search} discovery={!!areas} />
}

/** Kept separate so keyboard behavior can be tested without a router harness. */
export function HeaderContent({ path, discovery = false, search = '' }: { path: string; discovery?: boolean; search?: string }) {
  const locale = localeForPath(path)
  const copy = t(locale)
  const twin = twinForPath(path + search)
  const home = locale === 'ms' ? '/' : '/en'
  const anchor = path === home ? '' : home
  const links = [
    ...(discovery ? [{ href: discoveryHome(locale), label: copy.discovery.nav }] : []),
    { href: `${anchor}#ciri`, label: copy.nav.features },
    { href: `${anchor}#ulasan`, label: copy.nav.reviews },
    { href: `${anchor}#faq`, label: copy.nav.faq },
    { href: locale === 'ms' ? '/kolaborasi' : '/en/collaboration', label: copy.nav.collaborate },
  ]
  const [open, setOpen] = useState(false)
  const header = useRef<HTMLElement>(null)
  const products = useRef<HTMLDetailsElement>(null)
  const menuButton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const close = (event: KeyboardEvent | MouseEvent) => {
      if (event instanceof KeyboardEvent && event.key !== 'Escape') return
      if (event instanceof MouseEvent && header.current?.contains(event.target as Node)) {
        if (!products.current?.contains(event.target as Node) && products.current) products.current.open = false
        return
      }
      if (event instanceof KeyboardEvent) {
        if (products.current?.open) products.current.querySelector('summary')?.focus()
        else if (open) menuButton.current?.focus()
      }
      if (products.current) products.current.open = false
      setOpen(false)
    }
    const wide = matchMedia('(min-width: 1024px)')
    const resize = () => setOpen(false)
    document.addEventListener('keydown', close)
    document.addEventListener('click', close)
    wide.addEventListener('change', resize)
    return () => {
      document.removeEventListener('keydown', close)
      document.removeEventListener('click', close)
      wide.removeEventListener('change', resize)
    }
  }, [open])

  useEffect(() => {
    setOpen(false)
    if (products.current) products.current.open = false
  }, [path])

  return (
    <header ref={header} className="site-header sticky top-0 z-50 border-b border-border bg-background">
      {twin ? <a href="#main-content" className="skip-link">{copy.nav.skip}</a> : null}
      <Container className="header-bar flex h-16 items-center gap-3 sm:h-24">
        <a href={home} aria-label={copy.nav.home} className="mr-auto shrink-0">
          <LogoMark className="h-10 w-10 sm:hidden" />
          <Wordmark className="hidden sm:block" />
        </a>
        <nav className="header-navigation flex items-center gap-4 xl:gap-6" aria-label={copy.nav.main}>
          <details ref={products} className="product-nav">
            <summary className="flex min-h-11 cursor-pointer list-none items-center gap-1 text-sm">
              {copy.nav.products}<ChevronDown className="size-3.5" aria-hidden="true" />
            </summary>
            <div className="product-list">
              {PRODUCTS.map(product => (
                <a key={product.id} href={productHref(product, locale)} onClick={() => { if (products.current) products.current.open = false }}>
                  <span className="font-display font-extrabold">{copy.products[product.id].name}{product.external ? <><span aria-hidden="true"> ↗</span><span className="sr-only"> ({copy.nav.external}: {new URL(product.href).hostname})</span></> : null}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{copy.products[product.id].status}</span>
                </a>
              ))}
            </div>
          </details>
          {links.map(link => <a key={link.href} className="hidden min-h-11 items-center text-sm hover:underline lg:inline-flex" href={link.href}>{link.label}</a>)}
        </nav>
        {twin ? <a className="header-language hidden min-h-11 items-center whitespace-nowrap text-xs hover:underline lg:inline-flex" lang={locale === 'ms' ? 'en' : 'ms'} href={twin}>{copy.nav.language}</a> : null}
        <a href="/download" className="header-download jm-press inline-flex min-h-11 shrink-0 items-center rounded-full bg-primary px-4 py-2.5 font-display text-sm font-extrabold text-primary-foreground hover:bg-primary-strong sm:px-5">{copy.nav.download}</a>
        <button ref={menuButton} type="button" className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-border lg:hidden" aria-expanded={open} aria-controls="mobile-nav" aria-label={open ? copy.nav.close : copy.nav.open} onClick={() => { setOpen(!open); if (products.current) products.current.open = false }}>
          {open ? <X className="size-4" aria-hidden="true" /> : <Menu className="size-4" aria-hidden="true" />}
        </button>
      </Container>
      <nav id="mobile-nav" hidden={!open} aria-label={copy.nav.mobile} className="mobile-navigation border-t border-border bg-background lg:hidden">
        <Container className="flex flex-col py-3">
          {links.map(link => <a key={link.href} href={link.href} className="py-3 text-sm" onClick={() => setOpen(false)}>{link.label}</a>)}
          {twin ? <a href={twin} lang={locale === 'ms' ? 'en' : 'ms'} className="py-3 text-sm">{copy.nav.language}</a> : null}
        </Container>
      </nav>
    </header>
  )
}
