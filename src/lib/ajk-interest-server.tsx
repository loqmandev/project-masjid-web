import { renderToStaticMarkup } from 'react-dom/server'
import AjkInterestForm from '@/components/AjkInterestForm'
import styles from '@/styles.css?url'
import {
  allowedOrigin,
  duplicateBindings,
  DUPLICATE_PREDICATE,
  isHoneypot,
  text,
  validateInterest,
} from './ajk-interest'
import type { Input, Interest } from './ajk-interest'
import type { AjkEnv } from './worker-env'
import { COMMITTEE_WHATSAPP_URL } from './site'

const HEADERS = {
  'Cache-Control': 'private, no-store',
  'Referrer-Policy': 'same-origin',
  'X-Robots-Tag': 'noindex, nofollow',
  'X-Content-Type-Options': 'nosniff',
}
type Result =
  { ok: true; name: string } | { ok: false; errors: Record<string, string> }
function reply(
  request: Request,
  result: Result,
  status: number,
  input: Input = {},
  siteKey?: string,
) {
  if (request.headers.get('Accept')?.includes('application/json'))
    return Response.json(result, { status, headers: HEADERS })
  const values: Record<string, string | string[]> = {}
  for (const [key, value] of Object.entries(input)) {
    if (
      typeof value === 'string' ||
      (Array.isArray(value) && value.every((v) => typeof v === 'string'))
    )
      values[key] = value
  }
  const body = renderToStaticMarkup(
    <html lang="ms">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex, nofollow" />
        <title>Daftar minat dashboard AJK · Jejak Masjid</title>
        <link rel="stylesheet" href={styles} />
      </head>
      <body>
        <header className="bg-surface px-6 py-5">
          <a href="/ajk">
            <img
              src="/brand/jm-lockup-on-light.svg"
              width="180"
              alt="Jejak Masjid"
            />
          </a>
        </header>
        <main className="mx-auto max-w-3xl px-5 py-12">
          {result.ok ? (
            <section role="status">
              <h1 className="text-3xl">Terima kasih, {result.name}.</h1>
              <p className="mt-4">Kami akan hubungi anda melalui WhatsApp.</p>
              <a
                href="/ajk"
                className="mt-6 inline-flex min-h-11 items-center underline"
              >
                Kembali ke dashboard AJK
              </a>
            </section>
          ) : (
            <AjkInterestForm
              native
              initialValues={values}
              initialErrors={result.errors}
              turnstileSiteKey={siteKey}
            />
          )}
          <a
            className="mt-8 inline-flex min-h-11 items-center underline"
            href={COMMITTEE_WHATSAPP_URL}
          >
            Bincang melalui WhatsApp
          </a>
        </main>
        {siteKey && !result.ok && (
          <script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js"
            async
            defer
          />
        )}
      </body>
    </html>,
  )
  return new Response(`<!doctype html>${body}`, {
    status,
    headers: { ...HEADERS, 'Content-Type': 'text/html; charset=utf-8' },
  })
}

export async function readInput(request: Request): Promise<Input> {
  const type = request.headers
    .get('Content-Type')
    ?.split(';')[0]
    .trim()
    .toLowerCase()
  const reader = request.body?.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  if (reader) {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > 8192) {
        await reader.cancel()
        throw new Error('413')
      }
      chunks.push(value)
    }
  }
  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.length
  }
  if (
    !['application/json', 'application/x-www-form-urlencoded'].includes(
      type || '',
    )
  )
    throw new Error('415')
  const body = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  if (type === 'application/json') {
    const input: unknown = JSON.parse(body)
    if (!input || typeof input !== 'object' || Array.isArray(input))
      throw new Error('400')
    return input as Input
  }
  const params = new URLSearchParams(body)
  const input: Input = Object.fromEntries(params)
  input.needs = params.getAll('needs')
  return input
}

export async function hashIp(ip: string, salt: string) {
  const hash = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(ip + salt),
  )
  return Array.from(new Uint8Array(hash), (b) =>
    b.toString(16).padStart(2, '0'),
  ).join('')
}

