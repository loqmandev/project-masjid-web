import { APP_BUNDLE_ID, APP_SCHEME } from './app'
import { PLAY_STORE_URL } from './site'
export function masjidAppUrl(id: string) { return `${APP_SCHEME}://masjid/${encodeURIComponent(id)}` }
export function masjidIntentUrl(id: string) { return `intent://masjid/${encodeURIComponent(id)}#Intent;scheme=${APP_SCHEME};package=${APP_BUNDLE_ID};S.browser_fallback_url=${encodeURIComponent(PLAY_STORE_URL)};end` }
// Program public pages deliberately target the route supported by every shipped app.
export const programAppUrl = masjidAppUrl
