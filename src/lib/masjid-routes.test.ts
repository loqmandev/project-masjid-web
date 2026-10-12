import { expect, it, vi } from 'vitest'
vi.mock('./masjid-server', () => ({
  loadMasjid: vi.fn(),
  loadProgram: vi.fn(),
}))
import { Route as masjid } from '@/routes/masjid.$slug'
import { Route as program } from '@/routes/masjid.$slug_.p.$programId'

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
