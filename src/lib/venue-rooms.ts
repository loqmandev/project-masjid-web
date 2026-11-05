import type {
  PrayerRoom,
  PublicVenuePage,
  RoomAudience,
  VenueKind,
  VenueSummary,
} from './masjid-types'
import { VENUE_KINDS } from './masjid-types'

/**
 * In-venue prayer rooms ("where in the mall is the surau") and venue pages.
 * Everything the backend sends is untrusted until it passes through here: malformed
 * rooms are dropped, optional strings are capped to the backend limits, and nothing
 * outside the contract keys survives.
 */

export const VENUE_SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/
export const validVenueSlug = (s: unknown): s is string =>
  typeof s === 'string' && s.length >= 3 && s.length <= 100 && VENUE_SLUG.test(s)

const isObject = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v)
const AUDIENCES: RoomAudience[] = ['all', 'men', 'women']
const AUDIENCE_RANK: Record<RoomAudience, number> = { all: 0, men: 1, women: 2 }
const DATE = /^\d{4}-\d{2}-\d{2}/
// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g

/** Trimmed string capped to `max`, or null when empty / not a string. */
function capped(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null
  const s = v.replace(CONTROL, '').trim()
  return s ? s.slice(0, max) : null
}

export function validateRoom(value: unknown): PrayerRoom | null {
  if (!isObject(value)) return null
  const audience = value.audience
  if (!AUDIENCES.includes(audience as RoomAudience)) return null
  const floorLabel = capped(value.floorLabel, 31)
  if (!floorLabel || floorLabel.length > 30) return null
  const floorOrder = value.floorOrder
  if (typeof floorOrder !== 'number' || !Number.isInteger(floorOrder)) return null
  const hasWudhu = value.hasWudhu
  if (hasWudhu !== null && typeof hasWudhu !== 'boolean') return null
  if (typeof value.verified !== 'boolean') return null
  const verified = value.verified
  const rawDate = value.verifiedAt
  const verifiedAt =
    verified && typeof rawDate === 'string' && DATE.test(rawDate)
      ? rawDate.slice(0, 10)
      : null
  return {
    audience: audience as RoomAudience,
    floorLabel,
    floorOrder,
    zone: capped(value.zone, 60),
    landmark: capped(value.landmark, 60),
    directions: capped(value.directions, 500),
    hasWudhu,
    accessNotes: capped(value.accessNotes, 300),
    verified,
    verifiedAt,
  }
}

/** Drops malformed rooms, repeats of one audience, and sorts like the backend. */
export function validateRooms(value: unknown): PrayerRoom[] {
  if (!Array.isArray(value)) return []
  const seen = new Set<RoomAudience>()
  const rooms: PrayerRoom[] = []
  for (const raw of value.slice(0, 12)) {
    const room = validateRoom(raw)
    if (!room || seen.has(room.audience)) continue
    seen.add(room.audience)
    rooms.push(room)
  }
  // Mirror the backend rule: `all` never coexists with men/women; `all` wins.
  const only = rooms.some((r) => r.audience === 'all') ? rooms.filter((r) => r.audience === 'all') : rooms
  return only
    .slice(0, 3)
    .sort(
      (a, b) =>
        a.floorOrder - b.floorOrder ||
        AUDIENCE_RANK[a.audience] - AUDIENCE_RANK[b.audience],
    )
}

export function validateVenueSummary(value: unknown): VenueSummary | null {
  if (!isObject(value)) return null
  const { slug, kind, placeCount } = value
  if (!validVenueSlug(slug)) return null
  const name = capped(value.name, 120)
  if (!name) return null
  if (typeof placeCount !== 'number' || !Number.isInteger(placeCount) || placeCount < 1 || placeCount > 10000)
    return null
  return {
    slug,
    name,
    kind: VENUE_KINDS.includes(kind as VenueKind) ? (kind as VenueKind) : 'other',
    openingHours: capped(value.openingHours, 200),
    placeCount,
  }
}

export function validateVenuePage(value: unknown): PublicVenuePage | null {
  if (!isObject(value) || !isObject(value.venue) || !Array.isArray(value.places))
    return null
  const v = value.venue
  if (!validVenueSlug(v.slug)) return null
  const name = capped(v.name, 120)
  const address = capped(v.address, 300)
  const districtName = capped(v.districtName, 100)
  const stateName = capped(v.stateName, 100)
  if (!name || !address || !stateName) return null
  if (typeof v.lat !== 'number' || !Number.isFinite(v.lat) || Math.abs(v.lat) > 90) return null
  if (typeof v.lng !== 'number' || !Number.isFinite(v.lng) || Math.abs(v.lng) > 180) return null
  if (typeof value.indexable !== 'boolean') return null
  const places: PublicVenuePage['places'] = []
  for (const raw of value.places.slice(0, 100)) {
    if (!isObject(raw) || !validVenueSlug(raw.slug)) continue
    const placeName = capped(raw.name, 160)
    if (!placeName) continue
    places.push({
      slug: raw.slug,
      name: placeName,
      type: capped(raw.type, 30),
      rooms: validateRooms(raw.rooms),
    })
  }
  if (!places.length) return null
  const site = typeof v.websiteUrl === 'string' && v.websiteUrl.startsWith('https://') ? v.websiteUrl : null
  return {
    venue: {
      slug: v.slug,
      name,
      kind: VENUE_KINDS.includes(v.kind as VenueKind) ? (v.kind as VenueKind) : 'other',
      address,
      districtName,
      stateName,
      lat: v.lat,
      lng: v.lng,
      openingHours: capped(v.openingHours, 200),
      websiteUrl: site,
    },
    indexable: value.indexable,
    places,
  }
}

