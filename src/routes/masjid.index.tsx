import { createFileRoute, redirect } from '@tanstack/react-router'
import { DiscoveryLanding, DiscoveryMissing } from '@/components/Discovery'
import { loadDiscoveryLanding } from '@/lib/discovery-server'
import { discoverySearch, searchPath } from '@/lib/discovery'
import { landingHead } from '@/lib/discovery-seo'
export const Route = createFileRoute('/masjid/')({
  validateSearch: search => discoverySearch(search, 'ms'),
  search: { middlewares: [({ search, next }) => discoverySearch(next(search), 'ms')] },
  loaderDeps: ({ search }) => ({ q: search.q ?? '', page: search.halaman ?? 1 }),
  loader: async ({ deps }) => {
    const data = await loadDiscoveryLanding({ data: deps })
    if (data.results && deps.page > data.results.page) throw redirect({ href: searchPath('ms', data.q, data.results.page), statusCode: 302 })
    return data
  },
  headers: () => ({ 'Cache-Control': 'no-store' }),
  head: ({ loaderData, match }) => landingHead('ms', loaderData, match.search.q !== undefined),
  component: () => <DiscoveryLanding locale="ms" data={Route.useLoaderData()} />,
  notFoundComponent: () => <DiscoveryMissing locale="ms" />,
})
