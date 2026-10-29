import { beforeEach, expect, it, vi } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { isNotFound, isRedirect } from '@tanstack/react-router'
import MasjidFacilities from '@/components/MasjidFacilities'
import { facilityCatalogue, publicFacilities, page, program } from './masjid-fixture'
import type { FacilityCatalogueItem } from './masjid-types'

const pageCatalogue = facilityCatalogue.map(
  ({ code, label, shortDescription, definition, group, sortOrder }) => ({
    code, label, shortDescription, definition, group, sortOrder,
  }),
)

// Exercise the actual server handlers; only replace the Start transport wrapper.
vi.mock('@tanstack/react-start', () => ({
  createServerFn: () => ({
    inputValidator: () => ({ handler: (fn: unknown) => fn }),
  }),
}))
vi.mock('@tanstack/react-start/server', () => ({ setResponseHeader: vi.fn() }))
let ajkVar: string | undefined
let mapVar: string | undefined
vi.mock('./worker-env', () => ({
  getWorkerEnv: async () => ({ MASJID_AJK_ENABLED: ajkVar, MASJID_MAP_ENABLED: mapVar }),
}))
vi.mock('./jm-api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./jm-api')>()),
  getMasjidPage: vi.fn(),
  getFacilityCatalogue: vi.fn(),
  getProgram: vi.fn(),
  getPrayerTimes: vi.fn(),
}))
import { getMasjidPage, getFacilityCatalogue, getProgram, getPrayerTimes } from './jm-api'
import { loadMasjid, loadProgram } from './masjid-server'
import { setResponseHeader } from '@tanstack/react-start/server'

beforeEach(() => {
  vi.clearAllMocks()
  ajkVar = 'true'
  mapVar = undefined
  vi.mocked(getMasjidPage).mockResolvedValue({ status: 200, body: page })
  vi.mocked(getFacilityCatalogue).mockResolvedValue({ status: 200, body: facilityCatalogue })
  vi.mocked(getProgram).mockResolvedValue({ status: 200, body: program })
  vi.mocked(getPrayerTimes).mockResolvedValue({ status: 503, body: null })
})
it('invalid slug and program IDs fail before any fetch', async () => {
  for (const slug of ['../bad', 'Bad', 'ab']) {
    expect(
      isNotFound(await loadMasjid({ data: { slug } }).catch((e) => e)),
    ).toBe(true)
    expect(
      isNotFound(
        await loadProgram({ data: { slug, id: 'ok' } }).catch((e) => e),
      ),
    ).toBe(true)
  }
  expect(
    isNotFound(
      await loadProgram({ data: { slug: 'surau-test', id: '../bad' } }).catch(
        (e) => e,
      ),
    ),
  ).toBe(true)
  expect(getMasjidPage).not.toHaveBeenCalled()
  expect(getProgram).not.toHaveBeenCalled()
  expect(getPrayerTimes).not.toHaveBeenCalled()
})
it('valid aliases redirect permanently, invalid redirect data fails closed', async () => {
  vi.mocked(getMasjidPage).mockResolvedValue({
    status: 200,
    body: { redirect: 'surau-canonical' },
  })
  const e = await loadMasjid({ data: { slug: 'surau-old' } }).catch((e) => e)
  expect(isRedirect(e)).toBe(true)
  expect(e.options).toMatchObject({
    href: '/masjid/surau-canonical',
    statusCode: 301,
  })
  for (const redirect of ['https://evil.test', '//evil.test', '../bad']) {
    vi.mocked(getMasjidPage).mockResolvedValue({
      status: 200,
      body: { redirect },
    })
    await expect(loadMasjid({ data: { slug: 'surau-old' } })).rejects.toThrow(
      'JM_API_UNAVAILABLE',
    )
  }
})
it('program slug mismatch redirects to canonical and null slug is 404', async () => {
  const e = await loadProgram({
    data: { slug: 'surau-old', id: program.id },
  }).catch((e) => e)
  expect(isRedirect(e)).toBe(true)
  expect(e.options).toMatchObject({
    href: `/masjid/${page.masjid.slug}/p/${program.id}`,
    statusCode: 301,
  })
  vi.mocked(getProgram).mockResolvedValue({
    status: 200,
    body: { ...program, masjid: { ...program.masjid, slug: null } },
  })
  expect(
    isNotFound(
      await loadProgram({ data: { slug: 'surau-old', id: program.id } }).catch(
        (e) => e,
      ),
    ),
  ).toBe(true)
})
it('backend 503 throws for both routes rather than successful noindex data', async () => {
  vi.mocked(getMasjidPage).mockResolvedValue({ status: 503, body: null })
  vi.mocked(getProgram).mockResolvedValue({ status: 503, body: null })
  await expect(loadMasjid({ data: { slug: 'surau-test' } })).rejects.toThrow(
    'JM_API_UNAVAILABLE',
  )
  await expect(
    loadProgram({ data: { slug: 'surau-test', id: 'test' } }),
  ).rejects.toThrow('JM_API_UNAVAILABLE')
  expect(setResponseHeader).toHaveBeenCalledWith('Cache-Control', 'no-store')
})
it('upstream 404 remains not found', async () => {
  vi.mocked(getMasjidPage).mockResolvedValue({ status: 404, body: null })
  vi.mocked(getProgram).mockResolvedValue({ status: 404, body: null })
  expect(
    isNotFound(
      await loadMasjid({ data: { slug: 'surau-test' } }).catch((e) => e),
    ),
  ).toBe(true)
  expect(
    isNotFound(
      await loadProgram({ data: { slug: 'surau-test', id: 'test' } }).catch(
        (e) => e,
      ),
    ),
  ).toBe(true)
})
it('validates all five Malaysian prayers and drops incomplete or invalid data', async () => {
  const times = Object.fromEntries(
    ['subuh', 'zohor', 'asar', 'maghrib', 'isyak'].map((k) => [
      k,
      '2026-10-12T12:30:00Z',
    ]),
  )
  vi.mocked(getPrayerTimes).mockResolvedValue({
    status: 200,
    body: { country: 'MY', times },
  })
  expect(
    (await loadMasjid({ data: { slug: page.masjid.slug } })).prayers,
  ).toEqual(times)
  for (const body of [
    null,
    { country: 'SG', times },
    { country: 'MY', times: { ...times, subuh: undefined } },
    { country: 'MY', times: { ...times, isyak: 'bad' } },
  ]) {
    vi.mocked(getPrayerTimes).mockResolvedValue({ status: 200, body })
    expect(
      (await loadMasjid({ data: { slug: page.masjid.slug } })).prayers,
    ).toBeNull()
  }
})

