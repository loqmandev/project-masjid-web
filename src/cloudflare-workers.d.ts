// Minimal typing for the Workers runtime module. The project does not pull in
// @cloudflare/workers-types; vars are read as untrusted strings and validated.
declare module 'cloudflare:workers' {
  export const env: Record<string, unknown>
  /** Keeps the request's Worker alive until the promise settles. */
  export function waitUntil(promise: Promise<unknown>): void
}
