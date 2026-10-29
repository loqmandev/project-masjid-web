import type { AssociationEnv } from './app-association'

/**
 * Reads Worker vars at request time. Imported dynamically so the
 * `cloudflare:workers` module never reaches the client bundle.
 * Server-only: call from a server route handler.
 */
export type WebEnv = AssociationEnv & {
  MASJID_PAGES_ENABLED?: string
  MASJID_AJK_ENABLED?: string
  /** Google Maps Embed API key (public, referrer-restricted). Absent or malformed means no map. */
  GOOGLE_MAPS_EMBED_KEY?: string
  JM_API_BASE?: string
  JM_API?: { fetch(request: Request): Promise<Response> }
}
export async function getWorkerEnv(): Promise<WebEnv> {
  const { env } = await import('cloudflare:workers')
  return env as WebEnv
}
