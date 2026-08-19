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
pnpm test         # Vitest — currently no test files; the runner errors on startup (pre-existing)
pnpm run deploy   # Build and deploy to Cloudflare (`pnpm deploy` is a
                  # different, built-in pnpm command and will fail)
```

## Architecture

### Tech Stack
- **Framework**: TanStack Start (React SSR) with TanStack Router (file-based routing)
- **Styling**: Tailwind CSS v4, design tokens in `src/styles.css`
- **Deployment**: Cloudflare Workers via Wrangler (`jejakmasjid.my`, `www.jejakmasjid.my`)
- **Email**: Resend (waitlist onboarding — legacy, no longer linked from the homepage)
- **Data Storage**: Google Sheets API (waitlist — legacy)

### Project Structure
```
src/
  routes/
    __root.tsx        # HTML shell, default meta, icons, fonts, org/site/app JSON-LD,
                      # no-flash theme script. Devtools render in dev only.
    index.tsx         # Homepage + FAQPage JSON-LD
    privacy.tsx | tos.tsx | support.tsx   # Long-form pages via PageLayout
    download.tsx      # UA-sniffing redirect to the right store
    beta-ios.tsx | beta-android.tsx | google-groups.tsx  # Redirects
  components/
    Header · Hero · Assurances · Journey · Features · HowItWorks · Faq · Cta · Footer
    PageLayout.tsx    # Header + title band + .prose-jm article + Footer
    PrivacyPolicy · TermsOfService · Support   # Body copy only; no page chrome
    ui/               # Logo, StoreBadges, PhoneFrame, Section, Reveal
  lib/
    site.ts           # Site constants, store URLs, nav sections
    seo.ts            # seo() head builder + structuredData() + faqStructuredData()
    faq.ts            # Homepage FAQ — feeds both the accordion and FAQPage JSON-LD
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

### Environment Variables (Production)
- `SHEET_ID` — Google Sheets ID for the legacy waitlist
- `GOOGLE_SERVICE_ACCOUNT_JSON` — service account credentials (JSON string)
- `RESEND_API_KEY` / `RESEND_FROM_EMAIL` — onboarding email
- `APP_DOMAIN` — optional, defaults to https://jejakmasjid.my

### Known Follow-ups
- App Store badge is the Malay (`_MY`) artwork while the Play badge is English. Swap one for
  consistency using Apple/Google marketing resources — badges must not be redrawn by hand.
- `src/components/Waitlist.tsx` is unused (the homepage no longer has a waitlist).
- The header pairs the app icon with a text wordmark; the icon's own baked-in "Jejak Masjid"
  text is illegible at 36px. A symbol-only (dome) variant from the design source would read
  better, but must come from the brand owner rather than be cropped here.
- `pnpm test` fails at startup on a clean tree; there are no test files yet.
