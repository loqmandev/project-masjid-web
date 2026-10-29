# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Jejak Masjid (jejakmasjid.my) is the marketing site for the Jejak Masjid mobile app — a masjid
finder and visit journal for Muslims at home and on their travels. Built with TanStack Start (SSR React) and
deployed to Cloudflare Workers.

**Brand voice is normative.** Read `BRAND.md` before writing or editing any copy: calm,
bersahaja, gentle motivation, never competitive. The homepage is Bahasa Melayu first at `/`, with English at `/en`.
Keep both dictionaries in `src/lib/i18n/` aligned. Other existing routes keep their original language. Never use urgency or
streak-panic language.

Product facts come from `../FEATURES.md` and `../store-assets-v2/ASO_COPY.md`. Where the two
disagree, the store copy and the shipped app win (e.g. the ten-minute minimum visit).

## Commands

```bash
pnpm dev          # Dev server (port 3000, falls back if taken)
pnpm build        # Build for production
pnpm test         # Vitest (vitest.config.ts) — unit tests for src/lib/*.test.ts
pnpm run deploy   # Build and deploy to Cloudflare (`pnpm deploy` is a
                  # different, built-in pnpm command and will fail)
```

## Architecture

### Tech Stack
- **Framework**: TanStack Start (React SSR) with TanStack Router (file-based routing)
- **Styling**: Tailwind CSS v4, design tokens in `src/styles.css`
- **Deployment**: Cloudflare Workers via Wrangler (`jejakmasjid.my`, `www.jejakmasjid.my`)

### Project Structure
```
src/
  routes/
    __root.tsx        # HTML shell, default meta, icons, fonts, org/site/app JSON-LD,
                      # no-flash theme script. Devtools render in dev only.
    index.tsx | en.tsx # Localized homepage + FAQPage JSON-LD
    kolaborasi.tsx | en_.collaboration.tsx # Paired collaboration pages
    privacy.tsx | tos.tsx | support.tsx   # Long-form pages via PageLayout
    download.tsx      # UA-sniffing redirect to the right store
    beta-ios.tsx | beta-android.tsx | google-groups.tsx  # Redirects. Kept even
                      # though nothing links /google-groups now; it was printed in
                      # onboarding emails already sent.
    prayer-circles.invite.$code.tsx   # Prayer Circle invite landing (see below)
    [.]well-known.apple-app-site-association.ts   # iOS Universal Links (fail-closed)
    [.]well-known.assetlinks[.]json.ts            # Android App Links (fail-closed)
  components/
    Header · Hero · TrustStrip · PublicStats · Features · Reviews · Media
    CollaborationBand · Ecosystem · Faq · Cta · Footer
    Homepage · Collaboration · CollaborationContact # Localized pages and shared email/WhatsApp block
    PageLayout.tsx    # Header + title band + .prose-jm article + Footer
    PrivacyPolicy · TermsOfService · Support   # Body copy only; no page chrome
    ui/               # Logo, StoreBadges, PhoneFrame, Section, Reveal
  lib/
    site.ts           # Site constants, store URLs, PRODUCTS destinations
    i18n/{ms,en,index}.ts # Typed copy, route locale, twins and SSR document language
    social-proof.ts   # Verbatim store ratings/reviews/media; owner refreshes before deploy
    public-stats.ts   # Strict v1 validator, local country/state maps and MYT formatting
    public-stats-server.ts # createServerFn boundary for the homepage loaders
    public-stats-api.server.ts # Optional SSR read via jm-api, 1.5 s timeout, 1 h cache
    fixtures/public-stats.json # Synthetic snapshot shared by tests and the host mock
    hero-motion.js    # Dependency-free H8 canvas renderer; mounted/cleaned up by Hero effect
    seo.ts            # seo() head builder + structuredData() + faqStructuredData()
    faq.ts            # FAQ_MS / FAQ_EN aliases of the dictionary answers
    app.ts            # Mobile app bundle ID + custom scheme (public identifiers)
    invite.ts         # Invite code normaliser + app/intent URL builders
    app-association.ts # AASA + assetlinks builders, var parsing, 404 response
    worker-env.ts     # Reads Worker vars via a dynamic `cloudflare:workers` import
  styles.css          # Light-only brand tokens, .on-deep / .eyebrow / .path-rule / .prose-jm
public/
  screens/*.webp      # Real screenshots; the bento excludes unreleased 05-facilities
  hero/*.webp         # Approved H8 paintings, sprites and pre-warped phone overlays
  logo.png · og-image.png · icon-*.png · apple-touch-icon.png · favicon.ico
                      # all derived from project-masjid-mobile/assets/images/icon.png
  sitemap-pages.xml · robots.txt · manifest.json · _headers
```

