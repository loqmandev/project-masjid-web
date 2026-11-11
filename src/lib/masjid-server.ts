import { createServerFn } from '@tanstack/react-start'
import { setResponseHeader } from '@tanstack/react-start/server'
import { validPrayerTimes } from './masjid-format'
import { validatePhotos } from './masjid-gallery'
import { validateReviews } from './masjid-reviews'
import { validEmbedKey } from './embed-map'
import { validateRooms, validateVenueSummary, validateVenuePage } from './venue-rooms'
import { getWorkerEnv } from './worker-env'
import { notFound, redirect } from '@tanstack/react-router'
import {
  getMasjidPage,
  getFacilityCatalogue,
  getProgram,
  getPrayerTimes,
  getVenuePage,
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
    // Reviews are validated strictly and travel beside the page, never inside it, so
    // an invalid or oversharing payload cannot reach the HTML or the hydration data.
    // Venue and rooms follow the same rule: validated copies replace the raw fields,
    // and an absent field stays absent (older backends).
    const { reviews: rawReviews, venue: rawVenue, rooms: rawRooms, photos: rawPhotos, ...rest } = r.body
    const page = {
      ...rest,
      photos: validatePhotos(rawPhotos),
      ...(rawVenue !== undefined ? { venue: validateVenueSummary(rawVenue) } : {}),
      ...(rawRooms !== undefined ? { rooms: validateRooms(rawRooms) } : {}),
    }
    return {
      page,
      reviews: validateReviews(rawReviews),
      prayers: times,
      ajk: env.MASJID_AJK_ENABLED === 'true',
      mapKey: validEmbedKey(env.GOOGLE_MAPS_EMBED_KEY),
      facilityCatalogue:
        catalogue?.status === 200 && Array.isArray(catalogue.body)
          ? catalogue.body
              // Separate cache entries can mix an enabled page with the legacy
              // { code, label } catalogue during a rollout or flag rollback.
              .filter(
                (item) =>
                  item &&
                  typeof item.code === 'string' &&
                  typeof item.label === 'string' &&
                  typeof item.group === 'string' &&
                  typeof item.sortOrder === 'number' &&
                  Number.isFinite(item.sortOrder),
              )
              .map(
                ({ code, label, shortDescription, definition, group, sortOrder }) => ({
                  code, label, shortDescription, definition, group, sortOrder,
                }),
              )
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
export const loadVenue = createServerFn({ method: 'GET' })
  .inputValidator((data: { slug: string }) => data)
  .handler(async ({ data }) => {
    if (!validSlug(data.slug)) throw notFound()
    const r = await getVenuePage(data.slug)
    if (r.status === 404) throw notFound()
    if (!r.body || r.status !== 200) return unavailable()
    const venue = validateVenuePage(r.body)
    if (!venue) return unavailable()
    // The backend resolves renamed slugs by returning the canonical one.
    if (venue.venue.slug !== data.slug)
      throw redirect({ href: `/surau/${venue.venue.slug}`, statusCode: 301 })
    return { venue }
  })
