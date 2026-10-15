import { it, expect } from 'vitest'
import { jsonLdScript, mosqueJsonLd, eventJsonLd } from './jsonld'
import { page, program } from './masjid-fixture'
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
  })
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
  })
  expect(m).not.toHaveProperty('event')
  expect(m.address).not.toHaveProperty('addressLocality')
  expect(m.address.addressRegion).toBe('Putrajaya')
  expect(mosqueJsonLd(page).address.addressLocality).toBe('Fixture')
})
