import type { AssociationEnv } from './app-association'

/**
 * Reads Worker vars at request time. Imported dynamically so the
 * `cloudflare:workers` module never reaches the client bundle.
 * Server-only: call from a server route handler.
 */
export async function getWorkerEnv(): Promise<AssociationEnv> {
  const { env } = await import('cloudflare:workers')
  return env as AssociationEnv
}
