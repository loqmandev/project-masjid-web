import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { expect, it, vi } from 'vitest'
// Isolate site navigation (router context), retaining the real page/title shell.
vi.mock('@/components/Header', () => ({ default: () => null }))
vi.mock('@/components/Footer', () => ({ default: () => null }))
import {
  MasjidPage,
  ProgramPage,
  MissingProgram,
  VenuePage,
} from '@/components/MasjidPages'
import { page, program, allRoom, menRoom, womenRoom, unverifiedRoom, venue, venuePage } from './masjid-fixture'
import type { PublicMasjidPage, PublicMasjidPost } from './masjid-types'
const render = (p: PublicMasjidPage = page, ajk = true) =>
  renderToString(createElement(MasjidPage, { page: p, prayers: null, ajk }))
const profile = {
  description: '<script>alert(1)</script>',
  contactPhone: null,
  whatsappUrl: null,
  facilities: [],
  recurringClasses: [],
  coverUrl: null,
  updatedAt: '',
}
it('renders untrusted descriptions, titles and posts only as escaped text', () => {
  const html = render({
    ...page,
    profile,
    posts: [
      {
        id: 'post',
        type: 'news',
        title: '<script>title</script>',
        body: '<script>body</script>',
        publishedAt: '',
        expiresAt: '',
      },
    ],
  })
  expect(html).not.toContain('<script>')
  expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
  expect(html).toContain('&lt;script&gt;body&lt;/script&gt;')
  const detail = renderToString(
    createElement(ProgramPage, {
      p: {
        ...program,
        title: '<script>title</script>',
        description: '<script>description</script>',
      },
    }),
  )
  expect(detail).not.toContain('<script>')
  expect(detail).toContain('&lt;script&gt;title&lt;/script&gt;')
})
it('never renders khairat, including an otherwise empty News section', () => {
  const posts = [
    { id: 'secret', type: 'khairat', title: 'PRIVATE', body: 'PRIVATE' },
  ] as unknown as PublicMasjidPost[]
  const html = render({ ...page, posts })
  expect(html).not.toContain('PRIVATE')
  expect(html).not.toContain('<h2>News</h2>')
})
it('cancelled program has plain text status, no Register CTA or empty venue', () => {
  const html = renderToString(
    createElement(ProgramPage, { p: { ...program, status: 'cancelled' } }),
  )
  expect(html).toContain('Cancelled')
  expect(html).not.toContain('role="status"')
  expect(html).not.toContain('Register in')
  expect(html).not.toContain('<p></p>')
})
it('renders distinct claimed and unclaimed deep-teal CTAs', () => {
  expect(render()).toContain('Claim this surau')
  expect(render()).toContain('claim?masjid=fixture-masjid')
  const html = render({ ...page, claimed: true })
  expect(html).toContain('Managed by the AJK of')
  expect(html).toContain('https://ajk.jejakmasjid.my/login')
  expect(html).not.toContain('Claim this surau')
  expect(html).toMatch(/<aside class="on-deep[^"]*bg-deep/)
})
it('has no title band: one h1, Directions and Waze, the app card and the sticky bar', () => {
  const html = render()
  expect(html.match(/<h1[ >]/g)).toHaveLength(1)
  expect(html).not.toContain('bg-deep py-16')
  expect(html).toContain('Directions')
  expect(html).toContain('Waze')
  expect(html).toContain('Open in Jejak Masjid')
  expect(html).toContain('Open in app')
  expect(html).toContain('Singgah with Jejak Masjid')
})
it('renders MYT prayer and recurring times, singular history and program 404 copy', () => {
  const html = renderToString(
    createElement(MasjidPage, {
      ajk: true,
      page: {
        ...page,
        pastProgramCount: 1,
        profile: {
          ...profile,
          recurringClasses: [
            { dayOfWeek: 4, startTime: '21:00', title: 'Class', note: null },
          ],
        },
      },
      prayers: Object.fromEntries(
        ['subuh', 'zohor', 'asar', 'maghrib', 'isyak'].map((k) => [
          k,
          '2026-10-12T12:30:00Z',
        ]),
      ),
    }),
  )
  const text = html.replace(/<!-- -->/g, '').replace(/<[^>]+>/g, '')
  expect(text).toContain('8:30 pm')
  expect(text).toContain('9:00 pm')
  expect(html).not.toContain('T12:30')
  expect(html).not.toContain('programs<!-- --> held')
  expect(renderToString(createElement(MissingProgram))).toContain(
    'find this program',
  )
})
it('drops untrusted cover/photo/poster/sponsor src and keeps real photo hosts', () => {
  const html = render({
    ...page,
    profile: { ...profile, coverUrl: 'https://tracker.test/cover' },
    photos: [
      { url: 'https://tracker.test/photo' },
      { url: 'https://bucket.jejakmasjid.my/photo.jpg' },
    ],
    upcomingPrograms: [
      { ...program, posterUrl: 'https://tracker.test/poster' },
    ],
  })
  expect(html).not.toContain('tracker.test')
  expect(html).toContain('https://bucket.jejakmasjid.my/photo.jpg')
  const detail = renderToString(
    createElement(ProgramPage, {
      p: {
        ...program,
        posterUrl: 'https://tracker.test/p',
        sponsorLogoUrl: 'https://tracker.test/s',
      },
    }),
  )
  expect(detail).not.toContain('tracker.test')
})

