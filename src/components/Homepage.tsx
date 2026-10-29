import Header from './Header'
import Hero from './Hero'
import TrustStrip from './TrustStrip'
import Features from './Features'
import Reviews from './Reviews'
import Media from './Media'
import Ecosystem from './Ecosystem'
import Faq from './Faq'
import Cta from './Cta'
import Footer from './Footer'
import PublicStats from './PublicStats'
import CollaborationBand from './CollaborationBand'
import type { PublicStats as Stats } from '@/lib/public-stats'
import { t, type Locale, HOME_ALTERNATES } from '@/lib/i18n'
import { faqStructuredData, seo } from '@/lib/seo'
import { heroPreloadLink } from '@/lib/hero-art'

export function homepageHead(locale: Locale) {
  const { title, description } = t(locale).hero
  const head = seo({ title, description, path: HOME_ALTERNATES[locale], alternates: HOME_ALTERNATES })
  // Only `/` and `/en` render the hero, so only they preload its LCP image.
  return { ...head, links: [...head.links, heroPreloadLink()] }
}

export default function Homepage({ locale, stats = null }: { locale: Locale; stats?: Stats | null }) {
  return <><Header /><main id="main-content"><Hero locale={locale} /><TrustStrip locale={locale} /><PublicStats locale={locale} stats={stats} /><Features locale={locale} /><Reviews locale={locale} /><Media locale={locale} /><CollaborationBand locale={locale} /><Ecosystem locale={locale} /><Faq locale={locale} /><Cta locale={locale} /></main><Footer />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData(t(locale).faq.items)) }} />
  </>
}
