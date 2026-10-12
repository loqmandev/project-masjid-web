import { SITE } from './site'
import { getSitemapPage, validSitemapPage } from './jm-api'
import { getWorkerEnv } from './worker-env'
export const xmlEscape = (s: string) =>
  s.replace(
    /[<>&"']/g,
    (c) =>
      ({
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        '"': '&quot;',
        "'": '&apos;',
      })[c]!,
  )
export function sitemapIndex(total = 0) {
  return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['/sitemap-pages.xml', ...Array.from({ length: Math.min(999, Math.ceil(total / 5000)) }, (_, i) => `/sitemaps/masjid/${i + 1}`)].map((p) => `<sitemap><loc>${SITE.url}${p}</loc></sitemap>`).join('')}</sitemapindex>`
}
export function sitemapUrls(items: { slug: string; lastmod: string }[]) {
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${items.map((i) => `<url><loc>${xmlEscape(`${SITE.url}/masjid/${i.slug}`)}</loc><lastmod>${xmlEscape(i.lastmod)}</lastmod></url>`).join('')}</urlset>`
}
const response = (body: string, status = 200) =>
  new Response(body, {
    status,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': status === 200 ? 'public, max-age=3600' : 'no-store',
    },
  })
export async function sitemapIndexResponse() {
  const env = await getWorkerEnv()
  if (env.MASJID_PAGES_ENABLED !== 'true') return response(sitemapIndex())
  const r = await getSitemapPage('1')
  return r.status === 200 && r.body
    ? response(sitemapIndex(r.body.total))
    : response('', 503)
}
export async function sitemapPageResponse(n: string) {
  if (!validSitemapPage(n)) return response('', 404)
  const r = await getSitemapPage(n)
  return r.status === 200 &&
    r.body &&
    Number(n) <= Math.ceil(r.body.total / 5000)
    ? response(sitemapUrls(r.body.items))
    : response('', r.status === 503 ? 503 : 404)
}
