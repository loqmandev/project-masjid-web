import { createFileRoute } from '@tanstack/react-router'
import { areaSitemapResponse } from '@/lib/discovery-sitemap'
export const Route = createFileRoute('/sitemaps/areas')({ server: { handlers: { GET: areaSitemapResponse, HEAD: areaSitemapResponse } } })