it('loadProgram is 404 without any backend call unless AJK is exactly "true"', async () => {
  for (const v of [undefined, 'false', 'TRUE', '1', '']) {
    ajkVar = v
    expect(
      isNotFound(
        await loadProgram({
          data: { slug: 'surau-test', id: program.id },
        }).catch((e) => e),
      ),
    ).toBe(true)
  }
  expect(getProgram).not.toHaveBeenCalled()
  ajkVar = 'true'
  expect(
    (await loadProgram({ data: { slug: page.masjid.slug, id: program.id } }))
      .program.id,
  ).toBe(program.id)
})
it('loadMasjid returns ajk:true only for exactly "true"', async () => {
  const run = async (v: string | undefined) => {
    ajkVar = v
    return (await loadMasjid({ data: { slug: page.masjid.slug } })).ajk
  }
  expect(await run(undefined)).toBe(false)
  expect(await run('false')).toBe(false)
  expect(await run('TRUE')).toBe(false)
  expect(await run('1')).toBe(false)
  expect(await run('true')).toBe(true)
})

it('never loads the catalogue for older/flag-off backend responses', async () => {
  const result = await loadMasjid({ data: { slug: page.masjid.slug } })
  expect(result.page).toEqual(page)
  expect(result.facilityCatalogue).toEqual([])
  expect(getFacilityCatalogue).not.toHaveBeenCalled()
})
it.each([{ facilities: [] }, { facilities: publicFacilities }])('fetches the catalogue once only after the backend enables facilities', async ({ facilities }) => {
  ajkVar = 'false'
  vi.mocked(getMasjidPage).mockResolvedValue({ status: 200, body: { ...page, facilities } })
  const result = await loadMasjid({ data: { slug: page.masjid.slug } })
  expect(result.page.facilities).toEqual(facilities)
  expect(result.facilityCatalogue).toEqual(pageCatalogue)
  expect(result.ajk).toBe(false)
  expect(getFacilityCatalogue).toHaveBeenCalledOnce()
})
it('drops malformed catalogue entries and hydrates only the six page fields', async () => {
  const valid = facilityCatalogue[0]
  const malformed = [
    null,
    {},
    { code: valid.code, label: valid.label },
    { ...valid, code: null },
    { ...valid, label: null },
    { ...valid, label: 123 },
    { ...valid, group: null },
    { ...valid, group: 123 },
    ...[undefined, null, '2', NaN, Infinity, -Infinity].map((sortOrder) => ({ ...valid, sortOrder })),
  ]
  vi.mocked(getMasjidPage).mockResolvedValue({ status: 200, body: { ...page, facilities: publicFacilities } })
  vi.mocked(getFacilityCatalogue).mockResolvedValue({
    status: 200,
    body: [...malformed, ...facilityCatalogue] as FacilityCatalogueItem[],
  })
  const result = await loadMasjid({ data: { slug: page.masjid.slug } })
  expect(result.facilityCatalogue).toEqual(pageCatalogue)
  for (const item of result.facilityCatalogue) {
    expect(Object.keys(item).sort()).toEqual([
      'code', 'definition', 'group', 'label', 'shortDescription', 'sortOrder',
    ])
  }
})
it.each([3, 9])('renders an enabled page with %s proven facilities and a legacy {code,label} catalogue safely', async (count) => {
  const facilities = Array.from({ length: count }, (_, i) => ({
    ...publicFacilities[0], code: `FAC_${i}`,
  }))
  const legacyCatalogue = facilities.map(({ code }, i) => ({ code, label: `Facility ${i}` }))
  vi.mocked(getMasjidPage).mockResolvedValue({ status: 200, body: { ...page, facilities } })
  vi.mocked(getFacilityCatalogue).mockResolvedValue({
    status: 200, body: legacyCatalogue as FacilityCatalogueItem[],
  })
  const result = await loadMasjid({ data: { slug: page.masjid.slug } })
  expect(result.page.facilities).toHaveLength(count)
  expect(result.facilityCatalogue).toEqual([])
  const html = renderToStaticMarkup(createElement(MasjidFacilities, {
    facilities: result.page.facilities!,
    catalogue: result.facilityCatalogue,
    masjidName: result.page.masjid.name,
  }))
  expect(html).toContain('Some facility details are resting for a moment.')
  expect(html).not.toContain('No confirmed facilities yet.')
  expect(html).not.toContain('class="facility-chip ')
  expect(html).not.toContain('FAC_')
})
it.each([404, 503])('keeps the masjid page available when the catalogue fails with %s', async (status) => {
  vi.mocked(getMasjidPage).mockResolvedValue({ status: 200, body: { ...page, facilities: publicFacilities } })
  vi.mocked(getFacilityCatalogue).mockResolvedValue({ status, body: null })
  const result = await loadMasjid({ data: { slug: page.masjid.slug } })
  expect(result.page.masjid).toEqual(page.masjid)
  expect(result.facilityCatalogue).toEqual([])
})

