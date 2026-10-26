import { ms } from './ms'
import { en } from './en'

export type Locale = 'ms' | 'en'
export const t = (locale: Locale) => locale === 'ms' ? ms : en
export const HOME_ALTERNATES = { ms: '/', en: '/en' } as const
export const COLLABORATION_ALTERNATES = { ms: '/kolaborasi', en: '/en/collaboration' } as const

export function localeForPath(path: string): Locale {
  path = path.replace(/\/+$/, '') || '/'
  return path === '/' || path === '/kolaborasi' || path === '/masjid' || path.startsWith('/masjid/di/') ? 'ms' : 'en'
}

export function htmlLangForPath(path: string) {
  path = path.replace(/\/+$/, '') || '/'
  if (path === '/' || path === '/kolaborasi' || path === '/masjid' || path.startsWith('/masjid/di/')) return 'ms'
  if (path === '/en' || path === '/en/collaboration' || path === '/en/mosques' || path.startsWith('/en/mosques/in/')) return 'en'
  return 'en-MY'
}

export function twinForPath(path: string): string | undefined {
  const [pathname, search = ''] = path.split('?')
  path = pathname.replace(/\/+$/, '') || '/'
  for (const pair of [HOME_ALTERNATES, COLLABORATION_ALTERNATES]) {
    if (path === pair.ms) return pair.en
    if (path === pair.en) return pair.ms
  }
  const params = new URLSearchParams(search)
  const twin = path === '/masjid' ? '/en/mosques' : path === '/en/mosques' ? '/masjid' : path.startsWith('/masjid/di/') ? path.replace('/masjid/di/', '/en/mosques/in/') : path.startsWith('/en/mosques/in/') ? path.replace('/en/mosques/in/', '/masjid/di/') : undefined
  if (!twin) return undefined
  const result = new URLSearchParams()
  if (params.has('q')) result.set('q', params.get('q')!)
  const from = path.startsWith('/en/') ? 'page' : 'halaman'
  const page = path.includes('/di/') || path.includes('/in/') ? params.get(from) : null
  if (page && /^[1-9]\d*$/.test(page) && Number(page) > 1) result.set(from === 'page' ? 'halaman' : 'page', page)
  return twin + (result.size ? '?' + result : '')
}
