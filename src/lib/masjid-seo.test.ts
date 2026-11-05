import { it, expect } from 'vitest'
import { masjidSeo, programSeo, trustedImage, venueSeo } from './masjid-seo'
import { page, program, allRoom, menRoom, womenRoom, unverifiedRoom, venuePage } from './masjid-fixture'
it('does not repeat equal district/state in the title or description', () => {
  const s = masjidSeo({ ...page, masjid: { ...page.masjid, districtName: 'PULAU PINANG', stateName: 'Pulau Pinang' } }, false)
  expect(s.meta[0].title).toContain('Surau Fixture · Pulau Pinang')
  expect(s.meta.find(m => m.name === 'description')!.content).toContain('in Pulau Pinang:')
})
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

import { sentenceDescription } from './masjid-seo'
import { seo } from './seo'
it('accepts both real photo hosts, rejects lookalikes and unsafe schemes', () => {
  for (const url of [
    'https://bucket.jejakmasjid.my/photos/a.jpg',
    'https://imagedelivery.net/account-hash/photo-id/public',
  ])
    expect(trustedImage(url)).toBe(url)
  for (const url of [
    'https://bucket.jejakmasjid.my.evil.test/a',
    'http://bucket.jejakmasjid.my/a',
    'https://imagedelivery.net/',
    'https://imagedelivery.net/hash',
    'https://evil.test@bucket.jejakmasjid.my/a',
  ])
    expect(trustedImage(url)).toBeUndefined()
  expect(trustedImage('https://bucket.jejakmasjid.my/a', true)).toBeUndefined()
})
it('only default OG card claims 1200x630 dimensions', () => {
  expect(seo().meta).toContainEqual({
    property: 'og:image:width',
    content: '1200',
  })
  const p = {
    ...page,
    photos: [{ url: 'https://bucket.jejakmasjid.my/photo.jpg' }],
  }
  const meta = masjidSeo(p).meta
  expect(meta).toContainEqual({
    property: 'og:image',
    content: p.photos[0].url,
  })
  expect(
    meta.some(
      (m) =>
        m.property === 'og:image:width' || m.property === 'og:image:height',
    ),
  ).toBe(false)
})
it('trims long descriptions to a sentence, falling back to whole words', () => {
  expect(
    sentenceDescription('A quiet space. ' + 'More words '.repeat(20)),
  ).toBe('A quiet space.')
  const text = sentenceDescription(
    'Long description without punctuation '.repeat(10),
  )!
  expect(text.length).toBeLessThanOrEqual(150)
  expect(text.endsWith(' ')).toBe(false)
  expect(sentenceDescription('  A short sentence.  ')).toBe('A short sentence.')
})

it('ajk off description has prayer times, no Programs; unknown district title is Name · State', () => {
  const unknown = {
    ...page,
    masjid: { ...page.masjid, districtName: 'Unknown District' },
  }
  const s = masjidSeo(unknown, false)
  expect(s.meta[0].title).toContain('Surau Fixture · Putrajaya')
  expect(s.meta[0].title).not.toContain('Unknown')
  const d = s.meta.find((m) => m.name === 'description')!.content as string
  expect(d).toContain('prayer times')
  expect(d).not.toContain('Programs')
  expect(d).toContain('in Putrajaya:')
  const on = masjidSeo(page, true).meta.find((m) => m.name === 'description')!
  expect(on.content).toContain('Programs, photos and directions')
})

it('title and description use clean place text for Sabah and ZON masjids', () => {
  const sabah = masjidSeo(
    { ...page, masjid: { ...page.masjid, districtName: 'PBS - KOTA KINABALU', stateName: 'SABAH' } },
    false,
  )
  expect(sabah.meta[0].title).toContain('Surau Fixture \u00b7 Kota Kinabalu')
  expect(sabah.meta.find((m) => m.name === 'description')!.content).toContain(
    'in Kota Kinabalu, Sabah:',
  )
  const zon = masjidSeo(
    { ...page, masjid: { ...page.masjid, districtName: 'ZON 6', stateName: 'KUALA LUMPUR' } },
    false,
  )
  expect(zon.meta[0].title).toContain('Surau Fixture \u00b7 Kuala Lumpur')
  expect(zon.meta.find((m) => m.name === 'description')!.content).toContain(
    'in Kuala Lumpur:',
  )
})

