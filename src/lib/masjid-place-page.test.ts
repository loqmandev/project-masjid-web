// @vitest-environment jsdom
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { act, cleanup, render } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/components/Header', () => ({ default: () => null }))
vi.mock('@/components/Footer', () => ({ default: () => null }))
import { MasjidPage } from '@/components/MasjidPages'
import PrayerTimes from '@/components/masjid/PrayerTimes'
import { Gallery } from '@/components/masjid/Gallery'
import { facilityCatalogue, page, publicFacilities } from './masjid-fixture'
import { jsonLdScript, mosqueJsonLd } from './jsonld'
import type { MasjidReviews } from './masjid-reviews'
import type { PublicMasjidPage } from './masjid-types'

const styles = readFileSync('src/styles.css', 'utf8')
const pageCatalogue = facilityCatalogue.map(
  ({ code, label, shortDescription, definition, group, sortOrder }) => ({
    code, label, shortDescription, definition, group, sortOrder,
  }),
)
const KEY = 'AIzaSyDummyDummyDummyDummy12345_-'
const photoUrl = (i: number) => `https://bucket.jejakmasjid.my/p${i}.jpg`
const photos = (n: number) => Array.from({ length: n }, (_, i) => ({ url: photoUrl(i) }))
const day = (hhmm: string) => `2026-10-29T${hhmm}:00+08:00`
const prayers = {
  subuh: day('05:48'), zohor: day('13:00'), asar: day('16:19'), maghrib: day('18:59'), isyak: day('20:09'),
}
const reviews = (count: number, items = Math.min(count, 3), over: Partial<MasjidReviews> = {}): MasjidReviews => ({
  count,
  average: count >= 3 ? 4.7 : null,
  items: Array.from({ length: items }, (_, i) => ({
    id: `rv_${i + 1}`,
    rating: [5, 4, 5][i],
    tip: `Tip number ${i + 1}`,
    createdAt: i === 0 ? '2026-10-12T04:31:00Z' : '2026-09-20T04:31:00Z',
  })),
  ...over,
})

type Props = Partial<Parameters<typeof MasjidPage>[0]>
const markup = (props: Props = {}) =>
  renderToStaticMarkup(
    createElement(MasjidPage, { page, prayers: null, ajk: false, mapKey: KEY, reviews: null, facilityCatalogue: pageCatalogue, ...props }),
  )
