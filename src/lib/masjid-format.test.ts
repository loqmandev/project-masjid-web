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
