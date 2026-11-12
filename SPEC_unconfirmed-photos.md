# Web SPEC: "Not yet confirmed" label on visitor photos (masjid pages)

Status: built and reviewed at 41bb50e (§1–§11). §12 (facility name in the label, owner 2026-11-12) is ready to build, not built.
- **Owner decision (2026-11-12, D5 changed):** facility photos whose proof is still pending **stay** on the public masjid page, labelled **"Not yet confirmed"**, the same wording the site already uses for unverified prayer rooms (`verifiedLabel` in `src/lib/venue-rooms.ts`). Rejected proof photos and photos of women's areas or "open 24 hours" leave the page; the backend already drops those, so the website has nothing to filter.
- **Backend contract:** backend 2.5.13, `SPEC_guides-prelaunch-2.5.13.md` §1.3 on backend `develop` (read it with `git -C ../project-masjid-backend-cf show develop:SPEC_guides-prelaunch-2.5.13.md`, or in `../.hermes/worktrees/hotfix-2.5.8-backend/`).
- **Base:** web `main` 604882c (production). Line numbers below are from that commit. Web has no `develop`.
- **Branch:** `feature/unconfirmed-photos` from `main`. Worktree `../.hermes/worktrees/unconfirmed-photos-web`. No push, no deploy. The location-guides web work (`SPEC_location-guides.md`, this folder) is a separate branch from `main`; merge this one first, then the other, so both ship in one web deploy after backend 2.5.13.
- Read first: web `CLAUDE.md`, `BRAND.md`, `../BRAND_COLOURS.md`.

`../` is the project root `/home/loqman/Documents/project-masjid`.

## 1. What visitors see
- The masjid page gallery (phone strip and desktop mosaic) and the desktop "Photos from visitors" grid show the photos the backend sends, as today.
- A photo whose facility claim is not yet confirmed carries a small label on the photo: **Not yet confirmed**. Confirmed photos look exactly as today.
- Unconfirmed photos come **after** confirmed ones, so the first photo (the hero and LCP image) is a confirmed one whenever the page has one.
- Unconfirmed photos never feed JSON-LD `image` or `og:image`, the same rule as unverified rooms, which never reach titles, descriptions or JSON-LD (owner decision 2026-11-05).
- No other copy: no tooltip, no explanation line, no count. The page is English; the label is English, as on the rooms block.

## 2. Contract (backend 2.5.13, additive)

```ts
photos: Array<{
  url: string
  confirmed: boolean   // false = show "Not yet confirmed"
}>                     // ≤ 8, newest first
```

