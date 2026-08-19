import { SITE, absoluteUrl } from './site'

type SeoInput = {
  /** Page title without the brand suffix. Omit on the homepage. */
  title?: string
  description?: string
  /** Site-root-relative path, e.g. `/privacy`. Used for the canonical URL. */
  path?: string
  image?: string
  keywords?: string
  /** Redirect/utility routes should not be indexed. */
  noindex?: boolean
  type?: 'website' | 'article'
}

/**
 * Builds the `meta` + `links` arrays for a route's `head()`.
 * Every page gets a canonical URL, an OG card and a Twitter card.
 */
export function seo({
  title,
  description = SITE.description,
  path = '/',
  image = SITE.ogImage,
  keywords,
  noindex = false,
  type = 'website',
}: SeoInput = {}) {
  const fullTitle = title ? `${title} | ${SITE.name}` : `${SITE.name}: ${SITE.tagline}`
  const canonical = absoluteUrl(path)
  const imageUrl = absoluteUrl(image)

  const meta: Array<Record<string, string>> = [
    { title: fullTitle },
    { name: 'description', content: description },
    {
      name: 'robots',
      content: noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large',
    },

    { property: 'og:type', content: type },
    { property: 'og:site_name', content: SITE.name },
    { property: 'og:locale', content: SITE.locale },
    { property: 'og:title', content: fullTitle },
    { property: 'og:description', content: description },
    { property: 'og:url', content: canonical },
    { property: 'og:image', content: imageUrl },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:image:alt', content: `${SITE.name}: ${SITE.tagline}` },

    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: fullTitle },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: imageUrl },
  ]

  if (keywords) meta.push({ name: 'keywords', content: keywords })

  return {
    meta,
    links: [{ rel: 'canonical', href: canonical }],
  }
}

/** JSON-LD graph describing the organisation, the site and the mobile app. */
export function structuredData() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE.url}/#organization`,
        name: SITE.name,
        legalName: SITE.legalName,
        url: SITE.url,
        logo: absoluteUrl('/icon-512.png'),
        email: SITE.email,
        areaServed: 'MY',
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE.url}/#website`,
        name: SITE.name,
        url: SITE.url,
        description: SITE.description,
        inLanguage: 'en-MY',
        publisher: { '@id': `${SITE.url}/#organization` },
      },
      {
        '@type': 'MobileApplication',
        '@id': `${SITE.url}/#app`,
        name: SITE.storeName,
        alternateName: SITE.name,
        url: SITE.url,
        description: SITE.description,
        applicationCategory: 'LifestyleApplication',
        operatingSystem: 'iOS, Android',
        image: absoluteUrl('/icon-512.png'),
        screenshot: [
          absoluteUrl('/screens/01-today.webp'),
          absoluteUrl('/screens/02-explore.webp'),
          absoluteUrl('/screens/04-prayer-circle.webp'),
        ],
        inLanguage: ['ms-MY', 'en-MY'],
        author: { '@id': `${SITE.url}/#organization` },
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'MYR',
          availability: 'https://schema.org/InStock',
        },
      },
    ],
  }
}

/** FAQPage JSON-LD — lets the homepage FAQ qualify for rich results. */
export function faqStructuredData(items: ReadonlyArray<{ q: string; a: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  }
}
