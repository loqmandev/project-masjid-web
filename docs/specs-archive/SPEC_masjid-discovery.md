# SPEC: masjid search and browse pages (website phase 2)

Status: **approved 2026-10-26 (OD1–OD5 as proposed).** Phase 2 of `SPEC_website-revamp.md` (§1 "Phase 2"). Backend contract: `project-masjid-backend-cf/SPEC_masjid-discovery.md`. Branch `feat/masjid-discovery` from web `main` (73a5c6b or later). No deploy or push by the implementer.

## 1. Goal

Let visitors find any masjid or surau on jejakmasjid.my without the app, and give Google crawlable area pages ("masjid di Shah Alam", "mosques in Singapore") that lead to the existing masjid pages. This is the "Cari masjid berdekatan" promise of the hero, now available on the web too.

## 2. Routes (proposed; owner to confirm OD1)

| Page | BM | English |
|---|---|---|
| Search + browse landing | `/masjid` | `/en/mosques` |
| Country | `/masjid/di/<country>` | `/en/mosques/in/<country>` |
| Malaysian state, or overseas region | `/masjid/di/<country>/<region>` | `/en/mosques/in/<country>/<region>` |
| District | `/masjid/di/<country>/<region>/<district>` | `/en/mosques/in/<country>/<region>/<district>` |

- The `di` / `in` segment keeps area URLs apart from masjid pages (`/masjid/<slug>`, one segment). The router must match area routes before `/masjid/$slug`.
- Slugs come from the backend `areas` tree. Malaysia uses `malaysia` (for example `/masjid/di/malaysia/selangor/petaling`).
- Reciprocal hreflang pairs (`ms`, `en`, `x-default` = English) use the existing `seo()` alternates. `<html lang>` follows the route (`ms` / `en`). Masjid detail pages stay as they are (English, single URL).
- Pagination: `?halaman=N` / `?page=N`, with a canonical URL for each page and no `noindex` on page 2+.

## 3. Page content

### 3.1 Landing (`/masjid`, `/en/mosques`)
- **H1** "Cari masjid dan surau" / "Find a mosque", with one supporting line.
- **Search form:** a plain `<form method="get">` with `q`, so it works without JS. Results are server-rendered on the same page, up to 20, each linking to `/masjid/<slug>` and showing type, district, state and country.
  - Fewer than 2 characters: a gentle hint.
  - No results: suggest browsing by area or adding the masjid in the app.
- **"Dekat saya" / "Near me" button**, only with JS: asks for browser location **only when tapped**, calls `nearby` through a server function, and shows up to 20 results with distance.
  - Copy: "Lokasi anda tidak disimpan" / "Your location is not stored".
  - On denial or error, a calm message and the search box.
- **Browse:**
  - Malaysian states in a grid with counts, linking to state pages;
  - other countries as chips with counts;
  - "Other or unknown" is not linked.
- **Stats link:** reuse the numbers from the homepage stats section, linking back to it.

### 3.2 Area pages
- Breadcrumbs: Masjid › Malaysia › Selangor › Petaling.
- **H1:** "Masjid dan surau di {area}" / "Mosques and surau in {area}", with the count.
- Child areas (districts) with counts, when present.
- A paginated list of masjids (50 per page), each linking to its page.
- An "Add a missing masjid in the app" note with store badges, kept small.

### 3.3 Shared
- **JSON-LD:** `BreadcrumbList` on area pages; `ItemList` of `Place` (name, url) on lists. No ratings or invented data.
- **Meta:**
  - title "Masjid di {area} | Jejak Masjid" / "Mosques in {area} | Jejak Masjid";
  - a description with the count;
  - `noindex` only for areas with fewer than 3 masjids (OD3).
- **Look:** follows the site's brand rules in `CLAUDE.md` (light only, deep teal and ivory, Nunito and Plus Jakarta Sans). Lists are plain and readable, with no cards-for-everything.

## 4. Links into discovery (fail closed)
Each of these renders **only when the discovery API is available**, checked server-side through the cached `areas` call:
- header nav item "Cari masjid" / "Find a mosque";
- a hero secondary text link under the store badges, "atau cari di laman web →" / "or search on the web →" (counts as a hero text element: keep the hero at ≤ 4);
- footer link;
- the homepage stats table: state names link to their state pages.

While the backend flag is off, no link and no page appears: the discovery routes return 404. This keeps the revamp rule of no links that lead nowhere.

## 5. Data path
- The server-side `jm-api` pattern and Cache API, as for masjid pages and stats:
  - `areas`: 1 h;
  - lists: 1 h;
  - search: 60 s per `q`;
  - nearby: never cached.
- Strict payload validation (`payloadVersion: 1`). Invalid data → 404 for area pages, and a "search unavailable" line for search.
- **Sitemap:** add `/sitemaps/areas` (all indexable area pages in both languages, with `xhtml:link` alternates if the current format allows) to the sitemap index.

## 6. Tests and checks
- Unit and component tests:
  - route matching order (area vs slug);
  - fail-closed links;
  - validation;
  - pagination and canonicals;
  - hreflang;
  - JSON-LD;
  - the no-JS search form;
  - the near-me consent flow (geolocation called only after a tap).
- Extend `.hermes/reviews/website-revamp/check-hero.mjs` (or a sibling `check-discovery.mjs`), with a local mock of the four backend endpoints like `mock-stats.mjs`:
  - layout at 360, 768 and 1440 with no overflow;
  - no-JS search;
  - links absent when the mock answers 404.
- Gates: `pnpm test`, `pnpm build`, `pnpm exec tsc --noEmit` (the known `download.tsx` error only).

## 7. Owner decisions

| # | Question | Proposal |
|---|---|---|
| OD1 | URL shape | BM `/masjid/di/…`, English `/en/mosques/in/…` (as §2) |
| OD2 | Include "Near me" (browser location) in phase 2? | Yes. It is the hero promise; opt-in, rounded to ~100 m, never stored |
| OD3 | Index thin areas? | `noindex` below 3 masjids; still listed on the parent page |
| OD4 | Overseas regions | Flat country lists unless a country has ≥ 2 regions with ≥ 5 masjids each |
| OD5 | Release path | Backend as a small hotfix from `main` (like 2.3.7), web straight to `main`, flag on when both are live |
