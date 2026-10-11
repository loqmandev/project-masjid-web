import {it,expect} from 'vitest'
import {sitemapIndex,sitemapUrls,xmlEscape,sitemapPageResponse} from './sitemap'
it('off index includes only static file',()=>{expect(sitemapIndex()).toContain('sitemap-pages.xml');expect(sitemapIndex()).not.toContain('/sitemaps/masjid/')})
it('page count rounds up',()=>{expect(sitemapIndex(5001)).toContain('/masjid/2');expect(sitemapIndex(5000)).not.toContain('/masjid/2')})
it('escapes XML',()=>{expect(xmlEscape('<>&')).toBe('&lt;&gt;&amp;');expect(sitemapUrls([{slug:'x&y',lastmod:'<x>'}])).toContain('&lt;x&gt;')})
it('rejects malformed page before fetch',async()=>{expect((await sitemapPageResponse('01')).status).toBe(404)})
