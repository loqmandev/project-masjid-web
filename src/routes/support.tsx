import Support from '@/components/Support'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/support')({
  component: SupportPage,
})

function SupportPage() {
  return <Support />
}