// ---------------------------------------------------------------- floor in name

const tokens = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const LEVEL = '(?:level|lvl|aras|tingkat|tkt|floor|fl)'

/**
 * Canonical floor keys in a text: "Level 2" ~ "L2" ~ "Aras 2" ~ "Tingkat 2" ~ "2nd Floor"
 * -> "2"; "Basement 1" ~ "B1" -> "b1"; "Upper Ground" ~ "UG" -> "ug"; "Lower Ground" ~
 * "LG" -> "lg"; "Ground" ~ "Level G" -> "g". `l` is a level prefix only directly before a
 * digit, so "LG" is never "Level G". Known rare false positive: "Blok L1" reads as level 1.
 */
export function floorKeys(text: string): Set<string> {
  let s = ` ${tokens(text)} `
  const keys = new Set<string>()
  const take = (re: RegExp, key: (m: RegExpMatchArray) => string) => {
    s = s.replace(re, (...m) => {
      keys.add(key(m as unknown as RegExpMatchArray))
      return ' '
    })
  }
  take(/ (?:level |lvl |aras |tingkat |tkt |floor |fl )?(?:upper ground|ug) /g, () => 'ug')
  take(/ (?:level |lvl |aras |tingkat |tkt |floor |fl )?(?:lower ground|lg) /g, () => 'lg')
  take(/ (?:basement|bsmt) (\d{1,2}) /g, (m) => `b${m[1]}`)
  take(/ (?:level |lvl |aras |tingkat |tkt |floor |fl )?b(\d{1,2}) /g, (m) => `b${m[1]}`)
  take(/ (?:ground floor|ground|g floor) /g, () => 'g')
  take(new RegExp(` ${LEVEL} g `, 'g'), () => 'g')
  take(new RegExp(` ${LEVEL} ?(\\d{1,2}) `, 'g'), (m) => String(Number(m[1])))
  take(/ l(\d{1,2}) /g, (m) => String(Number(m[1])))
  take(/ (\d{1,2})(?:st|nd|rd|th) floor /g, (m) => String(Number(m[1])))
  return keys
}

/** True when the place name already says the floor (aliases normalised on both sides). */
export function nameMentionsFloor(name: string, floorLabel: string): boolean {
  const label = floorKeys(floorLabel)
  const bare = tokens(floorLabel)
  if (!label.size) {
    if (bare === 'g') label.add('g')
    else if (/^\d{1,2}$/.test(bare)) label.add(String(Number(bare)))
  }
  if (!label.size) return false
  const found = floorKeys(name)
  return [...label].some((k) => found.has(k))
}

// ---------------------------------------------------------------- SEO helpers

export const verifiedRooms = (rooms: PrayerRoom[] | undefined) =>
  (rooms ?? []).filter((r) => r.verified)

/**
 * The room whose floor may go in the title: a verified `all` room, or the masjid's only
 * room when that one is verified. A verified men room beside an unverified women room
 * gives no floor, so nobody is sent to the wrong audience's floor.
 */
export function titleRoom(rooms: PrayerRoom[] | undefined): PrayerRoom | null {
  const list = rooms ?? []
  const all = list.find((r) => r.audience === 'all' && r.verified)
  if (all) return all
  return list.length === 1 && list[0].verified ? list[0] : null
}

export const TITLE_LIMIT = 60

export function roomTitle(name: string, district: string | null, rooms: PrayerRoom[] | undefined) {
  const room = titleRoom(rooms)
  const base = district ? `${name} · ${district}` : name
  if (!room || nameMentionsFloor(name, room.floorLabel)) return base
  const floor = room.floorLabel
  const candidates = [
    [name, room.zone ? `${floor}, ${room.zone}` : floor, district],
    [name, floor, district],
    [name, floor],
  ].map((parts) => parts.filter(Boolean).join(' · '))
  // Name and floor are never cut: if `name · floor` alone exceeds the limit it stays long
  // (Google truncates; the floor is the click-through value).
  return candidates.find((c) => c.length <= TITLE_LIMIT) ?? candidates[candidates.length - 1]
}

const AUDIENCE_NAME: Record<RoomAudience, string> = { all: '', men: 'Lelaki', women: 'Wanita' }
export const DESCRIPTION_LIMIT = 155
const SUFFIXES = [
  " Today's prayer times, facilities and visitor photos on Jejak Masjid.",
  ' Prayer times and photos on Jejak Masjid.',
  '',
]

