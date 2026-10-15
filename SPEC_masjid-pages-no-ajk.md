# SPEC: public masjid pages without AJK (web)

Status: planned (2026-10-15). Plan and rationale: `../.hermes/plans/masjid-pages-without-ajk.md`.
Builds on `feature/ajk-masjid-pages` (`9937ae0`), which adds `/masjid/$slug`, `/masjid/$slug_/p/$programId`, the dynamic
`/sitemap.xml` index and `/sitemaps/masjid/$page`. That branch was Opus-reviewed: rounds R1 and R2 are fixed, and
`.hermes/reviews/ajk-dashboard/RECHECK-WEB-R1-opus.md` has the details.

## Why

The masjid pages ship to production while every AJK feature stays off:
- backend `AJK_PORTAL_ENABLED`, `AJK_NOTIFICATIONS_ENABLED` and the other AJK flags are `"false"`;
- shop `NUXT_AJK_ENABLED` is off, so **`ajk.jejakmasjid.my` returns 404 for every path**.

In that state the backend `GET /api/public/masjids/by-slug/:slug` returns `profile:null`, `claimed:false`,
`upcomingPrograms:[]`, `pastProgramCount:0` and `posts:[]`. The current page then has three problems:
- it renders an empty **"Upcoming programs / No upcoming programs listed yet."** section on every page;
- it renders a **"Are you the AJK of this surau? … Claim this surau" → `https://ajk.jejakmasjid.my/claim?masjid=…`** call to action (a dead link);
- it sends a view beacon to an endpoint that ignores it.

Separately, 723 masjids have a district of "Unknown District", "Unknown", "UNKNOWN" or empty. They would show
"Unknown District · Selangor" or " · Selangor". Many districts are ALL CAPS ("TAW - SEMPORNA").

## Branch and merge

- Web has no `develop`. Create `feat/masjid-pages-no-ajk` from **`feature/ajk-masjid-pages`** (`9937ae0`, which is based on
  `main` `fd803c6`). The orchestrator merges it into `feature/ajk-masjid-pages`, and then into `main`.
- Do not merge to `main`, push or deploy yourself.
- Do not change `MASJID_PAGES_ENABLED` (it stays `"false"` in `wrangler.jsonc`). The owner flips it in a separate commit
  at release time.
- Never run `wrangler dev` against remote bindings. Use `--local` only. This repo's `wrangler.jsonc` has no `remote: true`.
  Check that with grep before running anything.

## W1: a web switch for AJK surfaces (`MASJID_AJK_ENABLED`)

1. **Config.** `wrangler.jsonc`: add `"MASJID_AJK_ENABLED": "false"` to the existing `vars` object. Keep `MASJID_PAGES_ENABLED` and `JM_API_BASE` as they are.
   `src/lib/worker-env.ts`: add `MASJID_AJK_ENABLED?: string` to `WebEnv`. The switch is on only when the value is exactly `'true'`. Anything else, including a missing value, means off (fail closed).
2. **Masjid loader.** In `src/lib/masjid-server.ts` `loadMasjid`, read the env with `getWorkerEnv()` and return
   `{ page, prayers, ajk: env.MASJID_AJK_ENABLED === 'true' }`.
3. **Program loader.** In `src/lib/masjid-server.ts` `loadProgram`: when AJK is off, `throw notFound()` **before** any
   `getProgram` call, so no backend request is made. Keep the existing behaviour when AJK is on.
4. **Component.** In `src/components/MasjidPages.tsx` `MasjidPage`, add the prop `ajk: boolean`. When `ajk` is false:
   - Do not render these components at all, not even as empty wrappers: `ProgramsSection`, `NewsSection` and `ViewBeacon`.
   - **`ClaimCta` (owner decision D2, 2026-10-15): do not hide it; switch it to the interest form.** When `ajk` is false, render the same card with the
     copy `Are you on this masjid's committee?` / `Register your interest` linking to `https://jejakmasjid.my/ajk` (the live interest form,
     same tab). No `ajk.jejakmasjid.my` link anywhere on the page while `ajk` is false. When `ajk` is true the claim link is unchanged.
   - Keep the title band (name, place line, "Open in Jejak Masjid", "Get directions", "Don't have the app? Get it below."),
     the cover photo, "About this masjid" (address only, since the profile is null), the photos, today's prayer times and the store badges.
   - In `AboutSection`, the `whatsappUrl` / `contactPhone` / facilities / recurring-class blocks already depend on `profile`.
     Leave them unchanged.
   - When `ajk` is true the page renders exactly as it does today.

   The route `src/routes/masjid.$slug.tsx` passes `d.ajk` through.
