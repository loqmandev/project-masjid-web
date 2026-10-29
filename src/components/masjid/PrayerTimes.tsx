import { useEffect, useState } from 'react'
import {
  PRAYER_KEYS,
  countdownLabel,
  mytDateLabel,
  nextPrayer,
  prayerName,
  prayerTimeParts,
} from '@/lib/masjid-format'

/**
 * Today's five prayers. The server HTML is static: no highlight and no countdown,
 * because the visitor's clock is unknown until hydration. After hydration the next
 * prayer is marked and the countdown updates once a minute.
 */
export default function PrayerTimes({ prayers }: { prayers: Record<string, string> }) {
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const tick = () => {
      setNow(Date.now())
      timer = setTimeout(tick, 60_000 - (Date.now() % 60_000) + 50)
    }
    tick()
    return () => clearTimeout(timer)
  }, [])
  const next = now === null ? null : nextPrayer(prayers, now)
  return (
    <section aria-labelledby="prayer-times-title">
      <h2 id="prayer-times-title" className="m-h2">
        Prayer times today
      </h2>
      <dl className="m-pt">
        {PRAYER_KEYS.map((key) => {
          const { time, meridiem } = prayerTimeParts(prayers[key])
          return (
            <div key={key} className={next?.key === key ? 'is-next' : undefined}>
              <dt>{prayerName(key)}</dt>
              <dd>
                {time} <small>{meridiem}</small>
              </dd>
            </div>
          )
        })}
      </dl>
      <p className="mt-2 flex min-h-5 flex-wrap justify-between gap-x-3 gap-y-1 text-[0.8rem] text-muted-foreground">
        {next && (
          <span>
            <b className="text-primary">{prayerName(next.key)}</b> in {countdownLabel(next.minutes)}
          </span>
        )}
        <span className="ml-auto">{mytDateLabel(prayers.subuh)}</span>
      </p>
    </section>
  )
}
