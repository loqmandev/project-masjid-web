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
    <footer className="border-t border-border bg-surface-sunken py-14">
      <Container>
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Wordmark />
            <p className="mt-4 max-w-sm leading-relaxed text-muted-foreground">
              A quiet record of your visits to the masjid, so you can remember where you have
              been and choose where to go next.
            </p>
            <p className="mt-4 font-display text-lg italic text-primary">
              Terima kasih kerana hadir.
            </p>
          </div>

          <nav aria-label="Explore the site">
            <h2 className="eyebrow mb-4">On this site</h2>
            <ul className="space-y-2.5 text-[0.95rem] text-muted-foreground">
              {SECTIONS.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className="transition-colors hover:text-foreground">
                    {item.label}
                  </a>
                </li>
              ))}
              <li>
                <Link to="/support" className="transition-colors hover:text-foreground">
                  Support
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <h2 className="eyebrow mb-4">Get the app</h2>
            <ul className="space-y-2.5 text-[0.95rem] text-muted-foreground">
              <li>
                <a
                  href={APP_STORE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors hover:text-foreground"
                >
                  App Store
                </a>
              </li>
              <li>
                <a
                  href={PLAY_STORE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors hover:text-foreground"
                >
                  Google Play
                </a>
              </li>
              <li>
                <a
                  href={GOOGLE_GROUP_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors hover:text-foreground"
                >
                  Android testers group
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${SITE.email}`}
                  className="transition-colors hover:text-foreground"
                >
                  {SITE.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="path-rule my-10" />

        <div className="flex flex-col gap-4 text-sm text-subtle-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {SITE.name}. Built by {SITE.legalName}.
          </p>
          <div className="flex gap-6">
            <Link to="/privacy" className="transition-colors hover:text-foreground">
              Privacy Policy
            </Link>
            <Link to="/tos" className="transition-colors hover:text-foreground">
              Terms of Service
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  )
}