const offPage: PublicMasjidPage = {
  ...page,
  photos: [
    { url: 'https://bucket.jejakmasjid.my/one.jpg' },
    { url: 'https://bucket.jejakmasjid.my/two.jpg' },
  ],
}
it.each([false, true])('ajk off (claimed: %s): no programs, news, claim or committee card', (claimed) => {
  const html = render({ ...offPage, claimed }, false)
  for (const s of [
    'Upcoming programs',
    'No upcoming programs',
    'Claim',
    'AJK',
    'ajk.jejakmasjid.my',
    '/p/',
    'News',
    'committee?',
    'Register your interest',
    '<aside class="on-deep',
  ])
    expect(html).not.toContain(s)
  for (const s of [
    'Surau Fixture',
    'Synthetic street',
    'Open in Jejak Masjid',
    'Directions',
    'Waze',
    'https://bucket.jejakmasjid.my/one.jpg',
    'https://bucket.jejakmasjid.my/two.jpg',
  ])
    expect(html).toContain(s)
})
it('ajk off still hides programs and posts when the data carries them', () => {
  const html = render(
    {
      ...offPage,
      claimed: true,
      upcomingPrograms: [program],
      pastProgramCount: 3,
      posts: [
        {
          id: 'p1',
          type: 'news',
          title: 'Secret news',
          body: 'Secret body',
          publishedAt: '',
          expiresAt: '',
        },
      ],
    },
    false,
  )
  for (const s of ['Fixture program', 'Upcoming programs', 'Secret', 'News', '/p/', 'ajk.jejakmasjid.my', 'held here'])
    expect(html).not.toContain(s)
})

it('rooms block is hidden without rooms or on an old payload', () => {
  expect(render()).not.toContain('Where to find it')
  expect(render({ ...page, rooms: [] , venue: null })).not.toContain('Where to find it')
})
it('rooms block shows floor, landmark, wudhu, verified month and the venue link', () => {
  const html = render({ ...page, rooms: [allRoom], venue })
  expect(html).toContain('aria-label="Where to find it"')
  expect(html).toContain('<span aria-hidden="true">📍</span>')
  expect(html).toContain('Level UG · North Court')
  expect(html).toContain('Between Typo and Uniqlo · Tempat wudhu ada')
  expect(html).toContain('Lelaki &amp; wanita · Verified Oct 2026')
  expect(html).toContain('How to get there')
  expect(html).toContain('<details')
  expect(html).not.toContain('<details open')
  expect(html).toContain('href="/surau/mall-fixture"')
  expect(html).toContain('All prayer spaces in Mall Fixture →')
  expect(html).toContain('Open when Mall Fixture is open · 10am to 10pm')
  expect(render({ ...page, rooms: [allRoom], venue: { ...venue, placeCount: 1 } })).toContain('More about Mall Fixture')
})
it('wudhu true / false / null', () => {
  expect(render({ ...page, rooms: [allRoom] })).toContain('Tempat wudhu ada')
  expect(render({ ...page, rooms: [{ ...allRoom, hasWudhu: false }] })).toContain('Tiada tempat wudhu')
  const none = render({ ...page, rooms: [{ ...allRoom, hasWudhu: null }] })
  expect(none).not.toContain('wudhu')
})
it('unverified rooms carry the soft label and no Verified text', () => {
  const html = render({ ...page, rooms: [unverifiedRoom] })
  expect(html).toContain('Not yet confirmed')
  expect(html).not.toContain('Verified')
})
it('men and women get one line each with a shared verified line', () => {
  const html = render({ ...page, rooms: [womenRoom, menRoom] })
  expect(html).toContain('Wanita: Level 1')
  expect(html).toContain('Lelaki: Level 2 · North Court')
  expect(html.match(/Verified Oct 2026/g)).toHaveLength(1)
})
it('venue page renders places in order, links, directions and no raw html', () => {
  const html = renderToString(createElement(VenuePage, { page: { ...venuePage, venue: { ...venuePage.venue, name: '<b>Mall</b>' } } }))
  expect(html).toContain('Surau at &lt;b&gt;Mall&lt;/b&gt;')
  expect(html).not.toContain('<b>Mall')
  expect(html.indexOf('Surau Mall Fixture (Women)')).toBeLessThan(html.indexOf('Surau Annex'))
  expect(html).toContain('href="/masjid/surau-mall-fixture"')
  expect(html).toContain('https://www.google.com/maps/search/?api=1&amp;query=2.9,101.7')
  expect(html).toContain('Get directions')
  expect(html).toContain('Exact floor not listed yet.')
})

