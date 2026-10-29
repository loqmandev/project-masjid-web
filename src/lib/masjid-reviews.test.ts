import { describe, expect, it } from 'vitest'
import {
  reviewMonth,
  reviewReportHref,
  roundToHalf,
  validateReviews,
} from './masjid-reviews'

const item = (over: Record<string, unknown> = {}) => ({
  id: 'rv_1',
  rating: 5,
  tip: 'Big compound, easy parking after Zohor.',
  createdAt: '2026-10-12T04:31:00Z',
  ...over,
})
const ok = { count: 23, average: 4.7, items: [item(), item({ id: 'rv_2', rating: 4 })] }

describe('validateReviews', () => {
  it('accepts a valid summary and keeps only the four item keys', () => {
    const leaky = { ...ok, items: [{ ...item(), userId: 'u-1', alias: 'Real Name' }] }
    const result = validateReviews(leaky)!
    expect(result.items[0]).toEqual(item())
    expect(JSON.stringify(result)).not.toMatch(/userId|alias|Real Name/)
  })
  it('accepts count 0, 1 and 2 without an average', () => {
    expect(validateReviews({ count: 0, average: null, items: [] })).toEqual({ count: 0, average: null, items: [] })
    expect(validateReviews({ count: 2, average: null, items: [item()] })!.average).toBeNull()
  })
  it('ignores an average sent below three reviews', () => {
    expect(validateReviews({ count: 2, average: 4.5, items: [] })!.average).toBeNull()
  })
  it('trims tips', () => {
    expect(validateReviews({ count: 1, average: null, items: [item({ tip: '  Quiet.  ' })] })!.items[0].tip).toBe('Quiet.')
  })
  it.each([
    ['absent', undefined],
    ['null', null],
    ['an array', []],
    ['a string', 'x'],
    ['negative count', { ...ok, count: -1 }],
    ['fractional count', { ...ok, count: 2.5 }],
    ['string count', { ...ok, count: '23' }],
    ['average above 5', { ...ok, average: 5.1 }],
    ['average below 1', { ...ok, average: 0.5 }],
    ['average NaN', { ...ok, average: Number.NaN }],
    ['count >= 3 without an average', { ...ok, average: null }],
    ['more than three items', { ...ok, items: [item(), item({ id: 'a' }), item({ id: 'b' }), item({ id: 'c' })] }],
    ['more items than the count', { count: 1, average: null, items: [item(), item({ id: 'b' })] }],
    ['items not an array', { ...ok, items: {} }],
    ['rating 0', { ...ok, items: [item({ rating: 0 })] }],
    ['rating 6', { ...ok, items: [item({ rating: 6 })] }],
    ['rating 4.5', { ...ok, items: [item({ rating: 4.5 })] }],
    ['empty tip', { ...ok, items: [item({ tip: '   ' })] }],
    ['tip over 150 chars', { ...ok, items: [item({ tip: 'x'.repeat(151) })] }],
    ['non-string tip', { ...ok, items: [item({ tip: 5 })] }],
    ['bad id', { ...ok, items: [item({ id: 'a b' })] }],
    ['id over 64 chars', { ...ok, items: [item({ id: 'a'.repeat(65) })] }],
    ['bad date', { ...ok, items: [item({ createdAt: 'yesterday' })] }],
    ['date without a zone', { ...ok, items: [item({ createdAt: '2026-10-12 04:31:00' })] }],
  ])('drops the whole section for %s', (_name, value) => {
    expect(validateReviews(value)).toBeNull()
  })
  it('drops everything when one item is bad (never a partial section)', () => {
    expect(validateReviews({ ...ok, items: [item(), item({ id: '!', rating: 3 })] })).toBeNull()
  })
  it('accepts a 150 character tip and offsets in dates', () => {
    expect(validateReviews({ ...ok, items: [item({ tip: 'x'.repeat(150), createdAt: '2026-10-12T12:31:00+08:00' })] })).not.toBeNull()
  })
})
it('rounds to the nearest half star', () => {
  expect([4.7, 4.8, 4.2, 4.25, 3, 1, 5].map(roundToHalf)).toEqual([4.5, 5, 4, 4.5, 3, 1, 5])
})
it('formats the review month in Malaysia time', () => {
  expect(reviewMonth('2026-10-12T04:31:00Z')).toBe('October 2026')
  expect(reviewMonth('2026-09-30T17:00:00Z')).toBe('October 2026') // 01:00 on 1 Oct MYT
})
it('builds an encoded report mailto', () => {
  const href = reviewReportHref('rv_1', 'masjid-negara')
  expect(href.startsWith('mailto:admin@jejakmasjid.my?subject=')).toBe(true)
  expect(decodeURIComponent(href.split('subject=')[1])).toBe('Report review rv_1 on masjid-negara')
  expect(href).not.toContain(' ')
})
