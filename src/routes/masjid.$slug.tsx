import { createFileRoute } from '@tanstack/react-router'
import { loadMasjid } from '@/lib/masjid-server'
import { masjidSeo } from '@/lib/masjid-seo'
import { jsonLdScript, mosqueJsonLd } from '@/lib/jsonld'
import {
  MasjidPage,
  MissingMasjid,
  RestingPage,
} from '@/components/MasjidPages'
export const Route = createFileRoute('/masjid/$slug')({
  loader: ({ params }) => loadMasjid({ data: { slug: params.slug } }),
  headers: () => ({ 'Cache-Control': 'no-store' }),
  head: ({ loaderData }) =>
    loaderData
      ? {
          ...masjidSeo(loaderData.page, loaderData.ajk),
          scripts: [
            {
              type: 'application/ld+json',
              children: jsonLdScript(
                mosqueJsonLd(
                  loaderData.page,
                  loaderData.ajk,
                  loaderData.facilityCatalogue,
                ),
              ),
            },
          ],
        }
      : { meta: [] },
  component: Page,
  notFoundComponent: MissingMasjid,
  errorComponent: RestingPage,
})
function Page() {
  const d = Route.useLoaderData()
  return (
    <MasjidPage
      page={d.page}
      prayers={d.prayers}
      ajk={d.ajk}
      facilityCatalogue={d.facilityCatalogue}
    />
  )
}
