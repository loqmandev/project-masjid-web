import { trustedImage } from './masjid-seo'
import type { PublicMasjidPage } from './masjid-types'

export const MAX_GALLERY_PHOTOS = 8
/** Images shown in the desktop mosaic: one large and up to four small. */
export const MOSAIC_MAX = 5

export type GalleryPhoto = { url: string; confirmed: boolean }

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
    const { url, confirmed } = entry as { url?: unknown; confirmed?: unknown }
    if (typeof url !== 'string') continue
    out.push({ url, confirmed: confirmed !== false })
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
  const visitors = (page.photos ?? []).map((p) => ({ url: p.url, confirmed: p.confirmed !== false }))
  const candidates: { url: string | null | undefined; confirmed: boolean }[] = [
    { url: page.profile?.coverUrl, confirmed: true },
    ...visitors.filter((p) => p.confirmed),
    ...visitors.filter((p) => !p.confirmed),
  ]
  const out: GalleryPhoto[] = []
  for (const c of candidates) {
    const url = trustedImage(c.url)
    if (url && !out.some((p) => p.url === url)) out.push({ url, confirmed: c.confirmed })
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
