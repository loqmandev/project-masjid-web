# SPEC — Public stats: name six more countries (web)

Owner request 2026-11-22. Paired backend spec: `project-masjid-backend-cf/SPEC_public-stats-more-countries.md`.

## Why

The homepage stats block (`src/components/PublicStats.tsx`, section `#angka`) shows a "Lain-lain / tidak diketahui"
row that is the second-largest country row (563 masjids). Nearly all of it is masjids in known countries that the list
doesn't name. The backend will add AE, US, GB, TR, TH and AU to `byCountry`.

## Changes

1. `src/lib/public-stats.ts` → `COUNTRY_NAMES`: add
   - `AE: { ms: 'Emiriah Arab Bersatu', en: 'United Arab Emirates' }`
   - `US: { ms: 'Amerika Syarikat', en: 'United States' }`
   - `GB: { ms: 'United Kingdom', en: 'United Kingdom' }`
   - `TR: { ms: 'Turkiye', en: 'Türkiye' }`
   - `TH: { ms: 'Thailand', en: 'Thailand' }`
   - `AU: { ms: 'Australia', en: 'Australia' }`
2. Same file, `rows()`: the `byCountry` length cap `7` → `13`. Keep every other check; the validator stays fail-closed.
3. **Must accept both payloads.** The web deploys first, so it must render the current 7-row payload and the new
   13-row one. Nothing in the validator may require all 13 codes to be present (today it doesn't; keep it so).
4. `src/lib/i18n/ms.ts` and `en.ts`: `stats.unknown` → ms `'Negara lain'`, en `'Other countries'`. Unlisted
   countries are still in that row, and truly unknown rows are now a handful.
5. Layout: 13 rows makes the country list long. Hide zero-count rows (`row.count > 0`), and leave the list as is
   otherwise. Check that it still fits at phone width (16px gutter, no horizontal scroll).

## Tests

Update or add in the existing test files for public stats (search `validPublicStats`):
- the current 7-row payload is still accepted;
- a 13-row payload with the new codes is accepted and renders the ms and en names;
- an unknown code (e.g. `'DE'`) and a 14-row array are rejected;
- the null row renders as "Negara lain" / "Other countries".
Run the project's test and typecheck commands from its `CLAUDE.md`/`package.json`.

## Git

Branch `feat/public-stats-more-countries` from `origin/develop`, merge back into `develop` (never `main`). Don't deploy.
This ships **before** the backend change.
