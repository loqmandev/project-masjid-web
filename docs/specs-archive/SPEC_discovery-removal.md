# SPEC: remove masjid search and browse pages from the website

Status: **owner decision 2026-10-29** ("revert the masjid search on the website, I don't want people to scrape this"). Pairs with `project-masjid-backend-cf/SPEC_discovery-removal.md`. Reverses `SPEC_masjid-discovery.md` (web `main` eb4fdcf, bc488b8, da2c1e9; live since 2026-10-27).

## 1. Context
- The backend turns the public discovery API off first (hotfix 2.3.14, `PUBLIC_DISCOVERY_ENABLED=false`). The site already fails closed on that 404, so in production the pages and links disappear within about an hour without any web change.
- This spec removes the code, so the feature cannot come back by accident.
- **Masjid pages (`/masjid/<slug>`), program pages, the masjid sitemaps and homepage public stats stay exactly as they are.**

## 2. Branch
`chore/remove-masjid-discovery` from web `main` (85200cb or later). Worktree `../.hermes/worktrees/remove-discovery-web`. No deploy, no push, no merge.

## 3. Remove
Routes:
- `src/routes/masjid.index.tsx`
- `src/routes/masjid.di.$country.tsx`, `masjid.di.$country_.$region.tsx`, `masjid.di.$country_.$region_.$district.tsx`
- `src/routes/en_.mosques.tsx`, `en_.mosques_.in.$country.tsx`, `en_.mosques_.in.$country_.$region.tsx`, `en_.mosques_.in.$country_.$region_.$district.tsx`
- `src/routes/sitemaps.areas.ts`
- Regenerate `src/routeTree.gen.ts` with the normal build, never by hand.

Components and libraries:
- `src/components/Discovery.tsx`, `src/components/DiscoveryAvailability.tsx`
- `src/lib/discovery.ts`, `discovery-api.server.ts`, `discovery-server.ts`, `discovery-response.ts`, `discovery-seo.ts`, `discovery-sitemap.ts`, `src/lib/i18n/discovery.ts`
- `src/lib/fixtures/discovery.json`, `discovery-backend.json`
- Every `src/lib/discovery*.test.ts`

Wiring:
- `src/start.ts`: drop the discovery 503 middleware. Keep `createStart` working with whatever remains.
- `src/routes/__root.tsx`: drop `loadDiscoveryAreas` and the `areas` data it feeds.
- `src/components/Header.tsx`: drop the "Cari masjid" / "Find a mosque" nav item and the `discovery` prop.
- `src/components/Hero.tsx`: drop the "atau cari di laman web →" / "or search on the web →" link.
- `src/components/Footer.tsx`: drop the "Find a mosque" link.
- `src/components/PublicStats.tsx`: state names become plain text (no `areaPath` links).
- `src/lib/i18n/{ms,en,index}.ts`: drop the `discovery` keys. Keep both dictionaries aligned.
- `src/lib/jm-api.ts`: drop the discovery branches (`discovery`, `nearby`, `staleFallback`, `discoveryCacheKey`, `discoveryStaleCacheKey`, the 4 s timeout). Stats, masjid, program, facility, prayer and sitemap reads must behave exactly as before.
- `src/lib/sitemap.ts`: the index lists `/sitemap-pages.xml` and the masjid pages only; no areas lookup.

Before deleting anything, `grep` for every importer. Remove only what nothing else uses.

## 4. Behaviour after removal
- `/masjid`, `/masjid/di/...`, `/en/mosques`, `/en/mosques/in/...` and `/sitemaps/areas` return a real HTTP 404 (the existing not-found page).
- `/masjid/<slug>` still matches and renders unchanged. Slugs shorter than 3 characters (e.g. `/masjid/di`) stay 404.
- No page links to a removed URL. Homepage hero stays at ≤ 4 text elements.
- No change to `robots.txt`, `_headers`, `sitemap-pages.xml` (none of them lists the removed pages).

## 5. Tests and gates
- Update the tests that referenced discovery (header/footer/hero/navigation, homepage, sitemap, i18n, jm-api).
- Add or keep assertions that:
  - header, footer, hero and stats contain no `/masjid` landing, `/masjid/di/` or `/en/mosques` link;
  - the sitemap index has no `/sitemaps/areas`;
  - the route tree has no discovery routes, and `/masjid/$slug` still resolves.
- Gates: `pnpm test`, `pnpm build`, `pnpm exec tsc --noEmit` (only the known `download.tsx` error).
- Compare test counts with `main` and explain every removed test file.

## 6. Docs
- `CLAUDE.md`: add one line under the homepage section: masjid search/browse removed 2026-10-29 (owner anti-scraping decision), do not reintroduce without the owner.
- After merge, `git mv SPEC_masjid-discovery.md` and this spec to `docs/specs-archive/`.

## 7. Report
`../.hermes/reviews/discovery-removal/BUILD-web.md`: files removed and changed, gate results against `main`, deviations.
