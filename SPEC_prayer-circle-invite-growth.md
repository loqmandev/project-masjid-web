# SPEC — Prayer Circle invite landing page + app-link association (web)

Status: planned 2026-09-25. Companion specs:
`project-masjid-backend-cf/SPEC_prayer-circle-invite-growth.md`,
`project-masjid-mobile/SPEC_prayer-circle-invite-growth.md`.

## Why

Circle owners now share one standing link:
`https://jejakmasjid.my/prayer-circles/invite/<CODE>` (CODE = 10 chars from
`ABCDEFGHJKMNPQRSTVWXYZ0123456789`, case-insensitive). Today that URL **404s** and the
site serves no `/.well-known/apple-app-site-association` or `/.well-known/assetlinks.json`,
so iOS Universal Links / Android App Links can't open the app. The shipped app already
declares `applinks:jejakmasjid.my` (iOS) and an autoVerify intent filter for
`https://jejakmasjid.my/prayer-circles/invite/*` (Android), so hosting the files is all
that's missing on the link side.

Read `BRAND.md` and `CLAUDE.md` in this repo first. English copy, calm tone.

## 1. Route `/prayer-circles/invite/$code`

TanStack Start file route, e.g. `src/routes/prayer-circles.invite.$code.tsx` (follow
the repo's route file convention; regenerate `routeTree.gen.ts` via the normal build).

- Validate `code`: trim, strip spaces/dashes, uppercase; valid if it matches
  `/^[ABCDEFGHJKMNPQRSTVWXYZ0-9]{10}$/`. Also tolerate legacy base64url tokens
  `/^[A-Za-z0-9_-]{20,64}$/` (pass through unchanged, don't display as a "code").
  Invalid → friendly "This invite link looks incomplete" page (HTTP 404) with a
  Download app button.
- **No backend call** — don't show circle name or members (the page is public and
  indexable-by-accident; keep it capability-neutral). Don't log the code.
- `<meta name="robots" content="noindex, nofollow">`, `Referrer-Policy: no-referrer`,
  `Cache-Control: private, no-store`. OG tags: title "Join my prayer circle on Jejak
  Masjid", generic description, existing `og-image.png` (WhatsApp shows this preview).
- Content:
  - Heading: "You're invited to a prayer circle"
  - One line: "Pray together with family and friends on Jejak Masjid."
  - Primary button **Open in Jejak Masjid** → `jejakmasjidmobile://prayer-circle/join?code=<CODE>`.
    On Android, prefer an `intent://prayer-circle/join?code=<CODE>#Intent;scheme=jejakmasjidmobile;package=my.lonasoft.jejakmasjidmobile;S.browser_fallback_url=<encoded Play URL>;end`
    URL so users without the app fall through to Play.
  - Code block showing the code (formatted `ABCDE 12345`) + **Copy code** button
    (small client-side clipboard handler).
  - "Don't have the app?" + existing App Store / Play badges (`public/app-store-badge.svg`,
    `public/play-store-badge.svg`; store URLs are in `src/routes/download.tsx` — reuse,
    don't duplicate constants: extract to a shared module).
  - Steps: "1. Install Jejak Masjid 2. Open Prayer Circle → Join 3. Enter the code above".
- Mobile-first, works at 360px, uses existing site styles/fonts. No auto-redirect loops.

## 2. App-association documents (fail-closed)

Server routes returning JSON with `Content-Type: application/json`, status 200, **no
redirects**, `Cache-Control: public, max-age=3600`:

- `/.well-known/apple-app-site-association`
  ```json
  { "applinks": { "details": [ {
      "appIDs": ["<APPLE_TEAM_ID>.my.lonasoft.jejakmasjidmobile"],
      "components": [ { "/": "/prayer-circles/invite/*" } ]
  } ] } }
  ```
- `/.well-known/assetlinks.json`
  ```json
  [ { "relation": ["delegate_permission/common.handle_all_urls"],
      "target": { "namespace": "android_app",
                  "package_name": "my.lonasoft.jejakmasjidmobile",
                  "sha256_cert_fingerprints": ["<FINGERPRINT>", "..."] } } ]
  ```

Values come from Worker vars: `APPLE_TEAM_ID` (10 uppercase alnum) and
`ANDROID_SHA256_CERT_FINGERPRINTS` (comma-separated `AA:BB:...` 32-byte hex pairs).
**Fail closed:** if a var is missing or malformed, that document returns 404 — never
publish placeholder IDs. Declare the vars (empty) in `wrangler.jsonc` `vars` only if
that's the repo's pattern; otherwise document them in README. Do not invent real
values. Check that static asset handling / `_headers` doesn't shadow or rewrite
`/.well-known/*`.

## 3. Tests + verification (local only)

- Unit test the code normalizer and the two document builders (valid, missing,
  malformed input → 404).
- `pnpm build` passes; run locally and curl both `.well-known` paths (with and
  without vars) and an invite URL.
- Update this repo's `CLAUDE.md` + `README.md` with the new route, the two env vars,
  and the operator steps below.

Operator steps (document, don't perform): set `APPLE_TEAM_ID` (Apple Developer →
Membership) and `ANDROID_SHA256_CERT_FINGERPRINTS` (Play Console → App integrity →
App signing key SHA-256, plus the upload key SHA-256), deploy, then verify with
Apple's AASA validator and `adb shell pm get-app-links my.lonasoft.jejakmasjidmobile`.

Do not deploy, do not set secrets, do not commit to a remote.
