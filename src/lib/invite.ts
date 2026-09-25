import { APP_BUNDLE_ID, APP_SCHEME } from './app'
import { PLAY_STORE_URL } from './site'

/**
 * Prayer Circle invites.
 *
 * Owners share `https://jejakmasjid.my/prayer-circles/invite/<CODE>`. The page
 * is capability-neutral: it never calls the backend and never learns anything
 * about the circle. It only hands the code to the app, or lets the visitor
 * copy it.
 */

/** Crockford-style alphabet used by the backend (no I, L, O, U). */
const SHORT_CODE = /^[ABCDEFGHJKMNPQRSTVWXYZ0-9]{10}$/
/** Older invite links carried an opaque base64url token instead of a code. */
const LEGACY_TOKEN = /^[A-Za-z0-9_-]{20,64}$/

export type Invite =
  /** A 10-character short code, normalised to upper case. Safe to display. */
  | { kind: 'code'; value: string }
  /** A legacy token, passed through unchanged. Never displayed as a code. */
  | { kind: 'legacy'; value: string }

export function normalizeInviteCode(raw: string | null | undefined): Invite | null {
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  if (!trimmed) return null

  const compact = trimmed.replace(/[\s-]+/g, '').toUpperCase()
  if (SHORT_CODE.test(compact)) return { kind: 'code', value: compact }

  if (LEGACY_TOKEN.test(trimmed)) return { kind: 'legacy', value: trimmed }

  return null
}

/** `ABCDE12345` → `ABCDE 12345`, the form people read aloud and retype. */
export function formatInviteCode(code: string) {
  return `${code.slice(0, 5)} ${code.slice(5)}`
}

/** Custom-scheme link the app handles on both platforms. */
export function appJoinUrl(value: string) {
  return `${APP_SCHEME}://prayer-circle/join?code=${encodeURIComponent(value)}`
}

/**
 * Android intent URL. Chrome opens the app when it is installed and falls
 * through to the Play Store listing when it is not, so the button never
 * dead-ends.
 */
export function androidIntentUrl(value: string) {
  return (
    `intent://prayer-circle/join?code=${encodeURIComponent(value)}` +
    `#Intent;scheme=${APP_SCHEME};package=${APP_BUNDLE_ID};` +
    `S.browser_fallback_url=${encodeURIComponent(PLAY_STORE_URL)};end`
  )
}
