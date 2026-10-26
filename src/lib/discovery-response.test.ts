import { beforeEach, expect, it, vi } from 'vitest'
vi.mock('@tanstack/react-start/server', () => ({ getResponseStatus: vi.fn(), getResponseHeader: vi.fn() }))
import { getResponseStatus, getResponseHeader } from '@tanstack/react-start/server'
import { startInstance } from '../start'

beforeEach(() => vi.resetAllMocks())
async function respond(status: number) {
  const request = new Request('https://jejakmasjid.my/masjid')
  const response = new Response('<main>Discovery page</main>', { status, headers: { 'Content-Type': 'text/html', 'X-Test': 'preserved' } })
  const context = { request, pathname: '/masjid', context: {}, response }
  const middleware = (await startInstance.getOptions()).requestMiddleware![0]!.options.server!
  const result = await middleware({ ...context, next: async () => context } as never)
  return result instanceof Response ? result : result.response
}
it('preserves an explicit discovery 503 when SSR has constructed a 200 response', async () => {
  vi.mocked(getResponseStatus).mockReturnValue(503)
  vi.mocked(getResponseHeader).mockReturnValue('120')
  const r = await respond(200)
  expect(r.status).toBe(503)
  expect(r.headers.get('Retry-After')).toBe('120')
  expect(r.headers.get('Cache-Control')).toBe('no-store')
  expect(r.headers.get('X-Robots-Tag')).toContain('noindex')
  expect(r.headers.get('X-Test')).toBe('preserved')
  expect(await r.text()).toBe('<main>Discovery page</main>')
})
it.each([200, 404])('preserves ordinary %i responses', async status => {
  vi.mocked(getResponseStatus).mockReturnValue(status)
  const r = await respond(status)
  expect(r.status).toBe(status)
  expect(r.headers.has('Retry-After')).toBe(false)
})
it('leaves unrelated responses alone when discovery has not marked them unavailable', async () => {
  vi.mocked(getResponseStatus).mockReturnValue(503)
  expect((await respond(200)).status).toBe(200)
})
