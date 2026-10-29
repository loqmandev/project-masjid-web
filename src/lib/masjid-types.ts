export const AUDIENCE_TAGS = [
  'belia',
  'wanita',
  'kanak_kanak',
  'warga_emas',
  'keluarga',
  'umum',
] as const
export const PROGRAM_CATEGORIES = [
  'kuliah',
  'ceramah',
  'kelas',
  'gotong_royong',
  'sukan',
  'majlis',
  'program_belia',
  'lain',
] as const
export const ATTENDING_AS = [
  'youth',
  'women',
  'family',
  'senior',
  'other',
] as const
export type AudienceTag = (typeof AUDIENCE_TAGS)[number]
export type ProgramCategory = (typeof PROGRAM_CATEGORIES)[number]
export type AjkActor = { ajkUserId: string } // shop_user.id, /^[A-Za-z0-9-]{8,64}$/
export type AjkRole = 'lead' | 'volunteer'
export type RecurringClass = {
  title: string
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6
  startTime: string /*HH:MM MYT*/
  note: string | null
}
export type PublicProgramCard = {
  id: string
  title: string
  category: ProgramCategory
  audienceTags: AudienceTag[]
  startsAt: string
  endsAt: string
  venueNote: string | null
  posterUrl: string | null
  foodProvided: boolean
  sponsorName: string | null
  sponsorLogoUrl: string | null
  registrationEnabled: boolean
  spotsLeft: number | null
  status: 'published' | 'cancelled'
}
export type PublicProgramDetail = PublicProgramCard & {
  description: string | null
  seriesId: string | null
  masjid: {
    id: string
    slug: string | null
    name: string
    districtName: string
    stateName: string
    lat: number
    lng: number
  }
}
export type FacilityCatalogueItem = {
  code: string
  label: string
  question: string
  shortDescription: string
  definition: string
  photoHint: string
  tier: 'standard' | 'critical'
  group: string
  sortOrder: number
  noReasons: { key: string; label: string }[]
}
export type FacilityCatalogueDetails = Pick<
  FacilityCatalogueItem,
  'code' | 'label' | 'shortDescription' | 'definition' | 'group' | 'sortOrder'
>
export type PublicFacility = {
  code: string
  state: 'masjid_verified' | 'confirmed' | 'unconfirmed'
  stateLabel: 'masjid_verified' | 'confirmed' | 'unconfirmed'
  summary: {
    visitorConfirmations: number
    proofPhotos: number
    lastCheckedAt: string | null
    verifiedAt: string | null
  }
  photos: { id: string; url: string; createdAt: string }[]
}
export type PublicMasjidPage = {
  masjid: {
    id: string
    slug: string
    name: string
    address: string
    districtName: string | null
    stateName: string
    lat: number
    lng: number
    type: string | null
  }
  claimed: boolean
  indexable: boolean
  // Omitted by the backend when facility info is off (including older backends).
  facilities?: PublicFacility[]
  // Optional reviews summary (backend flag). Untrusted until validateReviews() accepts it;
  // the loader strips it from `page` and returns the validated copy separately.
  reviews?: unknown
  profile: null | {
    description: string | null
    contactPhone: string | null
    whatsappUrl: string | null
    facilities: { code: string; label: string }[]
    recurringClasses: RecurringClass[]
    coverUrl: string | null
    updatedAt: string
  }
  upcomingPrograms: PublicProgramCard[]
  pastProgramCount: number
  photos: { url: string }[] // ≤ 8 masjid_photo WHERE status='approved' AND is_hidden=0, newest first
  posts: PublicMasjidPost[] // P3; [] before. news|volunteer|approved appeal, never khairat; ≤ 5 unexpired
}
export type PublicMasjidPost = {
  id: string
  type: 'news' | 'volunteer' | 'appeal'
  title: string
  body: string
  publishedAt: string
  expiresAt: string
}
export type SitemapPage = {
  total: number
  pageSize: number
  page: number
  items: { slug: string; lastmod: string }[]
}
