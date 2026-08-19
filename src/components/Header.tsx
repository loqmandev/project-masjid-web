import { Link } from '@tanstack/react-router'
import { Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Wordmark } from '@/components/ui/Logo'
import { Container } from '@/components/ui/Section'
import { SECTIONS } from '@/lib/site'

export default function Header() {
  const [open, setOpen] = useState(false)
  const [lifted, setLifted] = useState(false)

  useEffect(() => {
    const onScroll = () => setLifted(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-colors duration-300 ${
        lifted
          ? 'border-border bg-background/85 backdrop-blur-md'
          : 'border-transparent bg-transparent'
      }`}
    >
      <Container className="flex h-16 items-center justify-between gap-4 sm:h-18">
        <Link to="/" aria-label="Jejak Masjid home" onClick={() => setOpen(false)}>
          <Wordmark />
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Main">
          {SECTIONS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href="/download"
            className="jm-press hidden rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-strong sm:inline-flex"
          >
            Get the app
          </a>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </Container>

      {open ? (
        <div id="mobile-nav" className="border-t border-border bg-background md:hidden">
          <Container className="flex flex-col py-2">
            {SECTIONS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="border-b border-border/60 py-3.5 text-sm text-muted-foreground last:border-0"
              >
                {item.label}
              </a>
            ))}
            <a
              href="/download"
              className="jm-press mt-3 mb-3 rounded-full bg-primary px-5 py-3 text-center text-sm font-medium text-primary-foreground"
            >
              Get the app
            </a>
          </Container>
        </div>
      ) : null}
    </header>
  )
}
