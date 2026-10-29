import { expect, it, vi } from 'vitest'
vi.mock('./masjid-server', () => ({
  loadMasjid: vi.fn(),
  loadProgram: vi.fn(),
}))
import { Route as masjid } from '@/routes/masjid.$slug'
import { Route as program } from '@/routes/masjid.$slug_.p.$programId'
import { Route as root } from '@/routes/__root'
import { page, program as programFixture } from './masjid-fixture'
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

it('the map route serves GET and HEAD for /masjid/<slug>/map.svg', async () => {
  const { Route: map } = await import('@/routes/masjid.$slug_.map[.]svg')
  const handlers = (map.options as unknown as { server: { handlers: Record<string, unknown> } }).server.handlers
  expect(Object.keys(handlers).sort()).toEqual(['GET', 'HEAD'])
})
