import TermsOfService from '@/components/TermsOfService'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/tos')({
  component: TermsOfServicePage,
})

function TermsOfServicePage() {
  return <TermsOfService />
}