const reviews = {
  count: 23,
  average: 4.7,
  items: [{ id: 'rv_1', rating: 5, tip: 'Big compound.', createdAt: '2026-10-12T04:31:00Z' }],
}
it('validates reviews in the loader and returns them beside, not inside, the page', async () => {
  vi.mocked(getMasjidPage).mockResolvedValue({
    status: 200,
    body: { ...page, reviews: { ...reviews, items: [{ ...reviews.items[0], userId: 'u-1' }] } },
  })
  const result = await loadMasjid({ data: { slug: page.masjid.slug } })
  expect(result.reviews).toEqual(reviews)
  expect(result.page).not.toHaveProperty('reviews')
  expect(JSON.stringify(result)).not.toContain('u-1')
})
it.each([
  ['absent', undefined],
  ['null', null],
  ['invalid', { ...reviews, count: -1 }],
  ['partly invalid', { ...reviews, items: [{ ...reviews.items[0], rating: 9 }] }],
])('omits reviews entirely when they are %s', async (_name, value) => {
  vi.mocked(getMasjidPage).mockResolvedValue({ status: 200, body: { ...page, reviews: value } })
  const result = await loadMasjid({ data: { slug: page.masjid.slug } })
  expect(result.reviews).toBeNull()
  expect(result.page).not.toHaveProperty('reviews')
})

it('loadMasjid returns mapEnabled:true only for exactly "true" (independent of the AJK flag)', async () => {
  for (const [value, expected] of [[undefined, false], ['false', false], ['TRUE', false], ['1', false], ['', false], ['true', true]] as const) {
    mapVar = value
    ajkVar = 'false'
    const result = await loadMasjid({ data: { slug: page.masjid.slug } })
    expect(result.mapEnabled).toBe(expected)
    expect(result.ajk).toBe(false)
  }
})
