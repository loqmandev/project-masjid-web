import { expect, it } from 'vitest'
import { confirmedGalleryUrls, galleryPhotos, validatePhotos } from './masjid-gallery'
import { page } from './masjid-fixture'

const u = (n: number | string) => `https://bucket.jejakmasjid.my/${n}.jpg`
const withPhotos = (photos: { url: string; confirmed?: boolean; facilityLabel?: string | null }[], coverUrl: string | null = null) => ({
  profile: coverUrl ? ({ coverUrl } as never) : null,
  photos,
})

it('validatePhotos: non-array, cap, missing/string/false confirmed, extra keys, bad url', () => {
  expect(validatePhotos(undefined)).toEqual([])
  expect(validatePhotos({ url: u(1) })).toEqual([])
  expect(validatePhotos(Array.from({ length: 12 }, (_, i) => ({ url: u(i) })))).toHaveLength(8)
  expect(validatePhotos([{ url: u(1) }])).toEqual([{ url: u(1), confirmed: true, facilityLabel: null }])
  expect(validatePhotos([{ url: u(1), confirmed: 'false' }])[0].confirmed).toBe(true)
  expect(validatePhotos([{ url: u(1), confirmed: false, facilityLabel: null }])[0].confirmed).toBe(false)
  expect(validatePhotos([{ url: u(1), confirmed: true, id: 'x', code: 'wudhu' }])).toEqual([
    { url: u(1), confirmed: true, facilityLabel: null },
  ])
  expect(validatePhotos([{ url: 5 }, null, 'x', { confirmed: false }, { url: u(2) }])).toEqual([
    { url: u(2), confirmed: true, facilityLabel: null },
  ])
})
it('validatePhotos: facilityLabel only on unconfirmed, cleaned, 1-60 chars', () => {
  const f = (confirmed: boolean, facilityLabel?: unknown) =>
    validatePhotos([{ url: u(1), confirmed, facilityLabel }])[0].facilityLabel
  expect(f(false, '  Wheelchair   access ')).toBe('Wheelchair access')
  expect(f(true, 'Wheelchair access')).toBeNull()
  expect(f(false)).toBeNull()
  expect(f(false, 5)).toBeNull()
  expect(f(false, '')).toBeNull()
  expect(f(false, '   ')).toBeNull()
  expect(f(false, 'x'.repeat(61))).toBeNull()
  expect(f(false, 'x'.repeat(60))).toBe('x'.repeat(60))
})
it('galleryPhotos carries facilityLabel; cover gets null', () => {
  const out = galleryPhotos(withPhotos([{ url: u('a'), confirmed: false, facilityLabel: 'Ramp' }], u('cover')))
  expect(out).toEqual([
    { url: u('cover'), confirmed: true, facilityLabel: null },
    { url: u('a'), confirmed: false, facilityLabel: 'Ramp' },
  ])
})
it('galleryPhotos: cover first, confirmed before unconfirmed, trusted, de-duplicated, capped', () => {
  const out = galleryPhotos(
    withPhotos(
      [
        { url: u('a'), confirmed: false, facilityLabel: null },
        { url: u('b') },
        { url: 'https://tracker.test/x' },
        { url: u('c'), confirmed: true, facilityLabel: null },
        { url: u('b'), confirmed: false, facilityLabel: null },
        { url: u('d'), confirmed: false, facilityLabel: null },
      ],
      u('cover'),
    ),
  )
  expect(out).toEqual([
    { url: u('cover'), confirmed: true, facilityLabel: null },
    { url: u('b'), confirmed: true, facilityLabel: null },
    { url: u('c'), confirmed: true, facilityLabel: null },
    { url: u('a'), confirmed: false, facilityLabel: null },
    { url: u('d'), confirmed: false, facilityLabel: null },
  ])
  expect(galleryPhotos(withPhotos(Array.from({ length: 12 }, (_, i) => ({ url: u(i) }))))).toHaveLength(8)
  expect(galleryPhotos(page)).toEqual([])
})
it('confirmedGalleryUrls excludes unconfirmed', () => {
  expect(
    confirmedGalleryUrls(withPhotos([{ url: u(1), confirmed: false, facilityLabel: null }, { url: u(2) }])),
  ).toEqual([u(2)])
})
