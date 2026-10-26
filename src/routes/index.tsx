import { createFileRoute } from '@tanstack/react-router'
import Homepage, { homepageHead } from '@/components/Homepage'
import { loadPublicStats } from '@/lib/public-stats-server'

export const Route = createFileRoute('/')({
  loader: () => loadPublicStats(),
  head: () => homepageHead('ms'),
  component: HomePage,
})

function HomePage() {
  return <Homepage locale="ms" stats={Route.useLoaderData()} />
}
