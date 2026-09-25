import { createFileRoute } from '@tanstack/react-router'
import {
  associationResponse,
  buildAppleAppSiteAssociation,
} from '@/lib/app-association'
import { getWorkerEnv } from '@/lib/worker-env'

const handle = async () =>
  associationResponse(buildAppleAppSiteAssociation(await getWorkerEnv()))

/** iOS Universal Links. 404 until APPLE_TEAM_ID is set and valid. */
export const Route = createFileRoute('/.well-known/apple-app-site-association')({
  server: {
    handlers: {
      // HEAD is explicit: without it the request falls through to an empty
      // SSR page with a 200, which would contradict the fail-closed 404.
      GET: handle,
      HEAD: handle,
    },
  },
})
