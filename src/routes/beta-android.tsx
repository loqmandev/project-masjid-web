import { createFileRoute, redirect } from '@tanstack/react-router'

const ANDROID_BETA_URL = 'https://play.google.com/apps/internaltest/4701127114534778311'

export const Route = createFileRoute('/beta-android')({
  loader: () => {
    throw redirect({
      href: ANDROID_BETA_URL,
      statusCode: 302,
      reloadDocument: true,
    })
  },
})
