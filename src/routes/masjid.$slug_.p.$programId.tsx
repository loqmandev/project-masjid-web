import { createFileRoute } from '@tanstack/react-router'
import { loadProgram } from '@/lib/masjid-server'
import { programSeo } from '@/lib/masjid-seo'
import { jsonLdScript, eventJsonLd } from '@/lib/jsonld'
import {
  ProgramPage,
  MissingMasjid,
  RestingPage,
} from '@/components/MasjidPages'
export const Route = createFileRoute('/masjid/$slug_/p/$programId')({
  loader: ({ params }) =>
    loadProgram({ data: { slug: params.slug, id: params.programId } }),
  headers: ({ loaderData }) => ({
    'Cache-Control':
      loaderData && !loaderData.unavailable
        ? 'public, max-age=0, s-maxage=300'
        : 'no-store',
  }),
  head: ({ loaderData }) =>
    loaderData && !loaderData.unavailable
      ? {
          ...programSeo(loaderData.program),
          scripts: [
            {
              type: 'application/ld+json',
              children: jsonLdScript(eventJsonLd(loaderData.program)),
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
  return d.unavailable ? <RestingPage /> : <ProgramPage p={d.program} />
}
