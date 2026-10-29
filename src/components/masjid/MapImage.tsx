import { MAP_HEIGHT, MAP_WIDTH } from '@/lib/masjid-map'

/**
 * The server-rendered SVG map (route /masjid/<slug>/map.svg) with the
 * OpenStreetMap credit (ODbL). The credit is HTML, not part of the SVG: the
 * container crops the image (object-fit: cover), which would cut an in-image
 * credit off, while this overlay always sits inside the visible box.
 */
export default function MapImage({
  slug,
  name,
  eager = false,
  className = '',
}: {
  slug: string
  name: string
  eager?: boolean
  className?: string
}) {
  return (
    <div className={`m-map ${className}`}>
      <img
        src={`/masjid/${slug}/map.svg`}
        width={MAP_WIDTH}
        height={MAP_HEIGHT}
        alt={`Map of the area around ${name}`}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
      />
      <a
        className="m-map-credit"
        href="https://www.openstreetmap.org/copyright"
        target="_blank"
        rel="noopener"
      >
        &copy; OpenStreetMap
      </a>
    </div>
  )
}
