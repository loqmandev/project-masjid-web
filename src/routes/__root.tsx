import { HeadContent, Scripts, Outlet, createRootRoute, useLocation } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import { loadDiscoveryAreas } from '@/lib/discovery-server'
import { DiscoveryAvailability } from '@/components/DiscoveryAvailability'

import appCss from '../styles.css?url'
import { SITE } from '@/lib/site'
import { seo, structuredData } from '@/lib/seo'
import { htmlLangForPath } from '@/lib/i18n'

/**
 * Opts the page into motion. Everything animated is gated behind
 * `html[data-motion="on"]`, so a visitor without JS, or one who has asked for
 * reduced motion, gets the full page rendered static and visible.
 */
const MOTION_INIT = `(function(){try{var q=matchMedia('(prefers-reduced-motion: reduce)');function sync(){if(q.matches){delete document.documentElement.dataset.motion}else{document.documentElement.dataset.motion='on'}}sync();q.addEventListener('change',sync)}catch(e){}})()`

export const Route = createRootRoute({
  loader: () => loadDiscoveryAreas(),
  component: DiscoveryShell,
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'theme-color', content: '#003130' },
      { name: 'apple-mobile-web-app-title', content: SITE.name },
      { name: 'author', content: SITE.legalName },
      // Smart App Banner for Safari on iOS.
      { name: 'apple-itunes-app', content: 'app-id=6757920248' },
      // Child routes may replace the image without knowing its dimensions.
      ...seo().meta.filter(
        (meta) =>
          meta.property !== 'og:image:width' &&
          meta.property !== 'og:image:height',
      ),
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      // Fetch the two faces alongside the CSS rather than after it parses.
      {
        rel: 'preload',
        as: 'font',
        type: 'font/woff2',
        href: '/fonts/nunito-latin.woff2',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'preload',
        as: 'font',
        type: 'font/woff2',
        href: '/fonts/plus-jakarta-sans-latin.woff2',
        crossOrigin: 'anonymous',
      },
      { rel: 'icon', href: '/favicon.ico', sizes: '48x48' },
      { rel: 'icon', href: '/icon-192.png', type: 'image/png', sizes: '192x192' },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      { rel: 'manifest', href: '/manifest.json' },
      // Canonical URLs are emitted per route so pages never carry two of them.
    ],
  }),

  shellComponent: RootDocument,
})

function DiscoveryShell() {
  const areas = Route.useLoaderData()
  return <DiscoveryAvailability.Provider value={areas}><Outlet /></DiscoveryAvailability.Provider>
}

function RootDocument({ children }: { children: React.ReactNode }) {
  const path = useLocation({ select: location => location.pathname })
  return (
    <html lang={htmlLangForPath(path)}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: MOTION_INIT }} />
        <HeadContent />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData()) }}
        />
      </head>
      <body>
        {children}
        {import.meta.env.DEV ? (
          <TanStackDevtools
            config={{ position: 'bottom-right' }}
            plugins={[
              {
                name: 'Tanstack Router',
                render: <TanStackRouterDevtoolsPanel />,
              },
            ]}
          />
        ) : null}
        <Scripts />
      </body>
    </html>
  )
}
