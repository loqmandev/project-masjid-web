import { createFileRoute } from '@tanstack/react-router'
import { masjidMapResponse } from '@/lib/masjid-map-response'

// /masjid/<slug>/map.svg: server-rendered static map for the masjid page.
export const Route = createFileRoute('/masjid/$slug_/map.svg')({
  server: {
    handlers: {
      GET: ({ params }) => masjidMapResponse(params.slug, 'GET'),
      HEAD: ({ params }) => masjidMapResponse(params.slug, 'HEAD'),
    },
  },
})
