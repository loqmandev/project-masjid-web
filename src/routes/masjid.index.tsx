import { createFileRoute } from '@tanstack/react-router'
import { DiscoveryLanding, DiscoveryMissing } from '@/components/Discovery'
import { loadDiscoveryLanding } from '@/lib/discovery-server'
import { discoverySearch } from '@/lib/discovery'
import { landingHead } from '@/lib/discovery-seo'
export const Route = createFileRoute('/masjid/')({
  validateSearch: discoverySearch,
  search: { middlewares: [({ search, next }) => discoverySearch(next(search))] },
  loaderDeps: ({ search }) => ({ q: search.q ?? '' }),
  loader: ({ deps }) => loadDiscoveryLanding({ data: deps }),
  headers: () => ({ 'Cache-Control': 'no-store' }),
  head: ({ loaderData }) => landingHead('ms', loaderData),
  component: () => <DiscoveryLanding locale="ms" data={Route.useLoaderData()} />,
  notFoundComponent: () => <DiscoveryMissing locale="ms" />,
})
