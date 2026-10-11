import type { AssociationEnv } from './app-association'

export interface Statement {
  bind(...values: unknown[]): Statement
  first<T>(): Promise<T | null>
  run(): Promise<{ meta: { changes: number } }>
}
export interface AjkEnv {
  WEB_DB?: {
    prepare(sql: string): Statement
    batch(statements: Statement[]): Promise<unknown[]>
  }
  EMAIL?: { send(message: unknown): Promise<unknown> }
  AJK_INTEREST_NOTIFY_TO?: string
  TURNSTILE_SECRET_KEY?: string
  TURNSTILE_SITE_KEY?: string
}
export async function getAjkPublicConfig() {
  const env = await getWorkerEnv()
  return {
    turnstileSiteKey:
      env.TURNSTILE_SECRET_KEY && env.TURNSTILE_SITE_KEY
        ? env.TURNSTILE_SITE_KEY
        : undefined,
  }
}

/**
 * Reads Worker vars at request time. Imported dynamically so the
 * `cloudflare:workers` module never reaches the client bundle.
 * Server-only: call from a server route handler.
 */
export async function getWorkerEnv(): Promise<AssociationEnv & AjkEnv> {
  const { env } = await import('cloudflare:workers')
  return env as AssociationEnv & AjkEnv
}
