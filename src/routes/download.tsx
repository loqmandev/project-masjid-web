import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { APP_STORE_URL, PLAY_STORE_URL } from '@/lib/site'

const FALLBACK_URL = '/'

const getRedirectUrl = createServerFn({ method: 'GET' })
  .handler(async ({ request }) => {
    const userAgent = request.headers.get('user-agent') || ''

    if (/iPad|iPhone|iPod/.test(userAgent)) {
      return APP_STORE_URL
    } else if (/Android/.test(userAgent)) {
      return PLAY_STORE_URL
    }
    return FALLBACK_URL
  })

export const Route = createFileRoute('/download')({
  loader: async () => {
    const redirectUrl = await getRedirectUrl()
    throw redirect({
      href: redirectUrl,
      statusCode: 302,
      reloadDocument: true,
    })
  },
})
