// @vitest-environment jsdom
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { facilityTrustLine } from './masjid-facilities'
import { facilityCatalogue, publicFacilities, page } from './masjid-fixture'
import type { PublicFacility, PublicMasjidPage } from './masjid-types'

vi.mock('@/components/Header', () => ({ default: () => null }))
vi.mock('@/components/Footer', () => ({ default: () => null }))
import MasjidFacilities from '@/components/MasjidFacilities'
import { MasjidPage } from '@/components/MasjidPages'

function parse(html: string) {
  const doc = document.implementation.createHTMLDocument()
  doc.body.innerHTML = html
  return doc
}
const render = (facilities = publicFacilities, catalogue = facilityCatalogue) =>
  parse(renderToStaticMarkup(createElement(MasjidFacilities, {
    facilities,
    catalogue,
    masjidName: page.masjid.name,
  })))

it('renders catalogue-ordered proven chips with distinct accessible icons and trust lines', () => {
  const doc = render()
  const chips = [...doc.querySelectorAll('summary.facility-chip')]
  expect(chips.map((chip) => chip.textContent)).toEqual(['Compound parking', 'Wi-Fi', 'Kolah'])
  expect(chips[0].querySelector('svg[role="img"]')?.getAttribute('aria-label')).toBe('Masjid verified')
  expect(chips[0].classList.contains('facility-chip--masjid_verified')).toBe(true)
  expect(chips[1].querySelector('[role="img"]')?.getAttribute('aria-label')).toBe('Confirmed by visitors')
  expect(chips[1].classList.contains('facility-chip--confirmed')).toBe(true)
  expect(chips[0].textContent).not.toContain('verified') // icons only on chips
  expect(doc.body.textContent).toContain(facilityCatalogue[0].definition)
  expect(doc.body.textContent).toContain('Masjid verified · updated Oct 2026')
  expect(doc.body.textContent).toContain('Confirmed by the committee of Surau Fixture.')
  expect(doc.body.textContent).toContain('Confirmed by 4 visitors · 2 photos · last checked 12 Oct 2026')
})

it('keeps reported facilities exclusively inside the initially collapsed disclosure', () => {
  const doc = render()
  const reported = doc.querySelector('details.facility-reported')!
  expect(reported.hasAttribute('open')).toBe(false)
  expect(reported.querySelector(':scope > summary')?.textContent).toBe('1 reported, not confirmed')
  expect(reported.textContent).toContain("Visitors haven't confirmed these yet. Visiting? Confirm them in the Jejak Masjid app.")
  const chip = doc.querySelector('[data-facility-state="unconfirmed"]')!
  expect(reported.contains(chip)).toBe(true)
  expect(chip.querySelector('[role="img"]')?.getAttribute('aria-label')).toBe('Reported, not confirmed')
  expect(chip.querySelector('.lucide-shield-check, .facility-visitors-icon')).toBeNull()
  expect(doc.querySelectorAll('details[open]')).toHaveLength(0)
})

it.each([{ facilities: [] }, { facilities: [publicFacilities[2]] }])('shows the empty proven state, retaining any reported facilities', ({ facilities }) => {
  const doc = render(facilities)
  expect(doc.body.textContent).toContain('No confirmed facilities yet.')
  expect(doc.querySelectorAll('.facility-reported')).toHaveLength(facilities.length ? 1 : 0)
})

it('uses only native disclosures and exactly five help lines without rewards or gold', () => {
  const doc = render()
  expect(doc.querySelector('.facility-help')?.hasAttribute('open')).toBe(false)
  expect(doc.querySelector('.facility-help > summary')?.textContent).toBe('How we check facilities')
  expect(doc.querySelectorAll('.facility-help li')).toHaveLength(5)
  expect(doc.body.textContent).toContain('24 hours needs several visitors inside at night.')
  expect(doc.body.textContent).toContain('Women friendly and compound parking need a photo.')
  expect(doc.querySelector('button, script, [role="dialog"]')).toBeNull()
  expect(doc.body.innerHTML).not.toMatch(/points|\+10|gold|accent|confetti/i)
})

