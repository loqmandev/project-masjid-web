import type { ReactNode } from 'react'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import MasjidFacilities from '@/components/MasjidFacilities'
import { Container } from '@/components/ui/Section'
import { galleryPhotos, MOSAIC_MAX } from '@/lib/masjid-gallery'
import { placeParts, titleCaseAddress, venueLabel } from '@/lib/masjid-format'
import type { MasjidReviews } from '@/lib/masjid-reviews'
import type { FacilityCatalogueDetails, PublicMasjidPage } from '@/lib/masjid-types'
import { Gallery, MapHero } from './Gallery'
import { Address, AppCard, MapLinks, PlaceCard, StickyBar } from './PlaceCards'
import PrayerTimes from './PrayerTimes'
import Reviews from './Reviews'

/**
 * The public masjid page, sketch 108 variant A "Place card". Two columns from lg
 * (main + a sticky 340 px aside), one column below it with a sticky action bar.
 * AJK content arrives through the `about` and `ajk` slots, already flag-gated.
 */
export default function MasjidPlacePage({
  page,
  prayers,
  reviews,
  facilityCatalogue,
  about,
  ajk,
}: {
  page: PublicMasjidPage
  prayers: Record<string, string> | null
  reviews: MasjidReviews | null
  facilityCatalogue: FacilityCatalogueDetails[]
  about?: ReactNode
  ajk?: ReactNode
}) {
  const m = page.masjid
  const photos = galleryPhotos(page)
  const place = placeParts(m.districtName, m.stateName)
  const venue = venueLabel(m.type, m.name)
  const address = titleCaseAddress(m.address)
  const hasPhotos = photos.length > 0
  return (
    <>
      <Header />
      <main>
        <Container>
          <p className="m-0 pt-3.5 text-[0.8rem] text-muted-foreground">
            {venue}
            {place.line ? ` · ${place.line}` : ''}
          </p>

          {hasPhotos ? <Gallery photos={photos} name={m.name} /> : <MapHero slug={m.slug} name={m.name} />}

          <div className="grid gap-7 pt-[18px] pb-9 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-12 lg:pt-[26px] lg:pb-14">
            <div className="grid min-w-0 gap-7">
              <header>
                <div className="flex flex-wrap gap-1.5">
                  <span className="m-tag">{venue}</span>
                  {place.district && <span className="m-tag">{place.district}</span>}
                </div>
                <h1 className="mt-2 mb-1.5 text-[2rem] leading-[1.1] text-primary text-balance lg:text-[2.7rem]">
                  {m.name}
                </h1>
                <Address address={address} className="mt-2.5" />
                <MapLinks lat={m.lat} lng={m.lng} className="mt-4 flex-wrap lg:hidden" />
              </header>

              {about}

              {prayers && <PrayerTimes prayers={prayers} />}

              {Array.isArray(page.facilities) ? (
                <MasjidFacilities
                  facilities={page.facilities}
                  catalogue={facilityCatalogue}
                  masjidName={m.name}
                />
              ) : (
                !!page.profile?.facilities.length && (
                  <section>
                    <h2 className="m-h2">Facilities</h2>
                    <ul className="m-ajk m-0">
                      {page.profile.facilities.map((f) => (
                        <li key={f.code}>{f.label}</li>
                      ))}
                    </ul>
                  </section>
                )
              )}

              {reviews && <Reviews reviews={reviews} slug={m.slug} masjidId={m.id} />}

              {photos.length > MOSAIC_MAX && (
                <section id="photos" className="hidden lg:block">
                  <h2 className="m-h2">Photos from visitors</h2>
                  <div className="grid grid-cols-4 gap-2">
                    {photos.map((src, i) => (
                      <img
                        key={src}
                        src={src}
                        alt={i === 0 ? m.name : `${m.name}, photo ${i + 1}`}
                        width={600}
                        height={800}
                        loading="lazy"
                        decoding="async"
                        className="aspect-[3/4] w-full rounded-xl object-cover"
                      />
                    ))}
                  </div>
                </section>
              )}

              {ajk}
            </div>

            <aside className="grid min-w-0 gap-3.5 lg:sticky lg:top-28" aria-label="Directions and the app">
              <PlaceCard
                slug={m.slug}
                name={m.name}
                address={address}
                lat={m.lat}
                lng={m.lng}
                withMap={hasPhotos}
              />
              <AppCard masjidId={m.id} />
            </aside>
          </div>
        </Container>
        <StickyBar masjidId={m.id} lat={m.lat} lng={m.lng} />
      </main>
      <Footer />
    </>
  )
}

