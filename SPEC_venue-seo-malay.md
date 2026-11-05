# Web SPEC: Malay search titles and descriptions for "surau in <mall>" pages

Status: approved by the owner 2026-11-05 (option 1 of 3: Malay title + description only; page body stays English). Not built.
Root brief: `../SPEC_venue-prayer-rooms.md` (§1 problem: "surau <mall>" searches with low CTR).
Branch: `feature/venue-seo-malay` from `main` (web has no `develop`; the main checkout sits on an old branch, so build in a worktree `../.hermes/worktrees/venue-seo-malay-web`). No push, no deploy.

## 1. Why

Our target searches are Malay-first ("surau trx", "surau setia city mall", "surau ampang point"). Live titles and descriptions say "Surau at …" / "Where to pray in …" / "Where to find it: …". A Malay snippet should read more naturally to these searchers and lift CTR. This is a search-snippet change only: no URL, body, `lang`, hreflang, sitemap or JSON-LD change.

## 2. Scope

| Surface | Today (English) | New (Malay) | Code |
|---|---|---|---|
| `/surau/{slug}` `<title>` | `Surau at {venue} · {district}` (district dropped if > 60 chars) | `Surau di {venue} · {district}` (same 60-char rule) | `venueSeo` in `src/lib/masjid-seo.ts` |
| `/surau/{slug}` description, verified floors | `Where to pray in {venue}: {n} prayer space(s), {floors}. Floors, wudhu and directions on Jejak Masjid.` | `Tempat solat di {venue}: {n} ruang solat, {floors}. Aras, tempat wudhu dan arah ke surau di Jejak Masjid.` | `venueDescription` in `src/lib/venue-rooms.ts` |
| `/surau/{slug}` description, no verified floor | `Where to pray in {venue}: floors, wudhu and directions on Jejak Masjid.` | `Tempat solat di {venue}: aras, tempat wudhu dan arah ke surau di Jejak Masjid.` | same |
| `/masjid/{slug}` description when it has verified rooms (the page Google already ranks for most of these searches) | `Where to find it: {where}.{suffix}` | `Lokasi: {where}.{suffix}` | `roomDescription` in `src/lib/venue-rooms.ts` |
| suffix 1 | ` Today's prayer times, facilities and visitor photos on Jejak Masjid.` | ` Waktu solat hari ini, kemudahan dan foto pengunjung di Jejak Masjid.` | `SUFFIXES` |
| suffix 2 | ` Prayer times and photos on Jejak Masjid.` | ` Waktu solat dan foto di Jejak Masjid.` | `SUFFIXES` |

Rules:
- `og:title`, `og:description` and the Twitter card follow automatically (they come from the same `seo()` inputs). Do not set `alternates`; `og:locale` stays as today.
- `{n}` is a plain number in Malay (`1 ruang solat`, `3 ruang solat`), with no plural form.
- Room data (`floorLabel`, `zone`, `landmark`, venue names) is shown exactly as stored. Never translate it.
- The `Lelaki` / `Wanita` audience words in `roomDescription` stay as they are; they are already Malay.
- `roomTitle` (masjid page titles) has no English words and does not change.
- Keep the existing fallback order and length limits (`TITLE_LIMIT` 60, `DESCRIPTION_LIMIT` 155). The Malay suffixes are about the same length as the English ones, so re-check the limit tests rather than assume.
- **Out of scope** (stays English): the page body (H1 `Surau at {venue}`, "Where to find it" block, `aria-label`s), `<html lang="en-MY">`, masjid page descriptions without verified rooms, program pages, and the homepage.

## 3. Tests (update, do not delete)

- `src/lib/masjid-seo.test.ts`: lines ~139 (room description), ~168/172 (venue titles incl. the long-name case that drops the district), ~173/178 (venue descriptions).
- `src/lib/venue-rooms.test.ts`: lines ~59–89 (`roomDescription`: single room with landmark/zone, men + women pair, length fallbacks, unverified → null), ~113/114 (`venueDescription`).
- `src/lib/masjid-routes.test.ts:74`: route `head()` title now contains `Surau di Mall Fixture`.
- Add one test that a 1-place venue reads `1 ruang solat` and one that every venue/room description is ≤ 155 chars for the fixtures.
- `src/lib/masjid-components.test.ts` checks the body (`Surau at …`, `Where to find it`); it must keep passing **unchanged**, which proves the body did not move.
- Full suite, `tsc` and the repo build pass.

## 4. Done when

Committed on `feature/venue-seo-malay` with `../.hermes/reviews/venue-seo-malay/WEB-BUILD.md`: files touched, tests before/after, and the rendered `<title>` + description for the TRX, Setia City Mall and Ampang Point fixtures (venue page and masjid page). Opus reviews before the merge into `main`. Update web `CLAUDE.md` (the "site is written in English" line gains: search titles/descriptions of venue pages and room-bearing masjid pages are Malay).

## 5. After deploy (owner)

- Deploy = web Worker only, then purge cache tag `jm-ajk-public` so the new head tags serve within a minute. No backend change. No sitemap resubmit needed (URLs unchanged); Google rewrites snippets on recrawl, which URL Inspection → Request indexing speeds up.
- Measure in Search Console 3 weeks after deploy: CTR for the 10 queries in the root brief §1 table (baseline 3 months to 4 Nov 2026; e.g. `surau trx` 2 clicks / 562 impressions). Compare 28-day windows, not the 3-month total. Google may still rewrite a description from page text; if the snippet shown is English body text, that is expected and not a bug.
