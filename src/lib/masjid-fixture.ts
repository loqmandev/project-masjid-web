import type { FacilityCatalogueItem, PrayerRoom, PublicFacility, PublicMasjidPage, PublicProgramDetail, PublicVenuePage, VenueSummary } from './masjid-types'
export const facilityCatalogue: FacilityCatalogueItem[] = [
  {
    code: 'PARKING_COMPOUND',
    label: 'Compound parking',
    question: 'Does this masjid have compound parking?',
    shortDescription: "Parking inside the masjid's own compound — not outside or by the roadside.",
    definition: "Cars can park inside the masjid's own compound (behind its gate or on its grounds), not on the street outside.",
    photoHint: 'The parking inside the gate. No people in the photo.',
    tier: 'critical',
    group: 'parking',
    sortOrder: 2,
    noReasons: [],
  },
  {
    code: 'WIFI',
    label: 'Wi-Fi',
    question: 'Does this masjid have wi-fi?',
    shortDescription: 'Wi-Fi visitors can use.',
    definition: 'Wi-Fi visitors can use.',
    photoHint: 'The facility, clearly visible. No people in the photo.',
    tier: 'standard',
    group: 'amenities',
    sortOrder: 13,
    noReasons: [],
  },
  {
    code: 'KOLAH',
    label: 'Kolah',
    question: 'Does this masjid have kolah?',
    shortDescription: 'A traditional wudhu pool.',
    definition: 'A traditional wudhu pool.',
    photoHint: 'The facility, clearly visible. No people in the photo.',
    tier: 'standard',
    group: 'wudhu',
    sortOrder: 11,
    noReasons: [],
  },
]
export const publicFacilities: PublicFacility[] = [
  {
    code: 'WIFI',
    state: 'confirmed',
    stateLabel: 'confirmed',
    summary: {
      visitorConfirmations: 4,
      proofPhotos: 2,
      lastCheckedAt: '2026-10-12 12:30:00',
      verifiedAt: null,
    },
    photos: [],
  },
  {
    code: 'PARKING_COMPOUND',
    state: 'masjid_verified',
    stateLabel: 'masjid_verified',
    summary: {
      visitorConfirmations: 0,
      proofPhotos: 0,
      lastCheckedAt: '2026-10-01T10:00:00Z',
      verifiedAt: '2026-10-01T10:00:00Z',
    },
    photos: [],
  },
  {
    code: 'KOLAH',
    state: 'unconfirmed',
    stateLabel: 'unconfirmed',
    summary: {
      visitorConfirmations: 1,
      proofPhotos: 0,
      lastCheckedAt: null,
      verifiedAt: null,
    },
    photos: [],
  },
]
export const page: PublicMasjidPage = {
  masjid: {
    id: 'fixture-masjid',
    slug: 'surau-fixture',
    name: 'Surau Fixture',
    address: 'Synthetic street',
    districtName: 'Fixture',
    stateName: 'Putrajaya',
    lat: 2.9,
    lng: 101.7,
    type: 'surau',
  },
  claimed: false,
  indexable: false,
  profile: null,
  upcomingPrograms: [],
  pastProgramCount: 0,
  photos: [],
  posts: [],
}
export const program: PublicProgramDetail = {
  id: 'fixture-program',
  title: 'Fixture program',
  category: 'kelas',
  audienceTags: ['umum'],
  startsAt: '2099-10-12T12:30:00.000Z',
  endsAt: '2099-10-12T13:30:00.000Z',
  venueNote: null,
  posterUrl: null,
  foodProvided: false,
  sponsorName: null,
  sponsorLogoUrl: null,
  registrationEnabled: true,
  spotsLeft: 4,
  status: 'published',
  description: null,
  seriesId: null,
  masjid: { ...page.masjid, districtName: 'Fixture' },
}

// Venue prayer rooms (SPEC_venue-prayer-rooms.md). Synthetic data only.
export const allRoom: PrayerRoom = {
  audience: 'all', floorLabel: 'Level UG', floorOrder: -1, zone: 'North Court',
  landmark: 'Between Typo and Uniqlo', directions: 'Take the lift near the food court to UG.',
  hasWudhu: true, accessNotes: 'Wheelchair accessible via lift B.', verified: true, verifiedAt: '2026-10-14',
}
export const menRoom: PrayerRoom = {
  audience: 'men', floorLabel: 'Level 2', floorOrder: 2, zone: 'North Court',
  landmark: null, directions: null, hasWudhu: true, accessNotes: null, verified: true, verifiedAt: '2026-10-14',
}
export const womenRoom: PrayerRoom = {
  audience: 'women', floorLabel: 'Level 1', floorOrder: 1, zone: null,
  landmark: null, directions: null, hasWudhu: null, accessNotes: null, verified: true, verifiedAt: '2026-10-14',
}
export const unverifiedRoom: PrayerRoom = { ...allRoom, verified: false, verifiedAt: null }
export const venue: VenueSummary = {
  slug: 'mall-fixture', name: 'Mall Fixture', kind: 'mall', openingHours: '10am to 10pm', placeCount: 2,
}
export const venuePage: PublicVenuePage = {
  venue: {
    slug: 'mall-fixture', name: 'Mall Fixture', kind: 'mall', address: 'Synthetic mall road',
    districtName: 'Fixture', stateName: 'Putrajaya', lat: 2.9, lng: 101.7, openingHours: '10am to 10pm', websiteUrl: null,
  },
  indexable: true,
  places: [
    { slug: 'surau-mall-fixture-women', name: 'Surau Mall Fixture (Women)', type: 'surau', rooms: [womenRoom] },
    { slug: 'surau-mall-fixture', name: 'Surau Mall Fixture', type: 'surau', rooms: [allRoom] },
    { slug: 'surau-mall-fixture-annex', name: 'Surau Annex', type: 'surau', rooms: [] },
  ],
}
