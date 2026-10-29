import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import { fileURLToPath, URL } from 'url'
import { execSync } from 'node:child_process'

import tailwindcss from '@tailwindcss/vite'
import { cloudflare } from '@cloudflare/vite-plugin'

// Changes on every build. Part of the homepage HTML edge-cache key (src/lib/html-cache.ts),
// so a deploy never serves cached HTML that references the previous build's asset hashes.
const buildId = (() => {
  let commit = 'nogit'
  try {
    commit = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() || commit
  } catch {
    /* Building outside a git checkout. */
  }
  return `${commit}-${Date.now().toString(36)}`
})()

const config = defineConfig({
  define: { __JM_BUILD_ID__: JSON.stringify(buildId) },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    devtools(),
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
})

export default config
