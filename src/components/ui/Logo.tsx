/** Approved JM artwork. Preserve the original silhouette and lockup spacing. */
export function LogoMark({ className = 'h-9 w-9' }: { className?: string }) {
  return <img src="/logo.png" alt="" aria-hidden="true" width={256} height={256} className={className} />
}

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <img
      src="/brand/jm-wordmark-ink.svg"
      alt="Jejak Masjid"
      width={387}
      height={174}
      className={`block h-11 w-auto shrink-0 ${className}`}
    />
  )
}