### Key Patterns

**SEO.** Every rendered route must call `seo()` in its `head()`. It emits title, description,
robots, OG, Twitter and the canonical link. The root deliberately emits **no** canonical — that
would produce two per page. Meta dedupes by `name`/`property`; links do not.

**Structured data.** `structuredData()` (Organization + WebSite + MobileApplication) renders in
the root `<head>`; `faqStructuredData(FAQ)` renders on the homepage. Both as inline
`<script type="application/ld+json">` so they appear in the SSR HTML.

**Theme.** The site is **light-only** — there is no dark palette, no toggle and no theme
script, and the OS `prefers-color-scheme` is ignored. `:root` in `styles.css` carries the only
token set and declares `color-scheme: light`. Do not reintroduce a `.dark` block or `dark:`
utilities without being asked.

**Motion.** Quiet by intent, and dependency-free: `ui/Reveal.tsx` uses one
IntersectionObserver, never a scroll listener. Everything animated is gated behind
`html[data-motion="on"]`, set by `MOTION_INIT` in `__root.tsx` only when JS runs and the
visitor has not asked for reduced motion, so the page always renders complete and static
otherwise. Animate only `transform` and `opacity`.

**Layout rhythm.** Max 1 section eyebrow per 3 sections, max 4 text elements in the hero, and
no more than 2 consecutive image-and-text split rows. The feature bento is asymmetric; its map tile spans two rows on desktop.

**Server Functions**: `createServerFn` from `@tanstack/react-start`. See `src/routes/download.tsx`.

**Server routes**: raw `Response` endpoints use `server.handlers` on a file route (see the
`.well-known` routes). Declare `HEAD` alongside `GET`, or a HEAD request falls through to an
empty SSR page with a 200. Read Worker vars only through `lib/worker-env.ts` so
`cloudflare:workers` never reaches the client bundle.

**Prayer Circle invites** (`/prayer-circles/invite/$code`). The mobile app's circle owners
share this URL. The page is capability-neutral: **no backend call**, it never shows the circle
name or members, and it never logs the code. The loader normalises the code (trim, strip
spaces/dashes, upper-case, 10 chars from `ABCDEFGHJKMNPQRSTVWXYZ0-9`) and also passes legacy
base64url tokens (20–64 chars) through unchanged without displaying them. Anything else throws
`notFound()` → "This invite link looks incomplete" with a real HTTP 404. Response headers:
`Cache-Control: private, no-store`, `Referrer-Policy: no-referrer`, `X-Robots-Tag: noindex,
nofollow`, plus `noindex` robots meta. "Open in Jejak Masjid" links to
`jejakmasjidmobile://prayer-circle/join?code=…`, swapped after hydration on Android for an
`intent://` URL whose `S.browser_fallback_url` is the Play listing. Never auto-redirect from
this page. When the association documents are live and the app is installed, the OS opens the
app and this page is not shown at all.

**App-association documents** are fail-closed: each returns 404 (`no-store`) unless its var is
present and well-formed, and 200 `application/json` with `Cache-Control: public, max-age=3600`
otherwise. Never publish placeholder IDs — the OS caches a bad document. The app claims only
`/prayer-circles/invite/*`. Nothing in `public/` or `_headers` may touch `/.well-known/*`
(a static file there would shadow the Worker route).

**Path Aliases**: `@/` → `src/`.

### Brand Mark
Follows the JM brand kit (`../Jejak-Masjid-complete-brand-kit/`, spec
`docs/specs-archive/SPEC_brand-guidelines.md`). Logo art in `public/brand/` is the exact approved
artwork, never redrawn, recoloured, cropped or retyped:
- `jm-lockup-on-light.svg` (dark-teal/gold) on ivory, white or mist; `jm-lockup-on-dark.svg`
  (ivory/gold) on deep teal `#003130` only. Never place a logo on brand teal `#00A9A5` or a photo.
- `jm-symbol-on-{light,dark}.png` (256 px) for compact spots. `ui/Logo.tsx`: `Wordmark` and
  `LogoMark` take `tone: 'light' | 'dark'`.
- Full lockup renders >= 180 px wide (guide minimum); below that use the symbol. The header shows
  the symbol below `sm` (64 px bar) and the lockup from `sm` (96 px bar).
