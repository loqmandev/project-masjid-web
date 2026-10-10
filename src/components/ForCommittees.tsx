import { Container } from '@/components/ui/Section'
import CommitteeSnapshot from '@/components/CommitteeSnapshot'
import { SITE } from '@/lib/site'

const MODULES = [
  {
    title: 'Program anda, lebih mudah ditemui.',
    body: 'Bantu penduduk menemui aktiviti masjid dan surau di sekitar mereka, termasuk keluarga yang belum berada dalam kumpulan WhatsApp anda.',
    detail: 'Cadangan: senarai program mengikut kawasan, tarikh, umur dan yuran, dengan pautan yang boleh dikongsi ke WhatsApp.',
  },
  {
    title: 'Ruang tersedia, peluang untuk mengajar.',
    body: 'Pertemukan ruang masjid dengan pengajar yang memerlukan tempat. Hasil sewaan boleh membantu kos operasi, sambil membuka lebih banyak pilihan kelas dengan yuran berpatutan.',
    detail: 'Cadangan modul marketplace: tawaran ruang, permohonan tempahan dewan atau bilik kelas, serta peluang pengajar. Jadual, kadar dan aktiviti tertakluk kepada kelulusan AJK.',
  },
  {
    title: 'Belia sebagai penggerak, bukan hanya peserta.',
    body: 'Beri belia peranan untuk menghebahkan aktiviti, mencadangkan kelas dan membantu sebagai fasilitator atau sukarelawan.',
    detail: 'Cadangan: akses penerbitan yang diberi kuasa oleh AJK dan peluang menyumbang mengikut kemahiran.',
  },
] as const

const enquiry = `mailto:${SITE.email}?subject=${encodeURIComponent('Minat rintis komuniti Jejak Masjid')}`

export default function ForCommittees() {
  return (
    <section
      id="committees"
      lang="ms"
      aria-labelledby="committees-heading"
      className="border-y border-border bg-surface-sunken py-20 sm:py-28"
    >
      <Container>
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div>
            <p className="eyebrow text-primary">Untuk AJK masjid &amp; surau</p>
            <h2 id="committees-heading" className="mt-4 text-3xl leading-tight text-foreground sm:text-4xl">
              Ruang masjid.<br />Peluang komuniti.
            </h2>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground">
              Lebih banyak aktiviti berhampiran rumah. Peluang untuk pengajar dan belia.
              Lebih banyak sebab untuk keluarga hadir bersama.
            </p>
            <p className="mt-6 max-w-lg border-l-2 border-brand-teal pl-4 text-sm leading-relaxed text-muted-foreground">
              <strong className="font-semibold text-foreground">Cadangan pembangunan.</strong>{' '}
              Modul ini belum tersedia. Kami ingin membentuk dan menguji pendekatan ini
              bersama pihak masjid dan surau, bermula di Putrajaya.
            </p>
          </div>

          <div className="divide-y divide-border">
            {MODULES.map((module, index) => (
              <article key={module.title} className="py-7 first:pt-0 last:pb-0">
                <div className="flex items-baseline gap-4">
                  <span aria-hidden="true" className="shrink-0 font-display text-lg text-primary">
                    0{index + 1}
                  </span>
                  <h3 className="text-xl leading-snug text-foreground">{module.title}</h3>
                </div>
                <p className="mt-3 leading-relaxed text-muted-foreground">{module.body}</p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{module.detail}</p>
              </article>
            ))}
          </div>
        </div>

        <CommitteeSnapshot />

        <div className="mt-12 border-t border-border pt-8 sm:mt-16">
          <div className="grid gap-8 md:grid-cols-2 md:gap-16">
            <div>
              <h3 className="text-xl text-foreground">Kelas dekat rumah, mengikut bajet keluarga.</h3>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                Seni, Bahasa Inggeris, al-Quran, robotik atau coding: mulakan dengan satu
                ruang, seorang pengajar dan satu kelas percubaan. Kesesuaian umur,
                penjagaan anak-anak dan yuran perlu dipersetujui dengan penganjur.
              </p>
            </div>
            <div>
              <h3 className="text-xl text-foreground">Melengkapi WhatsApp, bukan menggantikannya.</h3>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                Terus berhubung dengan jemaah sedia ada. JM dicadangkan untuk membantu
                orang lain menemui program anda. Penemuan aktiviti tidak bermaksud
                menerima semua notifikasi; hebahan pilihan akan memerlukan persetujuan pengguna.
              </p>
            </div>
          </div>
          <div className="mt-10 flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-lg text-lg text-foreground">
              Ada ruang, pengajar atau idea program?<br />Mari bincangkan rintis bersama.
            </p>
            <a
              href={enquiry}
              className="jm-press inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-primary px-6 py-3 font-display text-sm font-extrabold text-primary-foreground transition-colors hover:bg-primary-strong focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
            >
              Bincang kerjasama melalui e-mel
            </a>
          </div>
        </div>
      </Container>
    </section>
  )
}
