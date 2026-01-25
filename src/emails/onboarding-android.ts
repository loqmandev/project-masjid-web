export const onboardingAndroidSubject = 'Welcome to Jejak Masjid beta (Android)';

const DEFAULT_APP_DOMAIN = 'https://jejakmasjid.my';

function normalizeAppDomain(appDomain: string) {
  return appDomain.replace(/\/+$/, '');
}

export function onboardingAndroidHtml(
  email: string,
  appDomain: string = DEFAULT_APP_DOMAIN,
) {
  const baseUrl = normalizeAppDomain(appDomain);
  const groupUrl = `${baseUrl}/google-groups`;
  const betaUrl = `${baseUrl}/beta-android`;

  return `
    <!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Jejak Masjid Beta (Android) – Getting Started</title>
  </head>
  <body style="margin:0;padding:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#111827;">
    <div style="max-width:600px;margin:0 auto;padding:24px;">
      <p style="margin:0 0 16px 0;">Hi,</p>

      <p style="margin:0 0 16px 0;">
        Thanks for joining the <strong>Jejak Masjid Android beta</strong>.
      </p>

      <h3 style="margin:20px 0 8px 0;font-size:16px;line-height:1.4;">
        What you can expect in this beta:
      </h3>
      <ul style="margin:0 0 16px 20px;padding:0;line-height:1.6;">
        <li>Find nearby masjids</li>
        <li>Detect when you are near a masjid</li>
        <li>Check in and check out</li>
        <li>Earn points and see a basic leaderboard</li>
      </ul>

      <h3 style="margin:20px 0 8px 0;font-size:16px;line-height:1.4;">
        Install the Android beta (important – 2 steps)
      </h3>

      <p style="margin:0 0 8px 0;">
        <strong>Step 1: Join the Google Group (required)</strong><br />
        First, join our internal testing Google Group using the link below:
      </p>
      <p style="margin:0 0 12px 0;">
        <a href="${groupUrl}" style="color:#2563eb;text-decoration:underline;">
          ${groupUrl}
        </a>
      </p>
      <p style="margin:0 0 16px 0;">
        Make sure you join using the <strong>same Google account</strong> you used to sign up.
      </p>

      <p style="margin:0 0 8px 0;">
        <strong>Step 2: Install the beta app from Play Store</strong><br />
        After joining the group, install the app using this link:
      </p>
      <p style="margin:0 0 12px 0;">
        <a href="${betaUrl}" style="color:#2563eb;text-decoration:underline;">
          ${betaUrl}
        </a>
      </p>
      <p style="margin:0 0 16px 0;">
        If the link doesn’t work immediately, wait a few minutes and try again.
      </p>

      <h3 style="margin:20px 0 8px 0;font-size:16px;line-height:1.4;">
        What we’d like you to check:
      </h3>
      <ul style="margin:0 0 16px 20px;padding:0;line-height:1.6;">
        <li>Does location detection work correctly?</li>
        <li>Can you check in and check out smoothly?</li>
        <li>Any bugs, crashes, or confusing UI?</li>
        <li>Any ideas or suggestions are welcome</li>
      </ul>

      <p style="margin:0 0 16px 0;">
        📩 <strong>You can reply directly to this email</strong> with feedback, screenshots, or issues.<br />
        Short messages are totally fine.
      </p>

      <p style="margin:0 0 24px 0;">Thanks for helping test Jejak Masjid.</p>

      <p style="margin:0;">
        —<br />
        Admin<br />
        <a href="mailto:admin@jejakmasjid.my" style="color:#2563eb;text-decoration:underline;">admin@jejakmasjid.my</a>
      </p>
    </div>
  </body>
</html>

  `;
}
