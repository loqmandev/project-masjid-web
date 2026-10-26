import { APP_STORE_URL, PLAY_STORE_URL } from '@/lib/site'
import { t, type Locale } from '@/lib/i18n'

export default function StoreBadges({
  className = '',
  size = 'default',
  style,
  locale = 'en',
}: {
  className?: string
  size?: 'default' | 'compact'
  style?: React.CSSProperties
  locale?: Locale
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
          alt={t(locale).stores.apple}
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
          alt={t(locale).stores.google}
          className={height}
          width={162}
          height={48}
        />
      </a>
    </div>
  )
}
