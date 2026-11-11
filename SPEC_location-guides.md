# Web SPEC: location guides on the website (way-finding photos + "Confirmed by visitors")

Status: ready to build. Written 2026-11-05 (Opus-reviewed); **re-baselined 2026-11-12 against web `main` 604882c** (production; line numbers below are from it).
**Release (owner D4, 2026-11-12):** location guides is part of the JM Guides launch. The backend ships in backend **2.5.13** (migration 0099, location flag off), and this web part ships alongside it, in the same web deploy as `SPEC_unconfirmed-photos.md` (this folder).
Root brief: `../SPEC_venue-prayer-rooms.md` §5a (location guides, decisions G1–G3, S1–S11). Spec review: `../.hermes/reviews/location-guides/SPEC-REVIEW-opus.md` (fixes applied).
Backend contract: backend `develop`, `SPEC_location-guides.md` §3 (read it with `git -C ../project-masjid-backend-cf show develop:SPEC_location-guides.md`, or in `../.hermes/worktrees/hotfix-2.5.8-backend/`); release order in `SPEC_guides-prelaunch-2.5.13.md` §7 there. Build against fixtures: every field is additive and optional.
Branch: `feature/location-guides` from `main` (web has no `develop`). Worktree `../.hermes/worktrees/location-guides-web`. No push, no deploy. Merge after `feature/unconfirmed-photos` (both touch `src/lib/masjid-types.ts`); resolve conflicts on this branch.
Builds on the live venue feature (`docs/specs-archive` copy of `SPEC_venue-prayer-rooms.md` once archived; code in `src/lib/venue-rooms.ts`, `src/components/masjid/RoomsBlock.tsx`, `src/components/masjid/VenuePlacePage.tsx`).
`../` is the project root `/home/loqman/Documents/project-masjid`.

**Re-baseline (2026-11-12).** Since the 2026-11-05 version, web `main` gained Malay search titles and descriptions for venue and room pages (`roomTitle`, `roomDescription`, `src/lib/venue-rooms.ts:219-266`, live 2026-11-05) and Malay audience and wudhu words in the rooms block (`AUDIENCE_NAME` :234 = `Lelaki`/`Wanita`, `Lelaki & wanita` for a shared room, `wudhuText` :274). The trust words stay English (`verifiedLabel` :268: `Verified {Mon YYYY}` / `Not yet confirmed`), and so does every new label below. `validateRoom` (:36) keeps only the contract keys, so the new fields must be added there or they are silently dropped. The disclosure content comes from `roomBlock().details` (:290, filter at :317), which today keeps only rooms with directions or access notes. Both SEO helpers decide on `verified` alone, so a visitor-confirmed room gets the same Malay title and description as a venue-verified one, with no code change.

## 1. What changes for visitors

Rooms confirmed in the app (3 on-site Yes votes) arrive in the existing payload as verified rooms. Nothing about titles, descriptions or JSON-LD changes: `verified` already decides that, and the backend sets it for visitor-confirmed rooms.

