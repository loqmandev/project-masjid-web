export const API_PUBLIC_URL = 'https://apiv2.jejakmasjid.my'

export const SITE = {
  name: 'Jejak Masjid',
  legalName: 'JEJAK MANFAAT DIGITAL SOLUTIONS',
  registrationNumber: '202603263114 (JM1051015-M)',
  url: 'https://jejakmasjid.my',
  /** App Store "name" field — keep in sync with store-assets-v2/ASO_COPY.md */
  storeName: 'Jejak Masjid: Mosque Tracker',
  tagline: 'Remember where you prayed.',
  /** Kept under ~155 characters so Google does not truncate it in results. */
  description:
    'A masjid finder and visit journal for Muslims in Malaysia. Find masjids and surau near you, and keep a private record of your prayer journey.',
  email: 'admin@jejakmasjid.my',
  ogImage: '/og-image-cb5aed1525f9.png',
  locale: 'en_MY',
} as const

export const APP_STORE_URL =
  'https://apps.apple.com/my/app/jejak-masjid-masjid-journey/id6757920248'
export const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=my.lonasoft.jejakmasjidmobile'
export const GOOGLE_GROUP_URL = 'https://groups.google.com/g/jejakmasjid'
// Owner to confirm the Business destination and preset message before publishing.
export const WHATSAPP_URL = 'https://wa.me/message/IIUIRAT4AKQVJ1'

/** Shared destinations; localized names and availability live in i18n. */
export const PRODUCTS = [
  { id: 'app', href: '/download', external: false },
  { id: 'shop', href: 'https://shop.jejakmasjid.my', external: true },
  { id: 'merchant', href: 'https://merchant.jejakmasjid.my', external: true },
  { id: 'collaboration', href: '/kolaborasi', external: false },
] as const

export function productHref(product: typeof PRODUCTS[number], locale: 'ms' | 'en') {
  return product.id === 'collaboration' && locale === 'en' ? '/en/collaboration' : product.href
}

export function absoluteUrl(path: string) {
  return path.startsWith('http') ? path : `${SITE.url}${path}`
}
