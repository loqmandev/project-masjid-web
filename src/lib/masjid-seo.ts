import type { PublicMasjidPage, PublicProgramDetail } from './masjid-types'
import { seo } from './seo'
import { placeParts } from './masjid-format'
export function trustedImage(url: string | null | undefined, program = false) {
  if (!url) return undefined
  try {
    const u = new URL(url)
    return u.protocol === 'https:' &&
      !u.username &&
      !u.password &&
      !u.port &&
      ((u.hostname === 'shop.jejakmasjid.my' &&
        u.pathname.startsWith(program ? '/media/ajk/' : '/media/')) ||
        (!program &&
          ([
            'images.jejakmasjid.my',
            'cdn.jejakmasjid.my',
            'bucket.jejakmasjid.my',
          ].includes(u.hostname) ||
            (u.hostname === 'imagedelivery.net' &&
              /^\/[A-Za-z0-9_-]+\/[^/]+\/[^/]+$/.test(u.pathname)))))
      ? url
      : undefined
  } catch {
    return undefined
  }
}
// CF Images accepts any account hash: backend-built approved photos are the source.
export function sentenceDescription(
  text: string | null | undefined,
  limit = 150,
) {
  const clean = text?.replace(/\s+/g, ' ').trim()
  if (!clean || clean.length <= limit) return clean
  const prefix = clean.slice(0, limit)
  const sentences = prefix.match(/.*[.!?](?=\s|$)/)
  if (sentences) return sentences[0]
  const boundary = prefix.lastIndexOf(' ')
  return (boundary > 0 ? prefix.slice(0, boundary) : prefix).trimEnd()
}
export function masjidSeo(p: PublicMasjidPage, ajk = false) {
  const m = p.masjid,
    text = sentenceDescription(p.profile?.description),
    place = placeParts(m.districtName, m.stateName),
    placeShort = place.district || place.state
  return seo({
    title: placeShort ? `${m.name} · ${placeShort}` : m.name,
    description:
      text ||
      (ajk
        ? `${m.name} in ${place.prose}. Programs, photos and directions on Jejak Masjid.`
        : `${m.name} in ${place.prose}. Photos, prayer times and directions on Jejak Masjid.`),
    path: `/masjid/${m.slug}`,
    noindex: !p.indexable,
    image:
      trustedImage(p.profile?.coverUrl) ||
      p.photos.map((photo) => trustedImage(photo.url)).find(Boolean),
  })
}
export function programSeo(p: PublicProgramDetail, now = Date.now()) {
  return seo({
    title: `${p.title} · ${p.masjid.name}`,
    description:
      sentenceDescription(p.description) || `A program at ${p.masjid.name}.`,
    path: `/masjid/${p.masjid.slug}/p/${p.id}`,
    type: 'article',
    noindex: p.status === 'cancelled' || Date.parse(p.endsAt) < now,
    image: trustedImage(p.posterUrl, true),
  })
}
