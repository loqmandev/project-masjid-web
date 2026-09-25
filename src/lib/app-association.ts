import { APP_BUNDLE_ID } from './app'

/**
 * iOS Universal Links (apple-app-site-association) and Android App Links
 * (assetlinks.json) for the Prayer Circle invite path.
 *
 * Fail closed: each builder returns `null` when its Worker var is missing or
 * malformed, and the route answers 404. A document with a placeholder or wrong
 * ID would be cached by the OS and silently break verification, so it is
 * better to publish nothing at all.
 */

/** The only path the app claims. Everything else on the site stays on the web. */
export const INVITE_PATH_PATTERN = '/prayer-circles/invite/*'

const TEAM_ID = /^[A-Z0-9]{10}$/
const SHA256_FINGERPRINT = /^[0-9A-F]{2}(?::[0-9A-F]{2}){31}$/

export type AssociationEnv = {
  APPLE_TEAM_ID?: unknown
  ANDROID_SHA256_CERT_FINGERPRINTS?: unknown
}

export function parseAppleTeamId(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const value = raw.trim()
  return TEAM_ID.test(value) ? value : null
}

/**
 * Comma-separated `AA:BB:…` SHA-256 fingerprints (32 pairs each). Case is
 * normalised to upper. Any malformed entry rejects the whole list, so a typo
 * never ships a partial document.
 */
export function parseAndroidFingerprints(raw: unknown): string[] | null {
  if (typeof raw !== 'string') return null
  const parts = raw
    .split(',')
    .map((part) => part.trim().toUpperCase())
    .filter(Boolean)
  if (parts.length === 0) return null
  if (!parts.every((part) => SHA256_FINGERPRINT.test(part))) return null
  return [...new Set(parts)]
}

export function buildAppleAppSiteAssociation(env: AssociationEnv) {
  const teamId = parseAppleTeamId(env.APPLE_TEAM_ID)
  if (!teamId) return null
  return {
    applinks: {
      details: [
        {
          appIDs: [`${teamId}.${APP_BUNDLE_ID}`],
          components: [{ '/': INVITE_PATH_PATTERN }],
        },
      ],
    },
  }
}

export function buildAssetLinks(env: AssociationEnv) {
  const fingerprints = parseAndroidFingerprints(env.ANDROID_SHA256_CERT_FINGERPRINTS)
  if (!fingerprints) return null
  return [
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: APP_BUNDLE_ID,
        sha256_cert_fingerprints: fingerprints,
      },
    },
  ]
}

/** 200 JSON with a one-hour cache, or a bare 404 that is not cached. */
export function associationResponse(document: unknown) {
  if (document === null || document === undefined) {
    return new Response('Not found', {
      status: 404,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    })
  }
  return new Response(JSON.stringify(document), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