const gp = (n: string, confirmed?: boolean) => ({
  url: `https://bucket.jejakmasjid.my/${n}.jpg`,
  ...(confirmed === undefined ? {} : { confirmed }),
})
const count = (html: string, s: string) => html.split(s).length - 1
it('"Not yet confirmed" label renders exactly on unconfirmed photos, last, with alt text', () => {
  const html = render({ ...page, photos: [gp('u1', false), gp('c1', true), gp('u2', false)] })
  expect(count(html, 'class="m-unconfirmed"')).toBe(2)
  expect(html).toContain('<figcaption class="m-unconfirmed" aria-hidden="true">Not yet confirmed</figcaption>')
  expect(count(html, 'aria-hidden="true">Not yet confirmed')).toBe(2)
  expect(html).toContain('alt="Masjid Fixture, photo 3, not yet confirmed"'.replace('Masjid Fixture', page.masjid.name))
  expect(html.indexOf('c1.jpg')).toBeLessThan(html.indexOf('u1.jpg'))
  expect(html.indexOf('<img')).toBeLessThan(html.indexOf('u1.jpg'))
  expect(html).toMatch(new RegExp('<img[^>]*alt="' + page.masjid.name + '"[^>]*c1.jpg|c1.jpg[^>]*alt="' + page.masjid.name + '"'))
})
it('desktop grid (6+ photos) carries the label too', () => {
  const photos = [...[1, 2, 3, 4, 5].map((i) => gp('c' + i)), gp('u1', false), gp('u2', false)]
  const html = render({ ...page, photos })
  expect(count(html, 'class="m-unconfirmed"')).toBe(4) // strip + grid, 2 each
  expect(html).toContain('m-shot m-shot-grid')
})
it('no label anywhere for an old payload without confirmed', () => {
  const html = render({ ...page, photos: [gp('a'), gp('b'), gp('c')] })
  expect(html).not.toContain('m-unconfirmed')
  expect(html).not.toContain('not yet confirmed')
})
const wayPhotos = [1, 2, 3].map((i) => ({ url: `https://bucket.jejakmasjid.my/w${i}.jpg`, width: 800, height: 600 }))
it('way-finding photos show in the disclosure without directions; none without any of the three', () => {
  const html = render({ ...page, rooms: [{ ...menRoom, photos: wayPhotos }] })
  expect(html).toContain('How to get there')
  expect(count(html, 'w1.jpg') + count(html, 'w2.jpg') + count(html, 'w3.jpg')).toBe(6)
  expect(html).toContain('Way to the men&#x27;s surau, photo 2 of 3')
  expect(html).toContain('loading="lazy"')
  expect(html).toContain('width="800"')
  expect(html).toContain('rel="noopener"')
  expect(render({ ...page, rooms: [menRoom] })).not.toContain('How to get there')
  expect(render({ ...page, rooms: [{ ...allRoom, directions: null, accessNotes: null }] })).not.toContain('How to get there')
})
it('venue page cards render way-finding photos', () => {
  const vp = {
    ...venuePage,
    places: [{ ...venuePage.places[1], rooms: [{ ...allRoom, confirmedBy: 'visitors' as const, photos: wayPhotos }] }],
  }
  const html = renderToString(createElement(VenuePage, { page: vp } as never))
  expect(html).toContain('w1.jpg')
  expect(html).toContain('Way to the surau, photo 1 of 3')
  expect(html).toContain('Confirmed by visitors Oct 2026')
})
