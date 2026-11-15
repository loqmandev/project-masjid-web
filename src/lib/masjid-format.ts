import type { AudienceTag, ProgramCategory } from './masjid-types'
export const audienceLabels: Record<AudienceTag, string> = {
  belia: 'Youth (belia)',
  wanita: 'Women (wanita)',
  kanak_kanak: 'Children (kanak-kanak)',
  warga_emas: 'Seniors (warga emas)',
  keluarga: 'Family (keluarga)',
  umum: 'Everyone (umum)',
}
export const categoryLabels: Record<ProgramCategory, string> = {
  kuliah: 'Kuliah',
  ceramah: 'Talk (ceramah)',
  kelas: 'Class (kelas)',
  gotong_royong: 'Gotong-royong',
  sukan: 'Sports (sukan)',
  majlis: 'Gathering (majlis)',
  program_belia: 'Youth program',
  lain: 'Program',
}
export const programDate = (iso: string) =>
  new Intl.DateTimeFormat('en-MY', {
    timeZone: 'Asia/Kuala_Lumpur',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso))
export const localISO = (iso: string) =>
  new Date(new Date(iso).getTime() + 28800000).toISOString().slice(0, 19) +
  '+08:00'
export const directionsUrl = (lat: number, lng: number) =>
  `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
export const wazeUrl = (lat: number, lng: number) =>
  `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`

/** "Masjid" or "Surau", classified the way the backend does (type + name). */
export const venueLabel = (type: string | null | undefined, name: string) =>
  (type == null || type === 'masjid') && !/^\s*surau/i.test(name) ? 'Masjid' : 'Surau'

/**
 * Stored addresses are often ALL CAPS. Title-case them word by word, leaving words
 * that contain digits ("LOT 1234," stays) and any address that already has
 * lower-case letters exactly as stored.
 */
export function titleCaseAddress(address: string): string {
  if (!/\p{L}/u.test(address) || /\p{Ll}/u.test(address)) return address
  return address
    .split(/(\s+)/)
    .map((word) =>
      /\d/.test(word)
        ? word
        : word.replace(
            /\p{L}[\p{L}']*/gu,
            (run) => run.charAt(0).toUpperCase() + run.slice(1).toLowerCase(),
          ),
    )
    .join('')
}

export const PRAYER_KEYS = [
  'subuh',
  'zohor',
  'asar',
  'maghrib',
  'isyak',
] as const
const MYT = 'Asia/Kuala_Lumpur'
function isTimeZone(tz: unknown): tz is string {
  if (typeof tz !== 'string' || !tz) return false
  try {
    new Intl.DateTimeFormat('en', { timeZone: tz })
    return true
  } catch {
    return false
  }
}
/**
 * Today's five prayers for any country the API supports, plus a `timeZone` entry:
 * the IANA zone the API returns (DST-aware, e.g. Australia/Sydney). A Malaysian
 * response without one (older API) falls back to Malaysia time; any other response
 * without a valid zone is dropped rather than shown in the wrong time.
 */
export function validPrayerTimes(
  value: unknown,
): Record<string, string> | null {
  if (!value || typeof value !== 'object') return null
  const p = value as { country?: unknown; timezone?: unknown; times?: Record<string, unknown> }
  const timeZone = isTimeZone(p.timezone) ? p.timezone : p.country === 'MY' ? MYT : null
  if (
    typeof p.country !== 'string' ||
    !timeZone ||
    !p.times ||
    !PRAYER_KEYS.every(
      (k) =>
        typeof p.times![k] === 'string' &&
        Number.isFinite(Date.parse(p.times![k] as string)),
    )
  )
    return null
  return {
    ...Object.fromEntries(PRAYER_KEYS.map((k) => [k, p.times![k] as string])),
    timeZone,
  }
}
export const prayerTime = (iso: string, timeZone = MYT) =>
  new Intl.DateTimeFormat('en-MY', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
    .format(new Date(iso))
    .toLowerCase()
/** "5:48 am" as { time: "5:48", meridiem: "am" } for the prayer table. */
export function prayerTimeParts(iso: string, timeZone = MYT) {
  const [time, meridiem = ''] = prayerTime(iso, timeZone).split(/[\s\u00a0\u202f]+/)
  return { time, meridiem }
}
/** Calendar day in `timeZone` (default Malaysia), YYYY-MM-DD. */
export const mytDate = (ms: number, timeZone = MYT) =>
  new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(ms))
/** "Thursday 29 October" in Malaysia time (built from parts: no locale punctuation). */
export function mytDateLabel(iso: string, timeZone = MYT) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).formatToParts(new Date(iso))
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  return `${get('weekday')} ${get('day')} ${get('month')}`
}
export const prayerName = (key: (typeof PRAYER_KEYS)[number]) =>
  key.charAt(0).toUpperCase() + key.slice(1)
/**
 * The next of today's five prayers after `now`, or null after Isyak. Times from a
 * different Malaysia day than `now` (a page left open past midnight) never match.
 */
export function nextPrayer(prayers: Record<string, string>, now: number) {
  const tz = prayers.timeZone || MYT
  if (mytDate(Date.parse(prayers.subuh), tz) !== mytDate(now, tz)) return null
  for (const key of PRAYER_KEYS) {
    const at = Date.parse(prayers[key])
    if (at > now) return { key, minutes: Math.max(1, Math.ceil((at - now) / 60000)) }
  }
  return null
}
export function countdownLabel(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h ? (m ? `${h} h ${m} min` : `${h} h`) : `${m} min`
}
export const recurringTime = (time: string) =>
  /^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(time)
    ? prayerTime(`2000-01-01T${time}:00+08:00`)
    : time

const titleCaseWord = (w: string) =>
  /\d/.test(w) ? w : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
function cleanPart(v: string | null | undefined): string | null {
  const t = v?.trim()
  return t || null
}
const titleCaseState = (state: string) =>
  state
    .split(/\s+/)
    .map((w) => (/^w\.?p\.?$/i.test(w) ? w.toUpperCase() : titleCaseWord(w)))
    .join(' ')
export function placeParts(
  districtName: string | null | undefined,
  stateName: string | null | undefined,
): {
  district: string | null
  state: string | null
  line: string
  prose: string
} {
  let district = cleanPart(districtName)
  const rawState = cleanPart(stateName)
  const state = rawState ? titleCaseState(rawState) : null
  if (district) district = cleanPart(district.replace(/^\s*[A-Za-z]{2,4}\s+-\s+/, ''))
  if (
    district &&
    (/^unknown(\s+district)?$/i.test(district) || /^zon\s*\d+$/i.test(district))
  )
    district = null
  if (district && !/[a-z]/.test(district))
    district = district.split(/\s+/).map(titleCaseWord).join(' ')
  if (district && state && district.toLowerCase() === state.toLowerCase())
    district = null
  const parts = [district, state].filter(Boolean)
  return {
    district,
    state,
    line: parts.join(' \u00b7 '),
    prose: parts.join(', '),
  }
}
