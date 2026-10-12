import { it, expect } from 'vitest'
import { masjidSeo, programSeo, trustedImage } from './masjid-seo'
import { page, program } from './masjid-fixture'
it('thin pages noindex with canonical and descriptive title', () => {
  const s = masjidSeo(page)
  expect(s.meta).toContainEqual({
    name: 'robots',
    content: 'noindex, nofollow',
  })
  expect(s.links[0].href).toContain('/masjid/surau-fixture')
  expect(s.meta[0].title).toContain('Surau Fixture · Fixture')
})
it('cancelled and ended programs noindex', () => {
  expect(programSeo({ ...program, status: 'cancelled' }).meta).toContainEqual({
    name: 'robots',
    content: 'noindex, nofollow',
  })
  expect(programSeo(program, Date.parse('2100-01-01')).meta).toContainEqual({
    name: 'robots',
    content: 'noindex, nofollow',
  })
})
it('rejects untrusted OG images', () => {
  expect(trustedImage('https://evil.test/x')).toBeUndefined()
  expect(
    trustedImage('https://shop.jejakmasjid.my/media/ajk/a.jpg', true),
  ).toBeTruthy()
})
