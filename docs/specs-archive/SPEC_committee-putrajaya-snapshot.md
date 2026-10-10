# SPEC — Putrajaya data snapshot in the committee section

Status: planned (2026-10-10). Owner request: add the Putrajaya Jejak Masjid stats dashboard
(owner-supplied image, 8 Oct 2026) to the committee section of jejakmasjid.my.

## 0. Context

- Domain rules: `CLAUDE.md` (light-only, motion gating, Design System + Brand Mark sections).
- The site was just restyled to the brand kit; reuse its tokens and classes (`.on-deep`, `.eyebrow`,
  `--brand-teal`, `--accent` gold, `--deep-muted`, 20 px cards). Do not introduce new colours —
  the source image is navy/blue; **rebuild it in brand colours, do not embed the image**.
- Section: `src/components/ForCommittees.tsx` (`id="committees"`, `lang="ms"`, mist background).
  Copy is Bahasa Melayu, matching the section.

## 1. Git

Branch `feat/committee-putrajaya-snapshot` from `main`. Commit there. Do not merge, push or deploy.
Stage by explicit path, never `git add -A` / `.`; check `git diff --cached --shortstat`.

## 2. Data — `src/lib/putrajaya-snapshot.ts` (typed constant, no fetch, numbers exactly as below)

```
asOf: '8 Okt 2026, 21:42 MYT'
area: 'Putrajaya'
excluded: 'Masjid Putra & Masjid Tuanku Mizan'
stats:
  1,911  Kunjungan selesai   — 'bukan bilangan individu'
  158    Pengunjung unik     — 'profil dengan kunjungan'
  62     Lokasi direkod      — '1 masjid · 57 surau · 4 mini surau'
  537    Foto dipaparkan     — '89 pemuat naik · 49 lokasi'
prayer (Waktu solat): subtitle '1,333 kunjungan dalam waktu solat (70%)'
  Zohor 316 · Maghrib 290 · Isyak 280 · Subuh 226 · Asar 221
  footnote '578 kunjungan tidak dilabel waktu solat'
topLocations (Lokasi paling aktif): subtitle 'Bilangan kunjungan selesai; bukan jemaah unik'
  Surau Al-Quddus PPAM Saderi  332  (13 pengunjung unik)
  Surau PICC, Level C          197  (5)
  Surau Al-Muttaqin 5R6        187  (6)
  Surau Nur Perdana P10        181  (9)
  Surau Jannatul Firdaus PPAM  175  (8)
venueTypes (Corak kunjungan): Surau 1,791 · Masjid 76 · Mini surau 44
returning: 85 'orang datang lebih sekali'; 61 'orang melawat 2+ lokasi berbeza'
monthly (Kunjungan mengikut bulan): Apr 56* · Mei 181 · Jun 411 · Jul 408 · Ogo 398 · Sep 354 · Okt 103*
  (* bulan separa) note 'April dan Oktober ialah bulan separa'
photos (Foto komuniti): 32 'di Masjid Mahmoodiah' · 505 'di surau / mini surau' · '13 lokasi belum mempunyai foto'
source note: 'Sumber: data Jejak Masjid hingga 8 Okt 2026. Hanya kunjungan yang selesai.
  Masjid Putra & Masjid Tuanku Mizan dikecualikan. 9 lokasi beralamat Putrajaya tetapi berkod
  negeri lain belum dikira sementara semakan geografi.'
```
Store numbers as numbers; format with `Intl.NumberFormat('en-MY')` (1,911). Add a small Vitest
`src/lib/putrajaya-snapshot.test.ts` checking internal consistency that the source shows:
prayer sum 1,333 and 1,333 + 578 = 1,911; venue types sum 1,911; monthly sum 1,911; photos
32 + 505 = 537.

## 3. Component — `src/components/CommitteeSnapshot.tsx`

Placement: inside `ForCommittees`, between the top grid (intro + 3 modules) and the bottom
`border-t` block. Lead-in above the panel (light surface):
- `h3` 'Gambaran awal: Putrajaya' and one line: 'Contoh laporan yang boleh dikongsi bersama AJK —
  kunjungan, waktu solat dan lokasi yang aktif di kawasan anda.'

Panel: one `.on-deep` deep-teal rounded-[20px] block (`bg-deep`, ivory text), padding generous,
`<figure>` with a visually-hidden-or-visible caption, `aria-labelledby` the h3.
- Header row: small gold bar (≈48×4 px), 'Jejak Masjid / Putrajaya' (Nunito 800), sub
  'Tanpa Masjid Putra & Masjid Tuanku Mizan', and the as-of date on the right (`<time dateTime="2026-10-08T21:42+08:00">`).
- 4 stat tiles: grid 2×2 on phones, 4 across on `lg`. Tile = slightly lighter deep surface
  (e.g. `#0B3F3E` or `color-mix(in srgb, var(--brand-teal) 10%, var(--deep))`) rounded-2xl, eyebrow label
  (gold eyebrow on deep is existing style), big number Nunito 800 ivory (photos number may be gold
  — gold text on deep teal is allowed), caption in `--deep-muted`.
- 3 panels (stack on phone, 3 columns on `lg`): Waktu solat (horizontal bars), Lokasi paling aktif
  (ordered list, bar under each name, unique-visitor line), Corak kunjungan (3 bars + the 85 / 61
  callout). Bars: track `color-mix(... 20% ...)`, fill brand teal `#00A9A5` for prayer & venue
  types, gold `#FFCC00` for top locations (accent). Width = value / max in that group, CSS `width` %,
  min visible 2%. Numbers are visible text next to each bar; the bar `div`s are `aria-hidden`.
- Bottom row (2 panels, `lg`: 2fr / 1fr): Kunjungan mengikut bulan — vertical columns built from
  divs (no chart library), value above each, month below, partial months in a muted teal fill with
  the note; Foto komuniti — 32 / 505 / 13 lines.
- Source note below the panel, small `--deep-muted` text inside the panel.
- Lists use semantic `<ol>`/`<ul>`/`<dl>`; every number is real text (screen readers get it all
  without the bars). No tooltips, no hover-only info.
- Motion: may use existing `Reveal` and the gated `[data-motion='on']` pattern; if bars animate,
  only `transform: scaleX/scaleY` from 0, gated behind `html[data-motion="on"]`. Optional.
- 360 px: no horizontal scroll, long surau names wrap, numbers never clipped.
- Contrast ≥ 4.5:1 for all text (ivory and `--deep-muted` on the panel and tile colours; check the
  tile colour you pick).

## 4. Don't change

Other ForCommittees copy, other sections, SEO, routes, tokens (adding one tile token is OK).

## 5. Verify

`pnpm test` (new test included), `pnpm build`, `npx tsc --noEmit` (only the existing
`download.tsx` error). Screenshot `/#committees` at 1280 and 360 px (full section) into
`../.hermes/reviews/committee-snapshot/screens/`, look at them, fix issues. Stop the dev server.
Report to `../.hermes/reviews/committee-snapshot/IMPLEMENTATION.md` (commits, verification,
contrast of every new pair, deviations).
