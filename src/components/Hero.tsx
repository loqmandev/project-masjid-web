import { useEffect, useRef, type CSSProperties } from 'react'
import StoreBadges from '@/components/ui/StoreBadges'
import { t, type Locale } from '@/lib/i18n'
import { mountHero } from '@/lib/hero-motion.js'
import '@/hero.css'

/** The approved H8 rest composition is server rendered. Only its canvas
 * camera and reveals are mounted by this client effect. */
export default function Hero({ locale = 'ms' }: { locale?: Locale }) {
  const copy = t(locale).hero
  const paneRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (paneRef.current) return mountHero(paneRef.current)
  }, [])
  return (
    <section className={`zoom-hero hero-${locale}`} aria-labelledby="hero-title">
      <div className="hero-inner"><div className="hero-copy">
        <h1 id="hero-title">{copy.lines.map((line, index) => <span key={line}>{line}{index < copy.lines.length - 1 ? ' ' : ''}</span>)}</h1>
        <p className="supporting">{copy.supporting}</p>
        <StoreBadges locale={locale} className="store-badges" />
      </div></div>
   <div ref={paneRef} className="art-pane" data-state="rest">
    <div className="map-stage">
     <div className="camera">
      <div className="city-base">
      <div className="layer-city">
      <img className="city-art" data-art-src="/hero/l4-city.webp" alt={copy.city} width="1254" height="1254" decoding="async" fetchPriority="low" />
      <canvas className="painted-art" data-art=".city-art" width="0" height="0" aria-hidden="true"></canvas>
      </div>
      </div>
      <canvas className="zoom-canvas" width="0" height="0" aria-hidden="true" hidden></canvas>
      <svg className="map-paths" viewBox="0 0 1000 1000" aria-hidden="true"><defs><mask id="route-mask"><path className="path-reveal" data-target="city" pathLength="1" d="M496 530 L450 483 L374 427 L300 362 L163.476874 220.095694"/><path className="path-reveal" data-target="modern" pathLength="1" d="M496 530 L559 480 L640 414 L720 339 L838.915470 232.854864"/><path className="path-reveal" data-target="south" pathLength="1" d="M496 530 L420 590 L335 660 L250 727 L123.604466 759.968102"/><path className="path-reveal" data-target="condos" pathLength="1" d="M496 530 L560 582 L648 650 L730 717 L838.118022 748.006380"/></mask></defs><g className="route-ink" mask="url(#route-mask)"><path d="M496 530 L450 483 L374 427 L300 362 L163.476874 220.095694"/><path d="M496 530 L559 480 L640 414 L720 339 L838.915470 232.854864"/><path d="M496 530 L420 590 L335 660 L250 727 L123.604466 759.968102"/><path d="M496 530 L560 582 L648 650 L730 717 L838.118022 748.006380"/></g></svg>
      <svg className="radar" viewBox="0 0 1000 1000" aria-hidden="true"><circle className="radar-ring" cx="496" cy="530" r="700"/></svg>
      <div className="origin-track">
      <div className="origin" style={{'--x':'49.6%','--y':'53%'} as CSSProperties} aria-hidden="true"><span className="locator-pulse"></span><span className="locator-dot"></span></div>
      </div>
      <div className="destination dest-condos" data-id="condos" data-x="83.811802233" data-y="74.800637959" style={{'--x':'83.811802233%','--y':'74.800637959%','--size':'18.979266348%','--sprite-left':'-52.941176471%','--sprite-y':'-7.974481659','--ground-x':'52.941176471%','--ground-y':'63.291139241%','--lift':'8.474481659'} as CSSProperties} role="img" aria-label={copy.destinations[0]}>
       <span className="light-beam" aria-hidden="true"></span>
       <span className="shockwave" aria-hidden="true"></span>
       <span className="masjid-sprite"><img data-art-src="/hero/condo-surau.webp" alt="" width="238" height="158" decoding="async" fetchPriority="low" /><canvas className="painted-sprite" data-art=".dest-condos .masjid-sprite > img" width="0" height="0" aria-hidden="true"></canvas></span>
       <svg className="pin" viewBox="0 0 32 42" aria-hidden="true"><path className="pin-body" d="M16 40C12 34 2 24 2 16a14 14 0 1 1 28 0c0 8-10 18-14 24Z"/><path className="dome-icon" d="M9 21h14v-7H9zM9 14c0-4 7-7 7-7s7 3 7 7M16 7V4M7 21h18"/></svg>
       <span className="distance">350 m</span>
      </div>
      <div className="destination dest-south" data-id="south" data-x="12.360446571" data-y="75.996810207" style={{'--x':'12.360446571%','--y':'75.996810207%','--size':'16.826156300%','--sprite-left':'-45.023696682%','--sprite-y':'-7.416267943','--ground-x':'45.023696682%','--ground-y':'56.024096386%','--lift':'7.916267943'} as CSSProperties} role="img" aria-label={copy.destinations[1]}>
       <span className="light-beam" aria-hidden="true"></span>
       <span className="shockwave" aria-hidden="true"></span>
       <span className="masjid-sprite"><img data-art-src="/hero/shophouse-surau.webp" alt="" width="211" height="166" decoding="async" fetchPriority="low" /><canvas className="painted-sprite" data-art=".dest-south .masjid-sprite > img" width="0" height="0" aria-hidden="true"></canvas></span>
       <svg className="pin" viewBox="0 0 32 42" aria-hidden="true"><path className="pin-body" d="M16 40C12 34 2 24 2 16a14 14 0 1 1 28 0c0 8-10 18-14 24Z"/><path className="dome-icon" d="M9 21h14v-7H9zM9 14c0-4 7-7 7-7s7 3 7 7M16 7V4M7 21h18"/></svg>
       <span className="distance">600 m</span>
      </div>
      <div className="destination dest-modern" data-id="modern" data-x="83.891547049" data-y="23.285486443" style={{'--x':'83.891547049%','--y':'23.285486443%','--size':'17.862838915%','--sprite-left':'-46.428571429%','--sprite-y':'-8.612440191','--ground-x':'46.428571429%','--ground-y':'64.285714286%','--lift':'9.112440191'} as CSSProperties} role="img" aria-label={copy.destinations[2]}>
       <span className="light-beam" aria-hidden="true"></span>
       <span className="shockwave" aria-hidden="true"></span>
       <span className="masjid-sprite"><img data-art-src="/hero/modern-masjid.webp" alt="" width="224" height="168" decoding="async" fetchPriority="low" /><canvas className="painted-sprite" data-art=".dest-modern .masjid-sprite > img" width="0" height="0" aria-hidden="true"></canvas></span>
       <svg className="pin" viewBox="0 0 32 42" aria-hidden="true"><path className="pin-body" d="M16 40C12 34 2 24 2 16a14 14 0 1 1 28 0c0 8-10 18-14 24Z"/><path className="dome-icon" d="M9 21h14v-7H9zM9 14c0-4 7-7 7-7s7 3 7 7M16 7V4M7 21h18"/></svg>
       <span className="distance">900 m</span>
      </div>
      <div className="destination dest-city" data-id="city" data-x="16.347687400" data-y="22.009569378" style={{'--x':'16.347687400%','--y':'22.009569378%','--size':'18.261562998%','--sprite-left':'-53.711790393%','--sprite-y':'-10.446570973','--ground-x':'53.711790393%','--ground-y':'79.393939394%','--lift':'10.946570973'} as CSSProperties} role="img" aria-label={copy.destinations[3]}>
       <span className="light-beam" aria-hidden="true"></span>
       <span className="shockwave" aria-hidden="true"></span>
       <span className="masjid-sprite"><img data-art-src="/hero/city-masjid.webp" alt="" width="229" height="165" decoding="async" fetchPriority="low" /><canvas className="painted-sprite" data-art=".dest-city .masjid-sprite > img" width="0" height="0" aria-hidden="true"></canvas></span>
       <svg className="pin" viewBox="0 0 32 42" aria-hidden="true"><path className="pin-body" d="M16 40C12 34 2 24 2 16a14 14 0 1 1 28 0c0 8-10 18-14 24Z"/><path className="dome-icon" d="M9 21h14v-7H9zM9 14c0-4 7-7 7-7s7 3 7 7M16 7V4M7 21h18"/></svg>
       <span className="distance">1.4 km</span>
      </div>
     </div>
    </div>
     <div className="floating-phone" role="img" aria-label={copy.phone}><img data-art-src="/screens/02-explore@2x.webp" alt="" width="720" height="1600" decoding="async" fetchPriority="low" /><canvas className="painted-phone" data-art=".floating-phone > img" width="0" height="0" aria-hidden="true"></canvas><span aria-hidden="true" className="phone-camera"></span></div>
    <div className="art-footer"><p className="art-caption">{copy.caption}</p><button className="replay" type="button" aria-label={copy.replay} hidden><span aria-hidden="true">↻</span></button></div>
   </div>
    </section>
  )
}
