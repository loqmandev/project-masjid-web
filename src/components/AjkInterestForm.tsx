import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'

const ROLES = {
  pengerusi: 'Pengerusi',
  timbalan_pengerusi: 'Timbalan pengerusi',
  setiausaha: 'Setiausaha',
  bendahari: 'Bendahari',
  imam: 'Imam',
  ajk: 'AJK',
  lain: 'Lain-lain',
}
const STATES = [
  'W.P. Kuala Lumpur',
  'Johor',
  'Kedah',
  'Kelantan',
  'Melaka',
  'Negeri Sembilan',
  'Pahang',
  'Perak',
  'Perlis',
  'Pulau Pinang',
  'Sabah',
  'Sarawak',
  'Selangor',
  'Terengganu',
  'W.P. Labuan',
  'W.P. Putrajaya',
]
const NEEDS = {
  hebahan_program: 'Hebahan program',
  laporan_dana: 'Laporan untuk permohonan dana',
  penglibatan_belia: 'Penglibatan belia',
  kehadiran_qr: 'Rekod kehadiran QR',
  lain: 'Lain-lain',
}
const SIZES = ['<50', '50-150', '150-500', '>500']

type Values = Record<string, string | string[]>
type Turnstile = {
  render: (element: HTMLElement, options: Record<string, unknown>) => string
  remove: (id: string) => void
  reset: (id: string) => void
}
const turnstileApi = () =>
  (window as Window & { turnstile?: Turnstile }).turnstile

