import { createFileRoute } from '@tanstack/react-router'
import { loadVenue } from '@/lib/masjid-server'
import { venueSeo } from '@/lib/masjid-seo'
import { jsonLdScript, venueJsonLd } from '@/lib/jsonld'
import { MissingVenue, RestingPage, VenuePage } from '@/components/MasjidPages'

export const Route = createFileRoute('/surau/$slug')({
  loader: ({ params }) => loadVenue({ data: { slug: params.slug } }),
  headers: () => ({ 'Cache-Control': 'no-store' }),
  head: ({ loaderData }) =>
    loaderData
      ? {
          ...venueSeo(loaderData.venue),
          scripts: [
            {
              type: 'application/ld+json',
              children: jsonLdScript(venueJsonLd(loaderData.venue)),
            },
          ],
        }
      : { meta: [] },
  component: Page,
  notFoundComponent: MissingVenue,
  errorComponent: RestingPage,
})

function Page() {
  return <VenuePage page={Route.useLoaderData().venue} />
}
