import { createFileRoute, redirect } from '@tanstack/react-router'

const GOOGLE_GROUPS_URL = 'https://groups.google.com/g/jejakmasjid'

export const Route = createFileRoute('/google-groups')({
  loader: () => {
    throw redirect({
      href: GOOGLE_GROUPS_URL,
      statusCode: 302,
      reloadDocument: true,
    })
  },
})
