import { createFileRoute } from '@tanstack/react-router'
import { DiscoveryArea, DiscoveryMissing } from '@/components/Discovery'
import { loadDiscoveryArea } from '@/lib/discovery-server'
import { discoveryAreaSearch } from '@/lib/discovery'
import { areaHead } from '@/lib/discovery-seo'
export const Route = createFileRoute('/en_/mosques_/in/$country')({
  validateSearch: search => discoveryAreaSearch(search, 'en'),
  search: { middlewares: [({ search, next }) => discoveryAreaSearch(next(search), 'en')] },
  loaderDeps: ({ search }) => ({ page: search.page ?? 1 }),
  loader: ({ params, deps }) => loadDiscoveryArea({ data: { ...params, ...deps } }),
  headers: () => ({ 'Cache-Control': 'no-store' }),
  head: ({ loaderData }) => areaHead('en', loaderData),
  component: () => <DiscoveryArea locale="en" data={Route.useLoaderData()} />,
  notFoundComponent: () => <DiscoveryMissing locale="en" />,
})
