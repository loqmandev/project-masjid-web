import { expect, it } from 'vitest'
import {
  nameMentionsFloor, roomBlock, roomDescription, roomTitle, validateRooms,
  validateVenuePage, validateVenueSummary, venueDescription, venueLinkText, verifiedLabel,
} from './venue-rooms'
import { allRoom, menRoom, womenRoom, unverifiedRoom, venue, venuePage } from './masjid-fixture'

it.each([
  ['Surau Level 2 Setia City Mall', 'Level 2', true],
  ['Surau L2 Setia City Mall', 'Level 2', true],
  ['Surau Aras 2 Mall', 'Level 2', true],
  ['Surau Tingkat 2 Mall', 'L2', true],
  ['Surau UG Mall', 'Level UG', true],
  ['Surau LG Mall', 'LG', true],
  ['Surau B1 Mall', 'Level B1', true],
  ['Surau Ground Floor Mall', 'Ground Floor', true],
  ['Surau Mall', 'Level 2', false],
  ['Surau Mall 2', 'Level 2', false],
  ['Surau Level 12 Mall', 'Level 2', false],
  ['Surau Hall Mall', 'Level 2', false],
  ['Surau Mall', 'G', false],
  ['Surau LG Sunway Pyramid', 'Ground', false],
  ['Surau LG Sunway Pyramid', 'G', false],
  ['Surau LG Sunway Pyramid', 'Level G', false],
  ['Surau Level G Mall', 'LG', false],
  ['Surau Level G Mall', 'Ground', true],
  ['Surau LG Mall', 'Lower Ground', true],
  ['Surau UG Mall', 'Upper Ground', true],
  ['Surau B1 KLCC', 'Basement 1', true],
  ['Surau Level 1', '1st Floor', true],
  ['Surau 2nd Floor Mall', 'Level 2', true],
  ['Surau Floor 3 Mall', 'Aras 3', true],
  ['Surau Lobby Hotel', 'Lobby', true],
  ['Surau Concourse X', 'Concourse', true],
  ['Surau X', 'Concourse', false],
  ['Surau Tingkat Bawah KLIA', 'Tingkat Bawah', true],
  ['Surau B1 B2 Mall', 'B2', true],
  ['Surau B1 B2 Mall', 'B1', true],
  // Known rare false positive, accepted: "L1" in a block name reads as level 1.
  ['Surau Blok L1 Hospital', 'Level 1', true],
])('floor in name: %s / %s -> %s', (name, floor, expected) => {
  expect(nameMentionsFloor(name, floor)).toBe(expected)
})

