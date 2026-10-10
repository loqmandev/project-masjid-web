/** Putrajaya data snapshot (owner-supplied, 10 Okt 2026). Static; no fetch. */
export const PUTRAJAYA_SNAPSHOT = {
  asOf: '10 Okt 2026, 10:26 MYT',
  asOfIso: '2026-10-10T10:26+08:00',
  area: 'Putrajaya',
  excluded: 'Masjid Putra & Masjid Tuanku Mizan',
  stats: [
    { label: 'Kunjungan selesai', value: 1928, caption: 'bukan bilangan individu' },
    { label: 'Pengunjung unik', value: 158, caption: 'profil dengan kunjungan' },
    { label: 'Lokasi direkod', value: 62, caption: '1 masjid · 57 surau · 4 mini surau' },
    { label: 'Foto dipaparkan', value: 538, caption: '89 pemuat naik · 49 lokasi' },
  ],
  prayer: {
    subtitle: '1,346 kunjungan dalam waktu solat (70%)',
    items: [
      { label: 'Zohor', value: 321 },
      { label: 'Maghrib', value: 291 },
      { label: 'Isyak', value: 282 },
      { label: 'Subuh', value: 230 },
      { label: 'Asar', value: 222 },
    ],
    footnote: '582 kunjungan tidak dilabel waktu solat',
    unlabelled: 582,
  },
  topLocations: {
    subtitle: 'Bilangan kunjungan selesai; bukan jemaah unik',
    items: [
      { name: 'Surau Al-Quddus PPAM Saderi', value: 333, unique: 13 },
      { name: 'Surau PICC, Level C', value: 198, unique: 5 },
      { name: 'Surau Al-Muttaqin 5R6', value: 189, unique: 6 },
      { name: 'Surau Nur Perdana P10', value: 182, unique: 9 },
      { name: 'Surau Jannatul Firdaus PPAM', value: 178, unique: 8 },
    ],
  },
  venueTypes: [
    { label: 'Surau', value: 1806 },
    { label: 'Masjid', value: 76 },
    { label: 'Mini surau', value: 46 },
  ],
  returning: {
    repeat: { value: 85, label: 'orang datang lebih sekali' },
    multi: { value: 61, label: 'orang melawat 2+ lokasi berbeza' },
  },
  monthly: {
    note: 'April dan Oktober ialah bulan separa',
    items: [
      { label: 'Apr', value: 56, partial: true },
      { label: 'Mei', value: 181, partial: false },
      { label: 'Jun', value: 411, partial: false },
      { label: 'Jul', value: 408, partial: false },
      { label: 'Ogo', value: 398, partial: false },
      { label: 'Sep', value: 354, partial: false },
      { label: 'Okt', value: 120, partial: true },
    ],
  },
  photos: {
    mosque: { value: 32, label: 'di Masjid Mahmoodiah' },
    surau: { value: 506, label: 'di surau / mini surau' },
    missing: '13 lokasi belum mempunyai foto',
  },
  source:
    'Sumber: data Jejak Masjid hingga 10 Okt 2026. Hanya kunjungan yang selesai. Masjid Putra & Masjid Tuanku Mizan dikecualikan. 9 lokasi beralamat Putrajaya tetapi berkod negeri lain belum dikira sementara semakan geografi.',
} as const
