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
