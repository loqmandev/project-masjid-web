# SPEC — jejakmasjid.my homepage revamp (phase 1)

Status: approved for build, 2026-10-25. Owner decisions are in §0.
Base: web `main` (af50784). Branch `feat/website-revamp`, merged back into `main` only after the Opus review and the owner's browser check.
Planning record: `../.hermes/plans/2026-10-14_095052-website-revamp.md`. Sketches: hero = `../.planning/sketches/107-website-hero/H8-peta-bandar-luas/` (approved); `../sketches/20261014-website-revamp/` (A, superseded) remains the reference for the other sections.

## 0. Owner decisions (2026-10-25)

| # | Decision |
|---|---|
| D1 | ~~Sketch A~~ superseded 2026-10-25 by **sketch 107 H8 "Peta bandar"**: a man checks the app, then one camera zoom out reveals a watercolour city with four masjids appearing (§4.1). Hero SEO copy approved 2026-10-26 (global scope, language-only hreflang). |
| D2 | **Bahasa Melayu first, with an English version.** BM is served at `/` and English at `/en`. |
| D3 | **The committee (AJK) content leaves the homepage.** The `ForCommittees` modules and the Putrajaya `CommitteeSnapshot` move to `/ajk`. The homepage keeps one short card that links to `/ajk`. |
| D4 | **The AI illustration is approved for production.** It must never be presented as a real or named mosque. |

Problem being solved: the current homepage runs eight sections in a row (Hero, Assurances, Journey, Features, HowItWorks, a long committee proposal with a data snapshot, FAQ, CTA). Content is repeated and the page has no clear hierarchy. Phase 1 gives it one clear path: hero → proof → what the app does → reviews → other products → FAQ → download.

## 1. Scope

**In scope:**
- the homepage (`/` in BM, `/en` in English);
- the shared header (with a new Products menu) and footer;
- a new collaboration page;
- `/ajk`, which absorbs the committee content;
- SEO plumbing for two languages.

**Out of scope (do not change):**
- `/masjid/$slug`, program pages and the masjid sitemaps;
- `/privacy`, `/tos`, `/support`, `/download`, the beta and Google Groups redirects;
- the invite landing page and the `.well-known` routes;
- the AJK form's behaviour and its server endpoint;
- `wrangler.jsonc` vars, D1 and deploys.

These pages stay in their current language. They render the new header and footer, which must still work on them (see §3.3).

**Phase 2, not part of this build:** a public "Cari masjid" discovery page (`/masjid` index, area pages). It needs a backend search contract and has its own spec. Until then, **no search box or "Cari masjid" link that leads nowhere** may appear anywhere.

## 2. Routes and languages

| Page | BM (default) | English |
|---|---|---|
| Homepage | `/` | `/en` |
| Collaboration | `/kolaborasi` | `/en/collaboration` |

- Copy lives in one typed dictionary per language: `src/lib/i18n/ms.ts` and `src/lib/i18n/en.ts`, with the same keys, plus `src/lib/i18n/index.ts` exporting `type Locale = 'ms' | 'en'` and `t(locale)`. **No i18n library.** A unit test fails if either dictionary has a key the other lacks.
- `<html lang>` must follow the route: `ms` for BM pages and `en` for English pages. Other routes stay as they are today: `en-MY`, with `/ajk` keeping its inner `lang="ms"`. `__root.tsx` hard-codes `en-MY` today, so derive the value from the matched route (for example from route `staticData` or the path prefix) during SSR. Do not patch it after hydration.
- `seo()` gains an optional `alternates: { ms: string; en: string }`. When it is set, it emits a canonical link for the page's own URL plus reciprocal language-only `hreflang="ms"` and `hreflang="en"` alternates and `x-default` = the **English** URL, and `og:locale` set to `ms_MY` or `en_US`. Language-only codes are deliberate (owner 2026-10-26): the app serves masjids and check-ins overseas, so the English page must not be targeted at Malaysia only. Add unit tests in `seo.test.ts` or a similar file.
- Header language switch: a plain link labelled "English" or "Bahasa Melayu" that goes to the other version of the current page. Show it only on pages that have a twin. **No IP or browser-language redirects.**
- FAQPage JSON-LD is emitted per language from that language's FAQ.
- Add `/en`, `/kolaborasi` and `/en/collaboration` to `public/sitemap-pages.xml`. Use `xhtml:link` alternates if the file's format allows it; otherwise list plain URLs.
- Old homepage anchors (`/#journey`, `/#features`, `/#how`, `/#committees`, `/#faq`) may stop resolving. That is acceptable, but `/#faq` must keep working: the new FAQ section's id stays `faq`.

