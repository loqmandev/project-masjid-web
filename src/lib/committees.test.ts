// @vitest-environment jsdom
import { createElement } from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, vi } from 'vitest'
import AjkInterestForm from '@/components/AjkInterestForm'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import ForCommittees from '@/components/ForCommittees'
import { COMMITTEE_WHATSAPP_URL, SECTIONS, SITE } from './site'

afterEach(() => { cleanup(); vi.unstubAllGlobals() })

const html = renderToStaticMarkup(createElement(ForCommittees))

describe('AJK interest form', () => {
  it('renders a native URL-encoded POST form with all fields and no mandatory scripts', () => {
    const markup = renderToStaticMarkup(createElement(AjkInterestForm, { source: 'video' }))
    expect(markup).toContain('method="post"')
    expect(markup).toContain('action="/api/ajk-interest"')
    expect(markup).toContain('encType="application/x-www-form-urlencoded"')
    for (const name of ['name', 'role', 'masjid_name', 'venue_type', 'area', 'state', 'phone', 'email', 'needs', 'congregation_size', 'notes', 'consent', 'website', 'source']) {
      expect(markup).toContain(`name="${name}"`)
    }
    expect(markup).toContain('value="video"')
    expect(markup).not.toContain('challenges.cloudflare.com')
    expect(markup).not.toContain('name="cf-turnstile-response"')
  })

  it('restores server-rendered values and associates Malay inline errors', () => {
    render(createElement(AjkInterestForm, { initialValues: { name: 'Aminah', needs: ['laporan_dana'], consent: 'on' }, initialErrors: { phone: 'Sila semak nombor WhatsApp.' } }))
    expect((screen.getByLabelText('Nama penuh') as HTMLInputElement).value).toBe('Aminah')
    expect((screen.getByLabelText('Laporan untuk permohonan dana') as HTMLInputElement).checked).toBe(true)
    expect(screen.getByLabelText('No. WhatsApp').getAttribute('aria-describedby')).toBe('phone-error')
    expect(screen.getByLabelText('No. WhatsApp').getAttribute('aria-invalid')).toBe('true')
  })

  it('preserves entered values on API errors, then shows the returned success name', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce({ ok: false, json: async () => ({ ok: false, errors: { phone: 'Sila semak nombor WhatsApp.', form: 'Sila semak borang.' } }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true, name: 'Aminah' }) })
    vi.stubGlobal('fetch', fetcher)
    render(createElement(AjkInterestForm, { source: 'video' }))
    fireEvent.change(screen.getByLabelText('Nama penuh'), { target: { value: 'Aminah' } })
    fireEvent.click(screen.getByLabelText('Hebahan program'))
    fireEvent.submit(screen.getByRole('form'))
    await screen.findByText('Sila semak borang.')
    expect((screen.getByLabelText('Nama penuh') as HTMLInputElement).value).toBe('Aminah')
    expect((screen.getByLabelText('Hebahan program') as HTMLInputElement).checked).toBe(true)
    const request = fetcher.mock.calls[0][1]
    expect(request.headers.Accept).toBe('application/json')
    expect(request.body.get('source')).toBe('video')
    expect(request.body.getAll('needs')).toEqual(['hebahan_program'])
    fireEvent.submit(screen.getByRole('form'))
    await screen.findByText('Terima kasih, Aminah.')
    expect(screen.queryByRole('form')).toBeNull()
    expect(screen.getByText('Kami akan hubungi anda melalui WhatsApp.')).toBeTruthy()
  })

  it('disables duplicate submission while sending and preserves values after network failure', async () => {
    let rejectRequest!: (error: Error) => void
    vi.stubGlobal('fetch', vi.fn(() => new Promise((_resolve, reject) => { rejectRequest = reject })))
    render(createElement(AjkInterestForm))
    fireEvent.change(screen.getByLabelText('Nama penuh'), { target: { value: 'Aminah' } })
    fireEvent.submit(screen.getByRole('form'))
    expect((screen.getByRole('button') as HTMLButtonElement).disabled).toBe(true)
    rejectRequest(new Error('Offline'))
    await screen.findByText('Sambungan terganggu. Maklumat anda masih di sini. Sila cuba lagi.')
    await waitFor(() => expect((screen.getByRole('button') as HTMLButtonElement).disabled).toBe(false))
    expect((screen.getByLabelText('Nama penuh') as HTMLInputElement).value).toBe('Aminah')
  })
})

describe('committee partnership section', () => {
  it('has a shared navigation destination and accessible Malay section', () => {
    expect(SECTIONS).toContainEqual({ href: '/#committees', label: 'For committees' })
    expect(html).toContain('id="committees"')
    expect(html).toContain('lang="ms"')
    expect(html).toContain('aria-labelledby="committees-heading"')
    expect(html).toContain('id="committees-heading"')
  })

  it('clearly distinguishes the proposed modules from available app features', () => {
    expect(html).toContain('Cadangan pembangunan.')
    expect(html).toContain('Modul ini belum tersedia.')
    expect(html.match(/<article /g)).toHaveLength(3)
    for (const copy of ['Program anda, lebih mudah ditemui.', 'Ruang tersedia, peluang untuk mengajar.', 'Belia sebagai penggerak, bukan hanya peserta.', 'kelulusan AJK', 'persetujuan pengguna']) {
      expect(html).toContain(copy)
    }
  })

  it('offers dashboard interest as the primary action and keeps real contact options', () => {
    expect(html).toContain('href="/ajk"')
    expect(html).toContain('Daftar minat dashboard AJK')
    expect(html.indexOf('href="/ajk"')).toBeLessThan(html.indexOf(`href="${COMMITTEE_WHATSAPP_URL}"`))
    expect(html).toContain(`mailto:${SITE.email}?subject=${encodeURIComponent('Minat rintis komuniti Jejak Masjid')}`)
    expect(html).toContain('Atau melalui e-mel')
    expect(html).toContain('Bincang melalui WhatsApp')
    expect(html).toContain(`href="${COMMITTEE_WHATSAPP_URL}"`)
    expect(html).toContain('rel="noopener noreferrer"')
    expect(html).not.toContain('<form')
    expect(html).not.toContain('href="#"')
  })
})