function dom(props: Props = {}) {
  const doc = document.implementation.createHTMLDocument()
  doc.body.innerHTML = markup(props)
  return doc
}
const withPhotos = (n: number, over: Partial<PublicMasjidPage> = {}) => ({ ...page, photos: photos(n), ...over })
const text = (el: Element | null | undefined) => el?.textContent?.replace(/\s+/g, ' ').trim()

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('gallery', () => {
  it.each([
    [1, '1', '1 photo'],
    [3, '3', '3 photos'],
    [5, '5', '5 photos'],
    [8, '5', '8 photos'],
  ])('%s photos: one image set, mosaic of %s, counter "%s", first image eager for LCP', (n, mosaic, counter) => {
    const doc = dom({ page: withPhotos(n) })
    const strip = doc.querySelector('.m-strip')!
    expect(strip.getAttribute('data-n')).toBe(String(n))
    expect(strip.getAttribute('data-mosaic')).toBe(mosaic)
    const imgs = [...strip.querySelectorAll('img')]
    expect(imgs).toHaveLength(n)
    expect(imgs[0].getAttribute('loading')).toBe('eager')
    expect(imgs[0].getAttribute('fetchpriority') ?? imgs[0].getAttribute('fetchPriority')).toBe('high')
    for (const img of imgs.slice(1)) {
      expect(img.getAttribute('loading')).toBe('lazy')
      expect(img.hasAttribute('fetchpriority')).toBe(false)
    }
    for (const img of imgs) {
      expect(img.getAttribute('width')).toBeTruthy()
      expect(img.getAttribute('height')).toBeTruthy()
    }
    expect(imgs.map((i) => i.getAttribute('alt'))).toEqual(
      imgs.map((_, i) => (i === 0 ? page.masjid.name : `${page.masjid.name}, photo ${i + 1}`)),
    )
    expect(text(doc.querySelector('.m-count'))).toBe(counter)
    expect(doc.querySelector('.m-count')!.className).toContain('lg:hidden')
  })
  it('shows "All N photos" and the visitor grid only when the mosaic cannot show everything', () => {
    for (const n of [1, 3, 5]) {
      const doc = dom({ page: withPhotos(n) })
      expect(doc.querySelector('a[href="#photos"]')).toBeNull()
      expect(doc.querySelector('#photos')).toBeNull()
    }
    const doc = dom({ page: withPhotos(8) })
    const all = doc.querySelector('a[href="#photos"]')!
    expect(text(all)).toBe('All 8 photos')
    expect(all.className).toContain('hidden lg:inline-flex')
    const grid = doc.querySelector('#photos')!
    expect(grid.className).toContain('hidden lg:block')
    expect(text(grid.querySelector('h2'))).toBe('Photos from visitors')
    expect(grid.querySelectorAll('img')).toHaveLength(8)
    expect(grid.querySelector('.grid')!.className).toContain('grid-cols-4')
    for (const img of grid.querySelectorAll('img')) expect(img.getAttribute('loading')).toBe('lazy')
  })
  it('with photos the Google map lives in the place card only (lazy); without photos it takes the gallery slot', () => {
    const withImages = dom({ page: withPhotos(3) })
    const maps = withImages.querySelectorAll('iframe')
    expect(maps).toHaveLength(1)
    expect(maps[0].getAttribute('loading')).toBe('lazy')
    expect(withImages.querySelector('aside')!.contains(maps[0])).toBe(true)
    expect(maps[0].closest('.m-map')!.className).not.toContain('m-map-hero')

    const none = dom({ page: withPhotos(0) })
    const hero = none.querySelectorAll('iframe')
    expect(hero).toHaveLength(1)
    expect(hero[0].getAttribute('loading')).toBe('lazy')
    expect(none.querySelector('.m-map-hero')!.contains(hero[0])).toBe(true)
    expect(none.querySelector('aside')!.contains(hero[0])).toBe(false)
    expect(none.querySelector('.m-strip')).toBeNull()
    expect(none.body.textContent).toContain('No photos yet')
    expect(none.body.textContent).toContain('Visitors add photos in the Jejak Masjid app when they singgah.')
    // The place card keeps the address and both buttons.
    const card = none.querySelector('aside')!
    expect(card.textContent).toContain('Synthetic street')
    expect(card.querySelector('a[href^="https://waze.com"]')).not.toBeNull()
  })
  it('uses the AJK cover first, drops untrusted hosts and duplicates, and keeps at most eight', () => {
    const cover = photoUrl(0)
    const doc = dom({
      page: {
        ...page,
        profile: { description: null, contactPhone: null, whatsappUrl: null, facilities: [], recurringClasses: [], coverUrl: cover, updatedAt: '' },
        photos: [{ url: 'https://tracker.test/x.jpg' }, ...photos(12)],
      },
    })
    const srcs = [...doc.querySelectorAll('.m-strip img')].map((i) => i.getAttribute('src'))
    expect(srcs).toHaveLength(8)
    expect(srcs[0]).toBe(cover)
    expect(new Set(srcs).size).toBe(8)
    expect(doc.body.innerHTML).not.toContain('tracker.test')
  })
})

