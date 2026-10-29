import { useEffect, useState } from 'react'
import { masjidAppUrl, masjidIntentUrl } from '@/lib/deep-links'

const button =
  'inline-flex min-h-12 items-center rounded-full px-6 py-3 font-display font-extrabold no-underline'

/**
 * Deep link into the app. Android gets an intent:// URL (with the Play listing as
 * fallback) after hydration; everything else keeps the custom-scheme link, so the
 * server-rendered HTML never depends on the user agent.
 */
export function OpenMasjid({
  id,
  label = 'Open in Jejak Masjid',
  onDeep = false,
  className,
}: {
  id: string
  label?: string
  onDeep?: boolean
  /** Replaces the default button styling (e.g. the sticky bar or a text link). */
  className?: string
}) {
  const [href, setHref] = useState(masjidAppUrl(id))
  useEffect(
    () =>
      setHref(
        /Android/i.test(navigator.userAgent)
          ? masjidIntentUrl(id)
          : masjidAppUrl(id),
      ),
    [id],
  )
  return (
    <a
      className={
        className ??
        `${button} ${onDeep ? 'bg-accent text-accent-foreground' : 'bg-primary text-primary-foreground'}`
      }
      href={href}
    >
      {label}
    </a>
  )
}
