# SPEC — jejakmasjid.my follows the JM brand guidelines

Status: planned (2026-10-10). Owner request: "Update jejakmasjid.my UI web to follow JM brand guidelines."

## 0. Source of truth

- Brand kit: `../Jejak-Masjid-complete-brand-kit/Jejak-Masjid-brand-kit/` — read `README.md` and
  `brand-guide/Jejak-Masjid-brand-guidelines.pdf` (6 pages). **Approved** = logo colourways and
  background pairings. Palette, type and composition are the working system; follow them.
- Voice stays `BRAND.md` (calm, bersahaja, no urgency). **This spec does not change copy**, except
  where noted in §5.
- Sister implementation to copy from: the shop's `/merch` page already applies this brand —
  `../project-masjid-sales-page/app/assets/css/main.css` (`.jm-brand` block, tokens near line 29)
  and `../project-masjid-sales-page/public/brand/jm-lockup-on-{dark,light}.svg`.

## 1. Git

- Repo `project-masjid-web/` has only `main` (no `develop`). Branch `feat/brand-guidelines` from `main`.
  Commit there. Do **not** merge, push or deploy.
- Leave the stale branches `redesign-seo-brand` and `fix/company-web` alone.

## 2. Palette (replace the token values in `src/styles.css` `:root`)

Brand palette: Deep teal `#003130` · Brand teal `#00A9A5` · Ivory `#F7F6F0` · Gold `#FFCC00` ·
Dark teal `#154C46` · Mist `#E6F7F7`.

Keep the existing token **names** (components use them) and change the values:

| Token | New value | Notes |
|---|---|---|
| `--background` | `#F7F6F0` | ivory page |
| `--surface`, `--card` | `#FFFFFF` | |
| `--surface-sunken` | `#E6F7F7` | mist (alt sections) |
| `--foreground`, `--card-foreground` | `#003130` | |
| `--muted-foreground` | `#3F5B58` (or nearest teal-grey with ≥ 4.5:1 on ivory and mist) | verify contrast |
| `--subtle-foreground` | teal-grey with ≥ 4.5:1 on ivory | it is used for small text |
| `--primary` | `#003130` | primary buttons on light = deep teal |
| `--primary-strong` | `#154C46` | hover |
| `--primary-foreground` | `#F7F6F0` | |
| `--primary-tint` | `#E6F7F7` | |
| `--accent` | `#FFCC00` | **never text on light surfaces** |
| `--accent-tint` | a pale gold, e.g. `#FFF6CC` | |
| `--accent-foreground` | `#003130` | text on gold |
| `--border` / `--border-strong` | cool teal-tinted lines, e.g. `#D5E6E4` / `#B4CFCC` | replace the warm beige |
| `--ring` | `#00A9A5` | |

Add new tokens + `@theme inline` mappings: `--brand-teal: #00A9A5`, `--deep: #003130`,
`--deep-foreground: #F7F6F0`, `--deep-muted: ` an ivory at ~75% opacity or equivalent solid that
passes 4.5:1 on `#003130`.

Rules (from the guide):
- Brand teal `#00A9A5` is for thin rules, focus rings, small accents and icons — **not body text
  on light** (fails contrast) and **never a background behind the logo**.
- Gold is a restrained accent: the primary CTA on deep-teal blocks, small markers, the top bar on
  the hero. Not text on ivory/white.
- Body text dark on light, ivory on deep teal.
- Grep every `text-primary` / `text-accent` use after the swap: anything that was teal text on
  light still works (primary is now deep teal); anything that relied on `--accent` as text on
  light must change to `text-foreground` or similar.
- Remove the radial "teal wash" gradients (`bg-[radial-gradient(...primary-tint...)]` in `Hero`,
  `PageLayout`, `Cta`, `Features`, `prayer-circles.invite.$code.tsx`) in favour of clean colour
  blocks (guide: "clean colour blocks", avoid aggressive gradients). Use a flat mist block where
  a soft background is still wanted.
- Update `theme-color` in `src/routes/__root.tsx` to `#003130`, and `theme_color` /
  `background_color` in `public/manifest.json` to `#003130` / `#F7F6F0`.

The site stays **light-only** (`color-scheme: light`, no `.dark`, no `dark:` utilities, OS scheme
ignored). Deep-teal sections are colour blocks, not a dark mode.

## 3. Typography

