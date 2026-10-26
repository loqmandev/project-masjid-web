import { createServerFn } from '@tanstack/react-start'
export const loadPublicStats = createServerFn({ method: 'GET' }).handler(async () => {
  const { getPublicStats } = await import('./public-stats-api.server')
  return getPublicStats()
})
