import { createFileRoute } from '@tanstack/react-router'
import PageLayout from '@/components/PageLayout'
import TermsOfService from '@/components/TermsOfService'
import { seo } from '@/lib/seo'

export const Route = createFileRoute('/tos')({
  head: () =>
    seo({
      title: 'Terms of Service',
      path: '/tos',
      description:
        'The terms that apply when you use the Jejak Masjid app and website.',
    }),
  component: TermsOfServicePage,
})

function TermsOfServicePage() {
  return (
    <PageLayout
      eyebrow="Legal"
      title="Terms of Service"
      updated="March 1, 2025"
      intro="The agreement between you and Jejak Masjid."
    >
      <TermsOfService />
    </PageLayout>
  )
}
