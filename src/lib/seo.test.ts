import { describe, expect, it } from 'vitest'
import { seo, faqStructuredData, structuredData } from './seo'
import { t, HOME_ALTERNATES, COLLABORATION_ALTERNATES } from './i18n'
import { SITE } from './site'

describe('localized SEO', () => {
  for (const alternates of [HOME_ALTERNATES, COLLABORATION_ALTERNATES]) {
    for (const locale of ['ms', 'en'] as const) it(`emits one canonical and reciprocal language-only alternates for ${alternates[locale]}`, () => {
      const result = seo({ path: alternates[locale], alternates })
      expect(result.links.filter(link => link.rel === 'canonical')).toEqual([{ rel: 'canonical', href: SITE.url + alternates[locale] }])
      expect(result.links.filter(link => link.rel === 'alternate')).toEqual([
        { rel: 'alternate', hrefLang: 'ms', href: SITE.url + alternates.ms },
        { rel: 'alternate', hrefLang: 'en', href: SITE.url + alternates.en },
        { rel: 'alternate', hrefLang: 'x-default', href: SITE.url + alternates.en },
      ])
      expect(result.meta).toContainEqual({ property: 'og:locale', content: locale === 'ms' ? 'ms_MY' : 'en_US' })
    })
  }
  it('preserves default SEO for pages without alternates', () => {
    const result = seo({ path: '/privacy' })
    expect(result.links).toHaveLength(1)
    expect(result.meta).toContainEqual({ name: 'description', content: SITE.description })
    expect(result.meta).toContainEqual({ property: 'og:locale', content: SITE.locale })
  })
  it('describes a bilingual site and app without restricting the organization to Malaysia', () => {
    const graph = structuredData()['@graph']
    const organization = graph.find(node => node['@type'] === 'Organization')
    expect(organization).toBeDefined()
    expect(organization).not.toHaveProperty('areaServed')
    for (const type of ['WebSite', 'MobileApplication']) {
      expect(graph.find(node => node['@type'] === type)?.inLanguage).toEqual(['ms', 'en'])
    }
  })
  it('uses the approved titles and language-specific FAQs without a regional English target', () => {
    for (const locale of ['ms', 'en'] as const) {
      const copy = t(locale)
      expect(seo({ title: copy.hero.title }).meta[0]).toEqual({ title: copy.hero.title + ' | Jejak Masjid' })
      expect(faqStructuredData(copy.faq.items).mainEntity[0].name).toBe(copy.faq.items[0].q)
    }
  })
})
