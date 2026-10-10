import { Link } from '@tanstack/react-router'
import { Wordmark } from '@/components/ui/Logo'
import { Container } from '@/components/ui/Section'
import {
  APP_STORE_URL,
  GOOGLE_GROUP_URL,
  PLAY_STORE_URL,
  SECTIONS,
  SITE,
} from '@/lib/site'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="on-deep bg-deep py-14">
      <Container>
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Wordmark tone="dark" />
            <p className="mt-4 max-w-sm leading-relaxed text-deep-muted">
              A quiet record of your visits to the masjid, so you can remember where you have
              been and choose where to go next.
            </p>
            <span aria-hidden className="mt-6 block h-1 w-12 rounded-full bg-accent" />
            <p className="mt-3 font-display text-lg font-bold text-deep-foreground">
              Terima kasih kerana hadir.
            </p>
          </div>

          <nav aria-label="Explore the site">
            <h2 className="eyebrow mb-4">On this site</h2>
            <ul className="space-y-2.5 text-[0.95rem] text-deep-muted">
              {SECTIONS.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className="transition-colors hover:text-deep-foreground">
                    {item.label}
                  </a>
                </li>
              ))}
              <li>
                <Link to="/support" className="transition-colors hover:text-deep-foreground">
                  Support
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <h2 className="eyebrow mb-4">Get the app</h2>
            <ul className="space-y-2.5 text-[0.95rem] text-deep-muted">
              <li>
                <a
                  href={APP_STORE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors hover:text-deep-foreground"
                >
                  App Store
                </a>
              </li>
              <li>
                <a
                  href={PLAY_STORE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors hover:text-deep-foreground"
                >
                  Google Play
                </a>
              </li>
              <li>
                <a
                  href={GOOGLE_GROUP_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors hover:text-deep-foreground"
                >
                  Android testers group
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${SITE.email}`}
                  className="transition-colors hover:text-deep-foreground"
                >
                  {SITE.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="path-rule my-10" />

        <div className="flex flex-col gap-6 text-sm text-deep-muted lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1 leading-relaxed">
            <p>
              © {year} {SITE.name}. Built by{' '}
              {SITE.legalName}.
            </p>
            <p>SSM: {SITE.registrationNumber}</p>
            <p>Developer: Loqman Al Hakim Aripin</p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link to="/privacy" className="transition-colors hover:text-deep-foreground">
              Privacy Policy
            </Link>
            <Link to="/tos" className="transition-colors hover:text-deep-foreground">
              Terms of Service
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  )
}
