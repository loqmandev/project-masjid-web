import { createFileRoute } from '@tanstack/react-router'
import PageLayout from '@/components/PageLayout'
import Support from '@/components/Support'
import { seo } from '@/lib/seo'

export const Route = createFileRoute('/support')({
  head: () =>
    seo({
      title: 'Support & Help',
      path: '/support',
      description:
        'Answers to common Jejak Masjid questions — accounts, check-ins, location permissions, the leaderboard and deleting your account. Contact admin@jejakmasjid.my for anything else.',
    }),
  component: SupportPage,
})

function SupportPage() {
  return (
    <PageLayout
      eyebrow="Support"
      title="How can we help?"
      updated="February 18, 2026"
      intro="Answers to the questions we are asked most. If yours is not here, write to us — we usually reply within a day or two."
    >
      <Support />
    </PageLayout>
  )
}
