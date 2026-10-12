import { createFileRoute } from '@tanstack/react-router'
import { sitemapPageResponse } from '@/lib/sitemap'
export const Route = createFileRoute('/sitemaps/masjid/$page')({
  server: {
    handlers: {
      GET: ({ params }) => sitemapPageResponse(params.page),
      HEAD: ({ params }) => sitemapPageResponse(params.page),
    },
  },
})
