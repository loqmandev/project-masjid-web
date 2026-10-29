import { it, expect } from 'vitest'
import { jsonLdScript, mosqueJsonLd, eventJsonLd } from './jsonld'
import { facilityCatalogue, publicFacilities, page, program } from './masjid-fixture'
import type { PublicFacility } from './masjid-types'
it('omits addressLocality when the cleaned district equals the region', () => {
  const m = mosqueJsonLd({ ...page, masjid: { ...page.masjid, districtName: 'PULAU PINANG', stateName: 'Pulau Pinang' } })
  expect(m.address.addressRegion).toBe('Pulau Pinang')
  expect(m.address).not.toHaveProperty('addressLocality')
})
it('escapes script breakout, ampersands and line separators', () => {
  const text = '</script>&\u2028\u2029'
  const result = jsonLdScript({ text })
  expect(result).not.toContain('<')
  expect(result).not.toContain('&')
  expect(result).not.toContain('\u2028')
  expect(JSON.parse(result)).toEqual({ text })
})
it('Mosque omits absent telephone', () => {
  const m = mosqueJsonLd(page)
  expect(m['@type']).toBe('Mosque')
  expect(m).not.toHaveProperty('telephone')
  expect(m['@id']).toContain('surau-fixture#place')
})
it('Event has MYT dates and cancelled status', () => {
  const e = eventJsonLd({ ...program, status: 'cancelled' })
  expect(e.eventStatus).toContain('EventCancelled')
  expect(e.startDate).toBe('2099-10-12T20:30:00+08:00')
  expect(e.isAccessibleForFree).toBe(true)
})

it('omits cancelled event refs and derives country only for Malaysian states', () => {
  const m = mosqueJsonLd({
    ...page,
    upcomingPrograms: [
      program,
      { ...program, id: 'cancelled', status: 'cancelled' },
    ],
  }, true)
  expect(m.event).toHaveLength(1)
  expect(m.event![0].url).not.toContain('cancelled')
  expect(m.address.addressCountry).toBe('MY')
  expect(
    mosqueJsonLd({
      ...page,
      masjid: { ...page.masjid, stateName: 'Singapore' },
    }).address,
  ).not.toHaveProperty('addressCountry')
  expect(
    eventJsonLd({
      ...program,
      masjid: { ...program.masjid, stateName: 'Singapore' },
    }).location.address,
  ).not.toHaveProperty('addressCountry')
})

it('omits event when none are published and addressLocality when district unknown', () => {
  const m = mosqueJsonLd({
    ...page,
    masjid: { ...page.masjid, districtName: 'UNKNOWN' },
    upcomingPrograms: [{ ...program, status: 'cancelled' }],
  }, true)
  expect(m).not.toHaveProperty('event')
  expect(m.address).not.toHaveProperty('addressLocality')
  expect(m.address.addressRegion).toBe('Putrajaya')
  expect(mosqueJsonLd(page).address.addressLocality).toBe('Fixture')
})

it('Mosque emits event only when ajk is on', () => {
  const withProgram = { ...page, upcomingPrograms: [program] }
  expect(mosqueJsonLd(withProgram, true).event).toHaveLength(1)
  expect(mosqueJsonLd(withProgram, false)).not.toHaveProperty('event')
  expect(mosqueJsonLd(withProgram)).not.toHaveProperty('event')
})
it('Mosque JSON-LD title-cases the region and drops Sabah codes and ZON', () => {
  const ld = (d: string, st: string) =>
    mosqueJsonLd({ ...page, masjid: { ...page.masjid, districtName: d, stateName: st } })
      .address
  expect(ld('PETALING', 'SELANGOR')).toMatchObject({
    addressLocality: 'Petaling',
    addressRegion: 'Selangor',
    addressCountry: 'MY',
  })
  expect(ld('PBS - KOTA KINABALU', 'SABAH')).toMatchObject({
    addressLocality: 'Kota Kinabalu',
    addressRegion: 'Sabah',
  })
  const zon = ld('ZON 6', 'KUALA LUMPUR')
  expect(zon).not.toHaveProperty('addressLocality')
  expect(zon.addressRegion).toBe('Kuala Lumpur')
  expect(ld('Presint 16', 'WP PUTRAJAYA').addressRegion).toBe('WP Putrajaya')
})

it('includes only proven catalogue-backed amenities regardless of AJK, keeping indexability unchanged', () => {
  const facilities = [
    ...publicFacilities,
    { ...publicFacilities[0], code: 'UNKNOWN' },
    ...['disputed', 'absent'].map((state) => ({ ...publicFacilities[0], state })),
  ] as PublicFacility[]
  for (const ajk of [false, true]) {
    const data = mosqueJsonLd({ ...page, facilities }, ajk, facilityCatalogue)
    expect(data.amenityFeature).toEqual([
      { '@type': 'LocationFeatureSpecification', name: 'Compound parking', value: true },
      { '@type': 'LocationFeatureSpecification', name: 'Wi-Fi', value: true },
    ])
    expect(data['@type']).toBe('Mosque')
    expect(data['@id']).toBe(mosqueJsonLd(page)['@id'])
  }
})
it('omits facility structured data when disabled, empty, unconfirmed-only or catalogue is unavailable', () => {
  expect(mosqueJsonLd(page, false, facilityCatalogue)).toEqual(mosqueJsonLd(page))
  for (const facilities of [[], [publicFacilities[2]]])
    expect(mosqueJsonLd({ ...page, facilities }, false, facilityCatalogue)).not.toHaveProperty('amenityFeature')
  expect(mosqueJsonLd({ ...page, facilities: publicFacilities })).not.toHaveProperty('amenityFeature')
})

it('uses up to three trusted visitor photos as image when there is no AJK cover, and never ratings', () => {
  const photos = [
    { url: 'https://tracker.test/x' },
    ...[1, 2, 3, 4].map((i) => ({ url: `https://bucket.jejakmasjid.my/${i}.jpg` })),
  ]
  const m = mosqueJsonLd({ ...page, photos })
  expect(m.image).toEqual([1, 2, 3].map((i) => `https://bucket.jejakmasjid.my/${i}.jpg`))
  const withCover = mosqueJsonLd({
    ...page,
    photos,
    profile: { description: null, contactPhone: null, whatsappUrl: null, facilities: [], recurringClasses: [], coverUrl: 'https://bucket.jejakmasjid.my/cover.jpg', updatedAt: '' },
  })
  expect(withCover.image).toBe('https://bucket.jejakmasjid.my/cover.jpg')
  expect(mosqueJsonLd(page)).not.toHaveProperty('image')
  const json = jsonLdScript(mosqueJsonLd({ ...page, photos, reviews: { count: 23, average: 4.7, items: [] } } as never))
  expect(json).not.toMatch(/AggregateRating|"Review"|aggregateRating|ratingValue/)
})
