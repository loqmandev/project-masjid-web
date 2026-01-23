import { createServerFn, useServerFn } from '@tanstack/react-start';
import { useState } from 'react';

const SHEET_TAB = 'Waitlist';
const SHEET_RANGE = `${SHEET_TAB}!A:C`;

const submitWaitlist = createServerFn({ method: 'POST' })
  .inputValidator((formData: FormData) => formData)
  .handler(async ({ data }) => {
    const email = String(data.get('email') || '').trim();
    const platform = String(data.get('platform') || '').trim();

    if (!email || !platform) {
      throw new Error('Missing required fields.');
    }

    if (platform !== 'ios' && platform !== 'android') {
      throw new Error('Invalid platform.');
    }

    const sheetId = process.env.SHEET_ID;

    if (!sheetId) {
      throw new Error('Missing SHEET_ID.');
    }

    const accessToken = await getGoogleAccessToken({
      envVarName: 'GOOGLE_SERVICE_ACCOUNT_JSON',
      scope: 'https://www.googleapis.com/auth/spreadsheets',
    });
    const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(
      SHEET_RANGE,
    )}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

    const response = await fetch(appendUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [[new Date().toISOString(), email, platform]],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to save waitlist entry: ${errorText}`);
    }

    return { ok: true };
  });

async function getGoogleAccessToken({
  envVarName,
  scope,
}: {
  envVarName: string;
  scope: string;
}) {
  const serviceAccountRaw = process.env[envVarName];

  if (!serviceAccountRaw) {
    throw new Error(`Missing ${envVarName}.`);
  }

  const serviceAccount = JSON.parse(serviceAccountRaw) as {
    client_email?: string;
    private_key?: string;
  };

  if (!serviceAccount.client_email || !serviceAccount.private_key) {
    throw new Error('Invalid service account credentials.');
  }

  const jwt = await createSignedJwt(
    serviceAccount.client_email,
    serviceAccount.private_key,
    scope,
  );

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    throw new Error(`Failed to fetch access token: ${errorText}`);
  }

  const tokenData = (await tokenResponse.json()) as { access_token?: string };

  if (!tokenData.access_token) {
    throw new Error('Access token missing in response.');
  }

  return tokenData.access_token;
}

async function createSignedJwt(
  clientEmail: string,
  privateKey: string,
  scope: string,
) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: clientEmail,
    scope,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 60 * 60,
  };

  const header = { alg: 'RS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const key = await importPrivateKey(privateKey);
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(signingInput),
  );

  return `${signingInput}.${base64UrlEncode(signature)}`;
}

function base64UrlEncode(input: string | ArrayBuffer) {
  const buffer = typeof input === 'string' ? new TextEncoder().encode(input) : new Uint8Array(input);
  let binary = '';
  buffer.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function importPrivateKey(pem: string) {
  const pemContents = pem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s+/g, '');
  const binary = atob(pemContents);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return crypto.subtle.importKey(
    'pkcs8',
    bytes.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
}


const Waitlist = () => {
  const [email, setEmail] = useState('');
  const [platform, setPlatform] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const submitWaitlistFn = useServerFn(submitWaitlist);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await submitWaitlistFn({ data: new FormData(e.currentTarget) });
      setSubmitted(true);
      setEmail('');
      setPlatform('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="waitlist" className="bg-[linear-gradient(180deg,_rgba(255,204,0,0.12)_0%,_var(--color-background)_50%,_rgba(0,169,165,0.12)_100%)] py-16">
      <div className="mx-auto max-w-240 px-4">
        <div className="mx-auto max-w-137.5 rounded-2xl border border-border bg-card/80 p-10 text-center shadow-[0_14px_32px_rgba(0,79,77,0.08)]">
          <h2 className="mb-12 text-[2.5rem] font-bold text-foreground">Join the Journey</h2>
          <p className="mb-8 text-[1.1rem] text-muted-foreground">
            Be among the first to experience Jejak Masjid. Sign up now to become a beta tester.
          </p>

          {submitted ? (
            <div>
              <h3 className="mb-2 text-[1.8rem] text-secondary-foreground">Thank You!</h3>
              <p className="text-[1.1rem] text-muted-foreground">We will contact you soon. Make sure to check your spam/junk folder if you can't find our email.</p>
            </div>
          ) : (
            <form className="flex flex-col items-center gap-4" onSubmit={handleSubmit}>
              <input
                type="email"
                name="email"
                autoComplete="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-card px-4 py-[0.8rem] text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
              <select
                name="platform"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-card px-4 py-[0.8rem] text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="" disabled>
                  Select your platform
                </option>
                <option value="ios">iOS</option>
                <option value="android">Android</option>
              </select>
              {error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : null}
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-block rounded-lg bg-primary px-6 py-[0.8rem] font-medium text-primary-foreground shadow-[0_12px_24px_rgba(0,169,165,0.2)] transition-all duration-300 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

export default Waitlist;
