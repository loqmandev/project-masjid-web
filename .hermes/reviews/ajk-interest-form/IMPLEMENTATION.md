# AJK interest form — implementation and local verification

## Status

PASS: feature implemented, unit/component tests, production build, built Worker + local D1, and real Chromium JS/no-JS flows.
BLOCK: the required CLAUDE.md deployment-note edit was rejected by the environment's protected-agent-instruction-file approval rule. No bypass was attempted. The operator note is recorded below instead. This remains an explicit unmet spec item; the work is not claimed to match the specification without deviations.

No push, merge, deployment, remote D1/resource creation, secret setting, or remote Wrangler command was performed. Local Worker processes were stopped after verification. Local D1 remains available with synthetic evidence records.

## Branch and commits

- Branch: `feat/ajk-interest-form`, created directly from local `main`.
- Base/main: `283ddb242712fd818f7100ddf52e8331c6896579`.
- Implementation: `44d1d8a4ddb9007b9ec63d79637b3cb68c53e175` — `feat: add local-ready AJK dashboard interest form`.
- This report and its evidence are committed separately as `docs: record AJK interest form local verification` (the report's containing commit).
- Pre-existing untracked `SPEC_ajk-dashboard.md` and `SPEC_ajk-interest-form.md` were left untouched and uncommitted.

## Delivered

- Malay `/ajk`, specified title/description/canonical, indexable SEO, sitemap entry, shared Header/Footer and brand-token styling.
- Specified benefits and pilot disclosure; primary homepage committees CTA, secondary WhatsApp option, e-mail link.
- Full accessible form, inline Malay errors, preserved inputs, pending-submit guard, 44px form targets, progressive fetch enhancement and native URL-encoded POST.
- POST-only `/api/ajk-interest`; explicit 405 for GET/HEAD/PUT/PATCH/DELETE/OPTIONS.
- Pure normalization/validation; JSON and URL-encoded requests bounded to 8192 actual bytes; origin restrictions; honeypot success with no storage.
- D1 lead schema, indexes, atomic 24-hour duplicate suppression, atomic rolling five-attempt/hour rate limit. Separate attempts and random daily-salt tables prevent duplicate/invalid attempts bypassing the limit. The previous day's hash is included across UTC midnight. Old attempts/salts are pruned locally by the handler.
- Optional fail-closed Turnstile only when both keys exist; only the public site key reaches the page.
- Best-effort plain-text Email Routing `send_email` notification, skipped without recipient config; no submitted PII logging.
- Bilingual privacy disclosure and regional pilot retention policy.
- Placeholder D1 ID and local migration command; no remote provisioning.

## Gates and evidence

### Unit/component and build

- `pnpm test`: 109 tests passed across 7 files. Raw output: `tests.txt`.
- `pnpm build`: PASS. Raw output: `build.txt`.
- `git diff --check`: PASS before commit.
- `pnpm exec tsc --noEmit`: existing failure only at `src/routes/download.tsx:8`, where `request` is absent from ServerFnCtx. No new type errors. Raw output: `typecheck.txt`.
- New checks cover phone formats/bounds, all required fields/enums, optional field limits, honeypot, duplicate cutoff bindings, origins, request body/encoding boundaries, conditional Turnstile including outage/mismatched hostname, notification skip/failure and MIME encoding, rendered value/error restoration, enhanced retry and double-submit guard.

### Actual built Worker and local D1

Migration command exercised: `pnpm db:migrate:local` — `0001_ajk_interest.sql` applied successfully.

The build copies an existing ignored `.dev.vars` file. To keep runtime QA credential-free, the complete built `dist` was copied to `/home/loqman/.hermes/cache/scratch/ajk-interest-worker`, excluding `.dev.vars*` and `.env*`. No credentials were inspected or committed. All 68 copied build files were byte-compared to the final build; see `artifact-verification.json`.

Actual runtime command:

```sh
pnpm exec wrangler dev \
  -c /home/loqman/.hermes/cache/scratch/ajk-interest-worker/server/wrangler.json \
  --local --local-upstream 127.0.0.1:8787 --upstream-protocol http \
  --ip 127.0.0.1 --port 8787 \
  --persist-to /home/loqman/Documents/project-masjid/project-masjid-web/.wrangler/state
```

This uses the generated built Worker config, unchanged placeholder D1 binding and the same local persistence as the migration. It does not use the Vite dev server or a simulated handler. Local upstream settings avoid the production custom-domain forwarding behavior of Wrangler. Localhost origin checks permit the same local hostname/protocol without comparing ports because Wrangler rewrites the Origin port; production only accepts the two specified HTTPS origins.

`python3 scripts/ajk-local-proof.py`: PASS, 24 proof cases and 12 stored synthetic rows:

- Valid JSON: 200; normalized phone stored; consent timestamp and default status `new` present.
- Same normalized phone + masjid within 24h: 200; original name/notes unchanged, no extra row.
- Invalid fields: 422; no lead stored.
- Filled honeypot: 200 even with otherwise invalid fields; no lead stored.
- Six submissions from one synthetic IP: 200, 200, 200, 200, 200, 429; five rows.
- Six concurrent requests from another synthetic IP: exactly five 200s and one 429.
- Native URL-encoded errors preserve own form inputs; native success contains only name, not phone/e-mail.
- Untrusted/missing origin: 403; oversized request: 413; unsupported type: 415; malformed JSON: 400.
- GET/HEAD/PUT/PATCH/DELETE/OPTIONS: 405.

`worker-proof.json` contains actual response statuses and the local D1 readback from:

```sh
pnpm exec wrangler d1 execute jm-web-db --local --json --command \
  'SELECT id,created_at,name,role,masjid_name,venue_type,area,state,phone,email,needs,congregation_size,notes,notes IS NULL AS notes_is_null,consent_at,ip_hash,user_agent,source,status FROM ajk_interest ORDER BY created_at'
```

Wrangler 4.59.2 renders SQL NULL as string `"null"` in execute output; `notes_is_null = 1` verifies the stored SQL value without relying on that display conversion.

`runtime.txt` records the final command results. `final-local-rows.json` is a subsequent independent D1 readback: 14 synthetic leads after the two browser success flows. All records are explicit local fixtures, not real leads. Tests reset only these newly created local form tables between runs; no other tables were changed.

### Real Chromium and screenshots

`node scripts/ajk-browser-proof.mjs <absolute-path-to-@playwright/test>`: PASS using a temporary pnpm-dlx Playwright installation, with no repository dependency/lockfile changes.

- `/ajk` at 390px and 1280px: HTTP 200, exact title/canonical, Malay content language, UTM source preserved, no horizontal overflow, no form controls/choice labels/buttons shorter than 44px.
- Real enhanced fetch: invalid phone produces inline error and keeps values; corrected submission succeeds without navigation.
- Real browser with JavaScript disabled: native POST produces inline error, keeps values, then corrected native POST succeeds.
- No browser page errors. Details: `browser-proof.json`.

Screenshots (actual local Worker, not mockups):

- `ajk-390.png`
- `ajk-1280.png`
- `committees-390.png`
- `committees-1280.png`
- `native-error-390.png`
- `success-enhanced-390.png`
- `success-native-390.png`

Phone form/CTA crops and desktop page were visually inspected: readable labels, no clipped fields or CTA text, primary/secondary hierarchy preserved. Native success was visually inspected and exposes only the name. Screenshot checksums are in `artifact-verification.json`. `native-error.html` is an additional synthetic native-response artifact.

## Review and resolved findings

An independent read-only review inspected the spec, implementation, migrations and proof. It found a long-subject MIME issue: one RFC 2047 encoded-word could exceed 75 characters. Fixed by UTF-8-code-point-safe folding; regression tests cover long ASCII and multibyte subjects, <=75-character encoded-words, <=78-character header lines and lossless decode. Notification rejection is tested to remain non-fatal.

Browser QA found and fixed a native-retry issue: `Referrer-Policy: no-referrer` made the next POST's Origin null. API HTML now uses `same-origin`, preserving CSRF origin validation while withholding referrers from external sites. The final real JS-disabled retry passed.

Early local debugging also exposed Wrangler's origin-port rewriting and hot-reload interruptions while copying builds over an active Worker. Final verification used a clean, credential-free built copy, a fresh Worker process and a single uninterrupted run. No debug logging remains in the source or tested build.

## Deviations and limitations

1. **CLAUDE.md note blocked:** the protected-file tool rejected the edit because no interactive approval channel was available. CLAUDE.md is unchanged. The required operator warning follows below; an authorized human still needs to add it to CLAUDE.md.
2. **Phone wording:** interpreted “10–12 digits after 60” as 10–12 digits **total including 60**, beginning `601`. Literal 10–12 digits after the country code conflicts with the Malaysian mobile examples. This interpretation was stated before implementation and is tested, but was not explicitly confirmed by the owner.
3. **Turnstile vs no-JS:** native no-JS works when optional Turnstile is off (the tested/default configuration). Turnstile itself requires JavaScript; when both keys are set, no-JS cannot bypass it and the page offers WhatsApp. Enabled challenge validation is unit-tested with mocked provider results, not claimed as live Cloudflare verification.
4. **PII response wording:** success/JSON responses never echo phone/e-mail; private, no-store native error HTML preserves the submitting user's own phone/e-mail input values to satisfy the separate keep-values-on-error requirement. No values are placed in URLs or application logs.
5. **Shop email API changed:** inspected `../project-masjid-sales-page/server/utils/email.ts`; it now uses Cloudflare Email Sending's structured object API. This form preserves the binding-only, best-effort pattern but uses `EmailMessage` + RFC-compliant MIME for the specifically required `send_email` (Email Routing) binding, with the exact requested sender. No real email was sent, recipient configured, or provider delivery claimed.
6. Added auxiliary D1 salt/attempt tables and a duplicate lookup index to implement the rate limit safely. Lead table/status schema is unchanged from the spec.
7. The retention disclosure is implemented; deletion 12 months after each area's pilot opening remains operational until a pilot-opening date source/job exists. No dates were invented.
8. Existing download-route typecheck failure remains outside this scope.

## Operator warning (required CLAUDE.md text could not be written)

**Deployment is blocked.** `WEB_DB` has placeholder ID `00000000-0000-0000-0000-000000000000`. Before go-live, the operator must create `jm-web-db`, replace the ID and apply the migration; then configure a verified Email Routing destination in `AJK_INTEREST_NOTIFY_TO`, optionally configure both Turnstile keys, and verify sender/recipient routing and challenge hostname. Notification settings/keys are intentionally not committed. The operator, not Hermes, owns merge and deployment. Until then use `pnpm db:migrate:local` and local Wrangler only.

The sender must be `noreply@jejakmasjid.my`; the shop's newer sending-subdomain API is not substituted. Regional pilot opening dates, retention deletion and support deletion requests require operator handling. Review the phone interpretation and Turnstile/no-JS limitation before publication.
