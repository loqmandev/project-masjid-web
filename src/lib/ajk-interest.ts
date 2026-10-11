export const ROLES = [
  'pengerusi',
  'timbalan_pengerusi',
  'setiausaha',
  'bendahari',
  'imam',
  'ajk',
  'lain',
]
export const STATES = [
  'Johor',
  'Kedah',
  'Kelantan',
  'Melaka',
  'Negeri Sembilan',
  'Pahang',
  'Perak',
  'Perlis',
  'Pulau Pinang',
  'Sabah',
  'Sarawak',
  'Selangor',
  'Terengganu',
  'W.P. Kuala Lumpur',
  'W.P. Labuan',
  'W.P. Putrajaya',
]
export const NEEDS = [
  'hebahan_program',
  'laporan_dana',
  'penglibatan_belia',
  'kehadiran_qr',
  'lain',
]
export const SIZES = ['<50', '50-150', '150-500', '>500']
export type Input = Record<string, unknown>
export type Interest = {
  name: string
  role: string
  masjid_name: string
  venue_type: string
  area: string
  state: string
  phone: string
  email: string
  needs: string[]
  congregation_size: string
  notes: string
  source: string
}
export const text = (value: unknown) =>
  typeof value === 'string' ? value.trim() : ''
export const isHoneypot = (input: Input) =>
  typeof input.website === 'string' && input.website.length > 0

/** Malaysian international format, 10–12 digits TOTAL including country code. */
export function normalizePhone(value: unknown): string | null {
  let phone = text(value).replace(/[\s-]/g, '')
  if (phone.startsWith('+')) phone = phone.slice(1)
  if (phone.startsWith('01')) phone = `6${phone}`
  return /^601\d{7,9}$/.test(phone) ? phone : null
}

export function validateInterest(
  input: Input,
):
  { ok: true; data: Interest } | { ok: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {}
  const bounded = (key: string, label: string, min: number, max: number) => {
    const value = text(input[key])
    if (
      (input[key] !== undefined && typeof input[key] !== 'string') ||
      value.length < min ||
      value.length > max ||
      /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)
    )
      errors[key] =
        `${label}: sila isi ${min ? `${min}–` : 'maksimum '}${max} aksara.`
    return value
  }
  const choice = (key: string, options: string[], optional = false) => {
    const value = text(input[key])
    if (
      !(
        optional &&
        !value &&
        (input[key] === undefined || typeof input[key] === 'string')
      ) &&
      !options.includes(value)
    )
      errors[key] = 'Sila pilih pilihan yang sah.'
    return value
  }
  const name = bounded('name', 'Nama penuh', 2, 80)
  const masjid_name = bounded('masjid_name', 'Nama masjid / surau', 3, 120)
  const area = bounded('area', 'Kawasan', 2, 80)
  const email = bounded('email', 'E-mel', 0, 120)
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.email = 'Sila isi alamat e-mel yang sah.'
  const phone = normalizePhone(input.phone)
  if (!phone)
    errors.phone =
      'Sila isi nombor WhatsApp Malaysia yang sah, cth. 012-345 6789.'
  const needs = Array.isArray(input.needs)
    ? input.needs
    : typeof input.needs === 'string'
      ? [input.needs]
      : []
  if (
    !needs.length ||
    needs.some((need) => typeof need !== 'string' || !NEEDS.includes(need))
  )
    errors.needs = 'Sila pilih sekurang-kurangnya satu keperluan yang sah.'
  if (![true, 'on', 'true', '1'].includes(input.consent as string | boolean))
    errors.consent = 'Persetujuan anda diperlukan untuk menyimpan maklumat ini.'
  const data: Interest = {
    name,
    masjid_name,
    area,
    email,
    phone: phone || '',
    needs: [...new Set(needs)] as string[],
    role: choice('role', ROLES),
    venue_type: choice('venue_type', ['masjid', 'surau']),
    state: choice('state', STATES),
    congregation_size: choice('congregation_size', SIZES, true),
    notes: bounded('notes', 'Catatan', 0, 500),
    source: text(input.utm_source || input.source).slice(0, 120) || 'web',
  }
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, data }
}

// Reused by the actual INSERT, rather than a racy read-then-write duplicate check.
export const DUPLICATE_PREDICATE =
  'phone = ? AND masjid_name = ? AND created_at >= ?'
export function duplicateBindings(data: Interest, now: Date) {
  return [
    data.phone,
    data.masjid_name,
    new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
  ]
}
export function allowedOrigin(origin: string | null, requestUrl: string) {
  if (
    origin === 'https://jejakmasjid.my' ||
    origin === 'https://www.jejakmasjid.my'
  )
    return true
  if (!origin) return false
  try {
    const request = new URL(requestUrl)
    const candidate = new URL(origin)
    return (
      ['localhost', '127.0.0.1', '[::1]'].includes(request.hostname) &&
      candidate.hostname === request.hostname &&
      candidate.protocol === request.protocol &&
      origin === candidate.origin
    )
  } catch {
    return false
  }
}
