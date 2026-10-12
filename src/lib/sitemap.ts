import { SITE } from './site'
import { getSitemapCount, getSitemapPage, validSitemapPage } from './jm-api'
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
export function sitemapIndex(total = 0, pageSize = 5000) {
  return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['/sitemap-pages.xml', ...Array.from({ length: Math.min(999, Math.ceil(total / pageSize)) }, (_, i) => `/sitemaps/masjid/${i + 1}`)].map((p) => `<sitemap><loc>${SITE.url}${p}</loc></sitemap>`).join('')}</sitemapindex>`
}
export function sitemapUrls(items: { slug: string; lastmod: string }[]) {
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${items.map((i) => `<url><loc>${xmlEscape(`${SITE.url}/masjid/${i.slug}`)}</loc><lastmod>${xmlEscape(i.lastmod)}</lastmod></url>`).join('')}</urlset>`
}
const response = (body: string, status = 200, cacheControl = 'no-store') =>
  new Response(body, {
    status,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': cacheControl,
    },
  })
function validPagination(p: { total: number; pageSize: number }) {
  return (
    Number.isSafeInteger(p.total) &&
    p.total >= 0 &&
    Number.isSafeInteger(p.pageSize) &&
    p.pageSize > 0
  )
}
export async function sitemapIndexResponse() {
  const env = await getWorkerEnv()
  if (env.MASJID_PAGES_ENABLED !== 'true') return response(sitemapIndex())
  const r = await getSitemapCount()
  return r.status === 200 && r.body && validPagination(r.body)
    ? response(sitemapIndex(r.body.total, r.body.pageSize))
    : response(sitemapIndex(), 200, 'public, max-age=300')
}
export async function sitemapPageResponse(n: string) {
  if (!validSitemapPage(n)) return response('', 404)
  const r = await getSitemapPage(n)
  return r.status === 200 &&
    r.body &&
    validPagination(r.body) &&
    Number(n) <= Math.ceil(r.body.total / r.body.pageSize)
    ? response(sitemapUrls(r.body.items))
    : response('', r.status === 503 ? 503 : 404)
}