- `logo.png`, favicon, `icon-*.png`, `apple-touch-icon.png` and OG images are still the app icon
  (used by JSON-LD/manifest); unchanged by the rebrand.

### Design System
Light-only. Palette: deep teal `#003130` (hero, CTA block, footer, page title band, primary
buttons on light), ivory `#F7F6F0` (page), mist `#E6F7F7` (alternate sections), white 20 px cards,
dark teal `#154C46` (hover), brand teal `#00A9A5` (thin rules, icons, focus ring inside deep-teal
blocks only), gold `#FFCC00` (small bars, CTA buttons on deep teal). Gold and `#00A9A5` are never
text on light surfaces. Deep-teal blocks carry `.on-deep` (ivory text, gold eyebrows, teal ring).
Fonts self-hosted in `public/fonts/` from `@fontsource-variable` 5.3.0: **Nunito 800** for
headings/CTAs, **Plus Jakarta Sans** for body. No italics. The approved H8 hero overlays are the only gradient exception. `.path-rule` (dotted
footpath) remains the motif. Focus ring is deep teal on light surfaces (3:1 rule).

### Environment Variables
Two Worker vars (the values are public by nature, but either binding kind works — the code
reads `env` the same way). Neither is declared in `wrangler.jsonc` today, so both association
documents 404 until an operator sets them, either as `vars` in `wrangler.jsonc` or with
`wrangler secret put`. **Do not set them as plain-text vars in the dashboard only:** the next
`wrangler deploy` replaces dashboard vars with the (empty) config `vars` and the documents
silently fall back to 404.

| Var | Format | Source |
|---|---|---|
| `APPLE_TEAM_ID` | 10 upper-case alphanumerics | Apple Developer → Membership details |
| `ANDROID_SHA256_CERT_FINGERPRINTS` | comma-separated `AA:BB:…` (32 hex pairs each) | Play Console → Test and release → App integrity → App signing key SHA-256 **and** upload key SHA-256 |

Operator steps (never performed by an agent): set both vars, deploy, then verify with Apple's
AASA validator (or `curl -i https://jejakmasjid.my/.well-known/apple-app-site-association`) and,
on a device with the app installed, `adb shell pm verify-app-links --re-verify
my.lonasoft.jejakmasjidmobile` followed by `adb shell pm get-app-links
my.lonasoft.jejakmasjidmobile` (the `jejakmasjid.my` domain should read `verified`). iOS
fetches the AASA through Apple's CDN, so a fresh install may be needed to pick up changes.

Locally, `.dev.vars` feeds `pnpm dev`. To exercise the built Worker with fake values:
`pnpm build && npx wrangler dev -c dist/server/wrangler.json --local --var APPLE_TEAM_ID:ABCDE12345`.

