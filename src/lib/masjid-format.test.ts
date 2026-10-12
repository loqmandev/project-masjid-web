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
