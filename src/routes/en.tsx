import { createFileRoute } from '@tanstack/react-router'
import Homepage, { homepageHead } from '@/components/Homepage'
import { loadPublicStats } from '@/lib/public-stats-server'

export const Route = createFileRoute('/en')({
  loader: () => loadPublicStats(),
  head: () => homepageHead('en'),
  component: HomePage,
})

function HomePage() {
  return <Homepage locale="en" stats={Route.useLoaderData()} />
}