async function rateLimit(env: AjkEnv, ip: string, now: Date) {
  const db = env.WEB_DB!
  const today = now.toISOString().slice(0, 10)
  const yesterday = new Date(now.getTime() - 86400000)
    .toISOString()
    .slice(0, 10)
  await db.batch(
    [today, yesterday].map((day) =>
      db
        .prepare(
          'INSERT OR IGNORE INTO ajk_interest_salts(day,salt) VALUES (?,?)',
        )
        .bind(day, crypto.randomUUID()),
    ),
  )
  const salts = await Promise.all(
    [today, yesterday].map((day) =>
      db
        .prepare('SELECT salt FROM ajk_interest_salts WHERE day = ?')
        .bind(day)
        .first<{ salt: string }>(),
    ),
  )
  const hashes = await Promise.all(salts.map((row) => hashIp(ip, row!.salt)))
  const result = await db
    .prepare(
      `INSERT INTO ajk_interest_attempts(id,ip_hash,created_at)
    SELECT ?,?,? WHERE (SELECT COUNT(*) FROM ajk_interest_attempts WHERE ip_hash IN (?,?) AND created_at > ?) < 5`,
    )
    .bind(
      crypto.randomUUID(),
      hashes[0],
      now.toISOString(),
      ...hashes,
      new Date(now.getTime() - 3600000).toISOString(),
    )
    .run()
  // Keep only the two days needed for rolling windows across UTC midnight.
  await db.batch([
    db
      .prepare('DELETE FROM ajk_interest_attempts WHERE created_at < ?')
      .bind(new Date(now.getTime() - 172800000).toISOString()),
    db.prepare('DELETE FROM ajk_interest_salts WHERE day < ?').bind(yesterday),
  ])
  return { allowed: result.meta.changes > 0, ipHash: hashes[0] }
}

export async function verifyTurnstile(
  request: Request,
  input: Input,
  env: AjkEnv,
) {
  if (!env.TURNSTILE_SECRET_KEY || !env.TURNSTILE_SITE_KEY) return true
  const token = text(input['cf-turnstile-response'])
  if (!token || token.length > 2048) return false
  try {
    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        body: new URLSearchParams({
          secret: env.TURNSTILE_SECRET_KEY,
          response: token,
        }),
        signal: AbortSignal.timeout(10000),
      },
    )
    const result = (await response.json()) as {
      success?: boolean
      hostname?: string
    }
    return (
      response.ok &&
      result.success === true &&
      result.hostname === new URL(request.url).hostname
    )
  } catch {
    return false
  }
}

const encodeBase64 = (value: string) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(value)))

/** RFC 2047: each encoded-word <=75 chars, never split a UTF-8 code point. */
export function encodeSubject(subject: string) {
  const chunks: string[] = []
  let chunk = ''
  for (const character of subject) {
    if (new TextEncoder().encode(chunk + character).length > 42) {
      chunks.push(chunk)
      chunk = ''
    }
    chunk += character
  }
  if (chunk) chunks.push(chunk)
  return chunks
    .map((value) => `=?UTF-8?B?${encodeBase64(value)}?=`)
    .join('\r\n ')
}

export async function notifyInterest(
  env: AjkEnv,
  data: Interest,
  id: string,
  now: string,
  userAgent: string,
) {
  if (!env.EMAIL || !env.AJK_INTEREST_NOTIFY_TO) return
  try {
    // Shop pattern: binding-only, best-effort send. send_email uses EmailMessage (the
    // shop now uses Email Sending's structured object API instead of Email Routing).
    const { EmailMessage } = await import('cloudflare:email')
    const to = env.AJK_INTEREST_NOTIFY_TO
    if (/[\r\n]/.test(to)) return
    const subject = `Minat AJK: ${data.masjid_name} (${data.area})`
    const body = Object.entries({
      id,
      created_at: now,
      ...data,
      consent_at: now,
      user_agent: userAgent,
      status: 'new',
    })
      .map(
        ([key, value]) =>
          `${key}: ${Array.isArray(value) ? value.join(', ') : value}`,
      )
      .join('\n')
    const raw = [
      `From: Jejak Masjid <noreply@jejakmasjid.my>`,
      `To: ${to}`,
      `Subject: ${encodeSubject(subject)}`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=utf-8',
      'Content-Transfer-Encoding: base64',
      '',
      encodeBase64(body)
        .match(/.{1,76}/g)!
        .join('\r\n'),
    ].join('\r\n')
    await env.EMAIL.send(new EmailMessage('noreply@jejakmasjid.my', to, raw))
  } catch {
    /* No PII in logs, and notification never changes durable success. */
  }
}

