import { createFileRoute } from '@tanstack/react-router'
import { loadProgram } from '@/lib/masjid-server'
import { programSeo } from '@/lib/masjid-seo'
import { jsonLdScript, eventJsonLd } from '@/lib/jsonld'
import {
  ProgramPage,
  MissingProgram,
  RestingPage,
} from '@/components/MasjidPages'
export const Route = createFileRoute('/masjid/$slug_/p/$programId')({
  loader: ({ params }) =>
    loadProgram({ data: { slug: params.slug, id: params.programId } }),
  headers: () => ({ 'Cache-Control': 'no-store' }),
  head: ({ loaderData }) =>
    loaderData
      ? {
          ...programSeo(loaderData.program),
          scripts: [
            {
              type: 'application/ld+json',
              children: jsonLdScript(eventJsonLd(loaderData.program)),
            },
          ],
        }
      : { meta: [] },
  component: Page,
  notFoundComponent: MissingProgram,
  errorComponent: RestingPage,
})
function Page() {
  const d = Route.useLoaderData()
  return <ProgramPage p={d.program} />
}
