import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  HTML_CACHE_HEADER,
  cacheablePath,
  currentBuildId,
  htmlCacheKey,
  isStorableHtml,
  serveHtmlFromCache,
} from './html-cache'

// A tiny Cache API stand-in: keyed by URL string, stores a Response with its body buffered.
function fakeCache() {
  const store = new Map<string, { status: number; headers: Headers; body: string }>()
  return {
    store,
    match: vi.fn(async (key: string) => {
      const entry = store.get(key)
      return entry ? new Response(entry.body, { status: entry.status, headers: entry.headers }) : undefined
    }),
    put: vi.fn(async (key: string, response: Response) => {
      store.set(key, { status: response.status, headers: new Headers(response.headers), body: await response.text() })
    }),
  }
}

const html = (body = '<!DOCTYPE html><html><body>home</body></html>', init: ResponseInit = {}) =>
  new Response(body, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' }, ...init })
const get = (path: string, init: RequestInit = {}) => new Request(`https://jejakmasjid.my${path}`, init)

describe('cacheablePath', () => {
  it('accepts only GET for exactly / and /en without a query string', () => {
    expect(cacheablePath(get('/'))).toBe('/')
    expect(cacheablePath(get('/en'))).toBe('/en')
  })

  it('bypasses queries, other paths, other methods (HEAD included) and range requests', () => {
    for (const path of ['/?utm_source=x', '/en?a=1', '/en/', '/kolaborasi', '/masjid/surau-test', '/privacy', '/en/collaboration', '/_serverFn/abc', '//']) {
      expect(cacheablePath(get(path)), path).toBeNull()
    }
    for (const method of ['HEAD', 'POST', 'PUT', 'DELETE', 'OPTIONS']) expect(cacheablePath(get('/', { method })), method).toBeNull()
    expect(cacheablePath(get('/', { headers: { Range: 'bytes=0-10' } }))).toBeNull()
  })
})

describe('htmlCacheKey', () => {
  it('puts the build id and the path in a zone-host internal key', () => {
    expect(htmlCacheKey('/', 'abc123-xyz')).toBe('https://jejakmasjid.my/__jm-internal-cache/html/abc123-xyz/')
    expect(htmlCacheKey('/en', 'abc123-xyz')).toBe('https://jejakmasjid.my/__jm-internal-cache/html/abc123-xyz/en')
  })

  it('differs per build and per path, and falls back to "dev" outside a build', () => {
    expect(htmlCacheKey('/', 'build-a')).not.toBe(htmlCacheKey('/', 'build-b'))
    expect(htmlCacheKey('/', 'b')).not.toBe(htmlCacheKey('/en', 'b'))
    expect(currentBuildId()).toBe('dev')
    expect(htmlCacheKey('/')).toContain('/html/dev/')
  })
})

describe('isStorableHtml', () => {
  it('stores only a 200 text/html response without cookies or no-store/private', () => {
    expect(isStorableHtml(html())).toBe(true)
    expect(isStorableHtml(html('x', { status: 404 }))).toBe(false)
    expect(isStorableHtml(html('x', { status: 500 }))).toBe(false)
    expect(isStorableHtml(html('x', { status: 301, headers: { 'Content-Type': 'text/html', Location: '/en' } }))).toBe(false)
    expect(isStorableHtml(new Response('{}', { headers: { 'Content-Type': 'application/json' } }))).toBe(false)
    expect(isStorableHtml(html('x', { headers: { 'Content-Type': 'text/html', 'Set-Cookie': 'a=b' } }))).toBe(false)
    expect(isStorableHtml(html('x', { headers: { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' } }))).toBe(false)
    expect(isStorableHtml(html('x', { headers: { 'Content-Type': 'text/html', 'Cache-Control': 'private, max-age=0' } }))).toBe(false)
    expect(isStorableHtml({ status: 200 })).toBe(false)
  })
})

describe('serveHtmlFromCache', () => {
  afterEach(() => vi.restoreAllMocks())

  it('renders on a miss, stores for 300 s, and hands the browser max-age=60', async () => {
    const cache = fakeCache()
    const render = vi.fn(async () => html('<p>hello</p>'))
    const response = await serveHtmlFromCache('/', render, { cache, buildId: 'b1' }) as Response
    expect(render).toHaveBeenCalledTimes(1)
    expect(response.status).toBe(200)
    expect(await response.text()).toBe('<p>hello</p>')
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=60')
    expect(response.headers.get(HTML_CACHE_HEADER)).toBe('miss')
    expect(response.headers.get('Content-Type')).toBe('text/html; charset=utf-8')
    const stored = cache.store.get(htmlCacheKey('/', 'b1'))!
    expect(stored.body).toBe('<p>hello</p>')
    expect(stored.headers.get('Cache-Control')).toBe('public, max-age=300')
    expect(stored.headers.has(HTML_CACHE_HEADER)).toBe(false)
  })

  it('serves the second request from the cache without rendering', async () => {
    const cache = fakeCache()
    await serveHtmlFromCache('/en', async () => html('<p>one</p>'), { cache, buildId: 'b1' })
    const render = vi.fn(async () => html('<p>two</p>'))
    const hit = await serveHtmlFromCache('/en', render, { cache, buildId: 'b1' }) as Response
    expect(render).not.toHaveBeenCalled()
    expect(await hit.text()).toBe('<p>one</p>')
    expect(hit.headers.get(HTML_CACHE_HEADER)).toBe('hit')
    expect(hit.headers.get('Cache-Control')).toBe('public, max-age=60')
    expect(hit.status).toBe(200)
  })

  it('keeps / and /en apart', async () => {
    const cache = fakeCache()
    await serveHtmlFromCache('/', async () => html('<p>ms</p>'), { cache, buildId: 'b1' })
    const en = await serveHtmlFromCache('/en', async () => html('<p>en</p>'), { cache, buildId: 'b1' }) as Response
    expect(await en.text()).toBe('<p>en</p>')
    expect(cache.store.size).toBe(2)
  })

  it('never serves HTML cached by an earlier build', async () => {
    const cache = fakeCache()
    await serveHtmlFromCache('/', async () => html('<p>old assets</p>'), { cache, buildId: 'before-deploy' })
    const render = vi.fn(async () => html('<p>new assets</p>'))
    const response = await serveHtmlFromCache('/', render, { cache, buildId: 'after-deploy' }) as Response
    expect(render).toHaveBeenCalledTimes(1)
    expect(await response.text()).toBe('<p>new assets</p>')
    expect(response.headers.get(HTML_CACHE_HEADER)).toBe('miss')
  })

  it('does not store non-200, non-HTML, cookie or no-store responses and returns them untouched', async () => {
    for (const rendered of [
      new Response('missing', { status: 404, headers: { 'Content-Type': 'text/html' } }),
      new Response('boom', { status: 500, headers: { 'Content-Type': 'text/html' } }),
      new Response('{}', { headers: { 'Content-Type': 'application/json' } }),
      html('c', { headers: { 'Content-Type': 'text/html', 'Set-Cookie': 'a=b' } }),
      html('n', { headers: { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' } }),
    ]) {
      const cache = fakeCache()
      const response = await serveHtmlFromCache('/', async () => rendered, { cache, buildId: 'b1' })
      expect(response).toBe(rendered)
      expect(cache.put).not.toHaveBeenCalled()
      expect((response as Response).headers.has(HTML_CACHE_HEADER)).toBe(false)
    }
  })

  it('passes non-Response results (router redirects) straight through', async () => {
    const cache = fakeCache()
    const redirect = { isRedirect: true, options: { to: '/en' } }
    expect(await serveHtmlFromCache('/', async () => redirect, { cache, buildId: 'b1' })).toBe(redirect)
    expect(cache.put).not.toHaveBeenCalled()
  })

  it('renders normally when there is no cache', async () => {
    const rendered = html()
    expect(await serveHtmlFromCache('/', async () => rendered, { cache: undefined })).toBe(rendered)
  })

  it('falls back to a render when the cache read throws, and still answers when the write throws', async () => {
    const cache = fakeCache()
    cache.match.mockRejectedValueOnce(new Error('cache down'))
    cache.put.mockRejectedValueOnce(new Error('cache full'))
    const response = await serveHtmlFromCache('/', async () => html('<p>fresh</p>'), { cache, buildId: 'b1' }) as Response
    expect(await response.text()).toBe('<p>fresh</p>')
    expect(response.headers.get(HTML_CACHE_HEADER)).toBe('miss')
    expect(cache.store.size).toBe(0)
  })

  it('hands the cache write to waitUntil when available, and awaits it otherwise', async () => {
    const cache = fakeCache()
    const pending: Promise<unknown>[] = []
    const waitUntil = vi.fn((promise: Promise<unknown>) => { pending.push(promise) })
    const response = await serveHtmlFromCache('/', async () => html('<p>x</p>'), { cache, buildId: 'b1', waitUntil }) as Response
    expect(waitUntil).toHaveBeenCalledTimes(1)
    expect(await response.text()).toBe('<p>x</p>')
    await Promise.all(pending)
    expect(cache.store.get(htmlCacheKey('/', 'b1'))?.body).toBe('<p>x</p>')

    const inline = fakeCache()
    await serveHtmlFromCache('/', async () => html('<p>y</p>'), { cache: inline, buildId: 'b1' })
    expect(inline.store.get(htmlCacheKey('/', 'b1'))?.body).toBe('<p>y</p>')
  })
})
