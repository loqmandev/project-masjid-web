import type { Locale } from './i18n'

export const COUNTRY_NAMES = {
  MY: { ms: 'Malaysia', en: 'Malaysia' },
  SG: { ms: 'Singapura', en: 'Singapore' },
  BN: { ms: 'Brunei', en: 'Brunei' },
  ID: { ms: 'Indonesia', en: 'Indonesia' },
  SA: { ms: 'Arab Saudi', en: 'Saudi Arabia' },
  CN: { ms: 'China', en: 'China' },
} as const

// Mirrors backend CANONICAL_STATE_CODES; the spec's abbreviated SGR is illustrative.
export const STATE_NAMES = {
  JOHOR: { ms: 'Johor', en: 'Johor' },
  KEDAH: { ms: 'Kedah', en: 'Kedah' },
  KELANTAN: { ms: 'Kelantan', en: 'Kelantan' },
  MELAKA: { ms: 'Melaka', en: 'Melaka' },
  NEGERI_SEMBILAN: { ms: 'Negeri Sembilan', en: 'Negeri Sembilan' },
  PAHANG: { ms: 'Pahang', en: 'Pahang' },
  PERAK: { ms: 'Perak', en: 'Perak' },
  PERLIS: { ms: 'Perlis', en: 'Perlis' },
  PULAU_PINANG: { ms: 'Pulau Pinang', en: 'Penang' },
  SABAH: { ms: 'Sabah', en: 'Sabah' },
  SARAWAK: { ms: 'Sarawak', en: 'Sarawak' },
  SELANGOR: { ms: 'Selangor', en: 'Selangor' },
  TERENGGANU: { ms: 'Terengganu', en: 'Terengganu' },
  W_P_KUALA_LUMPUR: { ms: 'W.P. Kuala Lumpur', en: 'Kuala Lumpur' },
  W_P_LABUAN: { ms: 'W.P. Labuan', en: 'Labuan' },
  W_P_PUTRAJAYA: { ms: 'W.P. Putrajaya', en: 'Putrajaya' },
} as const

type CountryCode = keyof typeof COUNTRY_NAMES | null
type StateCode = keyof typeof STATE_NAMES
type VisitCount = { completed: number | null; suppressed: boolean }
export type PublicStats = {
  payloadVersion: 1
  computedAt: string
  windowStart: string
  windowEnd: string
  masjids: {
    total: number; masjid: number; surau: number; unclassified: number
    byCountry: { code: CountryCode; count: number }[]
    byState: { stateCode: StateCode; count: number }[]
  }
  visits30d: {
    completed: number; uniqueMasjids: number; activeVisitors: number
    byCountry: ({ code: CountryCode } & VisitCount)[]
    byState: ({ stateCode: StateCode } & VisitCount)[]
  }
}

const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
const fields = (v: Record<string, unknown>, names: string[]) =>
  Object.keys(v).length === names.length && names.every(key => Object.hasOwn(v, key))
const count = (v: unknown): v is number => Number.isSafeInteger(v) && (v as number) >= 0
const country = (v: unknown) => v === null || typeof v === 'string' && Object.hasOwn(COUNTRY_NAMES, v)
const state = (v: unknown) => typeof v === 'string' && Object.hasOwn(STATE_NAMES, v)
const date = (v: unknown): v is string => {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/.test(v)) return false
  const time = Date.parse(v)
  return Number.isFinite(time) && new Date(time).toISOString() === v.replace(/(?:\.(\d{1,3}))?Z$/, (_, fraction = '') => `.${fraction.padEnd(3, '0')}Z`)
}
const visits = (v: Record<string, unknown>) =>
  v.suppressed === true ? v.completed === null :
    v.suppressed === false && count(v.completed) && (v.completed === 0 || v.completed >= 10)

function rows(v: unknown, key: 'code' | 'stateCode', visit: boolean): boolean {
  if (!Array.isArray(v) || v.length > (key === 'code' ? 7 : 16)) return false
  const seen = new Set<unknown>()
  for (const row of v) {
    if (!record(row) || !fields(row, [key, ...(visit ? ['completed', 'suppressed'] : ['count'])]) ||
      !(key === 'code' ? country(row[key]) : state(row[key])) || seen.has(row[key]) ||
      !(visit ? visits(row) : count(row.count))) return false
    seen.add(row[key])
  }
  return key === 'code' || seen.size === 16
}

/** Fail closed on a partial snapshot, schema drift, or unsuppressed small counts. */
export function validPublicStats(value: unknown): PublicStats | null {
  if (!record(value) || !fields(value, ['payloadVersion', 'computedAt', 'windowStart', 'windowEnd', 'masjids', 'visits30d']) ||
    value.payloadVersion !== 1 || !date(value.computedAt) || !date(value.windowStart) || !date(value.windowEnd)) return null
  const start = Date.parse(value.windowStart), end = Date.parse(value.windowEnd)
  if (end - start !== 30 * 86400000 || Date.parse(value.computedAt) < end ||
    end % 86400000 !== 16 * 3600000) return null
  const m = value.masjids, v = value.visits30d
  if (!record(m) || !record(v) ||
    !fields(m, ['total', 'masjid', 'surau', 'unclassified', 'byCountry', 'byState']) ||
    !fields(v, ['completed', 'uniqueMasjids', 'activeVisitors', 'byCountry', 'byState']) ||
    ![m.total, m.masjid, m.surau, m.unclassified, v.completed, v.uniqueMasjids, v.activeVisitors].every(count) ||
    !rows(m.byCountry, 'code', false) || !rows(m.byState, 'stateCode', false) ||
    !rows(v.byCountry, 'code', true) || !rows(v.byState, 'stateCode', true)) return null
  const result = value as PublicStats
  const countryVisits = result.visits30d.byCountry
  const malaysia = result.masjids.byCountry.find(row => row.code === 'MY')?.count ?? 0
  const minimumVisits = countryVisits.reduce((sum, row) => sum + (row.completed ?? 1), 0)
  const maximumVisits = countryVisits.reduce((sum, row) => sum + (row.completed ?? 9), 0)
  if (result.masjids.masjid + result.masjids.surau !== result.masjids.total || result.masjids.unclassified > result.masjids.masjid ||
    result.masjids.byCountry.reduce((sum, row) => sum + row.count, 0) !== result.masjids.total ||
    result.masjids.byState.reduce((sum, row) => sum + row.count, 0) > malaysia ||
    result.masjids.byCountry.length !== countryVisits.length ||
    !result.masjids.byCountry.every(row => countryVisits.some(visit => visit.code === row.code)) ||
    minimumVisits > result.visits30d.completed || maximumVisits < result.visits30d.completed ||
    result.visits30d.uniqueMasjids > result.visits30d.completed || result.visits30d.activeVisitors > result.visits30d.completed) return null
  return result
}

export const statsNumber = (locale: Locale) => new Intl.NumberFormat(locale === 'ms' ? 'ms-MY' : 'en-MY')
export const statsDate = (value: string, locale: Locale) => new Intl.DateTimeFormat(locale === 'ms' ? 'ms-MY' : 'en-MY', {
  timeZone: 'Asia/Kuala_Lumpur', day: 'numeric', month: 'long', year: 'numeric',
}).format(new Date(value))