export async function handleInterest(request: Request, env: AjkEnv) {
  const siteKey =
    env.TURNSTILE_SECRET_KEY && env.TURNSTILE_SITE_KEY
      ? env.TURNSTILE_SITE_KEY
      : undefined
  const fail = (status: number, message: string, input?: Input) =>
    reply(
      request,
      { ok: false, errors: { form: message } },
      status,
      input,
      siteKey,
    )
  const originAllowed = allowedOrigin(
    request.headers.get('Origin'),
    request.url,
  )
  let input: Input
  try {
    input = await readInput(request)
  } catch (error) {
    if (!originAllowed)
      return fail(403, 'Sila hantar borang dari laman Jejak Masjid.')
    const code = error instanceof Error ? Number(error.message) : 400
    return fail(
      [413, 415].includes(code) ? code : 400,
      'Borang tidak dapat dibaca. Sila semak saiz dan format maklumat.',
    )
  }
  if (!originAllowed)
    return fail(403, 'Sila hantar borang dari laman Jejak Masjid.')
  if (isHoneypot(input))
    return reply(
      request,
      { ok: true, name: text(input.name).slice(0, 80) },
      200,
    )
  if (!env.WEB_DB)
    return fail(503, 'Borang belum tersedia. Sila cuba lagi kemudian.', input)
  try {
    const result = validateInterest(input)
    if (!result.ok) return reply(request, result, 422, input, siteKey)
    if (!(await verifyTurnstile(request, input, env)))
      return reply(
        request,
        {
          ok: false,
          errors: {
            'cf-turnstile-response':
              'Pengesahan keselamatan gagal. Sila cuba lagi.',
          },
        },
        422,
        input,
        siteKey,
      )
    const now = new Date()
    // CF-Connecting-IP is assigned by Cloudflare; never trust X-Forwarded-For.
    const limit = await rateLimit(
      env,
      request.headers.get('CF-Connecting-IP') || 'unknown',
      now,
    )
    if (!limit.allowed)
      return fail(
        429,
        'Beberapa borang telah dihantar. Sila cuba lagi selepas satu jam.',
        input,
      )
    const data = result.data
    const id = crypto.randomUUID()
    const timestamp = now.toISOString()
    const userAgent = (request.headers.get('User-Agent') || '').slice(0, 512)
    const saved = await env.WEB_DB.prepare(
      `INSERT INTO ajk_interest
      (id,created_at,name,role,masjid_name,venue_type,area,state,phone,email,needs,congregation_size,notes,consent_at,ip_hash,user_agent,source,status)
      SELECT ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'new'
      WHERE NOT EXISTS (SELECT 1 FROM ajk_interest WHERE ${DUPLICATE_PREDICATE})`,
    )
      .bind(
        id,
        timestamp,
        data.name,
        data.role,
        data.masjid_name,
        data.venue_type,
        data.area,
        data.state,
        data.phone,
        data.email || null,
        JSON.stringify(data.needs),
        data.congregation_size || null,
        data.notes || null,
        timestamp,
        limit.ipHash,
        userAgent,
        data.source,
        ...duplicateBindings(data, now),
      )
      .run()
    if (saved.meta.changes > 0)
      await notifyInterest(env, data, id, timestamp, userAgent)
    return reply(request, { ok: true, name: data.name }, 200)
  } catch {
    return fail(
      503,
      'Maklumat belum dapat disimpan. Sila cuba lagi kemudian.',
      input,
    )
  }
}

export function methodNotAllowed() {
  return new Response(null, {
    status: 405,
    headers: { ...HEADERS, Allow: 'POST' },
  })
}
