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
} from '@/components/MasjidPages'
import { page, program } from './masjid-fixture'
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
it('puts app/directions actions in title band with fallback copy', () => {
  const html = render()
  expect(html.indexOf('Open in Jejak Masjid')).toBeLessThan(
    html.indexOf('</header>'),
  )
  expect(html.indexOf('Get directions')).toBeLessThan(html.indexOf('</header>'))
  expect(html).toContain('have the app? Get it below.')
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
  expect(html).toContain('8:30 pm')
  expect(html).toContain('9:00 pm')
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
    '<aside',
  ])
    expect(html).not.toContain(s)
  for (const s of [
    'Surau Fixture',
    'Synthetic street',
    'Open in Jejak Masjid',
    'Get directions',
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