it('title uses a single verified room and drops zone, then district, to fit 60 characters', () => {
  expect(roomTitle('Surau Mall', 'Putrajaya', [allRoom])).toBe('Surau Mall · Level UG, North Court · Putrajaya')
  const long = roomTitle('Surau Pavilion Bukit Jalil Shopping', 'Kuala Lumpur', [allRoom])
  expect(long.length).toBeLessThanOrEqual(60)
  expect(long).toContain('Level UG')
  expect(long).not.toContain('North Court')
  const longer = roomTitle('Surau Pavilion Bukit Jalil Shopping Gallery X', 'Kuala Lumpur', [allRoom])
  expect(longer).toBe('Surau Pavilion Bukit Jalil Shopping Gallery X · Level UG')
  expect(roomTitle('Surau Level 2 Setia City Mall', 'Shah Alam', [{ ...menRoom, audience: 'all' }])).toBe('Surau Level 2 Setia City Mall · Shah Alam')
})
it('F1: floor in the title only for a verified all room or the masjid\'s only verified room', () => {
  const unverifiedWomen = { ...womenRoom, verified: false, verifiedAt: null }
  expect(roomTitle('Surau Mall', 'X', [menRoom, unverifiedWomen])).toBe('Surau Mall · X')
  expect(roomTitle('Surau Mall', 'X', [menRoom])).toBe('Surau Mall · Level 2, North Court · X')
  expect(roomDescription([menRoom, unverifiedWomen])).toContain('Where to find it: Lelaki Level 2')
})
it('F4: name and floor are never cut, even over 60 characters', () => {
  const t = roomTitle('Surau '.padEnd(60, 'N'), 'Kuala Lumpur', [allRoom])
  expect(t).toBe(`${'Surau '.padEnd(60, 'N')} · Level UG`)
  expect(t.length).toBeGreaterThan(60)
})
it('F5: a men + women description stays within 155 characters', () => {
  const long = (audience: 'men' | 'women') => ({ ...(audience === 'men' ? menRoom : womenRoom), floorLabel: 'F'.repeat(29) })
  const d = roomDescription([long('men'), long('women')])!
  expect(d.length).toBeLessThanOrEqual(155)
  const mid = roomDescription([{ ...menRoom, floorLabel: 'F'.repeat(28) }, { ...womenRoom, floorLabel: 'G'.repeat(28) }])!
  expect(mid).toContain('Prayer times and photos on Jejak Masjid.')
})
it('F6: an all room next to men/women rooms wins', () => {
  expect(validateRooms([allRoom, menRoom, womenRoom]).map((r) => r.audience)).toEqual(['all'])
})
it('no title floor with two verified rooms or only unverified ones', () => {
  expect(roomTitle('Surau Mall', 'X', [menRoom, womenRoom])).toBe('Surau Mall · X')
  expect(roomTitle('Surau Mall', 'X', [unverifiedRoom])).toBe('Surau Mall · X')
  expect(roomTitle('Surau Mall', null, undefined)).toBe('Surau Mall')
})
it('description: single, lone women, men + women, unverified, truncation', () => {
  expect(roomDescription([allRoom])).toBe(
    "Where to find it: Level UG, North Court, Between Typo and Uniqlo. Today's prayer times, facilities and visitor photos on Jejak Masjid.",
  )
  expect(roomDescription([womenRoom])).toContain('Where to find it: Wanita Level 1.')
  expect(roomDescription([menRoom, womenRoom])).toContain('Where to find it: Lelaki Level 2, Wanita Level 1.')
  expect(roomDescription([unverifiedRoom])).toBeNull()
  const big = { ...allRoom, landmark: 'L'.repeat(60), zone: 'Z'.repeat(60) }
  const d = roomDescription([big])!
  expect(d.length).toBeLessThanOrEqual(155)
  expect(d).not.toContain('LLL')
})
it('block lines: all, men+women, unverified, wudhu false/null', () => {
  expect(roomBlock([allRoom]).lines).toEqual([
    'Level UG · North Court',
    'Between Typo and Uniqlo · Tempat wudhu ada',
    'Lelaki & wanita · Verified Oct 2026',
  ])
  expect(roomBlock([{ ...allRoom, hasWudhu: false }]).lines[1]).toContain('Tiada tempat wudhu')
  expect(roomBlock([{ ...allRoom, hasWudhu: null }]).lines[1]).toBe('Between Typo and Uniqlo')
  expect(roomBlock([unverifiedRoom]).lines.at(-1)).toBe('Lelaki & wanita · Not yet confirmed')
  expect(roomBlock([womenRoom, menRoom]).lines).toEqual([
    'Lelaki: Level 2 · North Court · Tempat wudhu ada', 'Wanita: Level 1', 'Verified Oct 2026',
  ])
  const mixed = roomBlock([womenRoom, { ...menRoom, verified: false, verifiedAt: null }]).lines
  expect(mixed[1]).toBe('Wanita: Level 1 · Verified Oct 2026')
  expect(mixed[0]).toContain('Not yet confirmed')
  expect(verifiedLabel({ verified: true, verifiedAt: null })).toBe('Verified')
})
it('venue link text and description', () => {
  expect(venueLinkText(venue)).toBe('All prayer spaces in Mall Fixture →')
  expect(venueLinkText({ ...venue, placeCount: 1 })).toBe('More about Mall Fixture')
  expect(venueDescription('M', 3, ['Level 1', 'Level 2'])).toBe('Where to pray in M: 3 prayer spaces, Level 1, Level 2. Floors, wudhu and directions on Jejak Masjid.')
  expect(venueDescription('M', 1, [])).toBe('Where to pray in M: floors, wudhu and directions on Jejak Masjid.')
})
it('validateRooms drops malformed rooms, caps strings, sorts and strips unknown keys', () => {
  const rooms = validateRooms([
    { ...menRoom, notes: 'internal', source: 'research' },
    { ...womenRoom, floorLabel: 'x'.repeat(31) },
    { ...allRoom, audience: 'kids' },
    { ...allRoom, floorOrder: 1.5 },
    { ...allRoom, hasWudhu: 'yes' },
    { ...allRoom, verified: 'true' },
    'junk', null,
    { ...allRoom, audience: 'women', landmark: 'L'.repeat(200), verifiedAt: 'not-a-date', floorOrder: 0 },
    { ...allRoom, audience: 'women', floorLabel: 'dup' },
  ])
  expect(rooms.map((r) => r.audience)).toEqual(['women', 'men'])
  expect(rooms[0].landmark).toHaveLength(60)
  expect(rooms[0].verifiedAt).toBeNull()
  expect(JSON.stringify(rooms)).not.toContain('internal')
  expect(validateRooms(undefined)).toEqual([])
  expect(validateRooms('x')).toEqual([])
})
it('unverified rooms never carry a verified date', () => {
  expect(validateRooms([{ ...allRoom, verified: false, verifiedAt: '2026-10-14' }])[0].verifiedAt).toBeNull()
})
it('validateVenueSummary drops bad slugs and counts', () => {
  expect(validateVenueSummary(venue)).toEqual(venue)
  for (const slug of ['Bad Slug', '-x', 'a--b', 'x/../y', 'ab', '']) expect(validateVenueSummary({ ...venue, slug })).toBeNull()
  expect(validateVenueSummary({ ...venue, placeCount: 0 })).toBeNull()
  expect(validateVenueSummary({ ...venue, kind: 'castle' })?.kind).toBe('other')
  expect(validateVenueSummary(null)).toBeNull()
})
it('validateVenuePage accepts the contract and rejects malformed payloads', () => {
  expect(validateVenuePage(venuePage)).toEqual(venuePage)
  expect(validateVenuePage({ ...venuePage, places: [] })).toBeNull()
  expect(validateVenuePage({ ...venuePage, indexable: 'yes' })).toBeNull()
  expect(validateVenuePage({ ...venuePage, venue: { ...venuePage.venue, lat: 999 } })).toBeNull()
  expect(validateVenuePage({ ...venuePage, venue: { ...venuePage.venue, slug: 'No Good' } })).toBeNull()
  const v = validateVenuePage({ ...venuePage, venue: { ...venuePage.venue, websiteUrl: 'http://x.test' }, places: [...venuePage.places, { slug: 'Bad', name: 'x', rooms: [] }] })!
  expect(v.venue.websiteUrl).toBeNull()
  expect(v.places).toHaveLength(3)
})
