export const SITE = {
  name: 'Jejak Masjid',
  legalName: 'Lonasoft',
  url: 'https://jejakmasjid.my',
  /** App Store "name" field — keep in sync with store-assets-v2/ASO_COPY.md */
  storeName: 'Jejak Masjid: Mosque Tracker',
  tagline: 'Remember where you prayed.',
  /** Kept under ~155 characters so Google does not truncate it in results. */
  description:
    'A masjid finder and visit journal for Muslims in Malaysia. Find masjids and surau near you, and keep a private record of your prayer journey.',
  email: 'admin@jejakmasjid.my',
  ogImage: '/og-image.png',
  locale: 'en_MY',
} as const

export const APP_STORE_URL =
  'https://apps.apple.com/my/app/jejak-masjid-masjid-journey/id6757920248'
export const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=my.lonasoft.jejakmasjidmobile'
export const GOOGLE_GROUP_URL = 'https://groups.google.com/g/jejakmasjid'

/** Nav destinations shared by the header and footer. */
export const SECTIONS = [
  { href: '/#journey', label: 'The journey' },
  { href: '/#features', label: 'What it does' },
  { href: '/#how', label: 'How it works' },
  { href: '/#faq', label: 'Questions' },
] as const

export function absoluteUrl(path: string) {
  return path.startsWith('http') ? path : `${SITE.url}${path}`
}
