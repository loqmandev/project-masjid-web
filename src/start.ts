import { createMiddleware, createStart } from '@tanstack/react-start'
import { cacheablePath, serveHtmlFromCache } from './lib/html-cache'

// 300 s edge cache for the homepage documents (`/`, `/en`); see lib/html-cache.ts.
// Everything else, including HEAD, other methods and any query string, passes through.
// Never in `vite dev`: a 300 s copy would hide every edit to the page.
const homepageHtmlCache = createMiddleware().server(async ({ request, next }) => {
  if (import.meta.env.DEV) return next()
  const path = cacheablePath(request)
  const cache = typeof caches !== 'undefined' ? (caches as CacheStorage & { default?: Cache }).default : undefined
  if (!path || !cache) return next()
  let waitUntil: ((promise: Promise<unknown>) => void) | undefined
  try {
    const workers = await import('cloudflare:workers')
    if (typeof workers.waitUntil === 'function') waitUntil = workers.waitUntil
  } catch {
    /* Not running in workerd: the cache write is awaited inline instead. */
  }
  return serveHtmlFromCache(path, async () => (await next()).response, { cache, waitUntil })
})

export const startInstance = createStart(() => ({ requestMiddleware: [homepageHtmlCache] }))
