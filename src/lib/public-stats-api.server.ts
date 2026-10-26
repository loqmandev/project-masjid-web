import { apiGet } from './jm-api'
import { validPublicStats, type PublicStats } from './public-stats'
import type { WebEnv } from './worker-env'

export async function getPublicStats(env?: WebEnv): Promise<PublicStats | null> {
  try {
    const response = await apiGet<PublicStats>('/api/public/stats', {
      ttl: 3600,
      timeoutMs: 1500,
      validate: body => validPublicStats(body) !== null,
    }, env)
    return response.status === 200 ? validPublicStats(response.body) : null
  } catch {
    return null
  }
}
