/**
 * Google Maps Embed API (place mode) for the masjid page. The key is public by
 * nature (it is in the iframe URL) and is restricted by the owner to HTTP
 * referrers and the Maps Embed API only. It comes from the Worker var
 * GOOGLE_MAPS_EMBED_KEY; without a valid key the page shows no map at all.
 */
const KEY = /^[A-Za-z0-9_-]{20,60}$/

/** The key when well-formed, otherwise null. */
export const validEmbedKey = (value: unknown): string | null =>
  typeof value === 'string' && KEY.test(value) ? value : null

/**
 * Embed URL for a point. Always coordinates, never the name: Google could match a
 * different place with the same name.
 */
export function googleMapEmbedUrl(key: string, lat: number, lng: number): string | null {
  if (!KEY.test(key) || !Number.isFinite(lat) || !Number.isFinite(lng)) return null
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null
  const params = new URLSearchParams({
    key,
    q: `${lat},${lng}`,
    zoom: '16',
    language: 'en',
  })
  return `https://www.google.com/maps/embed/v1/place?${params}`
}
