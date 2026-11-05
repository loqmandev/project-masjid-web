import Footer from '@/components/Footer'
import Header from '@/components/Header'
import { Container } from '@/components/ui/Section'
import { directionsUrl, placeParts } from '@/lib/masjid-format'
import type { PublicVenuePage } from '@/lib/masjid-types'
import { roomBlock } from '@/lib/venue-rooms'
import { RoomDetails, RoomLines } from './RoomsBlock'

/**
 * /surau/{venue}: every prayer space inside one venue, in floor order (backend order).
 * No nearby lists on purpose (anti-scraping, owner 2026-10-29).
 */
export function VenuePlacePage({ page }: { page: PublicVenuePage }) {
  const v = page.venue
  const place = placeParts(v.districtName, v.stateName)
  return (
    <>
      <Header />
      <main>
        <Container>
          <div className="grid max-w-3xl gap-6 pt-6 pb-12 lg:pt-10 lg:pb-16">
            <header>
              <h1 className="m-0 mb-1.5 text-[2rem] leading-[1.1] text-primary text-balance lg:text-[2.7rem]">
                {`Surau at ${v.name}`}
              </h1>
              {place.line && <p className="m-0 text-muted-foreground">{place.line}</p>}
              {v.openingHours && (
                <p className="mt-1 mb-0 text-[0.92rem] text-muted-foreground">
                  {`Open when ${v.name} is open · ${v.openingHours}`}
                </p>
              )}
              <p className="mt-4 mb-0">
                <a
                  className="m-btn m-btn-primary"
                  href={directionsUrl(v.lat, v.lng)}
                  target="_blank"
                  rel="noopener"
                >
                  Get directions
                </a>
              </p>
            </header>
            <section aria-label="Prayer spaces" className="grid gap-3.5">
              {page.places.map((p) => {
                const { lines, strong, details } = roomBlock(p.rooms)
                return (
                  <article key={p.slug} className="rounded-[20px] border border-border bg-card p-5">
                    <h2 className="m-0 text-[1.15rem] leading-tight text-primary">
                      <a className="underline-offset-[3px] hover:underline" href={`/masjid/${p.slug}`}>
                        {p.name}
                      </a>
                    </h2>
                    {p.rooms.length ? (
                      <div className="mt-2 grid gap-0.5">
                        <RoomLines lines={lines} strong={strong} />
                        <div className="pl-7">
                          <RoomDetails details={details} />
                        </div>
                      </div>
                    ) : (
                      <p className="mt-2 mb-0 text-[0.92rem] text-muted-foreground">
                        Exact floor not listed yet.
                      </p>
                    )}
                  </article>
                )
              })}
            </section>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  )
}
