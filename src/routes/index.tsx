import Footer from '@/components/Footer'
import Hero from '@/components/Hero'
import HowItWorks from '@/components/HowItWorks'
import Vision from '@/components/Vision'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: App })

function App() {

  return (
    <main className="bg-background text-foreground">
      <Hero />
      <Vision />
      <HowItWorks />
      <Footer />
    </main>
  )
}
