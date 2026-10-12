import { createServerFn } from '@tanstack/react-start'
import { setResponseHeader } from '@tanstack/react-start/server'
import { validPrayerTimes } from './masjid-format'
import { notFound, redirect } from '@tanstack/react-router'
import {
  getMasjidPage,
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
    const prayers = await getPrayerTimes(r.body.masjid.lat, r.body.masjid.lng)
    const times = prayers.status === 200 ? validPrayerTimes(prayers.body) : null
    return {
      page: r.body,
      prayers: times,
    }
  })
export const loadProgram = createServerFn({ method: 'GET' })
  .inputValidator((data: { slug: string; id: string }) => data)
  .handler(async ({ data }) => {
    if (!validSlug(data.slug) || !validProgramId(data.id)) throw notFound()
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
