import { expect, it } from 'vitest'
import { confirmedGalleryUrls, galleryPhotos, validatePhotos } from './masjid-gallery'
import { page } from './masjid-fixture'

const u = (n: number | string) => `https://bucket.jejakmasjid.my/${n}.jpg`
const withPhotos = (photos: { url: string; confirmed?: boolean }[], coverUrl: string | null = null) => ({
  profile: coverUrl ? ({ coverUrl } as never) : null,
  photos,
})

it('validatePhotos: non-array, cap, missing/string/false confirmed, extra keys, bad url', () => {
  expect(validatePhotos(undefined)).toEqual([])
  expect(validatePhotos({ url: u(1) })).toEqual([])
  expect(validatePhotos(Array.from({ length: 12 }, (_, i) => ({ url: u(i) })))).toHaveLength(8)
  expect(validatePhotos([{ url: u(1) }])).toEqual([{ url: u(1), confirmed: true }])
  expect(validatePhotos([{ url: u(1), confirmed: 'false' }])[0].confirmed).toBe(true)
  expect(validatePhotos([{ url: u(1), confirmed: false }])[0].confirmed).toBe(false)
  expect(validatePhotos([{ url: u(1), confirmed: true, id: 'x', code: 'wudhu' }])).toEqual([
    { url: u(1), confirmed: true },
  ])
  expect(validatePhotos([{ url: 5 }, null, 'x', { confirmed: false }, { url: u(2) }])).toEqual([
    { url: u(2), confirmed: true },
  ])
})
it('galleryPhotos: cover first, confirmed before unconfirmed, trusted, de-duplicated, capped', () => {
  const out = galleryPhotos(
    withPhotos(
      [
        { url: u('a'), confirmed: false },
        { url: u('b') },
        { url: 'https://tracker.test/x' },
        { url: u('c'), confirmed: true },
        { url: u('b'), confirmed: false },
        { url: u('d'), confirmed: false },
      ],
      u('cover'),
    ),
  )
  expect(out).toEqual([
    { url: u('cover'), confirmed: true },
    { url: u('b'), confirmed: true },
    { url: u('c'), confirmed: true },
    { url: u('a'), confirmed: false },
    { url: u('d'), confirmed: false },
  ])
  expect(galleryPhotos(withPhotos(Array.from({ length: 12 }, (_, i) => ({ url: u(i) }))))).toHaveLength(8)
  expect(galleryPhotos(page)).toEqual([])
})
it('confirmedGalleryUrls excludes unconfirmed', () => {
  expect(
    confirmedGalleryUrls(withPhotos([{ url: u(1), confirmed: false }, { url: u(2) }])),
  ).toEqual([u(2)])
})
