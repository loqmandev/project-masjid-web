import { trustedImage } from './masjid-seo'
import type { PublicMasjidPage } from './masjid-types'

export const MAX_GALLERY_PHOTOS = 8
/** Images shown in the desktop mosaic: one large and up to four small. */
export const MOSAIC_MAX = 5

/**
 * AJK cover first (usually absent), then visitor photos, every URL through the
 * trusted-host allowlist, de-duplicated, at most eight.
 */
export function galleryPhotos(page: Pick<PublicMasjidPage, 'profile' | 'photos'>): string[] {
  const urls: string[] = []
  for (const url of [page.profile?.coverUrl, ...page.photos.map((p) => p.url)]) {
    const trusted = trustedImage(url)
    if (trusted && !urls.includes(trusted)) urls.push(trusted)
    if (urls.length === MAX_GALLERY_PHOTOS) break
  }
  return urls
}