The old waitlist (Google Sheets + Resend) was removed in full, along with
`SHEET_ID`, `GOOGLE_SERVICE_ACCOUNT_JSON`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL` and
`APP_DOMAIN`. Any of those still set as Worker secrets can be deleted.

### Homepage numbers and collaboration — owner amendments 2026-10-26

**Masjid search/browse removed 2026-10-29 (owner anti-scraping decision): no `/masjid` landing, `/masjid/di/…`, `/en/mosques…` or `/sitemaps/areas`, no "Find a mosque" links, no discovery API reads. Do not reintroduce without the owner.** Individual `/masjid/<slug>` pages stay.

`SPEC_website-revamp.md` §8 supersedes all earlier AJK marketing requirements. `/ajk` and
`/api/ajk-interest` are removed and return 404. The form, proposal, snapshot, server handlers
and their tests are gone. Products now contain App, Shop, Merchant and Collaboration. The
masjid-page AJK flag/code is unchanged. Under the owner's 2026-10-27 removal decision, the
former form's D1 and unused outbound email bindings, migration files and migration script
have been removed from the website. Runtime code, env types and tests no longer depend on
that infrastructure. Secrets remain untouched; the planner deletes the database after
this change ships.
The privacy policy still describes the former AJK form in BM/EN and its retention terms;
leave it unchanged because it covers previously collected leads.

The homepage order is hero → trust → optional numbers → features → reviews → media →
collaboration → ecosystem → FAQ → download. Collaboration is a deep-teal band with three
modest invitation cards (organisations/NGOs, brands/sponsors, media/researchers). It has a
top-level desktop/mobile nav link and stays in Products. `CollaborationContact` shows
`SITE.email` as selectable text, provides clipboard copy with text-selection fallback,
a localized subject in the mailto link, and a WhatsApp link. All three placements (band and
two collaboration pages) share this block. `WHATSAPP_URL` is the single Business-link constant;
the owner must confirm its destination and preset message before publishing.

Both homepages load numbers during SSR through `loadPublicStats`. The server-only API module
uses `jm-api` at `/api/public/stats`, independently of `MASJID_PAGES_ENABLED`, with the existing
`JM_API_BASE`/service-binding pattern. Only a 200 with a complete, strictly validated v1
snapshot renders. Non-200, network failures, timeout (1500 ms) or invalid data omit the entire
section. Cloudflare Cache API caches valid snapshots for 3600 s with keys isolated by upstream
URL; failures are not cached. Cached data is revalidated. Existing masjid/prayer caches retain
their own caps and keys. No new runtime variable or dependency is required.

Numbers render statically with tabular numerals and localized `Intl.NumberFormat`, local
country/state labels and an MYT snapshot date. Country visits and the semantic state table
preserve suppressed values as `< 10`; unknown geography is never assigned to Malaysia.
State codes mirror the backend's canonical list (e.g. `SELANGOR`, not the schematic `SGR`).
Never animate these numbers out of view or render a partial snapshot.

Host evidence lives in `../.hermes/reviews/website-revamp/` relative to the project root.
`mock-stats.mjs [port] [200|404|503|invalid|timeout]` serves the synthetic fixture on loopback
and proxies nothing. Start only the built local Worker using
`npx wrangler dev -c dist/server/wrangler.json --local --var JM_API_BASE:http://127.0.0.1:8799`.
Run `STATS_EXPECT=present ONLY=stats node check-hero.mjs <local-worker-url>` with the 200 mock;
use `STATS_EXPECT=absent` and another mock port/base for 404/failure checks to avoid a cached
success. Optional `STATS_ABSENT_BASE` checks a second local Worker in the same run.
The host script checks SSR and no-JS layouts at 360/768/1440 for both languages and verifies
retired AJK routes return 404. Preserve the planner's no-JS ready fix, 250–510 ms raster wipe
tolerance and realistic denied-storage getter simulation.

### Known Follow-ups
- App Store badge is the Malay (`_MY`) artwork while the Play badge is English. Swap one for
  consistency using Apple/Google marketing resources — badges must not be redrawn by hand.
- `pnpm test` runs from `vitest.config.ts`, which deliberately omits the Cloudflare/Start
  plugins (under `vite.config.ts` the workerd runner fails to load CJS deps). DOM component tests opt into jsdom with a per-file environment directive; static SSR component tests use `react-dom/server`.
- `npx tsc --noEmit` reports one pre-existing error in `src/routes/download.tsx`
  (`request` is not on the server-fn context type); the build is unaffected.

### Facility info on public masjid pages (local implementation, 2026-10-19)

`SPEC_facility-info.md` is implemented behind the backend facility-info flag. The presence of
the top-level `facilities` array from `GET /api/public/masjids/by-slug/:slug` enables
`components/MasjidFacilities.tsx` on claimed and unclaimed pages, independently of the web AJK
flag. An absent array preserves the existing plain `profile.facilities` list and does not
request the catalogue. An enabled empty array is authoritative; it shows the empty state.

`loadMasjid` fetches the raw `GET /api/facilities` catalogue once per enabled page request,
using `apiGet`'s existing 60-second cache, web-zone keys and `jm-ajk-public` purge tag.
Catalogue labels, definitions, groups and sort order drive the section. Proven chips use
native `details`/`summary` with shield/people icons and accessible status names; reported items
stay inside a collapsed disclosure. Details show trust dates in Malaysia time and up to four
trusted photo links. Facility UI uses no points or gold. Only proven, catalogue-backed items
enter the existing Mosque JSON-LD `amenityFeature`; noindex rules stay unchanged.

If catalogue entries are unavailable, the page remains readable and the section explains that
some facility details are temporarily unavailable; it does not invent definitions or expose
codes. Tests cover the backend gate, older-backend parity, states, disclosures, photos, cache,
loader and structured data. No deployment has been performed. Production currently has
`MASJID_AJK_ENABLED=true` at runtime (pilot version `f57a1189`) while tracked config says false;
the future deploy operator must preserve the pilot setting. This change does not edit config.


