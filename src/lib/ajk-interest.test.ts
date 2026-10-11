import { describe, expect, it } from 'vitest'
import {
  allowedOrigin,
  duplicateBindings,
  DUPLICATE_PREDICATE,
  isHoneypot,
  normalizePhone,
  validateInterest,
  STATES,
} from './ajk-interest'
export const valid = {
  name: 'Penguji Tempatan',
  role: 'ajk',
  masjid_name: 'Masjid Ujian',
  venue_type: 'masjid',
  area: 'Presint 16',
  state: 'W.P. Putrajaya',
  phone: '012-345 6789',
  needs: ['hebahan_program'],
  consent: 'on',
}

describe('Malaysian WhatsApp normalization', () => {
  it.each(['0123456789', '+6012-345 6789', '60123456789', ' 012 345 6789 '])(
    'normalizes %s',
    (input) => expect(normalizePhone(input)).toBe('60123456789'),
  )
  it.each(['601123456789', '6012345678'])(
    'accepts total 10–12 digit boundaries %s',
    (input) => expect(normalizePhone(input)).toBe(input),
  )
  it.each([
    '+6512345678',
    'abc0123456789',
    '6012345678901',
    '601234567',
    '60312345678',
    '++60123456789',
    null,
    60123456789,
  ])('rejects %s', (input) => expect(normalizePhone(input)).toBeNull())
})

describe('interest validation', () => {
  it('normalizes a valid submission', () =>
    expect(validateInterest(valid)).toMatchObject({
      ok: true,
      data: { phone: '60123456789', source: 'web' },
    }))
  it('contains exactly the 16 Malaysian states/territories', () =>
    expect(new Set(STATES).size).toBe(16))
  it.each([
    'name',
    'role',
    'masjid_name',
    'venue_type',
    'area',
    'state',
    'phone',
    'needs',
    'consent',
  ])('requires %s', (field) =>
    expect(validateInterest({ ...valid, [field]: undefined })).toMatchObject({
      ok: false,
      errors: { [field]: expect.any(String) },
    }),
  )
  it.each([
    { name: 'a' },
    { name: 'a'.repeat(81) },
    { masjid_name: 'ab' },
    { masjid_name: 'a'.repeat(121) },
    { area: 'a' },
    { area: 'a'.repeat(81) },
    { email: 'not-email' },
    { email: 'a'.repeat(121) },
    { notes: 'a'.repeat(501) },
    { role: 'admin' },
    { state: 'Singapore' },
    { venue_type: 'other' },
    { needs: ['fake'] },
    { needs: [] },
    { consent: 'false' },
    { congregation_size: '5000' },
    { name: {} },
    { email: [] },
  ])('rejects invalid fields %j', (input) =>
    expect(validateInterest({ ...valid, ...input }).ok).toBe(false),
  )
  it('accepts boundaries, optional fields, trims and deduplicates', () =>
    expect(
      validateInterest({
        ...valid,
        name: ' a'.repeat(40).trim(),
        notes: 'a'.repeat(500),
        needs: ['lain', 'lain'],
        congregation_size: '<50',
        email: 'qa@example.test',
        source: 'video',
      }),
    ).toMatchObject({ ok: true, data: { needs: ['lain'], source: 'video' } }))
  it('honeypot is independent of valid fields and includes whitespace', () => {
    expect(isHoneypot({ website: ' ' })).toBe(true)
    expect(isHoneypot({ website: '' })).toBe(false)
    expect(isHoneypot({})).toBe(false)
  })
  it('duplicate predicate matches exact phone + masjid in last 24 hours', () => {
    const result = validateInterest(valid)
    if (!result.ok) throw new Error('invalid fixture')
    expect(DUPLICATE_PREDICATE).toBe(
      'phone = ? AND masjid_name = ? AND created_at >= ?',
    )
    expect(
      duplicateBindings(result.data, new Date('2026-10-11T12:00:00Z')),
    ).toEqual(['60123456789', 'Masjid Ujian', '2026-10-10T12:00:00.000Z'])
  })
})

describe('origin restrictions', () => {
  it.each(['https://jejakmasjid.my', 'https://www.jejakmasjid.my'])(
    'allows %s',
    (origin) =>
      expect(
        allowedOrigin(origin, 'https://jejakmasjid.my/api/ajk-interest'),
      ).toBe(true),
  )
  it.each([
    null,
    'null',
    'https://evil.test',
    'https://jejakmasjid.my.evil.test',
    'http://localhost:8787',
  ])('denies production origin %s', (origin) =>
    expect(
      allowedOrigin(origin, 'https://jejakmasjid.my/api/ajk-interest'),
    ).toBe(false),
  )
  it('only permits localhost for a matching local request origin', () => {
    expect(
      allowedOrigin(
        'http://localhost:8787',
        'http://localhost:8787/api/ajk-interest',
      ),
    ).toBe(true)
    expect(
      allowedOrigin(
        'http://localhost:9999',
        'http://localhost:8787/api/ajk-interest',
      ),
    ).toBe(true)
  })
})
