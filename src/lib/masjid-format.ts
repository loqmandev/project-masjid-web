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