it('links at most four trusted photos, lazily loaded with descriptive alternatives', () => {
  const photos = [
    { id: 'unsafe', url: 'https://tracker.test/photo', createdAt: '' },
    { id: 'js', url: 'javascript:alert(1)', createdAt: '' },
    ...Array.from({ length: 6 }, (_, i) => ({
      id: `${i}`, url: `https://bucket.jejakmasjid.my/${i}.jpg`, createdAt: '',
    })),
  ]
  const doc = render([{ ...publicFacilities[0], photos }])
  expect(doc.querySelectorAll('.facility-photos img')).toHaveLength(4)
  expect(doc.body.innerHTML).not.toContain('tracker.test')
  expect(doc.body.innerHTML).not.toContain('javascript:')
  for (const img of doc.querySelectorAll('.facility-photos img')) {
    expect(img.getAttribute('loading')).toBe('lazy')
    expect(img.getAttribute('alt')).toContain('Wi-Fi at Surau Fixture')
    expect(img.parentElement?.getAttribute('href')).toBe(img.getAttribute('src'))
  }
})

it('groups more than eight proven items, keeping catalogue order within each group', () => {
  const catalogue = Array.from({ length: 9 }, (_, i) => ({
    ...facilityCatalogue[0], code: `FAC_${i}`, label: `Facility ${i}`,
    group: i % 2 ? 'prayer' : 'parking', sortOrder: i,
  }))
  const facilities = catalogue.map((item) => ({ ...publicFacilities[0], code: item.code })).reverse()
  const doc = render(facilities, catalogue.reverse())
  expect([...doc.querySelectorAll('h3')].map((h) => h.textContent)).toEqual(['Parking', 'Prayer spaces'])
  expect([...doc.querySelectorAll('.facility-chip')].map((c) => c.textContent)).toEqual([
    'Facility 0', 'Facility 2', 'Facility 4', 'Facility 6', 'Facility 8',
    'Facility 1', 'Facility 3', 'Facility 5', 'Facility 7',
  ])
  expect(render(facilities.slice(0, 8), catalogue).querySelector('h3')).toBeNull()
})

it.each([
  { group: '', label: 'Other' },
  { group: undefined, label: 'Other' },
  { group: 'visitor_services', label: 'visitor services' },
])('uses a safe heading for group $group', ({ group, label }) => {
  const catalogue = Array.from({ length: 9 }, (_, i) => ({
    ...facilityCatalogue[0], code: `FAC_${i}`, group: group as string,
  }))
  const facilities = catalogue.map(({ code }) => ({ ...publicFacilities[0], code }))
  const doc = render(facilities, catalogue)
  expect(doc.querySelector('h3')?.textContent).toBe(label)
  expect(doc.querySelectorAll('.facility-chip')).toHaveLength(9)
})

it('ignores hidden states even if an upstream response includes them', () => {
  const facilities = ['disputed', 'absent'].map((state, i) => ({
    ...publicFacilities[i], state,
  })) as unknown as PublicFacility[]
  const doc = render(facilities)
  expect(doc.querySelector('.facility-chip')).toBeNull()
  expect(doc.body.innerHTML).not.toMatch(/disputed|absent/)
})

it('handles missing catalogue entries without asserting an empty proven state or exposing codes', () => {
  const doc = render(publicFacilities, [])
  expect(doc.body.textContent).toContain('Some facility details are resting for a moment.')
  expect(doc.body.textContent).not.toContain('No confirmed facilities yet.')
  expect(doc.body.textContent).not.toContain('PARKING_COMPOUND')
  expect(doc.querySelector('.facility-chip')).toBeNull()
})

