import { googleMapEmbedUrl } from '@/lib/embed-map'
import { directionsUrl } from '@/lib/masjid-format'

/**
 * Google Maps embed in a fixed-aspect box (no layout shift while it loads). The
 * box is the same size the SVG map had: 16:10 in the place card, 4:3 in the phone
 * hero, 300 px tall in the desktop hero (see .m-map / .m-map-hero in styles.css).
 * Renders nothing when there is no valid key.
 *
 * On touch layouts a transparent link covers the iframe (see .m-map-cover): a swipe
 * that starts on the map scrolls the page instead of panning it, and a tap opens
 * Google Maps directions. With a fine pointer from lg the iframe stays interactive.
 */
export default function MapEmbed({
  mapKey,
  lat,
  lng,
  name,
  className = '',
}: {
  mapKey: string | null
  lat: number
  lng: number
  name: string
  className?: string
}) {
  const src = mapKey ? googleMapEmbedUrl(mapKey, lat, lng) : null
  if (!src) return null
  return (
    <div className={`m-map ${className}`}>
      <iframe
        src={src}
        title={`Map of ${name}`}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
      <a
        className="m-map-cover"
        href={directionsUrl(lat, lng)}
        aria-label={`Open ${name} in Google Maps`}
        target="_blank"
        rel="noopener"
      />
    </div>
  )
}
