import { createFileRoute } from '@tanstack/react-router'
import { venueSitemapResponse } from '@/lib/sitemap'
export const Route = createFileRoute('/sitemaps/venues')({
  server: {
    handlers: {
      GET: () => venueSitemapResponse(),
      HEAD: () => venueSitemapResponse(),
    },
  },
})
