import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import ForCommittees from '@/components/ForCommittees'
import { SECTIONS, SITE } from './site'

const html = renderToStaticMarkup(createElement(ForCommittees))

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

  it('offers a real enquiry rather than a fake booking or registration', () => {
    expect(html).toContain(`mailto:${SITE.email}?subject=${encodeURIComponent('Minat rintis komuniti Jejak Masjid')}`)
    expect(html).toContain('Bincang kerjasama melalui e-mel')
    expect(html).not.toContain('<form')
    expect(html).not.toContain('href="#"')
  })
})
