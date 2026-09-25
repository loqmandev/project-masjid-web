# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Jejak Masjid (jejakmasjid.my) is the marketing site for the Jejak Masjid mobile app — a masjid
finder and visit journal for Muslims in Malaysia. Built with TanStack Start (SSR React) and
deployed to Cloudflare Workers.

**Brand voice is normative.** Read `BRAND.md` before writing or editing any copy: calm,
bersahaja, gentle motivation, never competitive. The site is written in English with Malay
anchor words (`singgah`, `jejak`, `langkah`, `ikhlas`, `hadir`). Never use urgency or
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
    index.tsx         # Homepage + FAQPage JSON-LD
    privacy.tsx | tos.tsx | support.tsx   # Long-form pages via PageLayout
    download.tsx      # UA-sniffing redirect to the right store
    beta-ios.tsx | beta-android.tsx | google-groups.tsx  # Redirects. Kept even
                      # though nothing links /google-groups now; it was printed in
                      # onboarding emails already sent.
    prayer-circles.invite.$code.tsx   # Prayer Circle invite landing (see below)
    [.]well-known.apple-app-site-association.ts   # iOS Universal Links (fail-closed)
    [.]well-known.assetlinks[.]json.ts            # Android App Links (fail-closed)
  components/
    Header · Hero · Assurances · Journey · Features · HowItWorks · Faq · Cta · Footer
    PageLayout.tsx    # Header + title band + .prose-jm article + Footer
    PrivacyPolicy · TermsOfService · Support   # Body copy only; no page chrome
    ui/               # Logo, StoreBadges, PhoneFrame, Section, Reveal
  lib/
    site.ts           # Site constants, store URLs, nav sections
    seo.ts            # seo() head builder + structuredData() + faqStructuredData()
    faq.ts            # Homepage FAQ — feeds both the accordion and FAQPage JSON-LD
    app.ts            # Mobile app bundle ID + custom scheme (public identifiers)
    invite.ts         # Invite code normaliser + app/intent URL builders
    app-association.ts # AASA + assetlinks builders, var parsing, 404 response
    worker-env.ts     # Reads Worker vars via a dynamic `cloudflare:workers` import
  styles.css          # Light-only design tokens, .eyebrow / .path-rule / .prose-jm
public/
  screens/*.webp      # App screenshots, optimised from ../store-assets-v2/public/screenshots/source
  logo.png · og-image.png · icon-*.png · apple-touch-icon.png · favicon.ico
                      # all derived from project-masjid-mobile/assets/images/icon.png
  sitemap.xml · robots.txt · manifest.json · _headers
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
no more than 2 consecutive image-and-text split rows. Features deliberately runs three
different layout families for this reason.

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
The logo is the shipped app icon, mirrored from
`../project-masjid-mobile/assets/images/icon.png` into `public/logo.png` and the icon set.
It is a complete lockup (dome + crescent + "Jejak Masjid"). Never redraw or substitute it —
regenerate from the mobile asset if it changes.

### Design System
Light-only "journal" surface: warm paper `#fbfaf6`, teal `#00807d`, gold `#b98900` used sparingly.
Newsreader (serif) for headings, Inter for body, both from Google Fonts. `.path-rule` is the
recurring dotted-footpath motif. Prefer lines and whitespace over filled shapes and gradients.

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
`pnpm build && npx wrangler dev -c dist/server/wrangler.json --var APPLE_TEAM_ID:ABCDE12345`.

The old waitlist (Google Sheets + Resend) was removed in full, along with
`SHEET_ID`, `GOOGLE_SERVICE_ACCOUNT_JSON`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL` and
`APP_DOMAIN`. Any of those still set as Worker secrets can be deleted.

### Known Follow-ups
- App Store badge is the Malay (`_MY`) artwork while the Play badge is English. Swap one for
  consistency using Apple/Google marketing resources — badges must not be redrawn by hand.
- The header pairs the app icon with a text wordmark; the icon's own baked-in "Jejak Masjid"
  text is illegible at 36px. A symbol-only (dome) variant from the design source would read
  better, but must come from the brand owner rather than be cropped here.
- `pnpm test` runs from `vitest.config.ts`, which deliberately omits the Cloudflare/Start
  plugins (under `vite.config.ts` the workerd runner fails to load CJS deps). Component tests
  would need `environment: 'jsdom'` added there.
- `npx tsc --noEmit` reports one pre-existing error in `src/routes/download.tsx`
  (`request` is not on the server-fn context type); the build is unaffected.
