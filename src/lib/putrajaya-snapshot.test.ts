import { describe, expect, it } from 'vitest'
import { PUTRAJAYA_SNAPSHOT as S } from './putrajaya-snapshot'

const sum = (xs: readonly { value: number }[]) => xs.reduce((a, x) => a + x.value, 0)

describe('Putrajaya snapshot consistency', () => {
  const total = S.stats[0].value
  it('prayer-labelled visits sum to 1,346 and with unlabelled to the total', () => {
    expect(sum(S.prayer.items)).toBe(1346)
    expect(sum(S.prayer.items) + S.prayer.unlabelled).toBe(total)
  })
  it('venue types sum to the total', () => expect(sum(S.venueTypes)).toBe(total))
  it('monthly visits sum to the total', () => expect(sum(S.monthly.items)).toBe(total))
  it('photos split sums to the photo total', () => {
    expect(S.photos.mosque.value + S.photos.surau.value).toBe(S.stats[3].value)
  })
})
