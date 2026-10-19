import { createServerFn } from '@tanstack/react-start'
import { setResponseHeader } from '@tanstack/react-start/server'
import { validPrayerTimes } from './masjid-format'
import { getWorkerEnv } from './worker-env'
import { notFound, redirect } from '@tanstack/react-router'
import {
  getMasjidPage,
  getFacilityCatalogue,
  getProgram,
  getPrayerTimes,
  validSlug,
  validProgramId,
} from './jm-api'
function unavailable(): never {
  setResponseHeader('Cache-Control', 'no-store')
  throw new Error('JM_API_UNAVAILABLE')
}
export const loadMasjid = createServerFn({ method: 'GET' })
  .inputValidator((data: { slug: string }) => data)
  .handler(async ({ data }) => {
    if (!validSlug(data.slug)) throw notFound()
    const r = await getMasjidPage(data.slug)
    if (r.status === 404) throw notFound()
    if (!r.body || r.status !== 200) return unavailable()
    if ('redirect' in r.body) {
      if (!validSlug(r.body.redirect)) return unavailable()
      throw redirect({ href: `/masjid/${r.body.redirect}`, statusCode: 301 })
    }
    const [prayers, catalogue] = await Promise.all([
      getPrayerTimes(r.body.masjid.lat, r.body.masjid.lng),
      Array.isArray(r.body.facilities) ? getFacilityCatalogue() : null,
    ])
    const times = prayers.status === 200 ? validPrayerTimes(prayers.body) : null
    const env = await getWorkerEnv()
    return {
      page: r.body,
      prayers: times,
      ajk: env.MASJID_AJK_ENABLED === 'true',
      facilityCatalogue:
        catalogue?.status === 200 && Array.isArray(catalogue.body)
          ? catalogue.body
          : [],
    }
  })
export const loadProgram = createServerFn({ method: 'GET' })
  .inputValidator((data: { slug: string; id: string }) => data)
  .handler(async ({ data }) => {
    if (!validSlug(data.slug) || !validProgramId(data.id)) throw notFound()
    const env = await getWorkerEnv()
    if (env.MASJID_AJK_ENABLED !== 'true') throw notFound()
    const r = await getProgram(data.id)
    if (r.status === 404) throw notFound()
    if (!r.body || r.status !== 200) return unavailable()
    if (!r.body.masjid.slug || !validSlug(r.body.masjid.slug)) throw notFound()
    if (r.body.masjid.slug !== data.slug)
      throw redirect({
        href: `/masjid/${r.body.masjid.slug}/p/${r.body.id}`,
        statusCode: 301,
      })
    return { program: r.body }
  })
