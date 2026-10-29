import { ms } from './ms'
import { en } from './en'

export type Locale = 'ms' | 'en'
export const t = (locale: Locale) => locale === 'ms' ? ms : en
export const HOME_ALTERNATES = { ms: '/', en: '/en' } as const
export const COLLABORATION_ALTERNATES = { ms: '/kolaborasi', en: '/en/collaboration' } as const

export function localeForPath(path: string): Locale {
  path = path.replace(/\/+$/, '') || '/'
  return path === '/' || path === '/kolaborasi' ? 'ms' : 'en'
}

export function htmlLangForPath(path: string) {
  path = path.replace(/\/+$/, '') || '/'
  if (path === '/' || path === '/kolaborasi') return 'ms'
  if (path === '/en' || path === '/en/collaboration') return 'en'
  return 'en-MY'
}

export function twinForPath(path: string) {
  path = path.replace(/\/+$/, '') || '/'
  for (const pair of [HOME_ALTERNATES, COLLABORATION_ALTERNATES]) {
    if (path === pair.ms) return pair.en
    if (path === pair.en) return pair.ms
  }
  return undefined
}
