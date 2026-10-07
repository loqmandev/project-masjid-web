import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { SITE } from './site'
import { structuredData } from './seo'

describe('SSM business identity', () => {
  it('matches the registered company and number', () => {
    expect(SITE.legalName).toBe('JEJAK MANFAAT DIGITAL SOLUTIONS')
    expect(SITE.registrationNumber).toBe('202603263114 (JM1051015-M)')
    expect(SITE.email).toBe('admin@jejakmasjid.my')
  })
  it('uses the same identity in the footer and structured data', () => {
    const footer = readFileSync('src/components/Footer.tsx', 'utf8')
    expect(footer).toContain('{SITE.legalName}')
    expect(footer).toContain('{SITE.registrationNumber}')
    expect(footer).not.toContain('Hakim Technologies')
    expect(JSON.stringify(structuredData())).toContain(SITE.legalName)
  })
})
