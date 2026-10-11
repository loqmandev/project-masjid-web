import { createFileRoute } from '@tanstack/react-router'
import { sitemapIndexResponse } from '@/lib/sitemap'
export const Route = createFileRoute('/sitemap.xml')({server:{handlers:{GET:sitemapIndexResponse,HEAD:sitemapIndexResponse}}})