Two additions:
1. The verified line says who confirmed it: `Confirmed by visitors Nov 2026` for visitor-confirmed rooms, `Verified Oct 2026` (today's text) for the rest.
2. Up to 3 **way-finding photos** per room (signage, the entrance, the route) inside the existing "How to get there" disclosure. Women's rooms never have photos (O12).

No contributor name, avatar, level or count appears anywhere on the website (JM Guides §9, anti-scraping decision 2026-10-29).

## 2. Types (`src/lib/masjid-types.ts`)

Add to `PrayerRoom`, both optional (older backends omit them; absent = today's behaviour):

```ts
confirmedBy?: 'venue' | 'committee' | 'visitors' | null  // null when not verified
photos?: { url: string; width: number | null; height: number | null }[]  // ≤ 3, in the order sent (position order); web payloads never carry photo ids
```

## 3. Validation (`src/lib/venue-rooms.ts:36` → `validateRoom`)

- `confirmedBy`: keep only one of the three values; anything else → `null`. Force `null` when `verified` is false.
- `photos`: keep at most 3 entries; each `url` must pass `trustedImage(url)` from `src/lib/masjid-seo.ts` (drop the photo otherwise); `width`/`height` must be integers 1–10000, else `null`. Force `[]` for `audience === 'women'` (defence in depth: the backend never sends them).
- Applies to the masjid page rooms and to every `places[].rooms` of the venue page (`validateVenuePage`, :106).

## 4. Display

### 4.1 Verified line (`verifiedLabel` :268, `roomBlock` :290)
- `confirmedBy === 'visitors'` → `Confirmed by visitors {Mon YYYY}`; otherwise `Verified {Mon YYYY}` as today; unverified stays `Not yet confirmed`. These trust words stay English next to the Malay audience words (`Lelaki & wanita · Confirmed by visitors Nov 2026`).
- `roomBlock` merges men + women into one shared verified line today when both are verified. Keep that only when both rooms have the same `confirmedBy`; otherwise each line carries its own label.

### 4.2 Photos (`RoomDetails` in `RoomsBlock.tsx:5`)
- Show the disclosure when a room has directions, access notes **or** photos (today: directions/notes only). `roomBlock().details` (filter at `venue-rooms.ts:317`) gains each room's `photos` and keeps a room that has any of the three.
- Inside it, under that room's text: a row of up to 3 thumbnails, 96 px tall, rounded like the gallery images, `loading="lazy"`, `decoding="async"`, `width`/`height` attributes from the payload when present (no layout shift), `alt="Way to the surau, photo {i} of {n}"` (`Way to the men's surau…` for a men's room). Each thumbnail links to the full image (`target="_blank" rel="noopener"`).
- Same rendering on the venue page cards (`VenuePlacePage.tsx:45-57`, which already reuses `roomBlock` and `RoomDetails`).
- No lightbox, no carousel, no new dependency. Colours and spacing from `../BRAND_COLOURS.md` and the existing block (no gold).

## 5. SEO and caching

- Titles, descriptions, sitemaps, `noindex` rules and JSON-LD: **no change**. Do not add room photos to JSON-LD `image`.
- Caching is unchanged (60 s Cache API, tag `jm-ajk-public`): an approval shows on the website within a minute, no purge.
- The masjid-page gallery photos (`photos`, not room photos) get their own "Not yet confirmed" rule in `SPEC_unconfirmed-photos.md`; room photos are always approved (public only after approval), so they never carry that label.

## 6. Tests

- `validateRoom`: bad `confirmedBy` → null; unverified forces null; > 3 photos cut to 3; untrusted host dropped; women room photos dropped; bad width/height → null.
- `verifiedLabel` / `roomBlock`: visitors label; mixed `confirmedBy` on men + women → per-line labels; same → one shared line.
- Component tests (`masjid-components.test.ts`): disclosure shows with photos and no directions; thumbnails have width/height/alt/lazy; no disclosure with neither; venue page card renders photos.
- `masjid-seo.test.ts`: a visitor-confirmed room produces the same title/description as a venue-verified one.
- Full suite, typecheck and the repo build pass.

## 7. Done when

Committed on `feature/location-guides` with `../.hermes/reviews/location-guides/WEB-BUILD.md` (files, tests before/after, screenshots from local fixtures: visitor-confirmed room with 3 photos, men + women with mixed labels, venue page). Opus reviews before the merge into `main` (after `feature/unconfirmed-photos`). Update web `CLAUDE.md`.

**Deploy:** with backend 2.5.13, after the backend Worker (backend `SPEC_guides-prelaunch-2.5.13.md` §7 step 5), in one web deploy with `SPEC_unconfirmed-photos.md`, then purge Cache-Tag `jm-ajk-public`. The order is not load-bearing: both fields are optional, so the photos and the visitors label simply appear once the backend sends them (`photos` stay empty until the location flag is on and guides are approved). Web `main` is production: never deploy a branch.
