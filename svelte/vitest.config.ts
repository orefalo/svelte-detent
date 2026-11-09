import { svelte } from '@sveltejs/vite-plugin-svelte'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// The core straight from source: no build step before testing.
const alias = { '@hayderkg/detent/core': fileURLToPath(new URL('../src/core.ts', import.meta.url)) }

export default defineConfig({
  test: {
    projects: [
      {
        // Components in a (simulated) browser: Svelte's client build.
        plugins: [svelte({ hot: false })],
        resolve: { alias, conditions: ['browser'] },
        test: { name: 'client', environment: 'happy-dom', include: ['test/**/*.svelte.test.ts'] },
      },
      {
        // Server rendering: Svelte's server build, no DOM.
        plugins: [svelte({ hot: false })],
        resolve: { alias },
        test: { name: 'server', environment: 'node', include: ['test/ssr.test.ts'] },
      },
    ],
  },
})
