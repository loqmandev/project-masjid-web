# SPEC — Facility info on public masjid pages (web)

**Status:** Planned 2026-10-19 (Opus). **Do not implement until the owner says go.**
**Root brief (normative):** `../SPEC_facility-info.md` rev 3. Read §3 (states), §4 (definitions) and §12.1 / §12.4 (labels and section UX).
**Backend contract:** `../project-masjid-backend-cf/SPEC_facility-info.md` §5.9. `GET /api/public/masjids/by-slug/:slug` gains a top-level `facilities` array:
- `code`
- `state`: `masjid_verified | confirmed | unconfirmed`
- `summary {visitorConfirmations, proofPhotos, lastCheckedAt, verifiedAt}`
- `photos`

`profile.facilities` stays for compatibility but is sourced from proven states. `GET /api/facilities` gains `label`, `shortDescription`, `definition`, `tier`, `group` and `sortOrder`.
**Branching:** web has no `develop`. Branch `feat/facility-info` from `main` and merge to `main` at deploy, as with the AJK masjid-pages work. The deploy happens only after the backend flag is on.

## 0. What exists today (`main`)

- **Rendering:** `src/components/MasjidPages.tsx` (~line 198) renders `p.facilities` as a plain `<ul>` of labels, only when a claimed profile exists.
- **Types:** `src/lib/masjid-types.ts` (~83) holds the facility types.
- **API client:** `src/lib/jm-api.ts` fetches the backend.
- **Styling:** the site follows the brand kit (deep teal `#003130`, ivory and mist, gold accents only, Nunito 800 + Plus Jakarta Sans).

## 1. Changes

- **Types:** add `PublicFacility` and the catalogue type to `masjid-types.ts`. Treat a missing top-level `facilities` (older backend) as "use `profile.facilities`, no labels", today's behaviour.
- **Catalogue:** fetch `GET /api/facilities` once per request or build and cache it with the same cache rules as the page data. Map `code` to `label` / `shortDescription` / `definition` / `group`.
- **Facility section** (for every masjid page, not only claimed ones):
  - **Heading:** "Facilities".
  - **Proven items** (`masjid_verified`, `confirmed`): chips in catalogue `sortOrder`, grouped by `group` when there are more than 8. Each chip shows the label and a small badge icon:
    - shield-tick for **Masjid verified**, a deep-teal filled chip;
    - people-tick for **Confirmed by visitors**, a teal outline chip.

    Each chip is a `<details>` / `<summary>` (no JS needed) that expands to show:
    - the definition;
    - the trust line: "Masjid verified · updated Oct 2026", or "Confirmed by 4 visitors · 2 photos · last checked 12 Oct 2026";
    - up to 4 photo thumbnails, which link to the existing photo viewer or the full image.
  - **Reported, not confirmed:** a collapsed `<details>` "N reported, not confirmed" with grey chips and the line "Visitors haven't confirmed these yet. Visiting? Confirm them in the Jejak Masjid app."
  - **Empty state:** "No confirmed facilities yet."
  - **"How we check facilities"** `<details>`, five lines from root §12.2:
    - Masjid verified means the committee confirmed it.
    - Confirmed by visitors means people who checked in confirmed it.
    - Reported, not confirmed is shown in grey.
    - 24 hours needs several visitors inside at night.
    - Women friendly and compound parking need a photo.
- **Copy:** English. Never mention points. Gold is not used in this section.
- **Structured data:** if the page emits JSON-LD (`Mosque` / `PlaceOfWorship`), add `amenityFeature` for proven facilities only, never `unconfirmed`. If it emits none, don't add any.
- **SEO:** no change to the noindex rules.
- **Accessibility:** each badge icon has a text alternative ("Masjid verified" / "Confirmed by visitors"), and colour is never the only signal (the icon and words differ too).
- **Caching:** follow the existing page cache and instant purge. Facility changes don't need instant purge; the normal cache window is fine.

## 2. Tests (local)

- **Component tests** (`src/lib/masjid-components.test.ts` pattern):
  - each state renders the right label and icon;
  - unconfirmed items appear only in the reported group;
  - the empty state;
  - older backend fallback (no top-level `facilities`);
  - no `points` text.
- **Gate:** typecheck and build.
- **Local only:** no deploy.

## 3. Docs

Note the facility section and its data source in `project-masjid-web/CLAUDE.md` (or the README if there is no CLAUDE.md).