export default function AjkInterestForm({
  source = 'web',
  native = false,
  turnstileSiteKey,
  initialValues = {},
  initialErrors = {},
}: {
  source?: string
  native?: boolean
  turnstileSiteKey?: string
  initialValues?: Values
  initialErrors?: Record<string, string>
}) {
  const [errors, setErrors] = useState(initialErrors)
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [token, setToken] = useState('')
  const [challengeError, setChallengeError] = useState('')
  const widget = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | undefined>(undefined)
  const feedback = useRef<HTMLDivElement>(null)
  const submitting = useRef(false)

  useEffect(() => {
    if (!turnstileSiteKey || success !== null) return
    let disposed = false
    const fail = () =>
      setChallengeError(
        'Pengesahan keselamatan tidak dapat dimuatkan. Sila muat semula halaman dan cuba lagi.',
      )
    const render = () => {
      if (disposed || !widget.current || widgetId.current || !turnstileApi())
        return
      widgetId.current = turnstileApi()!.render(widget.current, {
        sitekey: turnstileSiteKey,
        theme: 'light',
        size: 'flexible',
        language: 'ms',
        callback: (value: string) => {
          setToken(value)
          setChallengeError('')
        },
        'response-field': false,
        'expired-callback': () => setToken(''),
        'error-callback': () => {
          setToken('')
          fail()
        },
      })
    }
    let script = document.querySelector<HTMLScriptElement>(
      'script[data-ajk-turnstile]',
    )
    if (!script) {
      script = document.createElement('script')
      script.src =
        'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      script.async = true
      script.dataset.ajkTurnstile = 'true'
      document.head.append(script)
    }
    script.addEventListener('load', render)
    script.addEventListener('error', fail)
    render()
    return () => {
      disposed = true
      script.removeEventListener('load', render)
      script.removeEventListener('error', fail)
      if (widgetId.current) turnstileApi()?.remove(widgetId.current)
      widgetId.current = undefined
    }
  }, [turnstileSiteKey, success])

  useEffect(() => {
    if (success !== null || Object.keys(errors).length)
      feedback.current?.focus()
  }, [errors, success])

  const value = (name: string) =>
    typeof initialValues[name] === 'string'
      ? (initialValues[name] as string)
      : ''
  const error = (name: string) =>
    errors[name] ? (
      <p id={`${name}-error`} className="mt-2 text-sm text-destructive">
        {errors[name]}
      </p>
    ) : null
  const attributes = (name: string) => ({
    id: name,
    name,
    'aria-invalid': !!errors[name],
    'aria-describedby': errors[name] ? `${name}-error` : undefined,
  })
  const field = (
    name: string,
    label: string,
    options: {
      type?: string
      required?: boolean
      minLength?: number
      maxLength?: number
      placeholder?: string
      autoComplete?: string
    } = {},
  ) => (
    <div>
      <label htmlFor={name} className="ajk-label">
        {label}
        {options.required ? '' : ' (pilihan)'}
      </label>
      <input
        {...attributes(name)}
        {...options}
        type={options.type ?? 'text'}
        defaultValue={value(name)}
        className="ajk-input"
      />
      {error(name)}
    </div>
  )
  const select = (
    name: string,
    label: string,
    options: Record<string, string>,
    required = true,
  ) => (
    <div>
      <label htmlFor={name} className="ajk-label">
        {label}
        {required ? '' : ' (pilihan)'}
      </label>
      <select
        {...attributes(name)}
        required={required}
        defaultValue={value(name)}
        className="ajk-input"
      >
        <option value="">Sila pilih</option>
        {Object.entries(options).map(([key, text]) => (
          <option key={key} value={key}>
            {text}
          </option>
        ))}
      </select>
      {error(name)}
    </div>
  )

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting.current) return
    const form = event.currentTarget
    const body = new URLSearchParams()
    new FormData(form).forEach((entry, key) => {
      if (typeof entry === 'string') body.append(key, entry)
    })
    submitting.current = true
    setSending(true)
    setErrors({})
    try {
      const response = await fetch(form.action, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body,
      })
      const result = (await response.json()) as {
        ok: boolean
        name?: string
        errors?: Record<string, string>
      }
      if (response.ok && result.ok && typeof result.name === 'string')
        setSuccess(result.name)
      else
        setErrors(
          result.errors && Object.keys(result.errors).length
            ? result.errors
            : { form: 'Maklumat belum dapat dihantar. Sila cuba lagi.' },
        )
    } catch {
      setErrors({
        form: 'Sambungan terganggu. Maklumat anda masih di sini. Sila cuba lagi.',
      })
    } finally {
      setSending(false)
      submitting.current = false
      if (widgetId.current) turnstileApi()?.reset(widgetId.current)
      setToken('')
    }
  }

  if (success !== null)
    return (
      <div
        ref={feedback}
        tabIndex={-1}
        role="status"
        className="rounded-[20px] border border-border bg-surface-sunken p-6 sm:p-8"
      >
        <h2 className="text-2xl">Terima kasih, {success}.</h2>
        <p className="mt-3 leading-relaxed">
          Kami akan hubungi anda melalui WhatsApp.
        </p>
      </div>
    )

  return (
    <form
      method="post"
      action="/api/ajk-interest"
      encType="application/x-www-form-urlencoded"
      noValidate
      onSubmit={submit}
      aria-labelledby="ajk-form-heading"
      aria-busy={sending}
      className="ajk-form rounded-[20px] border border-border bg-surface p-5 sm:p-8"
    >
      <h2 id="ajk-form-heading" className="text-2xl sm:text-3xl">
        Daftar minat dashboard AJK
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Semua medan diperlukan kecuali yang ditanda pilihan. Pilih
        sekurang-kurangnya satu keperluan utama.
      </p>
      {Object.keys(errors).length > 0 && (
        <div
          ref={feedback}
          tabIndex={-1}
          role="alert"
          className="mt-6 rounded-xl border border-destructive p-4 text-destructive"
        >
          <p className="font-semibold">
            {errors.form ?? 'Sila semak maklumat di bawah.'}
          </p>
          <ul className="mt-2 space-y-1">
            {Object.entries(errors)
              .filter(([key]) => key !== 'form')
              .map(([key, message]) => (
                <li key={key}>
                  <a
                    className="inline-flex min-h-11 items-center underline underline-offset-4"
                    href={`#${key}`}
                  >
                    {message}
                  </a>
                </li>
              ))}
          </ul>
        </div>
      )}
      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        {field('name', 'Nama penuh', {
          required: true,
          minLength: 2,
          maxLength: 80,
          autoComplete: 'name',
        })}
        {select('role', 'Jawatan dalam AJK', ROLES)}
        {field('masjid_name', 'Nama masjid / surau', {
          required: true,
          minLength: 3,
          maxLength: 120,
          autoComplete: 'organization',
        })}
        <fieldset
          id="venue_type"
          aria-describedby={errors.venue_type ? 'venue_type-error' : undefined}
        >
          <legend className="ajk-label">Jenis</legend>
          <div className="flex flex-wrap gap-x-6">
            {['masjid', 'surau'].map((type) => (
              <label key={type} className="ajk-choice">
                <input
                  type="radio"
                  name="venue_type"
                  value={type}
                  required
                  defaultChecked={value('venue_type') === type}
                  aria-invalid={!!errors.venue_type}
                />
                {type === 'masjid' ? 'Masjid' : 'Surau'}
              </label>
            ))}
          </div>
          {error('venue_type')}
        </fieldset>
        {field('area', 'Kawasan', {
          required: true,
          minLength: 2,
          maxLength: 80,
          placeholder: 'cth. Kampung Baru, Kuala Lumpur',
          autoComplete: 'address-level2',
        })}
        {select(
          'state',
          'Negeri',
          Object.fromEntries(STATES.map((state) => [state, state])),
        )}
        {field('phone', 'No. WhatsApp', {
          type: 'tel',
          required: true,
          maxLength: 30,
          placeholder: 'cth. 012-345 6789',
          autoComplete: 'tel',
        })}
        {field('email', 'E-mel', {
          type: 'email',
          maxLength: 120,
          autoComplete: 'email',
        })}
        <fieldset
          id="needs"
          className="sm:col-span-2"
          aria-describedby={`needs-hint${errors.needs ? ' needs-error' : ''}`}
        >
          <legend className="ajk-label">Keperluan utama</legend>
          <p id="needs-hint" className="mb-2 text-sm text-muted-foreground">
            Boleh pilih lebih daripada satu.
          </p>
          <div className="grid gap-x-6 sm:grid-cols-2">
            {Object.entries(NEEDS).map(([key, label]) => (
              <label key={key} className="ajk-choice">
                <input
                  type="checkbox"
                  name="needs"
                  value={key}
                  defaultChecked={
                    Array.isArray(initialValues.needs)
                      ? initialValues.needs.includes(key)
                      : value('needs') === key
                  }
                  aria-invalid={!!errors.needs}
                />
                {label}
              </label>
            ))}
          </div>
          {error('needs')}
        </fieldset>
        {select(
          'congregation_size',
          'Anggaran jemaah mingguan',
          Object.fromEntries(SIZES.map((size) => [size, `${size} orang`])),
          false,
        )}
        <div className="sm:col-span-2">
          <label htmlFor="notes" className="ajk-label">
            Catatan (pilihan)
          </label>
          <textarea
            {...attributes('notes')}
            maxLength={500}
            rows={4}
            defaultValue={value('notes')}
            className="ajk-input resize-y"
          />
          <p className="mt-2 text-sm text-muted-foreground">
            Maksimum 500 aksara.
          </p>
          {error('notes')}
        </div>
      </div>
      <div className="mt-7 border-t border-border pt-6">
        <label className="ajk-choice items-start">
          <input
            {...attributes('consent')}
            type="checkbox"
            value="on"
            required
            defaultChecked={['on', 'true', '1'].includes(value('consent'))}
            className="mt-1"
          />
          <span>
            Saya bersetuju Jejak Masjid menyimpan maklumat ini dan menghubungi
            saya tentang dashboard AJK. Lihat{' '}
            <a href="/privacy" className="underline underline-offset-4">
              Dasar Privasi
            </a>
            .
          </span>
        </label>
        {error('consent')}
      </div>
      <div hidden aria-hidden="true">
        <label htmlFor="website">Laman web</label>
        <input
          id="website"
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>
      <input type="hidden" name="source" value={value('source') || source} />
      {turnstileSiteKey && (
        <div id="cf-turnstile-response" className="mt-6">
          {native ? (
            <div
              className="cf-turnstile"
              data-sitekey={turnstileSiteKey}
              data-theme="light"
              data-size="flexible"
              data-language="ms"
            />
          ) : (
            <>
              <div ref={widget} />
              <input type="hidden" name="cf-turnstile-response" value={token} />
            </>
          )}
          {challengeError && (
            <p role="alert" className="mt-2 text-sm text-destructive">
              {challengeError}
            </p>
          )}
          {error('cf-turnstile-response')}
          <noscript>
            <p>
              Pengesahan keselamatan memerlukan JavaScript. Sila aktifkan
              JavaScript atau hubungi kami melalui WhatsApp di bawah.
            </p>
          </noscript>
        </div>
      )}
      <button
        type="submit"
        disabled={sending}
        className="jm-press mt-8 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-primary px-6 py-3 font-display font-extrabold text-primary-foreground hover:bg-primary-strong disabled:cursor-wait disabled:opacity-60 sm:w-auto"
      >
        {sending ? 'Sedang menghantar…' : 'Daftar minat'}
      </button>
      <p role="status" className="sr-only">
        {sending ? 'Sedang menghantar maklumat.' : ''}
      </p>
    </form>
  )
}
