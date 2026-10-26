import { createFileRoute } from '@tanstack/react-router'
import Collaboration, { collaborationHead } from '@/components/Collaboration'

export const Route = createFileRoute('/en_/collaboration')({ head: () => collaborationHead('en'), component: () => <Collaboration locale="en" /> })
