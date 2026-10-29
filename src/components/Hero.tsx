import type { CSSProperties } from 'react'
import StoreBadges from '@/components/ui/StoreBadges'
import { t, type Locale } from '@/lib/i18n'
import { HERO_CITY, HERO_PHONE } from '@/lib/hero-art'
import '@/hero.css'

/**
 * Plot of the four destinations on the 1000 x 1000 city map. Coordinates are
 * percentages of the map stage; sprite offsets are in source pixels of the
 * 1254 px painting, so the footprints follow the same plot at every size.
 */
const DESTINATIONS = [
  { id: 'condos', x: '83.811802233%', y: '74.800637959%', size: '18.979266348%', spriteLeft: '-52.941176471%', spriteY: '-7.974481659', lift: '8.474481659', src: '/hero/condo-surau.webp', width: 238, height: 158, distance: '350 m' },
  { id: 'south', x: '12.360446571%', y: '75.996810207%', size: '16.826156300%', spriteLeft: '-45.023696682%', spriteY: '-7.416267943', lift: '7.916267943', src: '/hero/shophouse-surau.webp', width: 211, height: 166, distance: '600 m' },
  { id: 'modern', x: '83.891547049%', y: '23.285486443%', size: '17.862838915%', spriteLeft: '-46.428571429%', spriteY: '-8.612440191', lift: '9.112440191', src: '/hero/modern-masjid.webp', width: 224, height: 168, distance: '900 m' },
  { id: 'city', x: '16.347687400%', y: '22.009569378%', size: '18.261562998%', spriteLeft: '-53.711790393%', spriteY: '-10.446570973', lift: '10.946570973', src: '/hero/city-masjid.webp', width: 229, height: 165, distance: '1.4 km' },
] as const

/** Route lines from the locator (496, 530) to each destination, fully drawn. */
const ROUTES = [
  'M496 530 L450 483 L374 427 L300 362 L163.476874 220.095694',
  'M496 530 L559 480 L640 414 L720 339 L838.915470 232.854864',
  'M496 530 L420 590 L335 660 L250 727 L123.604466 759.968102',
  'M496 530 L560 582 L648 650 L730 717 L838.118022 748.006380',
] as const

/**
 * Static hero (owner 2026-10-29, performance): the rest composition only. The
 * city painting is the LCP `<img>` (AVIF source, WebP fallback), preloaded from the route head; nothing in
 * the hero moves and no script runs for it.
 */
export default function Hero({ locale = 'ms' }: { locale?: Locale }) {
  const copy = t(locale).hero
  return (
    <section className={`home-hero hero-${locale}`} aria-labelledby="hero-title">
      <div className="hero-inner"><div className="hero-copy">
        <h1 id="hero-title">{copy.lines.map((line, index) => <span key={line}>{line}{index < copy.lines.length - 1 ? ' ' : ''}</span>)}</h1>
        <p className="supporting">{copy.supporting}</p>
        <StoreBadges locale={locale} className="store-badges" />
      </div></div>
      <div className="art-pane">
        <div className="map-stage">
          <div className="map-layers">
            <picture>
              <source type="image/avif" srcSet={HERO_CITY.avifSrcSet} sizes={HERO_CITY.sizes} />
              <img className="city-art" src={HERO_CITY.src} srcSet={HERO_CITY.srcSet} sizes={HERO_CITY.sizes} alt={copy.city} width={HERO_CITY.width} height={HERO_CITY.height} fetchPriority="high" decoding="async" />
            </picture>
            <svg className="map-paths" viewBox="0 0 1000 1000" aria-hidden="true"><g className="route-ink">{ROUTES.map(d => <path key={d} d={d} />)}</g></svg>
            <div className="origin" style={{ '--x': '49.6%', '--y': '53%' } as CSSProperties} aria-hidden="true"><span className="locator-pulse"></span><span className="locator-dot"></span></div>
            {DESTINATIONS.map((place, index) => (
              <div key={place.id} className={`destination dest-${place.id}`} style={{ '--x': place.x, '--y': place.y, '--size': place.size, '--sprite-left': place.spriteLeft, '--sprite-y': place.spriteY, '--lift': place.lift } as CSSProperties} role="img" aria-label={copy.destinations[index]}>
                <span className="masjid-sprite"><img src={place.src} alt="" width={place.width} height={place.height} decoding="async" fetchPriority="low" /></span>
                <svg className="pin" viewBox="0 0 32 42" aria-hidden="true"><path className="pin-body" d="M16 40C12 34 2 24 2 16a14 14 0 1 1 28 0c0 8-10 18-14 24Z"/><path className="dome-icon" d="M9 21h14v-7H9zM9 14c0-4 7-7 7-7s7 3 7 7M16 7V4M7 21h18"/></svg>
                <span className="distance">{place.distance}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="floating-phone" role="img" aria-label={copy.phone}><img src={HERO_PHONE.src} srcSet={HERO_PHONE.srcSet} sizes={HERO_PHONE.sizes} alt="" width={HERO_PHONE.width} height={HERO_PHONE.height} loading="lazy" decoding="async" /><span aria-hidden="true" className="phone-camera"></span></div>
        <div className="art-footer"><p className="art-caption">{copy.caption}</p></div>
      </div>
    </section>
  )
}
