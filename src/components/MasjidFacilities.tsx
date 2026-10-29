import type { ReactNode } from 'react'
import { Check, CircleDashed, ShieldCheck, UsersRound } from 'lucide-react'
import {
  facilityTrustLine,
  isProvenFacility,
  publicFacilityDetails,
} from '@/lib/masjid-facilities'
import { trustedImage } from '@/lib/masjid-seo'
import type { FacilityCatalogueDetails, PublicFacility } from '@/lib/masjid-types'

type FacilityDetails = ReturnType<typeof publicFacilityDetails>[number]
const groupLabels: Record<string, string> = {
  amenities: 'Amenities',
  parking: 'Parking',
  prayer: 'Prayer spaces',
  wudhu: 'Wudhu',
  accessibility: 'Accessibility',
  toilets: 'Toilets',
  services: 'Services',
}

function VisitorsIcon({ label }: { label?: string }) {
  return (
    <span
      className="facility-visitors-icon"
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
    >
      <UsersRound size={18} aria-hidden="true" />
      <Check size={11} className="facility-visitors-check" aria-hidden="true" />
    </span>
  )
}

function FacilityIcon({ state }: { state: PublicFacility['state'] }) {
  if (state === 'masjid_verified')
    return <ShieldCheck size={18} role="img" aria-label="Masjid verified" />
  if (state === 'confirmed') return <VisitorsIcon label="Confirmed by visitors" />
  return <CircleDashed size={18} role="img" aria-label="Reported, not confirmed" />
}

function FacilityChip({
  facility,
  details,
  masjidName,
}: FacilityDetails & { masjidName: string }) {
  const photos = facility.photos
    .filter((photo) => trustedImage(photo.url))
    .slice(0, 4)
  return (
    <details className="facility-item" data-facility-state={facility.state}>
      <summary className={`facility-chip facility-chip--${facility.state}`}>
        <span>{details.label}</span>
        <FacilityIcon state={facility.state} />
      </summary>
      <div className="facility-info">
        <p>{details.definition || details.shortDescription}</p>
        <p className="facility-trust">{facilityTrustLine(facility)}</p>
        {facility.state === 'masjid_verified' && (
          <p>Confirmed by the committee of {masjidName}.</p>
        )}
        {!!photos.length && (
          <div className="facility-photos">
            {photos.map((photo, i) => (
              <a key={photo.id} href={photo.url}>
                <img
                  src={photo.url}
                  alt={`${details.label} at ${masjidName}, photo ${i + 1}`}
                  width={240}
                  height={160}
                  loading="lazy"
                />
              </a>
            ))}
          </div>
        )}
      </div>
    </details>
  )
}

function FacilityChips({
  items,
  masjidName,
  children,
}: {
  items: FacilityDetails[]
  masjidName: string
  children?: ReactNode
}) {
  return (
    <div className="facility-chips">
      {items.map((item) => (
        <FacilityChip key={item.facility.code} {...item} masjidName={masjidName} />
      ))}
      {children}
    </div>
  )
}

export default function MasjidFacilities({
  facilities,
  catalogue,
  masjidName,
}: {
  facilities: PublicFacility[]
  catalogue: FacilityCatalogueDetails[]
  masjidName: string
}) {
  const items = publicFacilityDetails(facilities, catalogue)
  const proven = items.filter(({ facility }) => isProvenFacility(facility))
  const reported = items.filter(({ facility }) => facility.state === 'unconfirmed')
  const missingDetails = facilities.some(
    (facility) =>
      (isProvenFacility(facility) || facility.state === 'unconfirmed') &&
      !items.some((item) => item.facility.code === facility.code),
  )
  const groups = new Map<string, FacilityDetails[]>()
  for (const item of proven) {
    const group = item.details.group ?? ''
    groups.set(group, [...(groups.get(group) ?? []), item])
  }
  // Reported items collapse into one dashed chip that opens the disclosure.
  const reportedChip = !!reported.length && (
    <details className="facility-reported">
      <summary className="facility-reported-chip">
        + {reported.length} reported by visitors
      </summary>
      <p>
        Visitors haven't confirmed these yet. Visiting? Confirm them in the
        Jejak Masjid app.
      </p>
      <FacilityChips items={reported} masjidName={masjidName} />
    </details>
  )
  return (
    <section className="facility-section" aria-labelledby="facilities-title">
      <h2 id="facilities-title">Facilities</h2>
      {!facilities.some(isProvenFacility) && <p>No confirmed facilities yet.</p>}
      {missingDetails && (
        <p>Some facility details are resting for a moment. Please try again.</p>
      )}
      {proven.length > 8 ? (
        <>
          {[...groups].map(([group, grouped]) => (
            <div key={group}>
              <h3>{groupLabels[group] ?? (group ? group.replace(/_/g, ' ') : 'Other')}</h3>
              <FacilityChips items={grouped} masjidName={masjidName} />
            </div>
          ))}
          {reportedChip && <div className="facility-chips mt-3">{reportedChip}</div>}
        </>
      ) : (
        (proven.length > 0 || reportedChip) && (
          <FacilityChips items={proven} masjidName={masjidName}>
            {reportedChip}
          </FacilityChips>
        )
      )}
      {proven.length > 0 && (
        <p className="facility-legend">
          <span>
            <ShieldCheck aria-hidden="true" />
            Verified by the masjid
          </span>
          <span>
            <VisitorsIcon />
            Confirmed by visitors
          </span>
        </p>
      )}
      <details className="facility-help">
        <summary>How we check facilities</summary>
        <ul>
          <li>Masjid verified means the committee confirmed it.</li>
          <li>Confirmed by visitors means people who checked in confirmed it.</li>
          <li>Reported, not confirmed is shown in grey.</li>
          <li>24 hours needs several visitors inside at night.</li>
          <li>Women friendly and compound parking need a photo.</li>
        </ul>
      </details>
    </section>
  )
}
