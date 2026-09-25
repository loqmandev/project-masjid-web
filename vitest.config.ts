import { defineConfig } from 'vitest/config'
import { fileURLToPath, URL } from 'url'

// Kept separate from vite.config.ts on purpose: the Cloudflare and TanStack
// Start plugins boot a workerd runner that fails to load CJS test deps. Unit
// tests here cover plain modules in src/lib and need neither.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})
