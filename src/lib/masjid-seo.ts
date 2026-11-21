import type { PublicMasjidPage, PublicProgramDetail } from './masjid-types'
import { seo } from './seo'
import { placeParts } from './masjid-format'
import { roomDescription, roomTitle, venueDescription, verifiedRooms } from './venue-rooms'
import type { PublicVenuePage } from './masjid-types'
import { countryAddress } from './jsonld'
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
/**
 * Description for a masjid page with no AJK text and no verified room. Malaysian pages are
 * Malay, like the searches that reach them ("masjid salahuddin manjung"); pages elsewhere
 * (Singapore, Sydney, ...) stay English.
 */
function fallbackDescription(name: string, prose: string, ajk: boolean, malay: boolean, jumaat = false) {
  if (malay)
    return ajk
      ? `${name} di ${prose}. Program, foto dan arah ke masjid di Jejak Masjid.`
      : `${name}${prose ? ` di ${prose}` : ''}: waktu solat hari ini${jumaat ? ', solat Jumaat' : ''}, kemudahan, foto dan ulasan pengunjung di Jejak Masjid.`
  return ajk
    ? `${name} in ${prose}. Programs, photos and directions on Jejak Masjid.`
    : `${name}${prose ? ` in ${prose}` : ''}: today's prayer times, facilities, photos and reviews from visitors on Jejak Masjid.`
}
/**
 * Friday prayer is held here: in Malaysia a masjid (type `masjid`) hosts Jumaat by
 * definition, and a surau or R&R prayer hall only when its name says so ("Surau Jumaat",
 * "(Solat Jumaat)").
 */
export const holdsJumaat = (type: string | null, name: string) =>
  /jumaa?t/i.test(name) ||
  ((type == null || type === 'masjid') &&
    !/^\s*(surau|musolla|musollah|musalla)\b/i.test(name) &&
    // Rest-stop prayer halls are often typed `masjid` without holding Jumaat.
    !/\b(rnr|r\s?&\s?r|hentian|rehat)\b/i.test(name))

/**
 * Names as searched: the backend title-cases ALL-CAPS names, so "RNR" arrives as "Rnr"
 * and "R&R" as "R&r". Restore those, and space a bracket glued to a word ("Gambang(arah").
 */
export function searchName(name: string) {
  return name
    .replace(/\brnr\b/gi, 'RnR')
    .replace(/\br\s?&\s?r\b/gi, 'R&R')
    .replace(/(\S)\(/g, '$1 (')
}
export function masjidSeo(p: PublicMasjidPage, ajk = false) {
  const m = { ...p.masjid, name: searchName(p.masjid.name) },
    text = sentenceDescription(p.profile?.description),
    place = placeParts(m.districtName, m.stateName),
    placeShort = place.district || place.state
  return seo({
    title: roomTitle(m.name, placeShort, p.rooms),
    description:
      text ||
      roomDescription(p.rooms) ||
      fallbackDescription(
        m.name,
        place.prose,
        ajk,
        !!countryAddress(m.stateName).addressCountry,
        holdsJumaat(m.type, m.name),
      ),
    path: `/masjid/${m.slug}`,
    noindex: !p.indexable,
    image:
      trustedImage(p.profile?.coverUrl) ||
      p.photos
        .filter((photo) => photo.confirmed !== false)
        .map((photo) => trustedImage(photo.url))
        .find(Boolean),
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

/** /surau/{venue}: title, description (verified floors only), canonical, noindex flag. */
export function venueSeo(p: PublicVenuePage) {
  const v = p.venue,
    place = placeParts(v.districtName, v.stateName),
    short = place.district || place.state,
    floors = [
      ...new Set(
        p.places.flatMap((x) => verifiedRooms(x.rooms).map((r) => r.floorLabel)),
      ),
    ]
  return seo({
    // Drop the district when the title would pass 60 characters; the venue name stays whole.
    title:
      short && `Surau di ${v.name} · ${short}`.length <= 60
        ? `Surau di ${v.name} · ${short}`
        : `Surau di ${v.name}`,
    description: venueDescription(v.name, p.places.length, floors),
    // A venue with one prayer space repeats its place page, and the two split the same
    // searches ("surau mitsui outlet"). Point the canonical at the place page instead.
    path: p.places.length === 1 ? `/masjid/${p.places[0].slug}` : `/surau/${v.slug}`,
    noindex: !p.indexable,
  })
}