- Older backends send `{ url }` only: a missing `confirmed` means confirmed (today's behaviour, no label).
- Anything other than the literal `false` means confirmed. Only `false` shows the label.
- The backend never sends ids or facility codes here; do not ask for them.
- `facilities[]` from 2.5.13: women's-area and "open 24 hours" facilities arrive with `photos: []` and `summary.proofPhotos: 0`. `facilityTrustLine` (`src/lib/masjid-facilities.ts:53-55`) already hides "N photos" at 0 and `FacilityChip` renders no photo row without photos, so nothing changes in the web code for that.

## 3. Types: `src/lib/masjid-types.ts`
`PublicMasjidPage.photos` (:167): `photos: { url: string; confirmed?: boolean }[]`, with the comment updated: "≤ 8 visitor photos, newest first; `confirmed: false` = facility claim not yet confirmed (backend 2.5.13)".

## 4. Validation: `src/lib/masjid-gallery.ts` + `src/lib/masjid-server.ts`
Today `loadMasjid` (`src/lib/masjid-server.ts:22-…`) passes `photos` through raw (`...rest`), so whatever the backend sends reaches the HTML and the hydration data. Give photos the same treatment as rooms and reviews:
- New `validatePhotos(value: unknown): { url: string; confirmed: boolean }[]` in `src/lib/masjid-gallery.ts`:
  - not an array → `[]`;
  - keep at most 8 entries that are objects with a string `url`;
  - `confirmed: entry.confirmed !== false`;
  - drop every other key.
- In `loadMasjid`, take `photos` out of `rest` like `rooms`, and put `photos: validatePhotos(rawPhotos)` on the page (always present: the page type requires it).

## 5. Gallery model: `src/lib/masjid-gallery.ts`
- `export type GalleryPhoto = { url: string; confirmed: boolean }`.
- `galleryPhotos(page)` (:12) returns `GalleryPhoto[]`:
  1. the AJK cover first (`confirmed: true`), as today;
  2. then confirmed visitor photos, in backend order;
  3. then unconfirmed visitor photos, in backend order;
  4. every URL through `trustedImage`, de-duplicated by URL (first wins), at most `MAX_GALLERY_PHOTOS` (8).
- New `confirmedGalleryUrls(page): string[]` = the `url`s of `galleryPhotos(page)` with `confirmed: true`, for SEO.
- Callers: `MasjidPlacePage.tsx:40` (`galleryPhotos`), `src/lib/jsonld.ts:54` (switch to confirmed only, §7).

## 6. Display
### 6.1 `src/components/masjid/Gallery.tsx`
- `Gallery({ photos, name })` takes `GalleryPhoto[]`.
- Each item renders as:
  ```tsx
  <figure className="m-shot" key={p.url}>
    <img … />  {/* attributes as today */}
    {!p.confirmed && <figcaption className="m-unconfirmed">Not yet confirmed</figcaption>}
  </figure>
  ```
- Alt text: today's alt, plus `, not yet confirmed` for an unconfirmed photo (for example `Masjid Al-Falah, photo 3, not yet confirmed`). The first image keeps `alt={name}` when it is confirmed.
- The `IntersectionObserver` already walks `root.children`; those are now the figures. The counter logic is unchanged.

### 6.2 Desktop "Photos from visitors" grid: `src/components/masjid/MasjidPlacePage.tsx:104-122`
Same figure + label and the same alt rule for each photo of `photos`.

### 6.3 CSS: `src/styles.css` gallery block (:518-620)
- Move every per-image rule from `.m-strip img` to `.m-strip > .m-shot`: flex basis, aspect ratio, border radius, background, scroll-snap, the `data-n='1'` basis, and the `lg` mosaic rules (`:nth-child(n + 6)` hidden, `:first-child` row span, `:nth-child(4)` column span).
- `.m-shot`: `position: relative; margin: 0; overflow: hidden;` with the radius it took over.
- `.m-shot img`: `display: block; width: 100%; height: 100%; object-fit: cover;`.
- `.m-unconfirmed`: top-left of the photo (`top: 0.625rem; left: 0.625rem`), the pill of `.m-count` (deep teal `rgb(0 49 48 / 0.85)`, `color: var(--primary-foreground)`, `border-radius: 999px`, `padding: 0.3rem 0.625rem`, `font-size: 0.72rem`, `font-weight: 700`), `pointer-events: none`.
  - Top-left so it never sits on the phone counter (bottom-left of the gallery) or the desktop "All N photos" button (bottom-right).
  - No amber, red or gold: "Not yet confirmed" is neutral information, never a warning (`../BRAND_COLOURS.md`; the rooms block shows it in muted text).
- The desktop grid of §6.2 uses `.m-shot` with its own aspect class, or a small variant; same label.

## 7. SEO (`src/lib/jsonld.ts`, `src/lib/masjid-seo.ts`)
- `imageField` (`jsonld.ts:51-56`): the AJK cover wins as today; otherwise up to three **confirmed** visitor photos (`confirmedGalleryUrls`). No unconfirmed photo ever goes into JSON-LD.
- `masjidSeo` (`masjid-seo.ts:43-61`, `image:` at :58-60): cover, else the first **confirmed** trusted photo, else no image.
- Titles, descriptions, `noindex`, sitemaps: unchanged.

## 8. Caching
Unchanged (60 s Cache API, tag `jm-ajk-public`). When a photo is confirmed, the label disappears within a minute. The backend release purges the tag after the web deploy.

## 9. Tests (Vitest)
| Suite | Cases |
|---|---|
| `src/lib/masjid-gallery.test.ts` (new) | `validatePhotos`: non-array → `[]`; > 8 cut to 8; missing `confirmed` → `true`; `"false"` string → `true`; `false` → `false`; extra keys dropped; bad `url` dropped. `galleryPhotos`: cover first; confirmed before unconfirmed, each in backend order; untrusted host dropped; duplicate URL kept once; cap 8. `confirmedGalleryUrls` excludes unconfirmed |
| `src/lib/masjid-server.test.ts` | a backend page with an extra photo key and `confirmed:false` → the page carries only `{url, confirmed}` |
| `src/lib/masjid-components.test.ts` | the label renders exactly on unconfirmed photos, in the gallery and in the desktop grid; alt text; no label anywhere for an old payload without `confirmed`; the first image is confirmed when one exists |
| `src/lib/jsonld.test.ts` | JSON-LD `image` never contains an unconfirmed URL; only unconfirmed photos → no `image` |
| `src/lib/masjid-seo.test.ts` | og image skips unconfirmed photos |

Then the full `pnpm test`, the typecheck and `pnpm build`.

Screenshots from local fixtures (phone 360 px and desktop 1280 px): a page with 1 confirmed + 2 unconfirmed photos, one with only unconfirmed photos, one with 6+ photos (desktop mosaic + "All N photos" + the grid). Check the mosaic layout is unchanged for a page with no unconfirmed photo.

## 10. Deploy
- After backend 2.5.13 is live, in the same window as the location-guides web work (backend `SPEC_guides-prelaunch-2.5.13.md` §7 step 5). Either order is safe: an older backend sends no `confirmed` (no labels), and the live web ignores the new field (unlabelled pending photos, as today).
- Web deploy: `pnpm run deploy` from `main` after the merge (owner). Then purge Cache-Tag `jm-ajk-public`.

## 11. Done when
- Committed on `feature/unconfirmed-photos`, Opus-reviewed, merged into `main`.
- Build report `../.hermes/reviews/guides-prelaunch-2.5.13/WEB-BUILD.md`: files, tests before/after, the screenshots of §9.
- Web `CLAUDE.md` updated (masjid page photos: the label rule and the confirmed-only SEO image rule).

## 12. Facility name in the label (owner 2026-11-12)

Status: ready to build (planner, 2026-11-12). Amends §1–§9 on this branch (`feat/unconfirmed-photos-location-guides`, built and reviewed at 41bb50e, not deployed). Build it on the same branch before the web deploy.

The owner answered the open question of backend `SPEC_guides-prelaunch-2.5.13.md` §5 Q1 with "yes": the label names the facility, for example **"Wheelchair access · Not yet confirmed"**.

### 12.1 Backend contract (backend 2.5.14, `SPEC_photo-facility-label.md` on backend branch `feature/photo-facility-label`)

```ts
photos: Array<{
  url: string
  confirmed: boolean
  facilityLabel: string | null   // NEW. English facility name (facility.info_label); non-null only when confirmed === false
}>                               // ≤ 8, confirmed first, newest first inside each group
```

- Backend 2.5.13 (and any rollback to it) sends no `facilityLabel`: the label stays plain "Not yet confirmed". Live web `main` 604882c reads only `url`. Every order of the two deploys is safe.
- The §2 rule still holds: the backend never sends ids or facility codes here, and the web must not ask for them. A display name is not an identifier.
- The name is English copy from the backend catalogue. Show it as received: never translate, abbreviate, re-case or map codes to names on the web.

### 12.2 Types and validation
- `src/lib/masjid-types.ts:174`: `photos: { url: string; confirmed?: boolean; facilityLabel?: string | null }[]`; comment: "… `facilityLabel` = English facility name, only on unconfirmed photos (backend 2.5.14)".
- `src/lib/masjid-gallery.ts`: `export type GalleryPhoto = { url: string; confirmed: boolean; facilityLabel: string | null }`.
- `validatePhotos`: for each kept entry, `facilityLabel` is the backend string only when `confirmed` is `false` **and** the value is a string that, after collapsing whitespace runs to one space and trimming, is 1–60 characters long; otherwise `null`. Confirmed photos always get `null`. Every other key is still dropped.
- `galleryPhotos`: carries `facilityLabel` through; the AJK cover is `{ confirmed: true, facilityLabel: null }`. De-duplication by URL is unchanged (first wins, so a URL that also appears confirmed keeps the confirmed copy).
- `confirmedGalleryUrls`, `jsonld.ts`, `masjid-seo.ts`: unchanged. The facility name never goes into the title, description, JSON-LD or `og:*`.

### 12.3 Pill text and markup
One helper, exported from `src/components/masjid/Gallery.tsx` and used by both the gallery (§6.1) and the desktop "Photos from visitors" grid (§6.2, `MasjidPlacePage.tsx:110-121`):

```tsx
export function UnconfirmedLabel({ facilityLabel }: { facilityLabel: string | null }) {
  return (
    <figcaption className="m-unconfirmed" aria-hidden="true">
      {facilityLabel && <span className="m-unconfirmed-name">{facilityLabel} ·</span>}
      {facilityLabel && ' '}
      <span className="m-unconfirmed-state">Not yet confirmed</span>
    </figcaption>
  )
}
```

- With a name the text reads `Wheelchair access · Not yet confirmed` (U+00B7 middle dot, one space each side). Without one it reads `Not yet confirmed`, exactly as today.
- Rendered only for `!p.confirmed`, as today. Keep `aria-hidden="true"` (the alt text carries it, §12.4).
- React escapes the name; never use `dangerouslySetInnerHTML`.

### 12.4 Alt text
`photoAlt(name, i, confirmed, facilityLabel)`:
- confirmed: unchanged (`name` for the first image, `name, photo N` after);
- unconfirmed with a name: `{base}, {facilityLabel}, not yet confirmed`, e.g. `Masjid Al-Falah, photo 3, Wheelchair access, not yet confirmed`;
- unconfirmed without a name: `{base}, not yet confirmed` (today's rule).

### 12.5 Wrapping and truncation (`src/styles.css`, the `.m-unconfirmed` block at :561-572)
Add:

```css
.m-unconfirmed {
  /* existing rules stay */
  max-width: calc(100% - 1.25rem);   /* never wider than the photo minus both 0.625rem insets */
  line-height: 1.3;
  border-radius: 0.75rem;            /* was 999px: a two-line pill stays a rounded box */
}
.m-unconfirmed-name,
.m-unconfirmed-state { white-space: nowrap; }
.m-unconfirmed-name {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: bottom;
}
```

Result:
- The only break point is the space after the middle dot. When the whole text fits it is one line; otherwise it is two lines: `Wheelchair access ·` / `Not yet confirmed`.
- `Not yet confirmed` is never cut. Only a name too long for the photo is cut with "…" (the longest English name today is "Community kitchen / hall", 24 characters).
- Phone 360 px: a strip photo is about 280 px wide (`min(86%, 30rem)`), so the pill may use about 262 px. Short names fit on one line; "Wheelchair access" and longer names wrap to two lines. Two lines are about 2.5rem tall at the top-left, clear of the phone counter (bottom-left) and of the desktop "All N photos" button (bottom-right).
- Desktop mosaic tiles and the 4-column grid tiles (about 190 px): usually two lines; same rules.
- Colours unchanged: deep teal `rgb(0 49 48 / 0.85)` with `var(--primary-foreground)` text. Never amber, red or gold (`../BRAND_COLOURS.md`).

### 12.6 Tests (Vitest)
| Suite | Cases |
|---|---|
| `src/lib/masjid-gallery.test.ts` | `validatePhotos`: `confirmed:false` + `"  Wheelchair   access "` → `facilityLabel: "Wheelchair access"`; `confirmed:true` + a name → `null`; missing `facilityLabel` → `null`; non-string → `null`; `""` / `"   "` → `null`; 61 characters → `null`, 60 kept; old `{url}` payload → `{url, confirmed:true, facilityLabel:null}`. Update the existing exact-shape expectations to include `facilityLabel`. `galleryPhotos`: carries the name; cover gets `null` |
| `src/lib/masjid-server.test.ts` (`:343-357`) | the page carries only `{url, confirmed, facilityLabel}` per photo; an extra `facilityCode` / `id` is still dropped |
| `src/lib/masjid-components.test.ts` (`:258-277`) | with tags and `<!-- -->` stripped, the gallery and the desktop grid read `Wheelchair access · Not yet confirmed` for a named unconfirmed photo and `Not yet confirmed` for a nameless one; `m-unconfirmed-name` only when there is a name; alt `…, Wheelchair access, not yet confirmed`; a name `<b>Ramp</b>` renders escaped; still no label for confirmed photos and for an old payload |
| `src/lib/jsonld.test.ts`, `src/lib/masjid-seo.test.ts` | unchanged: no unconfirmed URL, and no facility name, in JSON-LD or `og:image` |

Then the full `pnpm test`, the typecheck and `pnpm build`, under the machine lock (`flock /tmp/jm-heavy-job.lock …`), never next to an emulator.

Screenshots from local fixtures (phone 360 px, desktop 1280 px): one named unconfirmed photo with "Wheelchair access", one with "Community kitchen / hall", one without a name, and a page with 6+ photos (mosaic + grid). Add them to `../.hermes/reviews/guides-prelaunch-2.5.13/WEB-BUILD.md` (or a sibling `WEB-BUILD-LABEL.md`).

### 12.7 Deploy and docs
- Same web deploy as §10. If the web deploys while the backend is still 2.5.13, the label stays plain until backend 2.5.14 is live; then purge Cache-Tag `jm-ajk-public` (the backend 2.5.14 runbook does this).
- Web `CLAUDE.md` "Masjid page photos and location guides" bullet: "Gallery photos are `{ url, confirmed?, facilityLabel? }` … the pill reads `<facilityLabel> · Not yet confirmed` (name only on unconfirmed photos, cut with an ellipsis, never the status), and the alt text carries the same words."
- **Pending owner decision — `TOILET_FEMALE` ("Women's toilet"):** not a no-photo code today, so a pending one can read "Women's toilet · Not yet confirmed"; if the owner adds it to the backend no-photo list, that is a separate backend change to the upload and proof rules (the web needs no change: the backend simply stops sending those photos).