## 3. Shared chrome

### 3.1 Header
- Logo: the existing `Wordmark` / `LogoMark` rules apply unchanged (symbol below `sm`, lockup from `sm`, on the ivory bar).
- Nav, in order: **Produk ▾**, **Ciri aplikasi** (`#ciri`), **Ulasan** (`#ulasan`), **Soalan** (`#faq`), then the language switch and a persistent **Muat turun** button (deep teal) linking to `/download`. On non-home pages the anchors become `/#…` (or `/en#…`).
- English labels: Products, Features, Reviews, Questions, Download.
- Mobile: symbol, then **Produk ▾**, then **Muat turun**. The other links go into an accessible menu (a disclosure button with `aria-expanded`; Escape closes it; it must not trap focus).
- **Products menu.** A disclosure, not hover-only: it opens on click, Enter or Space; Escape and an outside click close it; it fits a 360 px viewport. The entries and their honest status labels:

| Entry | Destination | Status line (BM / EN) |
|---|---|---|
| Jejak Masjid | `/download` | "Aplikasi iOS & Android" / "iOS & Android app" |
| Jejak Masjid Shop | `https://shop.jejakmasjid.my` | "Barangan rasmi" / "Official merchandise". **No prices, no "order now"**: merch sales are behind `NUXT_MERCH_SALES_OPEN=false`. |
| Jejak Masjid AJK | `/ajk` | "Rintis — daftar minat" / "Pilot — register interest" |
| Jejak Masjid Merchant | `https://merchant.jejakmasjid.my` | "Portal penjual (dengan jemputan)" / "Seller portal (by invitation)". The marketplace is off in the app, so never say "sell now". |
| Kolaborasi / Collaboration | `/kolaborasi` or `/en/collaboration` | "Bekerjasama dengan kami" / "Work with us" |

  External links open in the same tab and show a small ↗ icon with `aria-hidden` plus visually hidden text naming the external site.
- Keep product destinations in `src/lib/site.ts` as a `PRODUCTS` constant and remove `SECTIONS`. The footer reads `PRODUCTS` as well.

### 3.2 Footer
Deep teal with `.on-deep`. Columns:
- Produk: the `PRODUCTS` list.
- Aplikasi: App Store, Google Play, `/download`.
- Syarikat: Support, Privacy, Terms, `mailto:` `SITE.email`.

Keep the legal name and registration line from `SITE` exactly as it is. Footer labels are localized, and the legal page titles stay as they are. Add the art disclosure line here (§4.1).

### 3.3 On pages without a twin
The header renders with BM labels on BM-only pages (`/ajk`) and English labels everywhere else (privacy, tos, support, masjid pages, invite). It shows no language switch on these pages.

## 4. Homepage sections (both languages, in this order)

Follow `BRAND.md` voice: calm, bersahaja, no urgency, no streak panic, no competitive framing. Every product claim must match what is **shipped in the live store build (2.3.0)** per `../FEATURES.md`. Things built for 2.4.0 but unreleased, such as facility info, home-screen widgets and arrival reminders, are **not** advertised.

### 4.1 Hero (sketch 107 H8, "Peta bandar")
Reference implementation: `../.planning/sketches/107-website-hero/H8-peta-bandar-luas/` (`index.html`, `hero.css`, `hero.js`, plus `../shared.css` and `../shared.js`). Approved preview: https://claude.ai/artifact/QfftZNeopWxgajayjXMCTp. Port it faithfully. Do not redesign the zoom, its timings, the map size or the person's size: the owner approved them as they are.