### Homepage revamp (phase 1, local implementation 2026-10-26)

Normative contract: `SPEC_website-revamp.md`. H8 camera geometry, 600–2300 ms zoom,
3600 ms sequence, and sprite plot coordinates are ported from sketch 107, rounds 9–9d.
`Hero.tsx` server-renders the full rest composition. The text never starts transparent.
CSS image backgrounds provide no-JS/canvas-failure rest. Because URL backgrounds can
be LCP candidates, the synchronous head motion gate suppresses them on normal-motion
startup, before hydration. Source images load only after text paint, then canvases paint
the rest city, sprites and phone. Reduced motion allocates
no canvas backing. The React effect cancels/releases work on unmount; visibility,
pagehide, replay and motion changes return to rest. One session-scoped play, explicit replay.
The zoom uses a stage-sized canvas capped at DPR 3; no art DOM layer may exceed 1.25 ×
the stage, and temporary buffers are capped at 1254 px and freed after each run.

`hero-motion.js` is intentionally the dependency-free JavaScript port; its public mount
signature is declared in `hero-motion.d.ts`. Keep the camera math/timings stable. Offline
screen regeneration: `python3 scripts/hero/warp-screen.py /path/to/light-mode-explore.png`
(Pillow + numpy; details in `scripts/hero/README.md`). Current Explore art is the dark
placeholder from the approved sketch, pending the owner's light-mode screenshot.

`seo({ alternates: { ms, en } })` emits one own-page canonical, language-only `ms` / `en`
and English `x-default`; OG locale is `ms_MY` / `en_US`. `__root.tsx` derives `html lang`
from the SSR location; existing routes remain `en-MY`. There are no browser-language/IP
redirects. Header/footer labels use BM on `/` and `/kolaborasi`, and English elsewhere. Only paired pages have a language
switch. Native Products disclosure works without JS; the mobile menu has Escape/outside
click cleanup. Product status copy is in the dictionaries, destinations in `PRODUCTS`.

`FAQ_MS` / `FAQ_EN` and `Faq` read the same dictionaries as homepage FAQPage JSON-LD.
The committee proposal, form and snapshot are removed per §8. Collaboration has the shared
email-copy/mailto/WhatsApp contact block described above. Homepage numbers read the new
backend public-stats contract; no directory/search page, Worker vars, migrations or deployment
changes are included.

Implementation evidence and the host-only Chromium script are under
`.hermes/reviews/website-revamp/` in the parent project. The script checks the built local
Worker, captures screens and records actual outcomes. Deployment still needs the owner's
ratings/review refresh, Opus review and browser approval.

### Masjid page redesign — "Place card" (local implementation, 2026-10-29)

Spec `SPEC_masjid-page-redesign.md` (project-masjid-web, unmoved), design sketch 108 variant A. Only
`/masjid/$slug` changed; the program page, missing/resting pages, sitemaps, redirects, noindex rules and the AJK
flag behaviour are as before. English only, light only.

**Structure.** `MasjidPage` (`components/MasjidPages.tsx`) renders `components/masjid/MasjidPlacePage.tsx`:
Header, place line (`Masjid · District · State`), gallery, then two columns from `lg` (main + sticky 340 px
`<aside>`) or one column below it with a `sticky bottom-0` action bar (inside `<main>`, never `fixed`, so it rests
above the footer). Main order: title block (tags, h1, title-cased address, Directions + Waze below `lg`), AJK "About"
profile text (claimed pages only), prayer times, facilities, reviews, `#photos` grid (lg only, only when more than five
photos), then the AJK sections (programs, news, claim callout) behind `MASJID_AJK_ENABLED`. The aside is the place
card (Google map when there are photos and a valid key, address, Directions + Waze; below `lg` it is shown only when it carries
the map, otherwise it would repeat the title block) and the deep-teal app card. Parts live in
`components/masjid/`: `Gallery` (one set of `<img>`s: scroll-snap strip below `lg`, mosaic from `lg` via CSS
`data-mosaic`; counter "N photos" in SSR, "i / N" after hydration through IntersectionObserver; no photos = `MapHero`),
`PrayerTimes` (SSR has no highlight or countdown; after hydration the next prayer is marked and a once-a-minute
countdown shows; a page left open past midnight never highlights), `Reviews`, `PlaceCards` (Address, MapLinks, PlaceCard,
AppCard, StickyBar), `MapEmbed`, `OpenMasjid` (keeps the Android `intent://` swap; re-exported from `MasjidPages`).
`MasjidFacilities` keeps its behaviour and tests; proven items are white pills (shield / people-check icon), reported
items collapse into one dashed "+ N reported by visitors" chip that opens the existing disclosure, plus an icon legend.
Pure helpers: `lib/masjid-format.ts` (`titleCaseAddress`, `wazeUrl`, `venueLabel`, `nextPrayer`, countdown, MYT date),
`lib/masjid-gallery.ts` (`galleryPhotos`: AJK cover, then photos, trusted hosts, de-duplicated, at most eight),
`lib/masjid-reviews.ts`. Page styles are the `m-*` / `facility-*` rules in `styles.css`.

