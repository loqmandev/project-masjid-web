import { it, expect } from 'vitest'
import {
  programDate,
  localISO,
  audienceLabels,
  categoryLabels,
} from './masjid-format'
it('uses MYT regardless of machine TZ', () => {
  expect(programDate('2026-10-12T12:30:00Z')).toContain('8:30')
  expect(localISO('2026-10-12T20:00:00Z')).toBe('2026-10-13T04:00:00+08:00')
})
it('has complete audience and category labels', () => {
  expect(Object.keys(audienceLabels)).toHaveLength(6)
  expect(Object.keys(categoryLabels)).toHaveLength(8)
  expect(audienceLabels.belia).toBe('Youth (belia)')
})

import { prayerTime, recurringTime, validPrayerTimes } from './masjid-format'
it('formats UTC prayers and local recurring classes as 12-hour MYT', () => {
  expect(prayerTime('2026-10-12T12:30:00Z')).toBe('8:30 pm')
  expect(prayerTime('2026-10-11T20:52:00Z')).toBe('4:52 am')
  expect(recurringTime('21:00')).toBe('9:00 pm')
  expect(recurringTime('00:00')).toBe('12:00 am')
  expect(
    validPrayerTimes({ country: 'MY', times: { subuh: 'bad' } }),
  ).toBeNull()
})

import { placeParts } from './masjid-format'
it.each([
  ['Pulau Pinang', 'Pulau Pinang', 'Pulau Pinang'],
  ['PULAU PINANG', 'pulau pinang', 'Pulau Pinang'],
  [' Singapore ', 'SINGAPORE', 'Singapore'],
  ['MeLaKa', 'MELAKA', 'Melaka'],
  ['TAW - LABUAN', 'labuan', 'Labuan'],
])('placeParts displays equal cleaned district/state once: %s / %s', (district, state, expected) => {
  expect(placeParts(district, state)).toEqual({
    district: null, state: expected, line: expected, prose: expected,
  })
})
it('placeParts preserves a district without a state and handles both absent', () => {
  expect(placeParts('Pulau Pinang', null)).toEqual({
    district: 'Pulau Pinang', state: null, line: 'Pulau Pinang', prose: 'Pulau Pinang',
  })
  expect(placeParts(null, null)).toEqual({ district: null, state: null, line: '', prose: '' })
})
it('placeParts cleans unknown, empty and ALL CAPS districts', () => {
  expect(placeParts('Unknown District', 'Selangor').line).toBe('Selangor')
  expect(placeParts('UNKNOWN', 'Kedah')).toMatchObject({
    district: null,
    state: 'Kedah',
    line: 'Kedah',
  })
  expect(placeParts('', 'Melaka').line).toBe('Melaka')
  expect(placeParts(null, 'Johor').line).toBe('Johor')
  expect(placeParts('TAW - SEMPORNA', 'Sabah').line).toBe(
    'Semporna \u00b7 Sabah',
  )
  expect(placeParts('PBS - KOTA KINABALU', 'SABAH')).toMatchObject({
    district: 'Kota Kinabalu',
    state: 'Sabah',
    prose: 'Kota Kinabalu, Sabah',
  })
  expect(placeParts('ZON 6', 'KUALA LUMPUR')).toMatchObject({
    district: null,
    line: 'Kuala Lumpur',
  })
  expect(placeParts('JOHOR BAHRU', 'JOHOR').line).toBe('Johor Bahru \u00b7 Johor')
  expect(placeParts('PETALING', 'SELANGOR').prose).toBe('Petaling, Selangor')
  expect(placeParts('Presint 16', 'WP PUTRAJAYA').state).toBe('WP Putrajaya')
  expect(placeParts('x', 'W.P. LABUAN').state).toBe('W.P. Labuan')
  expect(placeParts('Presint 16', 'Putrajaya').line).toBe(
    'Presint 16 \u00b7 Putrajaya',
  )
  expect(placeParts('PRESINT 16', 'Putrajaya').district).toBe('Presint 16')
})
