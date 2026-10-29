/**
 * Image sources for the static homepage hero. The same constants feed the
 * rendered `<img>` and the `<link rel="preload">` in the route head, so the
 * browser sees one candidate set and fetches the city painting exactly once.
 *
 * Variants are plain resizes of the approved painting (Lanczos, WebP q70) and
 * of the Explore screenshot (WebP q80); the artwork is never recoloured,
 * cropped or redrawn. Widths: 640 / 800 / 960 / 1254 (the original) for the
 * city, 320 / 480 / 720 for the phone screen.
 */

/**
 * Rendered width of the square map stage (`.map-stage` in hero.css):
 * 110vw on phones, min(720px, 66vw) from 761 px, then 60vw (the art pane)
 * once the pane outgrows 720 px at 1200 px.
 */
const CITY_SIZES = '(max-width: 760px) 110vw, (max-width: 1200px) min(720px, 66vw), 60vw'

export const HERO_CITY = {
  src: '/hero/l4-city-960.webp',
  srcSet: '/hero/l4-city-640.webp 640w, /hero/l4-city-800.webp 800w, /hero/l4-city-960.webp 960w, /hero/l4-city.webp 1254w',
  sizes: CITY_SIZES,
  width: 1254,
  height: 1254,
} as const

/**
 * Content width of the floating phone's screen: its box is 90 px wide from
 * 761 px, then clamp(90px, 8vw, 118px); the bezel is 4–5 px a side.
 */
export const HERO_PHONE = {
  src: '/screens/02-explore.webp',
  srcSet: '/screens/02-explore-320.webp 320w, /screens/02-explore.webp 480w, /screens/02-explore@2x.webp 720w',
  sizes: '(max-width: 1150px) 82px, clamp(80px, calc(8vw - 10px), 108px)',
  width: 720,
  height: 1600,
} as const

/**
 * Head link for `/` and `/en`: the LCP image is discovered before the CSS.
 * `href` is the `<img>` fallback `src`, used only by a browser that ignores
 * `imagesrcset`. React also hoists its own preload for the high-priority
 * `<img>` (same candidate set), so the head carries two identical links;
 * browsers fetch the file once, and this one keeps the preload explicit if
 * that React behaviour ever changes.
 */
export const heroPreloadLink = () => ({
  rel: 'preload',
  as: 'image',
  href: HERO_CITY.src,
  imageSrcSet: HERO_CITY.srcSet,
  imageSizes: HERO_CITY.sizes,
  fetchPriority: 'high' as const,
})
