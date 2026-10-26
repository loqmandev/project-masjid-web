import type { Locale } from './i18n'
import { COUNTRY_NAMES, STATE_NAMES } from './public-stats'

export type District = { code: string; slug: string; name: string; count: number }
export type Region = District & { districts: District[] }
export type Country = { code: string | null; slug: string; count: number; regions: Region[] }
export type Areas = { payloadVersion: 1; generatedAt: string; countries: Country[] }
export type DiscoveryItem = { slug: string; name: string; type: 'masjid' | 'surau'; districtName: string | null; stateName: string | null; country: string | null }
export type NearbyItem = DiscoveryItem & { distanceM: number }
export type AreaQuery = { country: string; region?: string; district?: string }
export type AreaList = { payloadVersion: 1; area: AreaQuery & { names: { country: string; region?: string; district?: string } }; total: number; page: number; pageSize: 50; items: DiscoveryItem[] }
export type SearchResults = { payloadVersion: 1; q: string; items: DiscoveryItem[] }
export type NearbyResults = { payloadVersion: 1; items: NearbyItem[] }
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
const keys = (v: Record<string, unknown>, required: string[], optional: string[] = []) => required.every(k => Object.hasOwn(v, k)) && Object.keys(v).every(k => [...required, ...optional].includes(k))
const count = (v: unknown): v is number => Number.isSafeInteger(v) && (v as number) >= 0
const text = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0 && v.length <= 300 && !/[\u0000-\u001f]/.test(v)
const nullableText = (v: unknown) => v === null || typeof v === 'string' && v.length <= 300 && !/[\u0000-\u001f]/.test(v)
export const areaSlug = (v: unknown): v is string => typeof v === 'string' && v.length <= 120 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v)
const countryCode = (v: unknown) => v === null || typeof v === 'string' && /^[A-Z]{2}$/.test(v)
const unique = (v: { slug: string }[]) => new Set(v.map(row => row.slug)).size === v.length
const node = (v: unknown): v is District => object(v) && text(v.code) && areaSlug(v.slug) && text(v.name) && count(v.count) && v.count > 0

