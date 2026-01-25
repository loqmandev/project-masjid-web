import { createFileRoute, redirect } from '@tanstack/react-router'

const IOS_BETA_URL = 'https://testflight.apple.com/join/zrH5N8Tp'

export const Route = createFileRoute('/beta-ios')({
  loader: () => {
    throw redirect({
      href: IOS_BETA_URL,
      statusCode: 302,
      reloadDocument: true,
    })
  },
})