**Reviews contract** (backend `SPEC_masjid-page-reviews.md` §3, flag `PUBLIC_MASJID_REVIEWS_ENABLED`). The by-slug payload
may carry `reviews: { count, average, items[{ id, rating, tip, createdAt }] }`. `loadMasjid` validates it strictly with
`validateReviews` (count integer >= 0; average null or 1–5, required from three reviews; <= 3 items and <= count;
rating integer 1–5; tip 1–150 chars; id `^[A-Za-z0-9_-]{1,64}$`; ISO date with zone) and returns it as `loaderData.reviews`,
removed from `page`; anything invalid or absent means no Reviews section, never a partial one. Only those four item
keys survive, so an oversharing backend cannot reach the HTML or hydration data. Tips render as escaped text, the
reviewer is "Visitor · Month YYYY" (MYT), "Report" is a `mailto:` to `SITE.email` with the review id and slug, and the
tile with average + gold stars (half stars) appears from three reviews. No `AggregateRating`/`Review` JSON-LD.
JSON-LD keeps `Mosque` as before and adds `image` (up to three trusted visitor photos) when there is no AJK cover.

**Map = Google Maps Embed API** (owner decision 2026-10-29, replacing the server-rendered SVG map and its tile
source, which no longer exists). `components/masjid/MapEmbed.tsx` renders
`<iframe src="https://www.google.com/maps/embed/v1/place?key=…&q={lat},{lng}&zoom=16&language=en" title="Map of {name}"
loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen>` inside the fixed-aspect `.m-map` box (16:10 in
the place card, 4:3 in the phone no-photo hero, 300 px tall in the desktop no-photo hero), so nothing shifts while Google
loads. On touch layouts (`max-width: 1023px` or `pointer: coarse`) a transparent `a.m-map-cover` link covers the iframe
(to the Google Maps directions URL) so a swipe scrolls the page instead of panning the map; with a fine pointer from `lg` it
is `display: none` and the iframe is interactive. `lib/embed-map.ts` builds the URL with `URLSearchParams` from **coordinates only** (never the name: Google could
match another place) and validates the key. The key is the Worker var **`GOOGLE_MAPS_EMBED_KEY`** (typed in
`lib/worker-env.ts`), validated as `^[A-Za-z0-9_-]{20,60}$`; `loadMasjid` returns it as `mapKey`. **No value is committed to
`wrangler.jsonc`:** the owner provides it (set it as a `vars` entry there, never dashboard-only, which the next deploy
overwrites). Absent or malformed key: no map anywhere, no empty container; the no-photo gallery slot is only the "No photos
yet" card and the place card (lg only) is address + Directions + Waze. Below `lg` the place card is shown only when it
carries the map. The key is public by nature, so the owner restricts it in Google Cloud to **HTTP referrers
`jejakmasjid.my/*` and `www.jejakmasjid.my/*`** and to the **Maps Embed API only**. The site sets no Content-Security-Policy
(`public/_headers` has none); if one is ever added it needs `frame-src https://www.google.com`. The privacy policy
discloses that Google receives the visitor's IP address and may set cookies when the map loads. The earlier SVG map route,
`TILES` service binding, `TILES_BASE`, `@mapbox/vector-tile`/`pbf` and the map fixtures are deleted; `lib/embed-map.test.ts`
fails if any of them comes back.

Host check (local built Worker only; `KEY=dummy|none` must match whether the Worker has `GOOGLE_MAPS_EMBED_KEY`):
`.hermes/reviews/masjid-page-redesign/{mock-api.mjs,check-masjid.mjs}` (loopback API and https image mocks; Chromium via
global `playwright-core`, Google requests stubbed so nothing leaves the machine). Start the Worker with
`--persist-to <dir outside dist>` or wrangler restarts on every Cache API write and truncates responses.
