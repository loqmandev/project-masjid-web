export const onboardingIosSubject = 'Welcome to Jejak Masjid beta';

export function onboardingIosHtml(email: string) {
  return `
    <!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Jejak Masjid Beta (iOS) – Getting Started</title>
  </head>
  <body style="margin:0;padding:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#111827;">
    <div style="max-width:600px;margin:0 auto;padding:24px;">
      <p style="margin:0 0 16px 0;">Hi,</p>

      <p style="margin:0 0 16px 0;">
        Thanks for joining the <strong>Jejak Masjid iOS beta</strong>.
      </p>

      <h3 style="margin:20px 0 8px 0;font-size:16px;line-height:1.4;">
        What you can expect in this beta:
      </h3>
      <ul style="margin:0 0 16px 20px;padding:0;line-height:1.6;">
        <li>Find nearby masjids</li>
        <li>Detect when you are near a masjid</li>
        <li>Check in and check out</li>
        <li>Earn points and view a basic leaderboard</li>
      </ul>

      <h3 style="margin:20px 0 8px 0;font-size:16px;line-height:1.4;">
        Install the iOS beta:
      </h3>
      <ol style="margin:0 0 16px 20px;padding:0;line-height:1.6;">
        <li>Install <strong>TestFlight</strong> from the App Store</li>
        <li>
          Join the beta using this link:
          <br />
          <a href="https://testflight.apple.com/join/zrH5N8Tp" style="color:#2563eb;text-decoration:underline;">
            https://testflight.apple.com/join/zrH5N8Tp
          </a>
        </li>
        <li>Install Jejak Masjid from TestFlight</li>
      </ol>

      <h3 style="margin:20px 0 8px 0;font-size:16px;line-height:1.4;">
        What we’d like you to check:
      </h3>
      <ul style="margin:0 0 16px 20px;padding:0;line-height:1.6;">
        <li>Location accuracy near masjids</li>
        <li>Check-in / check-out experience</li>
        <li>Bugs, crashes, or unexpected behavior</li>
        <li>Any feedback or improvement ideas</li>
      </ul>

      <p style="margin:0 0 16px 0;">
        📩 <strong>Just reply to this email</strong> to send feedback directly.<br />
        No special format needed.
      </p>

      <p style="margin:0 0 24px 0;">Thanks for being a beta tester.</p>

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
