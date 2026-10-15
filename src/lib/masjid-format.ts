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

export const PRAYER_KEYS = [
  'subuh',
  'zohor',
  'asar',
  'maghrib',
  'isyak',
] as const
export function validPrayerTimes(
  value: unknown,
): Record<string, string> | null {
  if (!value || typeof value !== 'object') return null
  const p = value as { country?: unknown; times?: Record<string, unknown> }
  if (
    p.country !== 'MY' ||
    !p.times ||
    !PRAYER_KEYS.every(
      (k) =>
        typeof p.times![k] === 'string' &&
        Number.isFinite(Date.parse(p.times![k] as string)),
    )
  )
    return null
  return Object.fromEntries(PRAYER_KEYS.map((k) => [k, p.times![k] as string]))
}
export const prayerTime = (iso: string) =>
  new Intl.DateTimeFormat('en-MY', {
    timeZone: 'Asia/Kuala_Lumpur',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
    .format(new Date(iso))
    .toLowerCase()
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
  const parts = [district, state].filter(Boolean)
  return {
    district,
    state,
    line: parts.join(' \u00b7 '),
    prose: parts.join(', '),
  }
}
