import { describe, expect, it } from 'vitest'
import {
  androidIntentUrl,
  appJoinUrl,
  formatInviteCode,
  normalizeInviteCode,
} from './invite'

describe('normalizeInviteCode', () => {
  it('accepts a 10-character short code', () => {
    expect(normalizeInviteCode('ABCDE12345')).toEqual({ kind: 'code', value: 'ABCDE12345' })
  })

  it('upper-cases, trims and strips spaces and dashes', () => {
    expect(normalizeInviteCode('  abcde 12345 ')).toEqual({ kind: 'code', value: 'ABCDE12345' })
    expect(normalizeInviteCode('abcde-12345')).toEqual({ kind: 'code', value: 'ABCDE12345' })
    expect(normalizeInviteCode('ab cd-e1 2345')).toEqual({ kind: 'code', value: 'ABCDE12345' })
  })

  it('rejects letters outside the alphabet (I, L, O, U)', () => {
    expect(normalizeInviteCode('ABCDI12345')).toBeNull()
    expect(normalizeInviteCode('ABCDL12345')).toBeNull()
    expect(normalizeInviteCode('ABCDO12345')).toBeNull()
    expect(normalizeInviteCode('ABCDU12345')).toBeNull()
  })

  it('rejects wrong lengths and junk', () => {
    expect(normalizeInviteCode('ABCDE1234')).toBeNull()
    expect(normalizeInviteCode('ABCDE123456')).toBeNull()
    expect(normalizeInviteCode('')).toBeNull()
    expect(normalizeInviteCode('   ')).toBeNull()
    expect(normalizeInviteCode('<script>')).toBeNull()
    expect(normalizeInviteCode(undefined)).toBeNull()
    expect(normalizeInviteCode(null)).toBeNull()
  })

  it('passes legacy base64url tokens through unchanged', () => {
    const token = 'aB3_-xYz0123456789Qq_-'
    expect(normalizeInviteCode(token)).toEqual({ kind: 'legacy', value: token })
    expect(normalizeInviteCode(`  ${token} `)).toEqual({ kind: 'legacy', value: token })
  })

  it('rejects legacy-shaped tokens outside 20–64 characters', () => {
    expect(normalizeInviteCode('a'.repeat(19))).toBeNull()
    expect(normalizeInviteCode('a'.repeat(65))).toBeNull()
    expect(normalizeInviteCode('a'.repeat(64))).toEqual({ kind: 'legacy', value: 'a'.repeat(64) })
  })
})

describe('formatInviteCode', () => {
  it('splits into two groups of five', () => {
    expect(formatInviteCode('ABCDE12345')).toBe('ABCDE 12345')
  })
})

describe('app links', () => {
  it('builds the custom-scheme join URL', () => {
    expect(appJoinUrl('ABCDE12345')).toBe(
      'jejakmasjidmobile://prayer-circle/join?code=ABCDE12345',
    )
  })

  it('builds an Android intent URL that falls back to Play', () => {
    expect(androidIntentUrl('ABCDE12345')).toBe(
      'intent://prayer-circle/join?code=ABCDE12345#Intent;scheme=jejakmasjidmobile;' +
        'package=my.lonasoft.jejakmasjidmobile;' +
        'S.browser_fallback_url=https%3A%2F%2Fplay.google.com%2Fstore%2Fapps%2Fdetails%3Fid%3Dmy.lonasoft.jejakmasjidmobile;end',
    )
  })
})
