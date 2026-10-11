import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Container } from '@/components/ui/Section'
import AjkInterestForm from '@/components/AjkInterestForm'
import { COMMITTEE_WHATSAPP_URL } from '@/lib/site'
import { seo } from '@/lib/seo'

const getPublicConfig = createServerFn({ method: 'GET' }).handler(async () => {
  const { getAjkPublicConfig } = await import('@/lib/worker-env')
  return getAjkPublicConfig()
})

export const Route = createFileRoute('/ajk')({
  validateSearch: (search: Record<string, unknown>) => ({
    utm_source:
      typeof search.utm_source === 'string'
        ? search.utm_source.slice(0, 120)
        : undefined,
  }),
  loader: () => getPublicConfig(),
  head: () => {
    const head = seo({
      title: 'Dashboard AJK',
      socialTitle: 'Dashboard AJK · Jejak Masjid',
      path: '/ajk',
      description:
        'Daftar minat untuk dashboard AJK Jejak Masjid: hebah program kepada kariah berdekatan, rekod kehadiran dan laporan program untuk permohonan dana.',
    })
    // This page's specified title uses a middle dot rather than the shared separator.
    head.meta = head.meta.map((meta) =>
      'title' in meta ? { title: 'Dashboard AJK · Jejak Masjid' } : meta,
    )
    return head
  },
  component: AjkPage,
})

const BENEFITS = [
  [
    'Program tak sampai kepada kariah',
    'Hebah program kepada pengguna Jejak Masjid dalam radius 10 km dan yang mengikuti masjid anda.',
  ],
  [
    'Dana program terhad',
    'Laporan program automatik (kehadiran, gambar, ringkasan) untuk sokong permohonan dana.',
  ],
  [
    'Susah tarik belia',
    'Program anda muncul di app yang digunakan jemaah muda untuk mencari masjid.',
  ],
]

function AjkPage() {
  const { turnstileSiteKey } = Route.useLoaderData()
  const { utm_source } = Route.useSearch()
  return (
    <div lang="ms">
      <Header />
      <main>
        <header className="on-deep bg-deep py-14 sm:py-20">
          <Container className="max-w-3xl text-center">
            <span
              aria-hidden="true"
              className="mx-auto mb-6 block h-[5px] w-16 rounded-full bg-accent"
            />
            <p className="eyebrow mb-3">Untuk AJK masjid &amp; surau</p>
            <h1 className="text-3xl leading-tight text-deep-foreground sm:text-5xl">
              Dashboard AJK Jejak Masjid
            </h1>
            <p className="mt-5 leading-relaxed text-deep-muted">
              Percuma untuk masjid dan surau. Kini dibuka untuk masjid &amp; surau di Kuala Lumpur.
            </p>
          </Container>
        </header>
        <Container className="max-w-3xl py-10 sm:py-14">
          <section aria-label="Cadangan dashboard AJK" className="mb-10">
            <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
              Dashboard sedang dibina. Inilah yang kami cadangkan untuk membantu
              AJK.
            </p>
            <dl className="divide-y divide-border">
              {BENEFITS.map(([problem, answer]) => (
                <div
                  key={problem}
                  className="grid gap-2 py-5 first:pt-0 sm:grid-cols-[1fr_1.5fr] sm:gap-8"
                >
                  <dt className="font-display text-lg font-extrabold">
                    {problem}
                  </dt>
                  <dd className="leading-relaxed text-muted-foreground">
                    {answer}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
          <AjkInterestForm
            source={utm_source || 'web'}
            turnstileSiteKey={turnstileSiteKey}
          />
          <aside className="mt-8 px-1">
            <p className="leading-relaxed text-muted-foreground">
              Dashboard sedang dibina. Kami akan hubungi anda melalui WhatsApp
              bila rintis dibuka di kawasan anda.
            </p>
            <a
              href={COMMITTEE_WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full border-2 border-primary/25 px-6 py-3 font-display text-sm font-extrabold text-primary hover:border-primary/50"
            >
              Bincang melalui WhatsApp
              <span className="sr-only"> (dibuka dalam tab baharu)</span>
            </a>
          </aside>
        </Container>
      </main>
      <Footer />
    </div>
  )
}
