# SPEC: masjid page redesign (sketch 108, variant A)

Status: **owner approved 2026-10-29**: variant A "Place card", no nearby masjid list, a Reviews section instead, English only. Backend pair: `project-masjid-backend-cf/SPEC_masjid-page-reviews.md` (adds `reviews` to the by-slug payload behind a flag).

Design reference (normative): `../.planning/sketches/108-masjid-page/index.html`, tab **A** (Desktop / Phone, With photos / No photos). Published copy: https://claude.ai/artifact/6ALHDWbeYTagktSvPdv2j5. Ignore tabs B and C. Sample reviews, facility states and the drawn map in the sketch are not real data.

## 1. Scope
- Only `/masjid/$slug` (`src/routes/masjid.$slug.tsx`, `MasjidPage` in `src/components/MasjidPages.tsx`). The program page, the missing/resting pages, sitemaps, the homepage and the AJK flag behaviour stay as they are.
- Branch `feat/masjid-page-redesign` from web `main`. Worktree `../.hermes/worktrees/masjid-page-redesign-web`. No deploy, push or merge. If `chore/remove-masjid-discovery` has merged into `main` first, branch from that.
- Site rules in `CLAUDE.md` and `BRAND.md` apply: light only, deep teal / ivory / mist / white cards, gold only on deep teal, Nunito 800 headings + Plus Jakarta Sans body, no italics, no gradients, motion only behind `html[data-motion="on"]`.

## 2. Layout
The page no longer uses `PageLayout`'s deep title band. Keep `Header` and `Footer`; build the body in a new component (e.g. `components/masjid/MasjidPlacePage.tsx` plus small parts). Two columns from `lg` (1024 px): main column + 340 px aside, aside `position: sticky`. Below `lg`: one column, aside after the main column, and a sticky bottom bar.

Order (main column):
1. **Place line** (small, muted): `{Masjid|Surau} · {state line from placeParts()}`.
2. **Gallery** (§3).
3. **Title block:** tags (`Masjid`/`Surau` from `masjid.type`, district if present), H1 name, address line with a pin icon (§6 title case). Below `lg` only: an action row with **Directions** (primary) and **Waze** (ghost).
4. **Prayer times today** (§4).
5. **Facilities** (§5).
6. **Reviews** (§7).
7. **Photos from visitors** `id="photos"`: grid of every trusted photo (≤ 8), 4 columns. From `lg` only, and only when there are more photos than the mosaic shows.
8. Existing AJK sections (programs, news, claim callout), unchanged behind `MASJID_AJK_ENABLED`, restyled only enough to sit in the column.

Aside:
- **Place card** (white, 20 px radius, border): static map (§8), address, **Directions** + **Waze**. With no photos the map moves to the gallery slot and the card keeps address + buttons only.
- **App card** (deep teal, `.on-deep`): small gold bar, "Singgah with Jejak Masjid", body copy (§9), gold **Open in Jejak Masjid** (`OpenMasjid onDeep`, keeps the Android intent swap), `StoreBadges`.

Sticky bottom bar (below `lg` only): **Directions** (ghost) + **Open in app** (primary), safe-area bottom padding, ivory 95 % background with a top border. It must not cover the footer once the page ends (sticky inside the page body, not `position: fixed`).

## 3. Gallery
Photos = `trustedImage(profile.coverUrl)` first (AJK, usually absent), then `page.photos` through `trustedImage`, de-duplicated, ≤ 8.
- **Desktop mosaic** by count: 1 → one image, 21:9, ~380 px tall; 2 → two equal; 3 → large left + two stacked; 4 → large left + three; ≥ 5 → large left (2 rows) + four (sketch). Rounded 20 px outer corners only. When count > shown, an ivory button "All N photos" links to `#photos`.
- **Phone carousel:** horizontal scroll-snap list of all photos (86 % width, 4:3, 16 px radius), with a counter chip. SSR shows "N photos"; after hydration it shows "i / N" from scroll position (no scroll listener on the window: use IntersectionObserver on the slides).
- **No photos:** the map (§8) fills the slot (4:3 phone, 300 px tall desktop) with a card "No photos yet. Visitors add photos in the Jejak Masjid app when they singgah."
- First image `loading="eager"` + `fetchpriority="high"` (LCP); all others lazy. Explicit `width`/`height`. Alt: `{name}, photo {i}`; the first is `{name}`.

