import { createFileRoute } from '@tanstack/react-router'
import { DiscoveryArea, DiscoveryMissing } from '@/components/Discovery'
import { loadDiscoveryArea } from '@/lib/discovery-server'
import { discoveryAreaSearch } from '@/lib/discovery'
import { areaHead } from '@/lib/discovery-seo'
export const Route = createFileRoute('/masjid/di/$country_/$region_/$district')({
  validateSearch: search => discoveryAreaSearch(search, 'ms'),
  search: { middlewares: [({ search, next }) => discoveryAreaSearch(next(search), 'ms')] },
  loaderDeps: ({ search }) => ({ page: search.halaman ?? 1 }),
  loader: ({ params, deps }) => loadDiscoveryArea({ data: { ...params, ...deps } }),
  headers: () => ({ 'Cache-Control': 'no-store' }),
  head: ({ loaderData }) => areaHead('ms', loaderData),
  component: () => <DiscoveryArea locale="ms" data={Route.useLoaderData()} />,
  notFoundComponent: () => <DiscoveryMissing locale="ms" />,
})
