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
  headers: ({ loaderData }) => ({
    'Cache-Control':
      loaderData && !loaderData.unavailable
        ? 'public, max-age=0, s-maxage=300'
        : 'no-store',
  }),
  head: ({ loaderData }) =>
    loaderData && !loaderData.unavailable
      ? {
          ...masjidSeo(loaderData.page),
          scripts: [
            {
              type: 'application/ld+json',
              children: jsonLdScript(mosqueJsonLd(loaderData.page)),
            },
          ],
        }
      : { meta: [{ name: 'robots', content: 'noindex' }] },
  component: Page,
  notFoundComponent: MissingMasjid,
  errorComponent: RestingPage,
})
function Page() {
  const d = Route.useLoaderData()
  return d.unavailable ? (
    <RestingPage />
  ) : (
    <MasjidPage page={d.page} prayers={d.prayers} />
  )
}
