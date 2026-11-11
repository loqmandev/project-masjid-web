# SPEC: Privacy notice line for app-usage counting

Status: copy **pending owner approval** (2026-11-11). Do not merge or deploy until the owner approves the wording below.
Branch: `feat/privacy-app-usage` from the web repo's integration branch (`main`, per the `jm-status` skill), merged after owner approval and Opus review. No deploy by the implementer.
Related: backend `project-masjid-backend-cf/SPEC_app-usage-analytics.md` (records which days a signed-in user opens the app, with platform and app version, in a separate analytics database keyed by a coded ID).

## Change

In `src/components/PrivacyPolicy.tsx`, add this paragraph in the section that describes information collected automatically (next to the location paragraph that says the app has no third-party tracking or analytics SDKs, which stays true). Update the policy's "last updated" date if the page has one.

> **App usage.** When you are signed in, we record the days you open the app, together with your device type (iOS or Android) and app version. We use this only to understand how many people use Jejak Masjid and which features they use. It is kept on our own servers under a coded ID instead of your name or email, and it never includes your location. We do not share it or use it for advertising. We delete it within 7 days after you delete your account.

Keep the existing sentence "The app contains no third-party tracking or analytics SDKs."

## Report back

Branch, commit, a screenshot of the rendered section from a local dev server.
