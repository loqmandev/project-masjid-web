import type {
  FacilityCatalogueDetails,
  PublicMasjidPage,
  PublicProgramDetail,
} from './masjid-types'
import { isProvenFacility, publicFacilityDetails } from './masjid-facilities'
import { SITE } from './site'
import { directionsUrl, localISO, placeParts } from './masjid-format'
import { trustedImage } from './masjid-seo'
import { galleryPhotos } from './masjid-gallery'

export function countryAddress(state: string) {
  const malaysianStates = new Set([
    'johor',
    'kedah',
    'kelantan',
    'melaka',
    'malacca',
    'negeri sembilan',
    'pahang',
    'perak',
    'perlis',
    'pulau pinang',
    'penang',
    'sabah',
    'sarawak',
    'selangor',
    'terengganu',
    'kuala lumpur',
    'putrajaya',
    'labuan',
  ])
  const name = state
    .toLowerCase()
    .replace(/^(wilayah persekutuan|w\.?p\.?)\s+/, '')
    .trim()
  return malaysianStates.has(name) ? { addressCountry: 'MY' } : {}
}
export function jsonLdScript(value: unknown) {
  const escapes: Record<string, string> = {
    '<': '\\u003c',
    '>': '\\u003e',
    '&': '\\u0026',
    '\u2028': '\\u2028',
    '\u2029': '\\u2029',
  }
  return JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, (c) => escapes[c])
}
// The AJK cover wins; otherwise up to three trusted visitor photos.
function imageField(page: PublicMasjidPage) {
  const cover = trustedImage(page.profile?.coverUrl)
  if (cover) return { image: cover }
  const photos = galleryPhotos({ profile: null, photos: page.photos }).slice(0, 3)
  return photos.length ? { image: photos } : {}
}
export function mosqueJsonLd(
  page: PublicMasjidPage,
  ajk = false,
  catalogue: FacilityCatalogueDetails[] = [],
) {
  const m = page.masjid,
    url = `${SITE.url}/masjid/${m.slug}`,
    place = placeParts(m.districtName, m.stateName),
    district = place.district,
    events = !ajk
      ? []
      : page.upcomingPrograms
          .filter((p) => p.status === 'published')
          .slice(0, 10)
          .map((p) => ({
            '@type': 'Event',
            url: `${url}/p/${p.id}`,
            name: p.title,
            startDate: localISO(p.startsAt),
          }))
  const amenities = Array.isArray(page.facilities)
    ? publicFacilityDetails(page.facilities, catalogue)
        .filter(({ facility }) => isProvenFacility(facility))
        .map(({ details }) => ({
          '@type': 'LocationFeatureSpecification',
          name: details.label,
          value: true,
        }))
    : []
  return {
    '@context': 'https://schema.org',
    '@type': 'Mosque',
    '@id': url + '#place',
    name: m.name,
    url,
    address: {
      '@type': 'PostalAddress',
      streetAddress: m.address,
      ...(district ? { addressLocality: district } : {}),
      addressRegion: place.state ?? m.stateName,
      ...countryAddress(m.stateName),
    },
    geo: { '@type': 'GeoCoordinates', latitude: m.lat, longitude: m.lng },
    hasMap: directionsUrl(m.lat, m.lng),
    ...(page.profile?.contactPhone
      ? { telephone: page.profile.contactPhone }
      : {}),
    ...imageField(page),
    ...(events.length ? { event: events } : {}),
    ...(amenities.length ? { amenityFeature: amenities } : {}),
  }
}
export function eventJsonLd(p: PublicProgramDetail) {
  const url = `${SITE.url}/masjid/${p.masjid.slug}`
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: p.title,
    startDate: localISO(p.startsAt),
    endDate: localISO(p.endsAt),
    eventStatus: `https://schema.org/Event${p.status === 'cancelled' ? 'Cancelled' : 'Scheduled'}`,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Mosque',
      '@id': url + '#place',
      name: p.masjid.name,
      address: {
        '@type': 'PostalAddress',
        addressLocality: p.masjid.districtName,
        addressRegion: p.masjid.stateName,
        ...countryAddress(p.masjid.stateName),
      },
    },
    organizer: { '@type': 'Organization', name: p.masjid.name, url },
    isAccessibleForFree: true,
    ...(trustedImage(p.posterUrl, true)
      ? { image: trustedImage(p.posterUrl, true) }
      : {}),
    ...(p.description ? { description: p.description } : {}),
    ...(p.sponsorName
      ? { sponsor: { '@type': 'Organization', name: p.sponsorName } }
      : {}),
  }
}