**Copy (SEO, owner-approved 2026-10-26).** The hero has these four text elements and no eyebrow:

| Element | BM (`/`) | English (`/en`) |
|---|---|---|
| H1, one `<span>` per line | "Cari masjid" / "berdekatan," / "simpan jejak." | "Find mosques" / "near you, keep" / "your record." (English uses "mosques", the word global searchers type; the brand name keeps "Masjid". Owner wording 2026-10-26. "keep your record." on one line overflows at every width, so it is split this way. This split measured 2 px short of the 20 px gutter at 768 with the sketch's 40 px minimum, so the English H1 uses a **38 px** clamp minimum; re-check the gutter at all six widths.) |
| Supporting line | "Jejak Masjid ialah aplikasi percuma untuk mencari masjid dan surau di sekitar anda, di tanah air atau ketika bermusafir. Semak waktu solat dan rekod setiap kunjungan anda." | "Jejak Masjid is a free app for finding mosques and surau near you, at home or on your travels. Check prayer times and keep a record of every visit." |
| Store badges | `StoreBadges` | `StoreBadges` |
| Art caption | "Ilustrasi dijana AI" | "AI-generated illustration" |

- Homepage `seo()`:
  - BM title "Cari Masjid & Surau Berdekatan", which `seo()` renders as "Cari Masjid & Surau Berdekatan | Jejak Masjid";
  - BM description "Aplikasi percuma untuk cari masjid dan surau berdekatan, di tanah air atau ketika bermusafir. Semak waktu solat dan simpan rekod kunjungan anda.";
  - English title "Find a Mosque Near You";
  - English description "Free app to find mosques near you, at home or on your travels. Check prayer times and keep a private record of every masjid you visit. iPhone and Android.";
  - `SITE.description` stays as the default for other pages.
- **Global scope (owner 2026-10-26).** Copy must not tie the app to Malaysia: masjids and check-ins work overseas. Prayer times are live for Malaysia (JAKIM), Singapore (MUIS), Brunei (KHEU), Indonesia (KEMENAG), Saudi Arabia (Umm al-Qura) and three Chinese cities (calculated). Never write "worldwide prayer times"; the FAQ may list the countries.
- The H1 lines are `white-space: nowrap` and were measured to fit the copy column at 360, 390, 768, 1024, 1280 and 1440 px with the headline gutter intact. If copy changes, re-check the gutter (≥ 48 px at 1440, ≥ 20 px elsewhere).
- The H1 and supporting line are in the SSR HTML, visible with JS off, and never start hidden or transparent.

**Art and motion:**
- **Sequence.** A man in a songkok checks the app on his phone: the Jejak Masjid splash, then the Explore screen wiping up from the bottom, with his thumb drawn over it. One camera zoom out (log-space `s = 72 ** (1 - e(t))`, `cubic-bezier(.4,0,.2,1)`, 600–2300 ms) passes through street and block and lands on a watercolour city. Four masjids then appear one by one, each with a pin, a distance chip and a route. The floating phone settles at rest, and a ↻ button replays the sequence.
- **Renderer.** The zoom is drawn on one `<canvas>` sized to the art pane, backing = CSS size × `min(devicePixelRatio, 3)`. At landing it hands over to the DOM rest city, and the WAAPI reveals take over.
  - **Hard limit: no element inside the art pane lays out larger than 1.25 × the stage width.** Round 7 used oversized DOM layers and crashed mobile Safari (~1.7 GB of GPU memory).
  - Feathered offscreen copies are ≤ 1254 px and freed after the run.
- **Masjid sprites** are drawn into canvases, not `<img>`, so they never become the LCP. Each sits on a real empty plot of `l4-city`; the plot corners are in the sketch README (round 9).
- **Phone screens** are pre-warped by homography with `warp-screen.py`. No runtime skew.
  - Re-run `python3 warp-screen.py <screenshot>` whenever the Explore screenshot changes. The owner will supply a light-mode screenshot; the current `02-explore` is a dark placeholder.
  - Commit the generated `screen-*` WebPs as assets.
- **Lifecycle:**
  - plays once per browser session (`sessionStorage`, wrapped in try/catch); ↻ replays;
  - `pagehide`, a hidden tab, replay and a reduced-motion change cancel the loop and jump to rest;
  - any canvas or decode failure falls back to rest with no error;
  - `prefers-reduced-motion` or no JS shows the rest state only, with no canvas.
- **Assets.** Copy the WebPs from the sketch folder into `public/hero/` (about 900 KB of art in total):
  - paintings `l1-close` (and `-small`), `l2-street`, `l3-block`, `l4-city`;
  - the four sprites;
  - the `screen-*` overlays.

  Load the art at low priority, after the text paints. **The text must stay the LCP element at every width**: the sketch probe measured the supporting line or the H1 at 390, 1280 and 2560 px. No `fetchpriority="high"` on art.
- The logo is never placed on the art. It stays on the ivory header bar.
- **Disclosure:** the art caption above, plus the footer line "Ilustrasi hero dijana dengan AI; bukan lokasi sebenar." / "Hero illustration is AI-generated and does not show a real place." No real or identifiable mosque appears.
- **Port to React** as a client-only effect inside `Hero.tsx`, with no runtime libraries. Server-render the rest state so the page is complete before hydration.
- **Acceptance.** Port the relevant assertions of the sketch's `capture-r5.mjs`:
  - responsive widths, the headline gutter and text LCP;
  - the 1.25× layout cap and the canvas backing cap;
  - the landing frame matching rest;
  - the sprites inside their plots;
  - no screen pixels outside the phone quad.

  One sketch check ("overlay plus painted fingers must cover rounded glass" at 300 ms) fails on about 0.2 % anti-aliased wipe-edge pixels that cannot be seen. Relax it with a small tolerance and say so in the report. Codex's sandbox cannot start Chromium, so the planner runs browser checks on the host.

### 4.2 Trust strip (ivory band directly under the hero)
- Two separate ratings, never blended. Each shows the score, the count, the store and the locale:
  - App Store Malaysia 4.8 ★ · 36 ratings;
  - Google Play (MY listing) 4.7 ★ · 48 reviews.
- Add a "Disemak / Checked" date and use `fetchedAt`.
- On the right: "Dipaparkan di / Featured in", followed by the publisher names as **text** (no logos) linking to the exact articles (§4.5).
- Data lives in `src/lib/social-proof.ts`:
  - `STORE_RATINGS` with `{ store, locale, score, count, unit: 'ratings'|'reviews', sourceUrl, fetchedAt: '2026-10-14' }`;
  - `REVIEWS` (§4.4);
  - `MEDIA` (§4.5).
- **The implementer must not change these numbers.** The owner refreshes them before deploy (§7).

### 4.3 Feature bento (`id="ciri"`)
- An asymmetric grid, not equal cards. On desktop, one large tile spans two rows, with four supporting tiles. On mobile it becomes one column in the order listed.
- Use **real app screenshots** from `public/screens/*.webp` inside the existing `PhoneFrame` or a cropped frame. No generated or fake UI.

| Tile | Shipped feature (verify in FEATURES.md) | Screenshot |
|---|---|---|
| Large | Find masjids and surau nearby (map + list) | `02-explore.webp` |
| 2 | Verified visit (check in, stay at least 10 min, complete nearby) | `03-visit-complete.webp` |
| 3 | Prayer times (JAKIM) | `01-today.webp` |
| 4 | Prayer Circle: a private group of up to 10, with public circles joinable by leader approval (shipped 2.3.0, directory flag on) | `04-prayer-circle.webp` |
| 5 | Personal journey: achievements and monthly challenges | `06-achievements.webp` |

- List the available screenshots in the build report. Do not use `05-facilities.webp`: facility info is unreleased. Use `@2x` files in `srcset`. Where none fits, use an icon tile (lucide) rather than inventing UI.
- Copy: one heading and at most two lines per tile. The existing `Features`, `Journey`, `HowItWorks` and `Assurances` copy is source material. Reuse the accurate lines and do not repeat claims across tiles.
- Privacy line, kept somewhere in this section: visit history is private, and location is used at check-in only, not tracked in the background. Take this wording from the current FAQ.

### 4.4 Reviews (`id="ulasan"`)
- A static grid of three or four quotes. No autoplay marquee.
- An optional filter (Semua / App Store / Google Play) must be real buttons with `aria-pressed`.
- Each quote is verbatim, original spelling kept, with the reviewer name, store, the date exactly as displayed (no invented year) and a link to the store listing. Show **no star icons per quote**: individual ratings were not captured.
- Use the four quotes listed under "Selected verbatim quote candidates" in the planning record, with their exact fields. Shown verbatim, they stay in the reviewer's own language. Give the section header in both languages.

### 4.5 Media (part of the trust strip, plus a small section or row)
Two items, each with the publisher, author, date, headline and a link to the exact article. Exact headlines and authors are in the planning record ("Verified media").
- Siakap Keli, Azizah Najib, 8 April 2026: https://siakapkeli.my/articles/fenomena-jejak-masjid-jadi-perhatian-ada-yang-dah-lawat-88-masjid
- Waktu Solat Malaysia, Shaifullah, 2 April 2026: https://www.waktusolat.digital/inspirasi-islam/aplikasi-jejak-masjid

Store listing URLs for reviews: App Store `APP_STORE_URL`; Google Play `https://play.google.com/store/apps/details?id=my.lonasoft.jejakmasjidmobile&hl=en&gl=MY`.

The headlines stay in BM in both languages. Do not imply endorsement.

### 4.6 Ecosystem ("Lebih daripada aplikasi" / "More than an app")
- Cards built from `PRODUCTS` (except the app itself), each with its honest status line from §3.1 and a one-line description.
- The **AJK card** is the homepage's only committee content: one or two lines and "Ketahui lebih lanjut → /ajk".

### 4.7 FAQ (`id="faq"`)
- Reuse `Faq.tsx`. `FAQ` becomes `FAQ_MS` / `FAQ_EN`, or moves into the dictionaries.
- **Audit every answer against FEATURES.md and the shipped app, and fix stale lines:**
  - Prayer Circle is no longer "invitation-only": public circles exist, and joining one needs leader approval;
  - the languages answer must state BM primary and English secondary per FEATURES §15;
  - the coverage count and countries must match FEATURES.
- List every changed answer in the build report.

### 4.8 Download close + footer
Reuse `Cta.tsx`: deep teal, `StoreBadges`, one line.

### 4.9 Removed from the homepage
`Assurances`, `Journey`, `HowItWorks`, `ForCommittees`, `CommitteeSnapshot`. Delete a component only if nothing else imports it once `/ajk` is done. `CommitteeSnapshot` and the `ForCommittees` content move, they are not deleted.

## 5. `/ajk` absorbs the committee content
- Keep everything on `/ajk` today: the form, its no-JS behaviour, `utm_source`, the head and title, and `lang="ms"`.
- Add the three `MODULES` from `ForCommittees.tsx` and the `CommitteeSnapshot` section **below** the form, under a heading such as "Apa yang kami bina bersama AJK". The form stays first on the page.
- Keep the snapshot data constant and its source comment unchanged (`src/lib/putrajaya-snapshot.ts`).
- The existing AJK tests must still pass.

## 6. Collaboration page (`/kolaborasi`, `/en/collaboration`)
- Uses `PageLayout` or the same header and footer.
- Content: a short intro and who we work with, as four short cards:
  - masjid and surau committees (link to `/ajk`);
  - Islamic organisations and NGOs (community challenges, events);
  - brands and sponsors (Home "Featured" sponsored slots, prizes for challenges);
  - media and researchers.
- Contact: `mailto:${SITE.email}` with a prefilled subject, for example "Kolaborasi Jejak Masjid". **No new form, endpoint or backend.**
- Copy is modest: "we're open to discussing", never promised deliverables, prices or audience numbers.
- `seo()` gets its own title and description, plus alternates.

## 7. Gates and acceptance

Run from the worktree and compare with a `main` baseline run (report the same failures versus new ones):
- `pnpm test`. New tests:
  - dictionary key parity;
  - the `seo()` alternates and `hreflang` output;
  - `PRODUCTS` destinations and status lines (no "beli sekarang", "order now" or "sell now" strings);
  - `social-proof.ts` provenance: every review and media item has a source URL, a date and a store or publisher, and every rating has `fetchedAt`.
- `pnpm build`.
- `pnpm exec tsc --noEmit` (one known pre-existing error in `download.tsx`).
- Raw SSR HTML of `/` and `/en`, with `curl` against `pnpm build` and then `npx wrangler dev -c dist/server/wrangler.json --local`, must contain:
  - the H1;
  - one canonical link;
  - reciprocal hreflang;
  - the correct `<html lang>`;
  - the FAQ JSON-LD in the right language;
  - real content with JS off.
- Browser check at 360, 390, 768 and 1440 px for `/`, `/en`, `/kolaborasi` and `/ajk`. Confirm:
  - no horizontal overflow;
  - the Products menu and the mobile menu work by keyboard and Escape;
  - the language switch round-trips;
  - the hero crop on mobile shows the mosque;
  - reduced motion renders everything static.

  Save screenshots to `../.hermes/reviews/website-revamp/screens/`.
- Regression:
  - `/download` redirect;
  - the `/ajk` form submit (local D1);
  - the invite page stays noindex/no-store;
  - the `.well-known` routes are untouched;
  - masjid pages render with the new header.

**Owner gate before deploy (not the implementer's job):** re-check both store ratings and the review quotes, update `social-proof.ts` `fetchedAt`, and approve the final screenshots. Deploy and Search Console sitemap resubmission are owner and operator steps.

## 8. Rules for the implementer
- Work only in the worktree on `feat/website-revamp`. **No deploy, push or merge, no remote D1, no wrangler var changes.**
- Read `CLAUDE.md` (the design system, motion, layout rhythm, logo rules, light-only) and `BRAND.md` first. Use `../DESIGN_LANGUAGE.md` for reference only: the Arcade style applies to the mobile app, **not** this site. The site keeps its light, calm brand-kit system.
- Allowed colours: ivory, mist, deep teal, white cards, gold accents. Gold and `#00A9A5` are never text on light. No italics. The only gradient is the hero overlay in §4.1. Motion only through `Reveal` and the `data-motion` gate.
- Update `CLAUDE.md` (structure, i18n pattern, routes) at the end.
- Report to `../.hermes/reviews/website-revamp/BUILD.md` with:
  - files changed;
  - gate results against the baseline;
  - the FAQ changes;
  - the screenshot inventory used per bento tile;
  - deviations and open questions.

## 8. Owner amendments (2026-10-26): no AJK, collaboration highlight, public numbers

### 8.1 Remove AJK from the website
Jejak Masjid is discussing with the qiyam.com.my team about them running the AJK dashboard, so the website no longer offers one. This supersedes D3 and every AJK item in §3–§6.
- **Delete `/ajk`; it returns 404.** Remove the route, `AjkInterestForm`, the AJK interest server function and its endpoint, `ForCommittees`, `CommitteeSnapshot`, `putrajaya-snapshot.ts` and their tests.
- Remove AJK from `PRODUCTS`, the header Products menu, the "More than an app" section, the footer, the collaboration cards, the dictionaries and `public/sitemap-pages.xml`.
- Rename `COMMITTEE_WHATSAPP_URL` to a neutral `WHATSAPP_URL` (same value; the owner will confirm the link, §8.2).
- **Infrastructure retirement (owner amendment 2026-10-27):** remove the former form's D1 and unused outbound email bindings, migration files and migration scripts from the website. Leave secrets untouched; the planner deletes the database after this change ships. This supersedes the earlier instruction to preserve that infrastructure.
- **Do not touch:**
  - the masjid-page AJK code behind `MASJID_AJK_ENABLED="false"`;
  - the privacy policy. If it describes the AJK form, list that in the report: previously collected leads remain covered by it, and the owner decides.
- No search box or link that leads nowhere (§1 still applies).

### 8.2 Collaboration is the highlight
- **Homepage band "Kolaborasi" / "Collaborate with us"** (deep teal `#003130` band, after Reviews/Media and before the "More than an app" section), with three cards:
  - Islamic organisations and NGOs (community challenges, events);
  - brands and sponsors (Home "Featured" sponsored slots, challenge prizes);
  - media and researchers (stories, data, research).

  Copy stays modest, as in §6: "we're open to discussing", with no promised audience numbers or prices.
- **Contact block**, on the band and at the top of `/kolaborasi` and `/en/collaboration`:
  - the email `SITE.email` shown as selectable text, with a copy button (clipboard with a select-text fallback) and a `mailto:` link prefilled with the subject "Kolaborasi Jejak Masjid" / "Jejak Masjid collaboration";
  - a WhatsApp button to `WHATSAPP_URL`, labelled "WhatsApp kami" / "WhatsApp us". **Owner to confirm** this is the right WhatsApp Business link and that its preset message is not committee-specific; until then keep it behind a single constant.
- **Header:** "Kolaborasi" / "Collaborate" becomes a top-level nav link (desktop and mobile menu). It also stays in the Products menu.
- The "More than an app" section keeps Shop, Merchant and Collaboration.

### 8.3 "Jejak Masjid dalam angka" / "Jejak Masjid in numbers"
Live aggregates from the backend endpoint `GET https://apiv2.jejakmasjid.my/api/public/stats` (backend spec `project-masjid-backend-cf/SPEC_public-stats.md`; payload in its §4, `payloadVersion: 1`).
- **Placement:** directly after the trust strip, before the feature bento.
- **Data path:**
  - fetch server-side with the existing `jm-api` pattern (base from `JM_API_BASE`) during SSR;
  - cache with the same mechanism the masjid pages use (about 1 h), validate the payload strictly, and never render partial or invalid data;
  - **any non-200, timeout (≤ 1.5 s) or invalid payload hides the whole section**, with no empty shell or error text. The backend ships behind a flag, so until it is live the homepage simply has no stats section.
- **Content:**
  - **Headline tiles:**
    - masjids and surau (total);
    - countries (known country codes with ≥ 1 masjid);
    - completed visits in the last 30 days;
    - different masjids visited in the last 30 days;
    - active visitors in the last 30 days.
  - **By country:** a horizontal bar list of masjid counts, with each country's 30-day completed visits beside it. Country names come from a local code → BM/EN map. `null` becomes "Lain-lain / tidak diketahui" / "Other or unknown".
  - **Malaysia by state:** a semantic `<table>` with state name (BM/EN), masjids and 30-day visits, sorted by masjids. Suppressed values show "< 10".
  - **"Dikemas kini {date}" / "Updated {date}"** in MYT from `computedAt`, and one short definitions line: a visit counts when someone checks in, stays at least 10 minutes and completes it nearby; small numbers are hidden for privacy.
- **Formatting:**
  - numbers use `Intl.NumberFormat('ms-MY')` / `('en-MY')`;
  - bars use brand teal `#00A9A5` as a graphic only, never as text;
  - text stays deep teal or ink on light;
  - tabular numerals;
  - no animation that hides numbers at rest.
- **Tests:** a component test with a fixture (rendering, suppression "< 10", unknown country, hiding on invalid or 404), and payload validation tests.
- **Host check:** add `/home/loqman/Documents/project-masjid/.hermes/reviews/website-revamp/mock-stats.mjs`, a tiny local HTTP server that serves a fixture at `/api/public/stats` and proxies nothing else. The planner then runs `wrangler dev … --var JM_API_BASE:http://127.0.0.1:<port>` (a CLI flag; no `wrangler.jsonc` edit). Extend `check-hero.mjs` with a `stats` group (section present with the mock, absent with the real base or a 404), covering layout at 360, 768 and 1440 with no overflow.
