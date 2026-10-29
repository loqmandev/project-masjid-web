import type { AssociationEnv } from './app-association'

/**
 * Reads Worker vars at request time. Imported dynamically so the
 * `cloudflare:workers` module never reaches the client bundle.
 * Server-only: call from a server route handler.
 */
export type WebEnv = AssociationEnv & {
  MASJID_PAGES_ENABLED?: string
  MASJID_AJK_ENABLED?: string
  /** "true" turns the static map on (page images and /masjid/<slug>/map.svg); anything else is off. */
  MASJID_MAP_ENABLED?: string
  JM_API_BASE?: string
  JM_API?: { fetch(request: Request): Promise<Response> }
  /** Service binding to the `project-masjid-tiles` Worker (masjid page map). */
  TILES?: { fetch(request: Request): Promise<Response> }
  /** Tile origin used when the TILES binding is absent (default tiles.jejakmasjid.my). */
  TILES_BASE?: string
}
export async function getWorkerEnv(): Promise<WebEnv> {
  const { env } = await import('cloudflare:workers')
  return env as WebEnv
}
