import { useRef, useState } from 'react'
import { Copy, Mail, MessageCircle } from 'lucide-react'
import { t, type Locale } from '@/lib/i18n'
import { SITE, WHATSAPP_URL } from '@/lib/site'

export default function CollaborationContact({ locale, onDeep = false }: { locale: Locale; onDeep?: boolean }) {
  const copy = t(locale).collaboration
  const email = useRef<HTMLSpanElement>(null)
  const [status, setStatus] = useState('')
  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(SITE.email)
      setStatus(copy.copied)
    } catch {
      if (email.current) {
        email.current.focus()
        const range = document.createRange()
        range.selectNodeContents(email.current)
        const selection = window.getSelection()
        selection?.removeAllRanges()
        selection?.addRange(range)
      }
      setStatus(copy.select)
    }
  }
  const button = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold'
  return <div className="collaboration-contact mt-8">
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <span ref={email} tabIndex={-1} className="select-all break-all text-lg font-semibold">{SITE.email}</span>
      <button type="button" onClick={copyEmail} className="inline-flex min-h-11 items-center gap-2 text-sm underline underline-offset-4"><Copy className="size-4" aria-hidden="true" />{copy.copy}</button>
    </div>
    <div className="mt-3 flex flex-wrap gap-3">
      <a className={`${button} ${onDeep ? 'bg-accent text-accent-foreground hover:bg-accent/90' : 'bg-primary text-primary-foreground hover:bg-primary-strong'}`} href={`mailto:${SITE.email}?subject=${encodeURIComponent(copy.subject)}`}><Mail className="size-4" aria-hidden="true" />{copy.contact}</a>
      <a className={`${button} border ${onDeep ? 'border-white/40 text-deep-foreground hover:bg-white/10' : 'border-border-strong hover:bg-surface-sunken'}`} href={WHATSAPP_URL}><MessageCircle className="size-4" aria-hidden="true" />{copy.whatsapp}</a>
    </div>
    <p role="status" className="mt-2 min-h-5 text-sm">{status}</p>
  </div>
}
