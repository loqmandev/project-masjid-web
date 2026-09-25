import { createFileRoute } from '@tanstack/react-router'
import { associationResponse, buildAssetLinks } from '@/lib/app-association'
import { getWorkerEnv } from '@/lib/worker-env'

const handle = async () => associationResponse(buildAssetLinks(await getWorkerEnv()))

/** Android App Links. 404 until ANDROID_SHA256_CERT_FINGERPRINTS is set and valid. */
export const Route = createFileRoute('/.well-known/assetlinks.json')({
  server: {
    handlers: {
      // HEAD is explicit so it cannot fall through to a 200 SSR page.
      GET: handle,
      HEAD: handle,
    },
  },
})
