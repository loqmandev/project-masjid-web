import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import appCss from '../styles.css?url'
import { SITE } from '@/lib/site'
import { seo, structuredData } from '@/lib/seo'

/**
 * Opts the page into motion. Everything animated is gated behind
 * `html[data-motion="on"]`, so a visitor without JS, or one who has asked for
 * reduced motion, gets the full page rendered static and visible.
 */
const MOTION_INIT = `(function(){try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.dataset.motion='on'}}catch(e){}})()`

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'theme-color', content: '#00807d' },
      { name: 'apple-mobile-web-app-title', content: SITE.name },
      { name: 'author', content: SITE.legalName },
      // Smart App Banner for Safari on iOS.
      { name: 'apple-itunes-app', content: 'app-id=6757920248' },
      ...seo().meta,
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      // Fetch the two faces alongside the CSS rather than after it parses.
      {
        rel: 'preload',
        as: 'font',
        type: 'font/woff2',
        href: '/fonts/newsreader-latin.woff2',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'preload',
        as: 'font',
        type: 'font/woff2',
        href: '/fonts/inter-latin.woff2',
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

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-MY">
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
