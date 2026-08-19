import { createFileRoute } from '@tanstack/react-router'
import PageLayout from '@/components/PageLayout'
import PrivacyPolicy from '@/components/PrivacyPolicy'
import { seo } from '@/lib/seo'

export const Route = createFileRoute('/privacy')({
  head: () =>
    seo({
      title: 'Privacy Policy',
      path: '/privacy',
      description:
        'How Jejak Masjid collects, uses and protects your information — including location data, masjid visit history and account details.',
    }),
  component: PrivacyPolicyPage,
})

function PrivacyPolicyPage() {
  return (
    <PageLayout
      eyebrow="Legal"
      title="Privacy Policy"
      updated="February 11, 2026"
      intro="What we collect, why we collect it, and what we never do with it."
    >
      <PrivacyPolicy />
    </PageLayout>
  )
}
