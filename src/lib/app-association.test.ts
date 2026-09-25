import { describe, expect, it } from 'vitest'
import {
  associationResponse,
  buildAppleAppSiteAssociation,
  buildAssetLinks,
  parseAndroidFingerprints,
  parseAppleTeamId,
} from './app-association'

// Syntactically valid, deliberately fake values. Never real IDs.
const TEAM_ID = 'ABCDE12345'
const FP_A = Array.from({ length: 32 }, () => 'AB').join(':')
const FP_B = Array.from({ length: 32 }, (_, i) => i.toString(16).padStart(2, '0')).join(':')

describe('parseAppleTeamId', () => {
  it('accepts 10 upper-case alphanumerics, trimmed', () => {
    expect(parseAppleTeamId(TEAM_ID)).toBe(TEAM_ID)
    expect(parseAppleTeamId(` ${TEAM_ID}\n`)).toBe(TEAM_ID)
  })

  it('rejects missing and malformed values', () => {
    for (const bad of [undefined, null, '', 'abcde12345', 'ABCDE1234', 'ABCDE123456', 'ABCDE-1234', 42]) {
      expect(parseAppleTeamId(bad)).toBeNull()
    }
  })
})

describe('parseAndroidFingerprints', () => {
  it('parses a comma-separated list, normalising case and whitespace', () => {
    expect(parseAndroidFingerprints(`${FP_A}, ${FP_B.toLowerCase()} ,`)).toEqual([
      FP_A,
      FP_B.toUpperCase(),
    ])
  })

  it('de-duplicates', () => {
    expect(parseAndroidFingerprints(`${FP_A},${FP_A.toLowerCase()}`)).toEqual([FP_A])
  })

  it('rejects the whole list if any entry is malformed', () => {
    expect(parseAndroidFingerprints(`${FP_A},AB:CD`)).toBeNull()
    expect(parseAndroidFingerprints(FP_A.replace(/:/g, ''))).toBeNull()
    expect(parseAndroidFingerprints(`${FP_A}:AB`)).toBeNull()
    expect(parseAndroidFingerprints(FP_A.replace('AB', 'ZZ'))).toBeNull()
  })

  it('rejects missing and empty values', () => {
    for (const bad of [undefined, null, '', ' , ', 7]) {
      expect(parseAndroidFingerprints(bad)).toBeNull()
    }
  })
})

describe('buildAppleAppSiteAssociation', () => {
  it('claims only the invite path for the app', () => {
    expect(buildAppleAppSiteAssociation({ APPLE_TEAM_ID: TEAM_ID })).toEqual({
      applinks: {
        details: [
          {
            appIDs: ['ABCDE12345.my.lonasoft.jejakmasjidmobile'],
            components: [{ '/': '/prayer-circles/invite/*' }],
          },
        ],
      },
    })
  })

  it('fails closed without a valid team ID', () => {
    expect(buildAppleAppSiteAssociation({})).toBeNull()
    expect(buildAppleAppSiteAssociation({ APPLE_TEAM_ID: 'TEAMID' })).toBeNull()
  })
})

describe('buildAssetLinks', () => {
  it('lists every fingerprint for the app package', () => {
    expect(buildAssetLinks({ ANDROID_SHA256_CERT_FINGERPRINTS: `${FP_A},${FP_B}` })).toEqual([
      {
        relation: ['delegate_permission/common.handle_all_urls'],
        target: {
          namespace: 'android_app',
          package_name: 'my.lonasoft.jejakmasjidmobile',
          sha256_cert_fingerprints: [FP_A, FP_B.toUpperCase()],
        },
      },
    ])
  })

  it('fails closed without valid fingerprints', () => {
    expect(buildAssetLinks({})).toBeNull()
    expect(buildAssetLinks({ ANDROID_SHA256_CERT_FINGERPRINTS: 'not-a-fingerprint' })).toBeNull()
  })
})

describe('associationResponse', () => {
  it('serves a document as cacheable JSON', async () => {
    const res = associationResponse({ ok: true })
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('application/json')
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=3600')
    expect(await res.json()).toEqual({ ok: true })
  })

  it('answers 404 when there is no document', async () => {
    const res = associationResponse(null)
    expect(res.status).toBe(404)
    expect(res.headers.get('Cache-Control')).toBe('no-store')
  })
})