5. **SEO.** In `src/lib/masjid-seo.ts` `masjidSeo(p, ajk)`, the fallback description (used when there is no profile description) is:
   - AJK off: `` `${name} in ${place}. Photos, prayer times and directions on Jejak Masjid.` ``
   - AJK on: the current text, with `${place}` in place of `${districtName}, ${stateName}`.

   `place` comes from W2. The title becomes `` `${name} · ${placeShort}` ``, where `placeShort` is the cleaned district if there is one, otherwise the state.
   Keep `noindex: !p.indexable`, the canonical path and the image logic as they are.
6. **JSON-LD.** In `src/lib/jsonld.ts` `mosqueJsonLd`, omit the `event` key entirely when the filtered event list is empty. This
   applies whether AJK is on or off.
   - Use the W2 cleaned district for `addressLocality`, and omit the key when there is no district.
   - `addressRegion` stays `stateName`.
7. **Program app link.** `programAppUrl` and `ProgramPage` stay as they are. Program pages cannot be reached while AJK is off (item 3).

## W2: place line cleanup (`src/lib/masjid-format.ts`)

Add and export `placeParts(districtName: string | null | undefined, stateName: string | null | undefined)`. It returns
`{ district: string | null, state: string | null, line: string }`:
- **Trim.** Trim both values. An empty string becomes `null`.
- **Unknown districts.** District values matching `/^unknown(\s+district)?$/i` become `null`.
- **Title case.** A value with no lowercase letter (`!/[a-z]/.test(v)`) is title-cased per word. Keep tokens containing a digit as
  they are, and keep the separator ` - ` (for example `TAW - SEMPORNA` → `Taw - Semporna`, and `JOHOR BAHRU` → `Johor Bahru`).
  Mixed-case values are unchanged.
- **Joined line.** `line` joins the non-null parts with `' · '`.

Use it in these places:
- the `MasjidPage` title band `intro`, in place of `` `${m.districtName} · ${m.stateName}` ``;
- `masjidSeo` (W1.5);
- `mosqueJsonLd` (W1.6).

`src/lib/masjid-types.ts`: widen `PublicMasjidPage['masjid'].districtName` to `string | null`. This is defensive: the backend column is
nullable, and there are 0 nulls in production today. Fix any type errors that follow.

## Out of scope

- No backend contract change. The response shape is exactly what backend `main` v2.3.1 returns today, and the backend spec
  `../project-masjid-backend-cf/SPEC_masjid-pages-no-ajk.md` only changes slug values and `indexable`.
- No `JM_API` service binding: the plain `fetch` to `apiv2` stays (owner decision D6).
- No change to the `/ajk` interest page, `/api/ajk-interest`, the AASA or assetlinks, `robots.txt`, the sitemap code or the cache code.
- No 410 status for removed pages.

## Tests (Vitest, alongside the existing `src/lib/*.test.ts`)

- `masjid-components.test.ts`:
  - Update `renders distinct claimed and unclaimed deep-teal CTAs` so it renders with `ajk: true`.
  - Add a test for `ajk: false` using the AJK-off fixture (`profile:null`, `claimed:false`, `upcomingPrograms:[]`,
    `pastProgramCount:0`, `posts:[]`, two photos). The HTML must not contain:
    - `Upcoming programs`;
    - `No upcoming programs`;
    - `Claim`;
    - `AJK`;
    - `ajk.jejakmasjid.my`;
    - `/p/`;
    - `News`.

    It must contain the name, the address, `Open in Jejak Masjid`, `Get directions` and the photos.
  - Add a test that `ajk: false` with a fixture that *does* carry programs or posts still renders neither (defence in depth).
- `masjid-server.test.ts`:
  - `loadProgram` with `MASJID_AJK_ENABLED` unset or `'false'` throws notFound, and `fetch` / `JM_API.fetch` is never called.
  - `loadMasjid` returns `ajk:false` by default and `ajk:true` only for exactly `'true'`. A value such as `'TRUE'` or `'1'` means off.
