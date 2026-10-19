import type { FacilityCatalogueItem, PublicFacility } from './masjid-types'

export const isProvenFacility = (facility: PublicFacility) =>
  facility.state === 'masjid_verified' || facility.state === 'confirmed'

// Only catalogue-backed public states get labels/definitions. Never promote a
// legacy profile list or an unknown/hidden state into a proven facility.
export function publicFacilityDetails(
  facilities: PublicFacility[],
  catalogue: FacilityCatalogueItem[],
) {
  const byCode = new Map(catalogue.map((item) => [item.code, item]))
  return facilities
    .filter((item) => isProvenFacility(item) || item.state === 'unconfirmed')
    .flatMap((facility) => {
      const details = byCode.get(facility.code)
      return details ? [{ facility, details }] : []
    })
    .sort(
      (a, b) =>
        a.details.sortOrder - b.details.sortOrder ||
        a.facility.code.localeCompare(b.facility.code),
    )
}

// D1 timestamps without an offset are UTC. Fix both parsing and display zones
// so SSR and hydration agree, including near midnight in Malaysia.
function facilityDate(value: string | null, monthOnly = false) {
  if (!value) return null
  const iso = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)
    ? value.replace(' ', 'T') + 'Z'
    : value
  const date = new Date(iso)
  if (!Number.isFinite(date.getTime())) return null
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kuala_Lumpur',
    ...(monthOnly ? {} : { day: 'numeric' as const }),
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function facilityTrustLine(facility: PublicFacility) {
  const { summary } = facility
  if (facility.state === 'masjid_verified') {
    const updated = facilityDate(summary.verifiedAt, true)
    return `Masjid verified${updated ? ` · updated ${updated}` : ''}`
  }
  if (facility.state === 'unconfirmed') return 'Reported, not confirmed'
  const checked = facilityDate(summary.lastCheckedAt)
  return [
    `Confirmed by ${summary.visitorConfirmations} ${summary.visitorConfirmations === 1 ? 'visitor' : 'visitors'}`,
    `${summary.proofPhotos} ${summary.proofPhotos === 1 ? 'photo' : 'photos'}`,
    ...(checked ? [`last checked ${checked}`] : []),
  ].join(' · ')
}