describe('title block and actions', () => {
  it('renders the place line, tags, one h1 and a title-cased address', () => {
    const doc = dom({
      page: { ...page, masjid: { ...page.masjid, name: 'Masjid Fixture', address: 'LOT 1234, KG BARU', type: 'masjid', districtName: 'Kuala Lumpur', stateName: 'Wilayah Persekutuan Kuala Lumpur' } },
    })
    expect(doc.querySelectorAll('h1')).toHaveLength(1)
    expect(text(doc.querySelector('h1'))).toBe('Masjid Fixture')
    expect(text(doc.querySelector('main > div > p'))).toBe('Masjid · Kuala Lumpur · Wilayah Persekutuan Kuala Lumpur')
    expect([...doc.querySelectorAll('.m-tag')].map(text)).toEqual(['Masjid', 'Kuala Lumpur'])
    expect(doc.body.textContent).toContain('Lot 1234, Kg Baru')
    expect(doc.body.textContent).not.toContain('KG BARU')
  })
  it('keeps mixed-case addresses as stored and the JSON-LD address as stored', () => {
    const upper = { ...page, masjid: { ...page.masjid, address: 'JALAN PERDANA' } }
    expect(dom({ page: upper }).body.textContent).toContain('Jalan Perdana')
    expect(mosqueJsonLd(upper).address.streetAddress).toBe('JALAN PERDANA')
    expect(dom({ page: { ...page, masjid: { ...page.masjid, address: 'Jalan Perdana, KL' } } }).body.textContent).toContain('Jalan Perdana, KL')
  })
  it('links Directions and Waze (new tab, noopener) in the title row, the place card and the sticky bar', () => {
    const doc = dom()
    const maps = [...doc.querySelectorAll('a[href^="https://www.google.com/maps"]')].filter((a) => !a.classList.contains('m-map-cover'))
    const waze = [...doc.querySelectorAll('a')].filter((a) => a.getAttribute('href') === 'https://waze.com/ul?ll=2.9,101.7&navigate=yes')
    expect(maps).toHaveLength(3) // title row, place card, sticky bar
    expect(waze).toHaveLength(2) // title row, place card
    for (const a of [...maps, ...waze]) {
      expect(a.getAttribute('target')).toBe('_blank')
      expect(a.getAttribute('rel')).toBe('noopener')
    }
    const row = doc.querySelector('header .lg\\:hidden')!
    expect(text(row)).toBe('DirectionsWaze')
    expect(row.querySelector('a')!.className).toContain('m-btn-primary')
    expect(row.querySelectorAll('a')[1].className).toContain('m-btn-ghost')
  })
  it('has a phone-only sticky bar that is sticky in the page body, never fixed', () => {
    const doc = dom()
    const bar = doc.querySelector('[data-sticky-bar]')!
    expect(bar.className).toContain('sticky')
    expect(bar.className).toContain('bottom-0')
    expect(bar.className).toContain('lg:hidden')
    expect(bar.className).not.toContain('fixed')
    expect(bar.className).toContain('safe-area-inset-bottom')
    expect(bar.parentElement!.tagName).toBe('MAIN')
    expect([...bar.querySelectorAll('a')].map(text)).toEqual(['Directions', 'Open in app'])
    expect(bar.querySelector('a:last-child')!.getAttribute('href')).toBe('jejakmasjidmobile://masjid/fixture-masjid')
  })
  it('has the two-column grid with a sticky aside and the app card copy', () => {
    const doc = dom()
    const grid = doc.querySelector('aside')!.parentElement!
    expect(grid.className).toContain('lg:grid-cols-[minmax(0,1fr)_340px]')
    expect(doc.querySelector('aside')!.className).toContain('lg:sticky')
    const card = doc.querySelector('aside .on-deep')!
    expect(text(card.querySelector('h3'))).toBe('Singgah with Jejak Masjid')
    expect(card.textContent).toContain('Stay ten minutes and the visit joins your journey, a quiet record of every masjid you have prayed at.')
    expect(text(card.querySelector('a'))).toBe('Open in Jejak Masjid')
    expect(card.querySelectorAll('img')).toHaveLength(2)
  })
  it('the app links swap to an Android intent after hydration', async () => {
    Object.defineProperty(navigator, 'userAgent', { value: 'Mozilla/5.0 (Linux; Android 14)', configurable: true })
    const { container } = render(createElement(MasjidPage, { page, prayers: null, ajk: false, reviews: reviews(23), facilityCatalogue: [] }))
    await act(async () => {})
    const hrefs = [...container.querySelectorAll('a')].map((a) => a.getAttribute('href')!).filter((h) => /^(intent|jejakmasjidmobile):\/\//.test(h))
    expect(hrefs.length).toBeGreaterThanOrEqual(3) // app card, sticky bar, "Read all reviews"
    for (const href of hrefs) expect(href).toMatch(/^intent:\/\/masjid\/fixture-masjid#Intent;scheme=jejakmasjidmobile;/)
    Object.defineProperty(navigator, 'userAgent', { value: 'Mozilla/5.0 (X11; Linux x86_64)', configurable: true })
  })
})

describe('prayer times', () => {
  it('omits the whole section when there are no prayers', () => {
    const doc = dom({ prayers: null })
    expect(doc.body.textContent).not.toContain('Prayer times today')
    expect(doc.querySelector('.m-pt')).toBeNull()
  })
  it('server HTML: five cells, the Malaysia date, no highlight and no countdown', () => {
    vi.useFakeTimers({ now: Date.parse(day('15:06')), toFake: ['Date', 'setTimeout', 'clearTimeout'] })
    const doc = dom({ prayers })
    expect(text(doc.querySelector('h2#prayer-times-title'))).toBe('Prayer times today')
    const cells = [...doc.querySelectorAll('.m-pt > div')]
    expect(cells.map((c) => text(c))).toEqual(['Subuh5:48 am', 'Zohor1:00 pm', 'Asar4:19 pm', 'Maghrib6:59 pm', 'Isyak8:09 pm'])
    expect(doc.querySelector('.is-next')).toBeNull()
    expect(doc.body.textContent).toContain('Thursday 29 October')
    expect(doc.body.textContent).not.toMatch(/ in \d+ (min|h)/)
  })
  it('after hydration marks the next prayer and counts down once a minute', async () => {
    vi.useFakeTimers({ now: Date.parse(day('15:06')), toFake: ['Date', 'setTimeout', 'clearTimeout'] })
    const { container } = render(createElement(PrayerTimes, { prayers }))
    await act(async () => {})
    expect(text(container.querySelector('.is-next'))).toBe('Asar4:19 pm')
    expect(text(container.querySelector('p'))).toContain('Asar in 1 h 13 min')
    await act(async () => {
      vi.advanceTimersByTime(60_100) // the next minute boundary
    })
    expect(text(container.querySelector('p'))).toContain('Asar in 1 h 12 min')
    await act(async () => {
      vi.setSystemTime(Date.parse(day('16:30')))
      vi.advanceTimersByTime(61_000)
    })
    expect(text(container.querySelector('.is-next'))).toBe('Maghrib6:59 pm')
    expect(text(container.querySelector('p'))).toContain('Maghrib in 2 h 28 min')
  })
  it('after Isyak there is no highlight and no countdown', async () => {
    vi.useFakeTimers({ now: Date.parse(day('20:30')), toFake: ['Date', 'setTimeout', 'clearTimeout'] })
    const { container } = render(createElement(PrayerTimes, { prayers }))
    await act(async () => {})
    expect(container.querySelector('.is-next')).toBeNull()
    expect(container.textContent).not.toMatch(/ in \d+ (min|h)/)
    expect(container.textContent).toContain('Thursday 29 October')
  })
  it('stops its timer on unmount', async () => {
    vi.useFakeTimers({ now: Date.parse(day('15:06')), toFake: ['Date', 'setTimeout', 'clearTimeout'] })
    const { unmount } = render(createElement(PrayerTimes, { prayers }))
    await act(async () => {})
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})

describe('gallery counter after hydration', () => {
  it('reads "i / N" from the slide that is most visible', async () => {
    let callback: IntersectionObserverCallback = () => {}
    vi.stubGlobal('IntersectionObserver', class {
      constructor(cb: IntersectionObserverCallback) { callback = cb }
      observe() {}
      disconnect() {}
    })
    const urls = Array.from({ length: 5 }, (_, i) => photoUrl(i))
    const { container } = render(createElement(Gallery, { photos: urls, name: 'Masjid' }))
    await act(async () => {})
    expect(text(container.querySelector('.m-count'))).toBe('1 / 5')
    const slides = [...container.querySelectorAll('.m-strip img')]
    await act(async () => {
      callback(
        [
          { target: slides[0], intersectionRatio: 0.2 },
          { target: slides[1], intersectionRatio: 0.9 },
        ] as unknown as IntersectionObserverEntry[],
        {} as IntersectionObserver,
      )
    })
    expect(text(container.querySelector('.m-count'))).toBe('2 / 5')
  })
  it('keeps "N photos" without IntersectionObserver and "1 photo" for a single image', async () => {
    vi.stubGlobal('IntersectionObserver', undefined)
    const three = render(createElement(Gallery, { photos: [photoUrl(1), photoUrl(2), photoUrl(3)], name: 'Masjid' }))
    await act(async () => {})
    expect(text(three.container.querySelector('.m-count'))).toBe('3 photos')
    cleanup()
    const one = render(createElement(Gallery, { photos: [photoUrl(1)], name: 'Masjid' }))
    await act(async () => {})
    expect(text(one.container.querySelector('.m-count'))).toBe('1 photo')
  })
})

describe('facilities', () => {
  it('older backend: no facilities key keeps the plain list and no facility section', () => {
    const legacy = { ...page, profile: { description: null, contactPhone: null, whatsappUrl: null, facilities: [{ code: 'OLD', label: 'Legacy Wi-Fi' }], recurringClasses: [], coverUrl: null, updatedAt: '' } }
    const doc = dom({ page: legacy })
    expect(doc.querySelector('.facility-section')).toBeNull()
    expect([...doc.querySelectorAll('li')].map(text)).toContain('Legacy Wi-Fi')
    expect(dom().querySelector('.facility-section')).toBeNull() // nothing at all without facilities
  })
  it('an enabled empty array shows the empty state, no chips and no legend', () => {
    const doc = dom({ page: { ...page, facilities: [] } })
    expect(doc.body.textContent).toContain('No confirmed facilities yet.')
    expect(doc.querySelector('.facility-chip')).toBeNull()
    expect(doc.querySelector('.facility-legend')).toBeNull()
  })
  it('mixed states: proven chips with trust icons, one dashed reported chip, legend, help', () => {
    const doc = dom({ page: { ...page, facilities: publicFacilities } })
    const section = doc.querySelector('.facility-section')!
    expect(text(section.querySelector('h2'))).toBe('Facilities')
    const proven = [...section.querySelectorAll(':scope > .facility-chips > .facility-item > summary')]
    expect(proven.map(text)).toEqual(['Compound parking', 'Wi-Fi'])
    expect(proven[0].querySelector('[aria-label="Masjid verified"]')).not.toBeNull()
    expect(proven[1].querySelector('[aria-label="Confirmed by visitors"]')).not.toBeNull()
    const reported = section.querySelector('details.facility-reported')!
    expect(text(reported.querySelector('summary'))).toBe('+ 1 reported by visitors')
    expect(reported.querySelector('summary')!.className).toContain('facility-reported-chip')
    expect(reported.hasAttribute('open')).toBe(false)
    expect(text(section.querySelector('.facility-legend'))).toBe('Verified by the masjidConfirmed by visitors')
    expect(section.querySelector('.facility-help')).not.toBeNull()
  })
})

describe('reviews', () => {
  const section = (r: MasjidReviews | null) => dom({ reviews: r }).querySelector('section[aria-labelledby="reviews-title"]')
  it('absent: no section at all', () => {
    expect(section(null)).toBeNull()
    expect(dom().body.textContent).not.toContain('Reviews')
  })
  it('zero reviews: one line and nothing else', () => {
    const s = section({ count: 0, average: null, items: [] })!
    expect(text(s)).toBe('ReviewsNo reviews yet. Visitors can rate this masjid in the app after they check in.')
    expect(s.querySelector('[data-review-tile]')).toBeNull()
  })
  it('one or two reviews: count text (singular/plural), no summary tile, items listed', () => {
    const one = section(reviews(1))!
    expect(text(one)).toContain('1 review from visitors who checked in with Jejak Masjid')
    expect(one.querySelector('[data-review-tile]')).toBeNull()
    const two = section(reviews(2))!
    expect(text(two)).toContain('2 reviews from visitors who checked in with Jejak Masjid')
    expect(two.querySelector('[data-review-tile]')).toBeNull()
    expect(two.querySelectorAll('li')).toHaveLength(2)
  })
  it('23 reviews: deep summary tile with half-rounded gold stars, three tips, Report links, app link', () => {
    const s = section(reviews(23))!
    const tile = s.querySelector('[data-review-tile]')!
    expect(tile.className).toContain('bg-deep')
    expect(text(tile.querySelector('b'))).toBe('4.7')
    expect(tile.querySelector('[role="img"]')!.getAttribute('aria-label')).toBe('4.7 out of 5')
    expect(tile.querySelectorAll('path[fill="#ffcc00"]')).toHaveLength(5) // four full stars + the half
    expect(text(s)).toContain('23 reviews from visitors who checked in with Jejak Masjid')
    const items = [...s.querySelectorAll('li')]
    expect(items).toHaveLength(3)
    expect(items.map((li) => li.querySelector('[role="img"]')!.getAttribute('aria-label'))).toEqual(['5 out of 5', '4 out of 5', '5 out of 5'])
    expect(text(items[0])).toContain('Visitor · October 2026')
    expect(text(items[1])).toContain('Visitor · September 2026')
    const report = items[0].querySelector('a')!
    expect(text(report)).toBe('Report')
    expect(decodeURIComponent(report.getAttribute('href')!)).toBe('mailto:admin@jejakmasjid.my?subject=Report review rv_1 on surau-fixture')
    const more = [...s.querySelectorAll('a')].find((a) => text(a) === 'Read all 23 reviews in the app')!
    expect(more.getAttribute('href')).toBe('jejakmasjidmobile://masjid/fixture-masjid')
    // No gold on a light surface outside the tile; no names, no avatars.
    expect(items.map((li) => li.innerHTML).join('')).not.toMatch(/#ffcc00|<img/i)
  })
  it('three reviews that are all shown have no "Read all" link', () => {
    expect(text(section(reviews(3))!)).not.toContain('Read all')
  })
  it('renders tips as escaped plain text', () => {
    const r = reviews(1)
    r.items[0].tip = '<img src=x onerror=alert(1)><script>alert(2)</script>'
    const html = markup({ reviews: r })
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;&lt;script&gt;alert(2)&lt;/script&gt;')
    expect(html).not.toContain('<script>alert')
    expect(html).not.toContain('<img src=x')
  })
  it('never emits AggregateRating or Review structured data', () => {
    const html = markup({ reviews: reviews(23), page: withPhotos(8) })
    expect(html).not.toMatch(/AggregateRating|aggregateRating|"@type":"Review"|ratingValue|itemprop/)
    expect(jsonLdScript(mosqueJsonLd(page))).not.toMatch(/AggregateRating|Review/)
  })
})

describe('place card below lg', () => {
  const placeCard = (doc: Document) => doc.querySelector('aside[aria-label] > div:not(.on-deep)')!
  it('with photos and a map key it carries the map and shows on phones', () => {
    const card = placeCard(dom({ page: withPhotos(3) }))
    expect(card.querySelector('iframe')).not.toBeNull()
    expect(card.className).toContain('grid')
    expect(card.className).not.toContain('hidden')
  })
  it.each([
    ['no photos, map key set (the map is already in the gallery slot)', { page: withPhotos(0), mapKey: KEY }],
    ['no photos, no key', { page: withPhotos(0), mapKey: null }],
    ['photos, no key (it would only repeat the title block)', { page: withPhotos(3), mapKey: null }],
  ])('is hidden below lg but kept from lg, and the app card stays: %s', (_name, props) => {
    const doc = dom(props)
    const card = placeCard(doc)
    expect(card.className).toContain('hidden')
    expect(card.className).toContain('lg:grid')
    expect(card.textContent).toContain('Synthetic street')
    expect(card.querySelector('a[href^="https://www.google.com/maps"]')).not.toBeNull()
    expect(card.querySelector('a[href^="https://waze.com"]')).not.toBeNull()
    expect(card.querySelector('iframe')).toBeNull()
    // The title block's row (below lg) and the app card are unaffected.
    expect(doc.querySelector('header .lg\\:hidden a[href^="https://waze.com"]')).not.toBeNull()
    expect(doc.querySelector('aside .on-deep')!.textContent).toContain('Singgah with Jejak Masjid')
  })
})

describe('Google Maps embed', () => {
  it('renders one lazy iframe with encoded coordinates, a title and the referrer policy', () => {
    for (const n of [0, 3]) {
      const doc = dom({ page: withPhotos(n) })
      const frames = doc.querySelectorAll('iframe')
      expect(frames).toHaveLength(1)
      const frame = frames[0]
      const url = new URL(frame.getAttribute('src')!)
      expect(url.origin + url.pathname).toBe('https://www.google.com/maps/embed/v1/place')
      expect(url.searchParams.get('key')).toBe(KEY)
      expect(url.searchParams.get('q')).toBe('2.9,101.7') // coordinates, never the name
      expect(url.searchParams.get('zoom')).toBe('16')
      expect(url.searchParams.get('language')).toBe('en')
      expect(frame.getAttribute('src')).toContain('q=2.9%2C101.7')
      expect(frame.getAttribute('src')).not.toContain('Surau')
      expect(frame.getAttribute('title')).toBe('Map of Surau Fixture')
      expect(frame.getAttribute('loading')).toBe('lazy')
      expect(frame.getAttribute('referrerpolicy')).toBe('no-referrer-when-downgrade')
      expect(frame.hasAttribute('allowfullscreen')).toBe(true)
      // Fixed-aspect box: the iframe fills it, so nothing shifts while Google loads.
      expect(frame.parentElement!.className).toContain('m-map')
      expect(frame.parentElement!.children).toHaveLength(2) // iframe + the touch cover link
      expect(frame.hasAttribute('tabindex')).toBe(false) // the iframe stays focusable
    }
    expect(styles).toMatch(/\.m-map\s*\{[^}]*aspect-ratio:\s*16\s*\/\s*10/s)
    expect(styles).toMatch(/\.m-map-hero\s*\{[^}]*aspect-ratio:\s*4\s*\/\s*3/s)
    expect(styles).toMatch(/\.m-map iframe\s*\{[^}]*width:\s*100%;[^}]*height:\s*100%;[^}]*border:\s*0/s)
  })
  it('covers each iframe with a link to Google Maps directions so touch swipes scroll the page', () => {
    for (const n of [0, 3]) {
      const doc = dom({ page: withPhotos(n) })
      const frame = doc.querySelector('iframe')!
      const covers = doc.querySelectorAll('a.m-map-cover')
      expect(covers).toHaveLength(1)
      const cover = covers[0]
      expect(cover.parentElement).toBe(frame.parentElement) // sibling, same fixed-aspect box
      expect(cover.previousElementSibling).toBe(frame)
      expect(cover.getAttribute('href')).toBe('https://www.google.com/maps/search/?api=1&query=2.9,101.7')
      expect(cover.getAttribute('aria-label')).toBe('Open Surau Fixture in Google Maps')
      expect(cover.getAttribute('target')).toBe('_blank')
      expect(cover.getAttribute('rel')).toBe('noopener')
      expect(cover.textContent).toBe('')
    }
    // Shown on touch layouts only: from lg with a fine pointer the iframe stays interactive.
    expect(styles).toMatch(/\.m-map-cover\s*\{[^}]*position:\s*absolute;[^}]*inset:\s*0;[^}]*display:\s*none;/s)
    expect(styles).toMatch(/@media \(max-width: 1023px\), \(pointer: coarse\)\s*\{\s*\.m-map-cover\s*\{\s*display:\s*block;/s)
    expect(styles).not.toMatch(/\.m-map-cover[^{]*\{[^}]*pointer-events/s)
  })
  it('the masjid name is never the query, even when it is odd', () => {
    const doc = dom({ page: { ...withPhotos(3), masjid: { ...page.masjid, name: 'A & B <Masjid> "x"' } } })
    const src = doc.querySelector('iframe')!.getAttribute('src')!
    expect(new URL(src).searchParams.get('q')).toBe('2.9,101.7')
    expect(doc.querySelector('iframe')!.getAttribute('title')).toBe('Map of A & B <Masjid> "x"')
    expect(doc.querySelector('a.m-map-cover')!.getAttribute('aria-label')).toBe('Open A & B <Masjid> "x" in Google Maps')
  })
  it.each([null, undefined, '', 'short', 'has spaces in it but is long enough 123', 'a'.repeat(61), 'bad/char!bad/char!bad/char!'])(
    'no key (%s): no iframe, no empty container, no map markup anywhere',
    (key) => {
      for (const n of [0, 3, 8]) {
        const html = markup({ page: withPhotos(n), mapKey: key as string | null })
        const doc = dom({ page: withPhotos(n), mapKey: key as string | null })
        expect(doc.querySelector('iframe')).toBeNull()
        expect(doc.querySelector('.m-map, .m-map-hero')).toBeNull()
        expect(html).not.toMatch(/google\.com\/maps\/embed|<iframe|map\.svg/)
      }
    },
  )
  it('without a key the no-photo slot is only the standalone "No photos yet" card', () => {
    const doc = dom({ page: withPhotos(0), mapKey: null })
    expect(doc.querySelector('.m-strip')).toBeNull()
    const card = [...doc.querySelectorAll('div')].find((d) => d.children.length === 2 && d.textContent === 'No photos yetVisitors add photos in the Jejak Masjid app when they singgah.')!
    expect(card).toBeTruthy()
    expect(card.className).not.toContain('lg:absolute')
    expect(card.previousElementSibling!.tagName).toBe('P') // right under the place line
    expect(doc.body.textContent).toContain('Singgah with Jejak Masjid')
  })
  it('with photos and no key the gallery is unchanged', () => {
    const doc = dom({ page: withPhotos(5), mapKey: null })
    expect(doc.querySelectorAll('.m-strip img')).toHaveLength(5)
    expect(doc.body.textContent).not.toContain('No photos yet')
  })
  it('the prop defaults to no map', () => {
    const html = renderToStaticMarkup(createElement(MasjidPage, { page: withPhotos(0), prayers: null, ajk: false }))
    expect(html).not.toContain('<iframe')
  })
  it('never loads the embed for impossible coordinates', () => {
    const doc = dom({ page: { ...withPhotos(3), masjid: { ...page.masjid, lat: 120, lng: 0 } } })
    expect(doc.querySelector('iframe')).toBeNull()
  })
})

describe('AJK content', () => {
  it('stays behind the flag and sits in the main column', () => {
    const claimed = { ...page, claimed: false, upcomingPrograms: [] }
    expect(markup({ page: claimed, ajk: false })).not.toContain('Upcoming programs')
    const doc = dom({ page: claimed, ajk: true })
    const main = doc.querySelector('aside[aria-label]')!.previousElementSibling!
    expect(main.querySelector('.m-ajk')!.textContent).toContain('Upcoming programs')
    expect(main.querySelector('.m-ajk')!.textContent).toContain('Claim this surau')
  })
})
