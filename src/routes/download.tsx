import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

const IOS_APP_URL = 'https://testflight.apple.com/join/zrH5N8Tp'
const ANDROID_APP_URL = 'https://play.google.com/store/apps/details?id=my.lonasoft.jejakmasjidmobile'
const FALLBACK_URL = '/'

const getRedirectUrl = createServerFn({ method: 'GET' })
  .handler(async ({ request }) => {
    const userAgent = request.headers.get('user-agent') || ''

    if (/iPad|iPhone|iPod/.test(userAgent)) {
      return IOS_APP_URL
    } else if (/Android/.test(userAgent)) {
      return ANDROID_APP_URL
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
