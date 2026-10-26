import { createFileRoute, redirect } from '@tanstack/react-router'
import { DiscoveryLanding, DiscoveryMissing } from '@/components/Discovery'
import { loadDiscoveryLanding } from '@/lib/discovery-server'
import { discoverySearch, searchPath } from '@/lib/discovery'
import { landingHead } from '@/lib/discovery-seo'
export const Route = createFileRoute('/en_/mosques')({
  validateSearch: search => discoverySearch(search, 'en'),
  search: { middlewares: [({ search, next }) => discoverySearch(next(search), 'en')] },
  loaderDeps: ({ search }) => ({ q: search.q ?? '', page: search.page ?? 1 }),
  loader: async ({ deps }) => {
    const data = await loadDiscoveryLanding({ data: deps })
    if (data.results && deps.page > data.results.page) throw redirect({ href: searchPath('en', data.q, data.results.page), statusCode: 302 })
    return data
  },
  headers: () => ({ 'Cache-Control': 'no-store' }),
  head: ({ loaderData, match }) => landingHead('en', loaderData, match.search.q !== undefined),
  component: () => <DiscoveryLanding locale="en" data={Route.useLoaderData()} />,
  notFoundComponent: () => <DiscoveryMissing locale="en" />,
})