## 4. Prayer times
- Data: the existing `prayers` from `loadMasjid` (`PRAYER_KEYS`, five prayers). `null` → omit the whole section (outside Malaysia, unseeded zone, timeout), as today.
- Five equal cells in one row at every width (phone cells are narrow: time in Nunito 800, "am/pm" small).
- Below the row: the date in Malaysia time (e.g. "Thursday 29 October"). No zone name (the loader does not have it).
- **Next prayer:** after hydration only, mark the next prayer cell (deep teal fill, ivory text, small gold top bar) and show "{Prayer} in 1 h 12 min" in the meta line, updating once a minute. After Isyak, no highlight. The SSR HTML has no highlight and no countdown.

## 5. Facilities
Restyle `MasjidFacilities` to the sketch chips: white pill per proven facility with its shield (masjid verified) or people-check (confirmed by visitors) icon; reported items collapse into one dashed chip "+ N reported by visitors" that opens the existing reported disclosure. Keep every current behaviour: backend gate (`facilities` absent → old plain list path), catalogue labels/definitions, `details/summary` detail with trust line and up to 4 photo links, the "temporarily unavailable" text, legend line, no points or gold, JSON-LD `amenityFeature` rules. Existing facility tests must still pass (update selectors only).

## 6. Address and place text
- If `masjid.address` has letters and no lowercase letter, show it in title case word by word; leave words containing digits unchanged (e.g. "JALAN PERDANA" → "Jalan Perdana", "LOT 1234, KG BARU" → "Lot 1234, Kg Baru"). Mixed-case addresses stay as stored. Pure function in `lib/masjid-format.ts` with tests. JSON-LD keeps the stored value.
- Waze link: `https://waze.com/ul?ll={lat},{lng}&navigate=yes` (new helper next to `directionsUrl`). Both open in a new tab with `rel="noopener"`.

## 7. Reviews
Data: optional `page.reviews` from the backend (`{ count, average, items[{ id, rating, tip, createdAt }] }`, see the backend spec). Validate strictly in the loader (count integer ≥ 0; average null or 1–5; ≤ 3 items; rating integer 1–5; tip string 1–150 chars; ISO date; id `^[A-Za-z0-9_-]{1,64}$`). Absent or invalid → omit the section; never show a partial one.
- **count ≥ 3:** summary tile on deep teal (ivory number with one decimal, five gold stars filled to the rounded half) + text "{count} reviews from visitors who checked in with Jejak Masjid".
- **count 1–2:** no tile; text "{count} review(s) from visitors who checked in with Jejak Masjid".
- **List:** each item shows deep-teal filled / outline stars (`aria-label="{n} out of 5"`), the tip as escaped plain text, "Visitor · {Month YYYY}" in Malaysia time, and a small "Report" link: `mailto:{SITE.email}?subject=Report review {id} on {slug}`. No names, no avatars.
- When `count > items.length`: link "Read all {count} reviews in the app" (same deep link as Open in Jejak Masjid).
- **count 0:** one line: "No reviews yet. Visitors can rate this masjid in the app after they check in."
- No `AggregateRating` or `Review` in JSON-LD. No gold stars on light surfaces (gold only inside the deep tile).

## 8. Map — superseded 2026-10-29: Google Maps Embed
**Owner 2026-10-29: use an embedded Google Map instead.** The R2 tile bucket behind `tiles.jejakmasjid.my` was found deleted, and the owner asked for Google Maps. Normative now:
- `<iframe src="https://www.google.com/maps/embed/v1/place?key={GOOGLE_MAPS_EMBED_KEY}&q={lat},{lng}&zoom=16&language=en" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Map of {name}">` in the same fixed-aspect slots (place card; no-photo hero). Coordinates for `q`, never the name.
- Web var `GOOGLE_MAPS_EMBED_KEY` (public; owner creates a browser key restricted to HTTP referrers `jejakmasjid.my/*`, `www.jejakmasjid.my/*` and to the Maps Embed API only; the Embed API has no usage charge). Absent → no map anywhere.
- Privacy policy line about Google Maps. The SVG map route, `TILES` binding and tile decoding below are dropped.

