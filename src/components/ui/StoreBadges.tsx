import { APP_STORE_URL, PLAY_STORE_URL } from '@/lib/site'

export default function StoreBadges({
  className = '',
  size = 'default',
  style,
}: {
  className?: string
  size?: 'default' | 'compact'
  style?: React.CSSProperties
}) {
  const height = size === 'compact' ? 'h-10' : 'h-12'

  return (
    <div style={style} className={`flex flex-wrap items-center gap-3 ${className}`}>
      <a
        href={APP_STORE_URL}
        target="_blank"
        rel="noreferrer"
        className="jm-press inline-flex transition-transform duration-200 hover:-translate-y-0.5"
      >
        <img
          src="/app-store-badge.svg"
          alt="Download Jejak Masjid on the App Store"
          className={height}
          width={140}
          height={48}
        />
      </a>
      <a
        href={PLAY_STORE_URL}
        target="_blank"
        rel="noreferrer"
        className="jm-press inline-flex transition-transform duration-200 hover:-translate-y-0.5"
      >
        <img
          src="/play-store-badge.svg"
          alt="Get Jejak Masjid on Google Play"
          className={height}
          width={162}
          height={48}
        />
      </a>
    </div>
  )
}
