import { MAP_HEIGHT, MAP_WIDTH } from '@/lib/masjid-map'

/** The server-rendered SVG map (route /masjid/<slug>/map.svg). */
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
    </div>
  )
}
