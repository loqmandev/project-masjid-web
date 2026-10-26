import { APP_STORE_URL } from './site'

/** Verified 2026-10-14. Source: .hermes/plans/2026-10-14_095052-website-revamp.md.
 * Keep spelling, displayed dates and store/region attribution verbatim.
 * The owner must refresh this evidence before deployment. */
const PLAY_MY = 'https://play.google.com/store/apps/details?id=my.lonasoft.jejakmasjidmobile&hl=en&gl=MY'

export const STORE_RATINGS = [
  { store: 'App Store', locale: 'Malaysia', score: 4.8, count: 36, unit: 'ratings', sourceUrl: APP_STORE_URL, fetchedAt: '2026-10-14' },
  { store: 'Google Play', locale: 'MY listing', score: 4.7, count: 48, unit: 'reviews', sourceUrl: PLAY_MY, fetchedAt: '2026-10-14' },
] as const

export const REVIEWS = [
  { name: 'Pakracle', store: 'App Store', date: '22 Jul', quote: 'Easy and usefull for all to istiqamah especially to muslim man', sourceUrl: APP_STORE_URL },
  { name: 'Zulzaim Hilmee', store: 'Google Play', date: 'July 29, 2026', quote: 'Good apps for travellers and Muslim journey.', sourceUrl: PLAY_MY },
  { name: 'Thariq Aiman', store: 'Google Play', date: 'May 12, 2026', quote: 'One of the best app out there. It keeps track on what mosque or surau you pray and also rewards you to keep praying to surau or mosque.', sourceUrl: PLAY_MY },
  { name: 'goldenrayedlily', store: 'App Store', date: '5 May', quote: 'This app features a live contest which users can participate as challengers.', sourceUrl: APP_STORE_URL },
] as const

export const MEDIA = [
  { publisher: 'Siakap Keli', author: 'Azizah Najib', date: '8 April 2026', headline: 'Fenomena Jejak Masjid Jadi Perhatian, Ada Yang Dah Lawat 88 Masjid', sourceUrl: 'https://siakapkeli.my/articles/fenomena-jejak-masjid-jadi-perhatian-ada-yang-dah-lawat-88-masjid' },
  { publisher: 'Waktu Solat Malaysia', author: 'Shaifullah', date: '2 April 2026', headline: 'Lelaki Bangunkan Aplikasi ‘Jejak Masjid’, Tarik Minat Anak Muda ‘Hunting’ Pahala & Istiqamah Solat Berjemaah', sourceUrl: 'https://www.waktusolat.digital/inspirasi-islam/aplikasi-jejak-masjid' },
] as const
