import { createContext, useContext } from 'react'
import type { Areas } from '@/lib/discovery'
export const DiscoveryAvailability = createContext<Areas | null>(null)
export const useDiscoveryAreas = () => useContext(DiscoveryAvailability)