- Headlines and high-emphasis CTAs: **Nunito ExtraBold (800)**. Body/captions: **Plus Jakarta
  Sans 400/500**. Drop Newsreader and Inter entirely (files, `@font-face`, preloads).
- Self-host, latin subset, variable woff2, same pattern as today: put
  `public/fonts/nunito-latin.woff2` and `public/fonts/plus-jakarta-sans-latin.woff2`, sourced
  from `@fontsource-variable/nunito` and `@fontsource-variable/plus-jakarta-sans` (download the
  latin `wght-normal` woff2 from `https://cdn.jsdelivr.net/npm/@fontsource-variable/<name>@<pinned
  version>/files/...`; do not add them as runtime deps). Keep the existing `unicode-range`. Update
  the two `rel="preload"` links in `__root.tsx`. Record the source + version in a comment.
- Base styles: `h1, h2, h3, .font-display` → `font-family: var(--font-display); font-weight: 800;
  letter-spacing: -0.01em`. Remove `font-feature-settings: 'cv05', 'ss01'` (Inter-specific).
- **No italics.** Newsreader italic was the old voice for Malay lines (`font-display italic` in
  `Hero`, `Footer`, and others). Replace with Nunito 700/800, not italic, in `text-foreground` (on
  light) or `--deep-foreground`/gold on deep teal. A small gold bar (≈ 48×4 px) above the line is
  the brand's accent pattern (guide cover + "Small wins" card).
- `.eyebrow`: Plus Jakarta Sans 700, uppercase, keep tracking, colour `--primary` (deep teal) on
  light, gold on deep teal.
- Revisit sizes after the font swap: Nunito 800 is much heavier and wider than Newsreader 400, so
  hero `text-6xl` and section `text-4xl` will need stepping down (e.g. hero ~`sm:text-5xl`,
  `leading-[1.1]`). Nothing may overflow at 360 px width.
- `.prose-jm` headings inherit the new display font at 800; links in `--primary` underlined.

## 4. Logo (approved pairings — exact artwork, never redrawn, retyped, recoloured or cropped)

Copy into `public/brand/`:
- `../Jejak-Masjid-complete-brand-kit/Jejak-Masjid-brand-kit/approved-assets/marketing-lockups/JM-lockup-light-teal-gold-100mm.svg`
  → `public/brand/jm-lockup-on-light.svg` (dark-teal/gold, for ivory/white/mist).
- `../Jejak-Masjid-complete-brand-kit/Jejak-Masjid-brand-kit/approved-assets/merch-vendor/artwork/JM-compact-colour-100mm.svg`
  → `public/brand/jm-lockup-on-dark.svg` (ivory/gold, for `#003130` only).
- `.../marketing-lockups/JM-symbol-light-teal-gold-transparent-1024.png` → downscale to a 256 px
  PNG (or WebP) → `public/brand/jm-symbol-on-light.png` (compact placements on light).
- `.../merch-vendor/artwork/JM-symbol-colour-transparent-1024.png` → 256 px →
  `public/brand/jm-symbol-on-dark.png` (compact placements on deep teal; verify visually which of
  the two symbol files is ivory vs dark-teal before naming).

`src/components/ui/Logo.tsx`:
- `Wordmark` takes `tone: 'light' | 'dark'` (default `'light'`) and renders the matching lockup.
  Keep `alt="Jejak Masjid"`, set correct intrinsic `width`/`height` from each SVG's viewBox.
- Rendered width ≥ 180 px wherever the full lockup is used (guide minimum). Below that, use the
  symbol. The header currently renders `h-11` — check the computed width; raise height or switch
  the header to symbol + nothing else if it won't fit on mobile. Preferred: full lockup ≥ 180 px
  on `sm`+, and on < 640 px it may still fit (the header has room — verify at 360 px).
- Clear space ≥ ¼ of lockup height on every side (padding/margin around the `<img>`).
- `LogoMark` (currently `/logo.png`, the old app icon) → renders the symbol, with a `tone` prop.
- Delete `public/brand/jm-wordmark-ink.svg` and `jm-wordmark-colour.svg` once nothing references
  them (the one-ink art is for single-colour print, not preferred digital).
- **Out of scope:** favicon, `icon-*.png`, `apple-touch-icon.png`, `logo.png` (used by JSON-LD /
  manifest) and the OG images — these are the app icon and stay as-is. Do not delete `logo.png`.

