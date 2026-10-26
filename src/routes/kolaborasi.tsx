import { createFileRoute } from '@tanstack/react-router'
import Collaboration, { collaborationHead } from '@/components/Collaboration'

export const Route = createFileRoute('/kolaborasi')({ head: () => collaborationHead('ms'), component: () => <Collaboration locale="ms" /> })