### 8 (original, dropped). Static map
A server-rendered SVG from our own vector tiles; no third-party map, no client map library, no iframe.
- Route `src/routes/masjid.$slug_.map[.]svg.ts` (server handler, GET + HEAD) → `/masjid/<slug>/map.svg`. It loads the masjid through the cached by-slug read to get `lat/lng` (invalid slug or 404 → 404).
- Tiles: add a service binding `TILES` → Worker `project-masjid-tiles` in `wrangler.jsonc`; fetch `/{z}/{x}/{y}.mvt` through it (fall back to `https://tiles.jejakmasjid.my` when the binding is absent, as `JM_API` does). The archive's max zoom is **15**: fetch the z15 tiles covering an 800 × 500 window centred on the masjid at an effective zoom of 16 (overzoom).
- Decode with `@mapbox/vector-tile` + `pbf` (Protomaps basemap schema v4 layers). Draw, in brand colours as in the sketch: land, water, parks/green landuse, roads by kind (major casing + fill, minor thin), rail dashed, and the pin (deep teal teardrop, gold dot) at the centre. No labels needed. Add "© OpenStreetMap" in a corner (ODbL).
- `Content-Type: image/svg+xml`, `Cache-Control: public, max-age=2592000`, Cache API keyed by slug + rounded coordinates. On any tile failure return a fallback SVG (plain land colour + pin + attribution), never an error image.
- The page uses `<img src="/masjid/{slug}/map.svg" width="800" height="500" alt="Map of the area around {name}" loading="lazy">` (eager when it is the no-photo hero).
- **W0 spike first (time-box half a day):** render Masjid Negara (`3.1424, 101.6918` approx.) in the local built Worker; record CPU time per render (target < 30 ms), SVG size (target < 80 KB) and a screenshot in the report. If either target fails badly, stop and report; do not switch to MapLibre or a hosted map without the planner.

## 9. Copy (English, `BRAND.md` voice)
- App card: title "Singgah with Jejak Masjid"; body "Stay ten minutes and the visit joins your journey, a quiet record of every masjid you have prayed at."; button "Open in Jejak Masjid".
- Sticky bar: "Directions", "Open in app". Title block: "Directions", "Waze".
- Section headings: "Prayer times today", "Facilities", "Reviews", "Photos from visitors".
- Meta description (in `masjidSeo`): "{name} in {district/state}: today's prayer times, facilities, photos and reviews from visitors on Jejak Masjid." Keep the title and the noindex rules.
- Privacy policy (`components/PrivacyPolicy.tsx`): add one sentence where user content is described: "Reviews you write in the app (your star rating and short tip) are public. They appear in the app and on the masjid's page at jejakmasjid.my, without your name."

## 10. JSON-LD
Keep `mosqueJsonLd` (address, geo, amenityFeature). Add `image` with up to 3 trusted visitor photo URLs when there is no AJK cover. No ratings.

## 11. Tests and checks
- Component tests (SSR string or jsdom) for: photo counts 0 / 1 / 3 / 5 / 8; prayers null; facilities absent / empty / mixed; reviews absent / invalid / 0 / 2 / 23; tip escaping; title case; Waze URL; Report mailto; no `AggregateRating`; the sticky bar and action row classes; the next-prayer highlight absent in SSR and present after a mocked clock.
- Map route: fallback SVG on tile failure, 404 on invalid slug, cache headers, HEAD.
- Host check: extend the website-revamp scripts (`../.hermes/reviews/website-revamp/check-hero.mjs` pattern) with a mock by-slug server (fixtures: Masjid Negara with 8 photos + reviews; a surau with no photos, no reviews, no prayers) and the tiles binding absent: screenshots at 360 / 768 / 1440, no horizontal overflow, no-JS render complete.
- Gates: `pnpm test`, `pnpm build`, `pnpm exec tsc --noEmit` (only the known `download.tsx` error).
- Report: `../.hermes/reviews/masjid-page-redesign/BUILD-web.md` (files, gates vs `main`, W0 numbers, screenshots, deviations).

## 12. Release
Backend 2.3.15 (reviews flag off) → web deploy (owner) → backend flag on. The page works with the flag off (no Reviews section) and with older backends.
