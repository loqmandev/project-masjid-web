import { createFileRoute } from '@tanstack/react-router'

import Cta from '@/components/Cta'
import Faq from '@/components/Faq'
import Features from '@/components/Features'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import Hero from '@/components/Hero'
import HowItWorks from '@/components/HowItWorks'
import Journey from '@/components/Journey'
import { FAQ } from '@/lib/faq'
import { faqStructuredData, seo } from '@/lib/seo'

export const Route = createFileRoute('/')({
  head: () =>
    seo({
      path: '/',
      keywords:
        'masjid finder, mosque tracker, masjid berdekatan, surau near me, waktu solat, prayer times Malaysia, masjid directory Malaysia, mosque check in app',
    }),
  component: App,
})

function App() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Journey />
        <Features />
        <HowItWorks />
        <Faq />
        <Cta />
      </main>
      <Footer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData(FAQ)) }}
      />
    </>
  )
}
