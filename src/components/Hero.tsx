import StoreBadges from '@/components/ui/StoreBadges'
import { t, type Locale } from '@/lib/i18n'
import '@/hero.css'

/**
 * Widget hero (owner 2026-10-29, performance): a deep-teal band with the app's
 * home-screen widgets built in HTML/CSS (no images). The LCP element is the H1.
 * The widgets reproduce the app and stay English in both languages; the values
 * are fixed samples. Everything in `.hero-widgets` is decorative (`aria-hidden`).
 * The resting frame is complete; the gentle float lives in `hero.css` under
 * `html[data-motion="on"]` only.
 */

const FLAME_PATH = 'M12 2c1 4-3 5-3 9a3 3 0 0 0 6 0c0-1.5-.5-2.5-1-3.5 2 1 4 3.5 4 6.5a6 6 0 0 1-12 0c0-5 5-7 6-12z'

/** Five-stop day timeline: gold = checked in, teal ring = missed or next. */
const TIMELINE = [
  { name: 'Subuh', time: '5:50', mark: 'done' },
  { name: 'Zohor', time: '1:06', mark: 'miss' },
  { name: 'Asar', time: '4:14', mark: 'done' },
  { name: 'Maghrib', time: '7:07', mark: 'upnext', next: true },
  { name: 'Isyak', time: '8:17', mark: '' },
] as const

const PRAYER_ROWS = [
  { name: 'Subuh', time: '5:50', cls: '' },
  { name: 'Zohor', time: '1:06', cls: '' },
  { name: 'Asar', time: '4:14', cls: '' },
  { name: 'Maghrib', time: '7:07', cls: 'on' },
  { name: 'Isyak', time: '8:17', cls: 'after' },
] as const

const COUNTDOWN = '1:12:40'

export default function Hero({ locale = 'ms' }: { locale?: Locale }) {
  const copy = t(locale).hero
  return (
    <section className={`home-hero on-deep hero-${locale}`} aria-labelledby="hero-title">
      <svg className="hero-pattern" aria-hidden="true" focusable="false">
        <defs>
          <pattern id="khatam" width="64" height="64" patternUnits="userSpaceOnUse">
            <g fill="none" stroke="#f7f6f0" strokeWidth="1.5">
              <rect x="17" y="17" width="30" height="30" />
              <rect x="17" y="17" width="30" height="30" transform="rotate(45 32 32)" />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#khatam)" />
      </svg>
      <div className="hero-inner">
        <div className="hero-copy">
          <h1 id="hero-title">{copy.lines.map((line, index) => <span key={line}>{line}{index < copy.lines.length - 1 ? ' ' : ''}</span>)}</h1>
          <p className="supporting">{copy.supporting}</p>
          <StoreBadges locale={locale} className="store-badges" />
        </div>
        <div className="hero-widgets" aria-hidden="true">
          <div className="wg wg-today">
            <div className="hd">
              <span>Next · Maghrib 7:07</span>
              <span className="chipf"><svg width="11" height="11" viewBox="0 0 24 24"><path d={FLAME_PATH} /></svg>12</span>
            </div>
            <div className="cd">{COUNTDOWN}</div>
            <div className="tl">
              {TIMELINE.map(stop => (
                <span key={stop.name} className={'next' in stop ? 'nx' : undefined}>
                  <i className={stop.mark || undefined} />{stop.name}<b>{stop.time}</b>
                </span>
              ))}
            </div>
          </div>
          <div className="wg wg-pt">
            <div className="hd"><span>☾ Kuala Lumpur</span><b>{COUNTDOWN}</b></div>
            <ul>
              {PRAYER_ROWS.map(row => <li key={row.name} className={row.cls || undefined}>{row.name}<b>{row.time}</b></li>)}
            </ul>
          </div>
          <div className="wg wg-st">
            <svg className="fl" viewBox="0 0 24 24" width="22" height="22"><path d={FLAME_PATH} /></svg>
            <div><div className="n">12</div><div className="ok">✓ Done today</div></div>
          </div>
        </div>
      </div>
    </section>
  )
}