## 5. Composition (guide p.4: "dark teal carries hero sections", rounded 16–20 px cards, gold as a small accent)

Homepage (`src/routes/index.tsx` order unchanged):
1. **Header** — ivory bar (lifted: `bg-background/90` + blur, border `--border`), on-light lockup.
   "Get the app" pill = deep teal bg, ivory text, Nunito 800.
2. **Hero** — full-width **deep teal `#003130`** block, ivory headline (Nunito 800), ivory-muted
   body, the Malay line in gold-free ivory 700 with a gold bar above it, store badges, phone
   screenshots. A short gold bar (≈ 64×5 px) at the top-left of the text column (guide cover
   pattern). Phones keep `PhoneFrame`; make sure the frame edge reads on deep teal. The
   `.path-rule` behind the phones uses a teal-on-deep colour (e.g. `#154C46` dots) on this block.
   Hero still has max 4 text elements. Because the header is transparent at the top and sticky,
   either make the header sit on ivory above the hero (simplest — hero starts below the header) or
   give the header a deep-teal state while over the hero with the on-dark lockup. **Choose the
   ivory header + hero-below option** unless it looks broken.
3. Middle sections (Assurances, Journey, Features, HowItWorks, ForCommittees, Faq) stay light:
   alternate ivory and mist backgrounds where they already alternate; cards white with a
   1 px `--border`, radius 16–20 px (`rounded-2xl` = 1.25 rem is fine; replace `rounded-3xl` with
   `rounded-[20px]`). Icons/small markers may use brand teal `#00A9A5`.
4. **Cta** — a deep-teal rounded-20 block: symbol on-dark, ivory heading "Singgah sebentar?",
   ivory-muted body, badges. (Store badges are official artwork; place them as-is.)
5. **Footer** — deep teal `#003130`, on-dark lockup, ivory/ivory-muted links, gold eyebrows,
   `.path-rule` in `#154C46`. Legal line unchanged.

Other pages:
- `PageLayout.tsx` (privacy/tos/support) — title band becomes a flat mist (`--surface-sunken`)
  or deep-teal band with a gold bar; pick deep teal with ivory title for consistency with the hero.
  Article body stays on ivory with `.prose-jm`.
- `prayer-circles.invite.$code.tsx` (both the valid and the "incomplete link" states) — use the
  new tokens, symbol instead of `/logo.png`, no radial gradient. **Do not change** its loader,
  headers, URLs, Android intent swap, noindex, or any behaviour. Behaviour tests must stay green.

Buttons (all sites of `bg-primary` pills): on light = deep teal bg / ivory text; on deep teal =
gold bg `#FFCC00` / deep-teal text. Nunito 800, min height 44 px, focus ring `#00A9A5`.

Motion: keep everything in `styles.css` Motion section as is (reveal, `jm-enter`, `jm-draw`,
lift, press). Only adjust colours.

## 6. Do not change

- Copy (except removing italics), SEO (`seo()`, JSON-LD, canonical), routes, redirects,
  `.well-known` routes, `lib/*`, `public/screens/*`, store badges, `_headers`, `sitemap.xml`.
- Light-only theme policy.

## 7. Verify (all must pass; report output)

1. `pnpm test` — green (no regressions vs `main`).
2. `pnpm build` — succeeds.
3. `npx tsc --noEmit` — only the one pre-existing `download.tsx` error.
4. `grep -rn "Newsreader\|Inter'\|inter-latin\|newsreader\|jm-wordmark\|radial-gradient\|italic" src public` → no hits
   (except intentional, explained).
5. Run `pnpm dev`, screenshot `/`, `/privacy`, `/prayer-circles/invite/ABCDEFGHJK` and
   `/prayer-circles/invite/x` at 1280 px and 360 px wide (Playwright/Chrome headless is fine);
   save under `../.hermes/reviews/web-brand-guidelines/screens/`. Check: no horizontal scroll at
   360 px, every lockup ≥ 180 px wide, the right lockup per background, no logo on `#00A9A5`.
6. Contrast table in the report for every text/background token pair used (≥ 4.5:1 body,
   ≥ 3:1 for ≥ 24 px headings).

## 8. Report

Write `../.hermes/reviews/web-brand-guidelines/IMPLEMENTATION.md`: branch + commits, files changed,
verification output, contrast table, screenshots list, and any deviation from this spec with a
reason.
