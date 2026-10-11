import { createFileRoute } from '@tanstack/react-router'
import { getWorkerEnv } from '@/lib/worker-env'
import { handleInterest, methodNotAllowed } from '@/lib/ajk-interest-server'

export const Route = createFileRoute('/api/ajk-interest')({
  server: {
    handlers: {
      POST: async ({ request }) =>
        handleInterest(request, await getWorkerEnv()),
      GET: methodNotAllowed,
      HEAD: methodNotAllowed,
      PUT: methodNotAllowed,
      PATCH: methodNotAllowed,
      DELETE: methodNotAllowed,
      OPTIONS: methodNotAllowed,
    },
  },
})
