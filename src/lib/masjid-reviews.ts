import { SITE } from './site'

/**
 * Visitor reviews on the public masjid page. The backend adds an optional
 * `reviews` summary to the by-slug payload (backend SPEC_masjid-page-reviews.md):
 * an absent key means the feature is off. Anything malformed is dropped whole, so
 * the page never shows a partial or surprising section, and nothing the backend
 * sends beyond these four item keys ever reaches the rendered page or its payload.
 */
export type MasjidReview = {
  id: string
  rating: number
  tip: string
  createdAt: string
}
export type MasjidReviews = {
  count: number
  average: number | null
  items: MasjidReview[]
}

const MAX_ITEMS = 3
const MAX_TIP = 150
const ID = /^[A-Za-z0-9_-]{1,64}$/
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,9})?)?(Z|[+-]\d{2}:\d{2})$/
const isObject = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v)

function validItem(value: unknown): MasjidReview | null {
  if (!isObject(value)) return null
  const { id, rating, tip, createdAt } = value
  if (typeof id !== 'string' || !ID.test(id)) return null
  if (typeof rating !== 'number' || !Number.isInteger(rating) || rating < 1 || rating > 5)
    return null
  if (typeof tip !== 'string' || tip.length > MAX_TIP) return null
  const trimmed = tip.trim()
  if (!trimmed) return null
  if (typeof createdAt !== 'string' || !ISO.test(createdAt) || !Number.isFinite(Date.parse(createdAt)))
    return null
  return { id, rating, tip: trimmed, createdAt }
}

export function validateReviews(value: unknown): MasjidReviews | null {
  if (!isObject(value)) return null
  const { count, average, items } = value
  if (typeof count !== 'number' || !Number.isInteger(count) || count < 0 || count > 1e9)
    return null
  if (average !== null && (typeof average !== 'number' || !(average >= 1 && average <= 5)))
    return null
  if (!Array.isArray(items) || items.length > MAX_ITEMS || items.length > count) return null
  const clean: MasjidReview[] = []
  for (const item of items) {
    const ok = validItem(item)
    if (!ok) return null
    clean.push(ok)
  }
  // The average is only meaningful (and only sent) from three reviews up.
  if (count >= 3 && average === null) return null
  return { count, average: count >= 3 ? average : null, items: clean }
}

/** Nearest half star, for the summary tile. */
export const roundToHalf = (average: number) => Math.round(average * 2) / 2

const month = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Kuala_Lumpur',
  month: 'long',
  year: 'numeric',
})
/** "October 2026", in Malaysia time. */
export const reviewMonth = (iso: string) => month.format(new Date(iso))

export const reviewReportHref = (id: string, slug: string) =>
  `mailto:${SITE.email}?subject=${encodeURIComponent(`Report review ${id} on ${slug}`)}`