export function roomDescription(rooms: PrayerRoom[] | undefined): string | null {
  const v = byAudience(verifiedRooms(rooms))
  if (!v.length) return null
  const build = (landmark: boolean, zone: boolean, suffix: string) => {
    const bits = v.map((r) => {
      // A men + women pair names floors only; zone and landmark are for a single room.
      const single = v.length === 1
      const where = [r.floorLabel, zone && single ? r.zone : null, landmark && single ? r.landmark : null]
        .filter(Boolean)
        .join(', ')
      const who = v.length > 1 || r.audience !== 'all' ? AUDIENCE_NAME[r.audience] : ''
      return who ? `${who} ${where}` : where
    })
    return `Where to find it: ${bits.join(', ')}.${suffix}`
  }
  for (const suffix of SUFFIXES)
    for (const [landmark, zone] of [[true, true], [false, true], [false, false]] as const) {
      const d = build(landmark, zone, suffix)
      if (d.length <= DESCRIPTION_LIMIT) return d
    }
  return build(false, false, '')
}

// ---------------------------------------------------------------- display lines

const monthYear = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', month: 'short', year: 'numeric' })
export function verifiedLabel(room: Pick<PrayerRoom, 'verified' | 'verifiedAt'>): string {
  if (!room.verified) return 'Not yet confirmed'
  const t = room.verifiedAt ? Date.parse(room.verifiedAt) : NaN
  return Number.isFinite(t) ? `Verified ${monthYear.format(new Date(t))}` : 'Verified'
}

export const wudhuText = (h: boolean | null) =>
  h === true ? 'Tempat wudhu ada' : h === false ? 'Tiada tempat wudhu' : null

export type RoomBlock = {
  /** Plain text lines, most important first. */
  lines: string[]
  /** How many leading lines are the location itself (rest are muted detail). */
  strong: number
  /** Disclosure content (directions + access notes), if any room has some. */
  details: { label: string | null; directions: string | null; accessNotes: string | null }[]
}

/** Lines for the masjid page "Where to find it" block (spec §2). */
const byAudience = (rooms: PrayerRoom[]) =>
  [...rooms].sort((a, b) => AUDIENCE_RANK[a.audience] - AUDIENCE_RANK[b.audience])

export function roomBlock(input: PrayerRoom[]): RoomBlock {
  // Men before women, as in the spec example; floors read from each line.
  const rooms = byAudience(input)
  const place = (r: PrayerRoom) => [r.floorLabel, r.zone].filter(Boolean).join(' · ')
  const lines: string[] = []
  if (rooms.length === 1) {
    const r = rooms[0]
    lines.push(r.audience === 'all' ? place(r) : `${AUDIENCE_NAME[r.audience]}: ${place(r)}`)
    const second = [r.landmark, wudhuText(r.hasWudhu)].filter(Boolean).join(' · ')
    if (second) lines.push(second)
    lines.push([r.audience === 'all' ? 'Lelaki & wanita' : null, verifiedLabel(r)].filter(Boolean).join(' · '))
  } else {
    const allVerified = rooms.every((r) => r.verified)
    for (const r of rooms) {
      const who = r.audience === 'all' ? 'Lelaki & wanita' : AUDIENCE_NAME[r.audience]
      lines.push(
        [`${who}: ${place(r)}`, r.landmark, wudhuText(r.hasWudhu), allVerified ? null : verifiedLabel(r)]
          .filter(Boolean)
          .join(' · '),
      )
    }
    if (allVerified) {
      const dates = rooms.map((r) => r.verifiedAt).filter((d): d is string => !!d).sort()
      lines.push(verifiedLabel({ verified: true, verifiedAt: dates[0] ?? null }))
    }
  }
  const details = rooms
    .filter((r) => r.directions || r.accessNotes)
    .map((r) => ({
      label: rooms.length > 1 ? (r.audience === 'all' ? 'Lelaki & wanita' : AUDIENCE_NAME[r.audience]) : null,
      directions: r.directions,
      accessNotes: r.accessNotes,
    }))
  return { lines, strong: rooms.length === 1 ? 1 : rooms.length, details }
}

/** Venue link text under the block, by place count (spec §2). */
export const venueLinkText = (v: Pick<VenueSummary, 'name' | 'placeCount'>) =>
  v.placeCount > 1 ? `All prayer spaces in ${v.name} →` : `More about ${v.name}`

/** Venue page description (spec §4). */
export function venueDescription(name: string, placeCount: number, floors: string[]) {
  return floors.length
    ? `Where to pray in ${name}: ${placeCount} prayer ${placeCount === 1 ? 'space' : 'spaces'}, ${floors.join(', ')}. Floors, wudhu and directions on Jejak Masjid.`
    : `Where to pray in ${name}: floors, wudhu and directions on Jejak Masjid.`
}