- `masjid-format.test.ts`: test `placeParts` with these inputs:
  - `('Unknown District','Selangor')` → line `Selangor`;
  - `('UNKNOWN','Kedah')`;
  - `('','Melaka')`;
  - `(null,'Johor')`;
  - `('TAW - SEMPORNA','Sabah')` → `Taw - Semporna · Sabah`;
  - `('JOHOR BAHRU','JOHOR')`;
  - `('Petaling','Selangor')` (unchanged);
  - `('Presint 16','Putrajaya')` (digits kept).
- `masjid-seo.test.ts`:
  - With AJK off, the description does not contain "Programs" and does contain "prayer times".
  - The title for an unknown district is `Name · State`.
- `jsonld.test.ts`:
  - There is no `event` key when there are no published upcoming programs.
  - There is no `addressLocality` when the district is unknown.
- Keep every existing test passing. Update fixtures only where the new `ajk` prop or argument requires it.

## Gates

```bash
grep -n '"remote"' wrangler.jsonc   # must print nothing
pnpm install
pnpm test                           # baseline at 9937ae0: 167 pass. Report the new total; 0 failures
npx tsc --noEmit                    # only the known src/routes/download.tsx(8,21) TS2339 may remain
pnpm build
```

**Real-Worker check (required, local only).** Boundary changes need a real Worker run: synthetic tests missed 4 bugs on 2026-10-09.
1. Start the backend harness on port 8797 in a backend worktree. Follow `project-masjid-backend-cf/scripts/ajk-r1-local/README.md`, which uses
   `wrangler dev --local` and disposable state. Use `MASJID_SLUGS_ENABLED=true`, `AJK_PORTAL_ENABLED=false` and
   `AJK_NOTIFICATIONS_ENABLED=false` in its temporary local config only.
2. Seed one masjid with a check-in and a slug, one with no check-in and no photo, and one with the district `Unknown District`.
3. Run this web build with `pnpm build && npx wrangler dev --local -c dist/server/wrangler.json` and a local `.dev.vars` (never committed) containing:
   ```
   MASJID_PAGES_ENABLED=true
   MASJID_AJK_ENABLED=false
   JM_API_BASE=http://127.0.0.1:8797
   ```
4. Capture the HTML and the status of each of these:
   - `/masjid/<slug>`: 200. No `Upcoming programs` and no `ajk.jejakmasjid.my`; the committee card says `Register your interest` and links to `https://jejakmasjid.my/ajk`. Canonical `https://jejakmasjid.my/masjid/<slug>`.
     Robots `index, follow`. JSON-LD has no `event`.
   - The thin masjid: 200 with `noindex, nofollow`.
   - The Unknown District masjid: the title and the intro do not contain "Unknown".
   - `/masjid/<slug>/p/anything`: 404, and the backend log shows no `/api/public/programs` request.
   - `/masjid/zz-missing-zz`: 404.
   - `/sitemap.xml`: an index with `/sitemap-pages.xml` and `/sitemaps/masjid/1`.
   - `/sitemaps/masjid/1`: a URL set. `/sitemaps/masjid/2`: 404.
   - `/ajk`: 200 (unchanged).

   Note: `caches.default` is a no-op under local dev. The cache tests cover it.

Report:
- the diff summary;
- the gate output, with test counts against the baseline;
- the captured HTTP evidence, saved under `../.hermes/reviews/masjid-pages-no-ajk/` (create the folder).

## Release notes (orchestrator/owner, not this agent)

**Deploy order.** The order is: web deploy dark → owner flips `MASJID_PAGES_ENABLED` to `"true"` in a one-line commit on `main` and redeploys
(the pages stay inert while the backend flag is off) → backend `MASJID_SLUGS_ENABLED=true`.

**Before the first deploy of this branch.** The new `vars` block replaces any dashboard-only plain vars. The owner must confirm that
`APPLE_TEAM_ID`, `ANDROID_SHA256_CERT_FINGERPRINTS`, `TURNSTILE_SECRET_KEY`, `TURNSTILE_SITE_KEY` and `AJK_INTEREST_NOTIFY_TO`
are secrets (`npx wrangler secret list`).

**Flipping on AJK later.** It needs `MASJID_AJK_ENABLED="true"` here, together with the backend `AJK_*` flags and shop
`NUXT_AJK_ENABLED`, which brings `ajk.jejakmasjid.my` up.
