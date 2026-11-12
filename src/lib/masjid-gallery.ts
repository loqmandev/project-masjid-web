import { trustedImage } from './masjid-seo'
import type { PublicMasjidPage } from './masjid-types'

export const MAX_GALLERY_PHOTOS = 8
/** Images shown in the desktop mosaic: one large and up to four small. */
export const MOSAIC_MAX = 5

export type GalleryPhoto = { url: string; confirmed: boolean; facilityLabel: string | null }

/** English facility name from the backend, only for unconfirmed photos: 1-60 chars after whitespace collapse. */
function cleanLabel(value: unknown, confirmed: boolean): string | null {
  if (confirmed || typeof value !== 'string') return null
  const t = value.replace(/\s+/g, ' ').trim()
  return t.length >= 1 && t.length <= 60 ? t : null
}

/**
 * Visitor photos from the backend, validated. Only the literal `false` means
 * "not yet confirmed": an older backend sends `{ url }` alone, which is confirmed.
 */
export function validatePhotos(value: unknown): GalleryPhoto[] {
  if (!Array.isArray(value)) return []
  const out: GalleryPhoto[] = []
  for (const entry of value) {
    if (out.length === MAX_GALLERY_PHOTOS) break
    if (!entry || typeof entry !== 'object') continue
    const { url, confirmed, facilityLabel } = entry as {
      url?: unknown
      confirmed?: unknown
      facilityLabel?: unknown
    }
    if (typeof url !== 'string') continue
    const isConfirmed = confirmed !== false
    out.push({ url, confirmed: isConfirmed, facilityLabel: cleanLabel(facilityLabel, isConfirmed) })
  }
  return out
}

/**
 * AJK cover first (usually absent), then confirmed visitor photos, then the
 * not-yet-confirmed ones, every URL through the trusted-host allowlist,
 * de-duplicated (first wins), at most eight.
 */
export function galleryPhotos(
  page: Pick<PublicMasjidPage, 'profile' | 'photos'>,
): GalleryPhoto[] {
  const visitors = (page.photos ?? []).map((p) => {
    const confirmed = p.confirmed !== false
    return { url: p.url, confirmed, facilityLabel: cleanLabel(p.facilityLabel, confirmed) }
  })
  const candidates: { url: string | null | undefined; confirmed: boolean; facilityLabel: string | null }[] = [
    { url: page.profile?.coverUrl, confirmed: true, facilityLabel: null },
    ...visitors.filter((p) => p.confirmed),
    ...visitors.filter((p) => !p.confirmed),
  ]
  const out: GalleryPhoto[] = []
  for (const c of candidates) {
    const url = trustedImage(c.url)
    if (url && !out.some((p) => p.url === url)) out.push({ url, confirmed: c.confirmed, facilityLabel: c.facilityLabel })
    if (out.length === MAX_GALLERY_PHOTOS) break
  }
  return out
}

/** URLs safe for JSON-LD and og:image: confirmed photos only. */
export function confirmedGalleryUrls(
  page: Pick<PublicMasjidPage, 'profile' | 'photos'>,
): string[] {
  return galleryPhotos(page)
    .filter((p) => p.confirmed)
    .map((p) => p.url)
}
