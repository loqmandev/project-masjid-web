/**
 * Approved JM artwork (brand kit). Never redraw, recolour or crop.
 * - on-light lockup: ivory / white / mist backgrounds
 * - on-dark lockup: deep teal #003130 only
 * Never place either on brand teal #00A9A5. Full lockup needs >= 180 px width and
 * clear space of at least a quarter of its height on every side; below that use the symbol.
 */
export type LogoTone = 'light' | 'dark'

export function LogoMark({
  className = 'h-9 w-9',
  tone = 'light',
}: {
  className?: string
  tone?: LogoTone
}) {
  return (
    <img
      src={tone === 'dark' ? '/brand/jm-symbol-on-dark.png' : '/brand/jm-symbol-on-light.png'}
      alt=""
      aria-hidden="true"
      width={256}
      height={256}
      className={className}
    />
  )
}

export function Wordmark({
  className = '',
  tone = 'light',
}: {
  className?: string
  tone?: LogoTone
}) {
  return (
    <img
      src={tone === 'dark' ? '/brand/jm-lockup-on-dark.svg' : '/brand/jm-lockup-on-light.svg'}
      alt="Jejak Masjid"
      width={387}
      height={174}
      className={`block h-auto w-[184px] max-w-none shrink-0 ${className}`}
    />
  )
}
