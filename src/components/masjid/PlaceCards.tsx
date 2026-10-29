import { MapPin, Navigation } from 'lucide-react'
import StoreBadges from '@/components/ui/StoreBadges'
import { directionsUrl, wazeUrl } from '@/lib/masjid-format'
import MapImage from './MapImage'
import { OpenMasjid } from './OpenMasjid'

export function Address({ address, className = '' }: { address: string; className?: string }) {
  return (
    <p className={`m-0 flex items-start gap-2 text-muted-foreground ${className}`}>
      <MapPin aria-hidden="true" className="mt-0.5 h-[18px] w-[18px] flex-none" />
      <span>{address}</span>
    </p>
  )
}

/** Directions (primary) and Waze (ghost); both open in a new tab. */
export function MapLinks({
  lat,
  lng,
  className = '',
}: {
  lat: number
  lng: number
  className?: string
}) {
  return (
    <div className={`flex gap-2 ${className}`}>
      <a
        className="m-btn m-btn-primary"
        href={directionsUrl(lat, lng)}
        target="_blank"
        rel="noopener"
      >
        <Navigation aria-hidden="true" />
        Directions
      </a>
      <a
        className="m-btn m-btn-ghost"
        href={wazeUrl(lat, lng)}
        target="_blank"
        rel="noopener"
      >
        Waze
      </a>
    </div>
  )
}

/**
 * White card: map (when the gallery has photos and the map is on), address,
 * Directions + Waze.
 */
export function PlaceCard({
  slug,
  name,
  address,
  lat,
  lng,
  withMap,
}: {
  slug: string
  name: string
  address: string
  lat: number
  lng: number
  withMap: boolean
}) {
  // Without a map the card only repeats the title block's address and buttons, so
  // phones skip it; from lg the aside always has it.
  return (
    <div
      className={`gap-3 rounded-[20px] border border-border bg-card p-3 ${withMap ? 'grid' : 'hidden lg:grid'}`}
    >
      {withMap && <MapImage slug={slug} name={name} />}
      <Address address={address} className="px-1 text-[0.92rem]" />
      <MapLinks lat={lat} lng={lng} className="[&>a]:flex-1" />
    </div>
  )
}

export function AppCard({ masjidId }: { masjidId: string }) {
  return (
    <div className="on-deep grid gap-3 rounded-[20px] bg-deep p-[22px] text-deep-foreground">
      <span aria-hidden="true" className="block h-1 w-10 rounded-sm bg-accent" />
      <h3 className="m-0 text-[1.2rem] leading-tight text-deep-foreground">
        Singgah with Jejak Masjid
      </h3>
      <p className="m-0 text-[0.88rem] text-deep-muted">
        Stay ten minutes and the visit joins your journey, a quiet record of every masjid you have
        prayed at.
      </p>
      <div>
        <OpenMasjid id={masjidId} label="Open in Jejak Masjid" onDeep />
      </div>
      <StoreBadges size="compact" className="[&_img]:w-auto" />
    </div>
  )
}

/**
 * Phones only. Sticky inside the page body (never position: fixed), so it rests
 * above the footer once the page ends.
 */
export function StickyBar({ masjidId, lat, lng }: { masjidId: string; lat: number; lng: number }) {
  return (
    <div
      data-sticky-bar
      className="sticky bottom-0 z-20 flex gap-2 border-t border-border bg-background/95 px-4 pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom,0px))] lg:hidden"
    >
      <a
        className="m-btn m-btn-ghost flex-1"
        href={directionsUrl(lat, lng)}
        target="_blank"
        rel="noopener"
      >
        <Navigation aria-hidden="true" />
        Directions
      </a>
      <OpenMasjid
        id={masjidId}
        label="Open in app"
        className="m-btn m-btn-primary flex-1"
      />
    </div>
  )
}
