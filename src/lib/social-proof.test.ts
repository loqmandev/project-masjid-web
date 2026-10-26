import { expect, it } from 'vitest'
import { STORE_RATINGS, REVIEWS, MEDIA } from './social-proof'

it('retains separately attributed store evidence and its checked date', () => {
  expect(STORE_RATINGS.map(({ score, count, store, locale, fetchedAt }) => ({ score, count, store, locale, fetchedAt }))).toEqual([
    { score: 4.8, count: 36, store: 'App Store', locale: 'Malaysia', fetchedAt: '2026-10-14' },
    { score: 4.7, count: 48, store: 'Google Play', locale: 'MY listing', fetchedAt: '2026-10-14' },
  ])
  for (const rating of STORE_RATINGS) expect(new URL(rating.sourceUrl).protocol).toBe('https:')
})
it('attributes every quote and article without inventing per-review stars or years', () => {
  expect(REVIEWS).toHaveLength(4)
  expect(MEDIA).toHaveLength(2)
  for (const review of REVIEWS) {
    expect(review.name && review.store && review.date && review.quote).toBeTruthy()
    expect(new URL(review.sourceUrl).protocol).toBe('https:')
    expect(review).not.toHaveProperty('rating')
  }
  expect(REVIEWS.filter(item => item.store === 'App Store').map(item => item.date)).toEqual(['22 Jul', '5 May'])
  expect(REVIEWS[0].quote).toBe('Easy and usefull for all to istiqamah especially to muslim man')
  for (const item of MEDIA) {
    expect(item.publisher && item.author && item.date && item.headline).toBeTruthy()
    expect(new URL(item.sourceUrl).protocol).toBe('https:')
  }
})