it('uses the place-card description for pages without a profile text, keeping title and noindex rules', () => {
  const s = masjidSeo({ ...page, indexable: true, masjid: { ...page.masjid, name: 'Masjid Negara', districtName: 'Kuala Lumpur', stateName: 'Wilayah Persekutuan Kuala Lumpur' } }, false)
  expect(s.meta.find((m) => m.name === 'description')!.content).toBe(
    "Masjid Negara in Kuala Lumpur, Wilayah Persekutuan Kuala Lumpur: today's prayer times, facilities, photos and reviews from visitors on Jejak Masjid.",
  )
  expect(s.meta[0].title).toBe('Masjid Negara · Kuala Lumpur | Jejak Masjid')
  expect(s.meta.some((m) => m.name === 'robots' && String(m.content).includes('noindex'))).toBe(false)
  const noPlace = masjidSeo({ ...page, masjid: { ...page.masjid, districtName: null, stateName: '' } }, false)
  expect(noPlace.meta.find((m) => m.name === 'description')!.content).toBe(
    "Surau Fixture: today's prayer times, facilities, photos and reviews from visitors on Jejak Masjid.",
  )
})

const title = (s: ReturnType<typeof masjidSeo>) => s.meta[0].title
const desc = (s: ReturnType<typeof masjidSeo>) => s.meta.find((m) => m.name === 'description')!.content
it('verified single room goes in title and description', () => {
  const s = masjidSeo({ ...page, rooms: [allRoom] })
  expect(title(s)).toBe('Surau Fixture · Level UG, North Court · Fixture | Jejak Masjid')
  expect(desc(s)).toContain('Where to find it: Level UG, North Court, Between Typo and Uniqlo.')
})
it('lone verified women room and a men + women pair', () => {
  expect(title(masjidSeo({ ...page, rooms: [womenRoom] }))).toContain('Surau Fixture · Level 1 · Fixture')
  expect(desc(masjidSeo({ ...page, rooms: [womenRoom] }))).toContain('Wanita Level 1')
  const pair = masjidSeo({ ...page, rooms: [womenRoom, menRoom] })
  expect(title(pair)).toBe('Surau Fixture · Fixture | Jejak Masjid')
  expect(desc(pair)).toContain('Lelaki Level 2, Wanita Level 1')
})
it('unverified rooms change neither title nor description', () => {
  const base = masjidSeo(page)
  const s = masjidSeo({ ...page, rooms: [unverifiedRoom] })
  expect(title(s)).toBe(title(base))
  expect(desc(s)).toBe(desc(base))
  expect(JSON.stringify(s)).not.toContain('Level UG')
})
it('skips the floor when the name already has it, keeps the AJK description first', () => {
  const named = masjidSeo({ ...page, masjid: { ...page.masjid, name: 'Surau L2 Setia City Mall' }, rooms: [{ ...allRoom, floorLabel: 'Level 2' }] })
  expect(title(named)).toBe('Surau L2 Setia City Mall · Fixture | Jejak Masjid')
  const ajk = masjidSeo({ ...page, rooms: [allRoom], profile: { description: 'The AJK says hello.', contactPhone: null, whatsappUrl: null, facilities: [], recurringClasses: [], coverUrl: null, updatedAt: '' } })
  expect(desc(ajk)).toBe('The AJK says hello.')
})
it('title before the site suffix stays within 60 characters', () => {
  const s = masjidSeo({ ...page, masjid: { ...page.masjid, name: 'Surau Pavilion Bukit Jalil Shopping', districtName: 'Kuala Lumpur' }, rooms: [allRoom] })
  expect(title(s).replace(' | Jejak Masjid', '').length).toBeLessThanOrEqual(60)
})
it('venue page seo: title, description with verified floors, canonical, noindex', () => {
  const s = venueSeo(venuePage)
  expect(title(s)).toBe('Surau at Mall Fixture · Fixture | Jejak Masjid')
  expect(desc(s)).toBe('Where to pray in Mall Fixture: 3 prayer spaces, Level 1, Level UG. Floors, wudhu and directions on Jejak Masjid.')
  expect(s.links[0].href).toBe('https://jejakmasjid.my/surau/mall-fixture')
  expect(s.meta).toContainEqual({ name: 'robots', content: 'index, follow, max-image-preview:large' })
  expect(venueSeo({ ...venuePage, indexable: false }).meta).toContainEqual({ name: 'robots', content: 'noindex, nofollow' })
  const none = venueSeo({ ...venuePage, places: venuePage.places.map((p) => ({ ...p, rooms: p.rooms.map((r) => ({ ...r, verified: false })) })) })
  expect(desc(none)).toBe('Where to pray in Mall Fixture: floors, wudhu and directions on Jejak Masjid.')
})
