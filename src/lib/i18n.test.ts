import { describe, expect, it } from 'vitest'
import { ms } from './i18n/ms'
import { en } from './i18n/en'
import { htmlLangForPath, localeForPath, twinForPath } from './i18n'

function keys(value: unknown, prefix = ''): string[] {
  if (!value || typeof value !== 'object') return []
  return Object.entries(value).flatMap(([key, child]) => [prefix + key, ...keys(child, `${prefix}${key}.`)]).sort()
}

describe('route languages and dictionaries', () => {
  it('has exactly the same nested keys in both directions, including every FAQ and tile', () => {
    expect(keys(en)).toEqual(keys(ms))
  })
  it('derives document language before hydration without changing existing routes', () => {
    for (const path of ['/', '/kolaborasi']) expect(htmlLangForPath(path)).toBe('ms')
    for (const path of ['/en', '/en/', '/en/collaboration']) expect(htmlLangForPath(path)).toBe('en')
    for (const path of ['/ajk', '/privacy', '/masjid/test', '/prayer-circles/invite/ABC']) expect(htmlLangForPath(path)).toBe('en-MY')
    expect(localeForPath('/ajk')).toBe('en')
    expect(localeForPath('/privacy')).toBe('en')
  })
  it('round-trips only pages with actual language twins', () => {
    for (const path of ['/', '/en', '/kolaborasi', '/en/collaboration']) expect(twinForPath(twinForPath(path)!)).toBe(path)
    for (const path of ['/ajk', '/privacy', '/masjid/test']) expect(twinForPath(path)).toBeUndefined()
  })
})