export function validAreas(value: unknown): Areas | null {
  if (!object(value) || !keys(value, ['payloadVersion', 'generatedAt', 'countries']) || value.payloadVersion !== 1 || typeof value.generatedAt !== 'string' || !/^\d{4}-\d\d-\d\dT/.test(value.generatedAt) || !Number.isFinite(Date.parse(value.generatedAt)) || !Array.isArray(value.countries)) return null
  for (const c of value.countries) {
    if (!object(c) || !keys(c, ['code', 'slug', 'count', 'regions']) || !countryCode(c.code) || !areaSlug(c.slug) || !count(c.count) || c.count < 1 || !Array.isArray(c.regions)) return null
    if (c.code === null && (c.slug !== 'other' || c.regions.length)) return null
    for (const r of c.regions) {
      if (!node(r) || !keys(r as unknown as Record<string, unknown>, ['code', 'slug', 'name', 'count', 'districts']) || !Array.isArray((r as Region).districts) || r.count > c.count) return null
      if (c.code === 'MY' && !Object.hasOwn(STATE_NAMES, r.code)) return null
      const districts = (r as Region).districts
      if (!districts.every(d => node(d) && keys(d as unknown as Record<string, unknown>, ['code', 'slug', 'name', 'count'])) || !unique(districts) || districts.reduce((n, d) => n + d.count, 0) > r.count) return null
    }
    if (!unique(c.regions) || c.regions.reduce((n, r) => n + r.count, 0) > c.count) return null
    if (c.code !== 'MY' && c.regions.length && c.regions.filter(r => r.count >= 5).length < 2) return null
  }
  if (!unique(value.countries) || new Set(value.countries.map(c => c.code)).size !== value.countries.length) return null
  return value as Areas
}
function item(v: unknown, nearby = false): v is DiscoveryItem {
  return object(v) && keys(v, ['slug', 'name', 'type', 'districtName', 'stateName', 'country', ...(nearby ? ['distanceM'] : [])]) && areaSlug(v.slug) && v.slug.length >= 3 && v.slug.length <= 100 && text(v.name) && ['masjid', 'surau'].includes(v.type as string) && nullableText(v.districtName) && nullableText(v.stateName) && countryCode(v.country) && (!nearby || count(v.distanceM) && v.distanceM <= 10000 && v.distanceM % 50 === 0)
}
function items(v: unknown, maximum: number, nearby = false): v is DiscoveryItem[] {
  return Array.isArray(v) && v.length <= maximum && v.every(i => item(i, nearby)) && unique(v)
}
export function validSearch(v: unknown, q?: string): SearchResults | null {
  return object(v) && keys(v, ['payloadVersion', 'q', 'items']) && v.payloadVersion === 1 && typeof v.q === 'string' && v.q === v.q.trim() && v.q.length >= 2 && v.q.length <= 80 && (q === undefined || v.q === q) && items(v.items, 20) ? v as SearchResults : null
}
export function validNearby(v: unknown): NearbyResults | null {
  return object(v) && keys(v, ['payloadVersion', 'items']) && v.payloadVersion === 1 && items(v.items, 20, true) && v.items.every((i, n, all) => n === 0 || (i as NearbyItem).distanceM >= (all[n - 1] as NearbyItem).distanceM) ? v as NearbyResults : null
}
export function validAreaList(v: unknown, query?: AreaQuery): AreaList | null {
  if (!object(v) || !keys(v, ['payloadVersion', 'area', 'total', 'page', 'pageSize', 'items']) || v.payloadVersion !== 1 || !object(v.area) || !keys(v.area, ['country', 'names'], ['region', 'district']) || !areaSlug(v.area.country) || v.area.region !== undefined && !areaSlug(v.area.region) || v.area.district !== undefined && (!v.area.region || !areaSlug(v.area.district))) return null
  const names = v.area.names
  if (!object(names) || !keys(names, ['country'], ['region', 'district']) || !text(names.country)) return null
  for (const k of ['region', 'district'] as const) if ((v.area[k] !== undefined) !== (names[k] !== undefined) || names[k] !== undefined && !text(names[k])) return null
  const area = v.area
  if (query && (['country', 'region', 'district'] as const).some(k => query[k] !== area[k])) return null
  if (!count(v.total) || !count(v.page) || v.page < 1 || v.pageSize !== 50 || v.page > Math.max(1, Math.ceil(v.total / 50)) || !items(v.items, 50) || v.items.length !== Math.min(50, Math.max(0, v.total - (v.page - 1) * 50))) return null
  return v as AreaList
}
export const discoveryHome = (locale: Locale) => locale === 'ms' ? '/masjid' : '/en/mosques'
export const areaPath = (locale: Locale, query: AreaQuery, page = 1) => `${discoveryHome(locale)}/${locale === 'ms' ? 'di' : 'in'}/${[query.country, query.region, query.district].filter(Boolean).join('/')}${page > 1 ? `?${locale === 'ms' ? 'halaman' : 'page'}=${page}` : ''}`
export const countryName = (code: string | null, locale: Locale) => code === null ? (locale === 'ms' ? 'Lain-lain / tidak diketahui' : 'Other or unknown') : COUNTRY_NAMES[code as keyof typeof COUNTRY_NAMES]?.[locale] ?? new Intl.DisplayNames([locale], { type: 'region' }).of(code) ?? code
export function resolveArea(areas: Areas, query: AreaQuery) {
  const country = areas.countries.find(c => c.code !== null && c.slug === query.country)
  if (!country) return null
  const region = query.region ? country.regions.find(r => r.slug === query.region) : undefined
  if (query.region && !region) return null
  const district = query.district ? region?.districts.find(d => d.slug === query.district) : undefined
  if (query.district && !district) return null
  return { country, region, district }
}
export function discoverySearch(search: Record<string, unknown>): { q?: string } {
  return typeof search.q === 'string' ? { q: search.q.trim().slice(0, 81) } : {}
}
export function discoveryAreaSearch(search: Record<string, unknown>, locale: 'ms'): { halaman?: number }
export function discoveryAreaSearch(search: Record<string, unknown>, locale: 'en'): { page?: number }
export function discoveryAreaSearch(search: Record<string, unknown>, locale: Locale) {
  const p = search[locale === 'ms' ? 'halaman' : 'page']
  // Defaults belong in loaderDeps: validated values also enter server URLs.
  if (p === undefined) return {}
  const page = /^[1-9]\d*$/.test(String(p)) && Number.isSafeInteger(Number(p)) ? Number(p) : 1
  return locale === 'ms' ? { halaman: page } : { page }
}
