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
  EMAIL?: {
    send(message: {
      to: string
      from: { email: string; name?: string }
      subject: string
      text?: string
      html?: string
      replyTo?: string
    }): Promise<unknown>
  }
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
export type WebEnv = AssociationEnv & AjkEnv & {
  MASJID_PAGES_ENABLED?: string
  JM_API_BASE?: string
  JM_API?: { fetch(request: Request): Promise<Response> }
}
export async function getWorkerEnv(): Promise<WebEnv> {
  const { env } = await import('cloudflare:workers')
  return env as WebEnv
}
