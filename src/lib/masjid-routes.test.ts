import { expect, it, vi } from 'vitest'
vi.mock('./masjid-server', () => ({
  loadVenue: vi.fn(),
  loadMasjid: vi.fn(),
  loadProgram: vi.fn(),
}))
import { Route as masjid } from '@/routes/masjid.$slug'
import { Route as program } from '@/routes/masjid.$slug_.p.$programId'
import { Route as venueRoute } from '@/routes/surau.$slug'
import { Route as venueSitemapRoute } from '@/routes/sitemaps.venues'
import { Route as root } from '@/routes/__root'
import { page, program as programFixture, venuePage } from './masjid-fixture'
import { SITE, absoluteUrl } from './site'

// Merge the actual root and page heads by name/property, as TanStack does.
// Inspecting only the leaf head misses inherited image dimensions.
type Meta = Record<string, string>
async function mergedMeta(route: typeof masjid | typeof program, loaderData: unknown) {
  const rootHead = (await root.options.head!({} as never))!
  const pageHead = (await route.options.head!({ loaderData } as never))!
  const merged = new Map<string, Meta>()
  for (const meta of [...rootHead.meta!, ...pageHead.meta!] as Meta[]) {
    merged.set(meta.property ?? meta.name ?? (meta.title ? 'title' : 'charset'), meta)
  }
  return [...merged.values()]
}

it.each(['masjid', 'program'] as const)(
  '%s merged page head does not inherit dimensions for a custom image',
  async (kind) => {
    const image = kind === 'masjid'
      ? 'https://bucket.jejakmasjid.my/photo.jpg'
      : 'https://shop.jejakmasjid.my/media/ajk/poster.jpg'
    const meta = kind === 'masjid'
      ? await mergedMeta(masjid, { page: { ...page, photos: [{ url: image }] }, prayers: null })
      : await mergedMeta(program, { program: { ...programFixture, posterUrl: image } })
    expect(meta.filter((m) => m.property === 'og:image')).toEqual([
      { property: 'og:image', content: image },
    ])
    expect(meta.some((m) => ['og:image:width', 'og:image:height'].includes(m.property))).toBe(false)
  },
)

it.each(['masjid', 'program'] as const)(
  '%s merged page head retains known default card dimensions',
  async (kind) => {
    const meta = kind === 'masjid'
      ? await mergedMeta(masjid, { page, prayers: null })
      : await mergedMeta(program, { program: programFixture })
    expect(meta).toContainEqual({ property: 'og:image', content: absoluteUrl(SITE.ogImage) })
    expect(meta).toContainEqual({ property: 'og:image:width', content: '1200' })
    expect(meta).toContainEqual({ property: 'og:image:height', content: '630' })
  },
)

it('both route error heads omit noindex, with no-store on success and errors', () => {
  for (const route of [masjid, program]) {
    const head = route.options.head as (ctx: { loaderData: undefined }) => {
      meta: unknown[]
    }
    const headers = route.options.headers as (ctx: {
      loaderData: unknown
    }) => Record<string, string>
    expect(head({ loaderData: undefined })).toEqual({ meta: [] })
    expect(headers({ loaderData: undefined })['Cache-Control']).toBe('no-store')
    expect(headers({ loaderData: {} })['Cache-Control']).toBe('no-store')
    expect(route.options.errorComponent).toBeDefined()
  }
})

it('venue route: head from the payload, noindex when not indexable, error head and no-store', async () => {
  const head = venueRoute.options.head as (ctx: { loaderData: unknown }) => { meta: Meta[]; links?: Meta[]; scripts?: { children: string }[] }
  const ok = head({ loaderData: { venue: venuePage } })
  expect(ok.meta[0].title).toContain('Surau at Mall Fixture')
  expect(ok.links![0].href).toBe('https://jejakmasjid.my/surau/mall-fixture')
  expect(JSON.parse(ok.scripts![0].children)['@type']).toBe('ShoppingCenter')
  const hidden = head({ loaderData: { venue: { ...venuePage, indexable: false } } })
  expect(hidden.meta).toContainEqual({ name: 'robots', content: 'noindex, nofollow' })
  expect(head({ loaderData: undefined })).toEqual({ meta: [] })
  const headers = venueRoute.options.headers as () => Record<string, string>
  expect(headers()['Cache-Control']).toBe('no-store')
  expect(venueRoute.options.notFoundComponent).toBeDefined()
  expect(venueRoute.options.errorComponent).toBeDefined()
})
it('venue sitemap route serves GET and HEAD', () => {
  const h = venueSitemapRoute.options.server?.handlers as Record<string, unknown>
  expect(typeof h.GET).toBe('function')
  expect(typeof h.HEAD).toBe('function')
})