it('escapes catalogue labels and definitions as text', () => {
  const doc = render([publicFacilities[1]], [{
    ...facilityCatalogue[0], label: '<script>label</script>', definition: '<script>definition</script>',
  }])
  expect(doc.querySelector('script')).toBeNull()
  expect(doc.body.textContent).toContain('<script>definition</script>')
})

describe('backend flag and older-backend parity', () => {
  const legacyPage: PublicMasjidPage = {
    ...page,
    profile: {
      description: null, contactPhone: null, whatsappUrl: null,
      facilities: [{ code: 'OLD_WIFI', label: 'Legacy Wi-Fi' }],
      recurringClasses: [], coverUrl: null, updatedAt: '',
    },
  }
  for (const ajk of [false, true]) {
    it(`keeps the plain legacy list and ignores catalogue data when facilities is absent (AJK ${ajk})`, () => {
      const props = { page: legacyPage, prayers: null, ajk }
      const original = renderToStaticMarkup(createElement(MasjidPage, props))
      const withCatalogue = renderToStaticMarkup(createElement(MasjidPage, {
        ...props, facilityCatalogue,
        page: { ...legacyPage, facilities: undefined },
      }))
      expect(withCatalogue).toBe(original)
      const doc = parse(original)
      expect(doc.querySelector('.facility-section')).toBeNull()
      expect([...doc.querySelectorAll('li')].some((li) => li.textContent === 'Legacy Wi-Fi')).toBe(true)
      expect(doc.body.innerHTML).not.toContain('How we check facilities')
    })
    it(`renders facilities for unclaimed pages regardless of the AJK flag (${ajk})`, () => {
      const html = renderToStaticMarkup(createElement(MasjidPage, {
        page: { ...page, facilities: publicFacilities }, prayers: null, ajk, facilityCatalogue,
      }))
      expect(html).toContain('facilities-title')
      expect(html).toContain('Compound parking')
    })
  }
  it('treats an enabled empty array as authoritative over the compatibility profile list', () => {
    const html = renderToStaticMarkup(createElement(MasjidPage, {
      page: { ...legacyPage, facilities: [] }, prayers: null, ajk: true, facilityCatalogue,
    }))
    expect(html).toContain('No confirmed facilities yet.')
    expect(html).not.toContain('Legacy Wi-Fi')
  })
})

it('formats nullable/D1 dates in Malaysia consistently, with singular counts', () => {
  const item = {
    ...publicFacilities[0],
    summary: { ...publicFacilities[0].summary, visitorConfirmations: 1, proofPhotos: 1, lastCheckedAt: '2026-10-12 18:30:00' },
  }
  expect(facilityTrustLine(item)).toBe('Confirmed by 1 visitor · 1 photo · last checked 13 Oct 2026')
  expect(facilityTrustLine({ ...item, summary: { ...item.summary, lastCheckedAt: null } })).toBe('Confirmed by 1 visitor · 1 photo')
  expect(facilityTrustLine({ ...item, summary: { ...item.summary, lastCheckedAt: 'bad' } })).not.toContain('Invalid')
  expect(facilityTrustLine({ ...publicFacilities[1], summary: { ...item.summary, verifiedAt: null } })).toBe('Masjid verified')
})

it.each([
  { lastCheckedAt: '2026-10-12 12:30:00', expected: 'Confirmed by 3 visitors · last checked 12 Oct 2026' },
  { lastCheckedAt: null, expected: 'Confirmed by 3 visitors' },
])('omits zero photos from the trust line with lastCheckedAt=$lastCheckedAt', ({ lastCheckedAt, expected }) => {
  const facility = {
    ...publicFacilities[0],
    summary: { ...publicFacilities[0].summary, visitorConfirmations: 3, proofPhotos: 0, lastCheckedAt },
  }
  expect(facilityTrustLine(facility)).toBe(expected)
  expect(render([facility]).querySelector('.facility-trust')?.textContent).toBe(expected)
})
