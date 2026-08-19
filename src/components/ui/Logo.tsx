/**
 * The shipped Jejak Masjid app icon (mirrored from
 * project-masjid-mobile/assets/images/icon.png). Use this everywhere the brand
 * mark appears — do not substitute a redrawn mark.
 */
export function LogoMark({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <img
      src="/logo.png"
      alt=""
      aria-hidden="true"
      width={256}
      height={256}
      className={`rounded-[22%] ${className}`}
    />
  )
}

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className="h-9 w-9" />
      <span className="font-display text-[1.35rem] leading-none text-foreground">
        Jejak Masjid
      </span>
    </span>
  )
}
