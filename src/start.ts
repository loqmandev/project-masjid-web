import { createMiddleware, createStart } from '@tanstack/react-start'
import { discoveryUnavailableHeaders } from './lib/discovery-response'

// Start's stream renderer uses the router status (200 for a rendered outage).
// Preserve the explicit 503 selected by the discovery server function as well.
const discoveryStatus = createMiddleware().server(async ({ next }) => {
  const result = await next()
  const { getResponseStatus, getResponseHeader } = await import('@tanstack/react-start/server')
  if (getResponseStatus() !== 503 || getResponseHeader('Retry-After') !== '120') return result
  const headers = new Headers(result.response.headers)
  for (const [name, value] of Object.entries(discoveryUnavailableHeaders)) headers.set(name, value)
  return { ...result, response: new Response(result.response.body, { status: 503, headers }) }
})

export const startInstance = createStart(() => ({ requestMiddleware: [discoveryStatus] }))
