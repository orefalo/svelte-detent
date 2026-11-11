import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      {
        // The engine and physics: no framework, no DOM unless a file asks for happy-dom.
        test: {
          name: 'core',
          environment: 'node',
          include: ['test/*.test.ts'],
          exclude: ['test/*.svelte.test.ts', 'test/ssr.test.ts'],
        },
      },
      {
        // Components in a (simulated) browser: Svelte's client build.
        plugins: [svelte()],
        resolve: { conditions: ['browser'] },
        test: { name: 'client', environment: 'happy-dom', include: ['test/**/*.svelte.test.ts'] },
      },
      {
        // Server rendering: Svelte's server build, no DOM.
        plugins: [svelte()],
        test: { name: 'server', environment: 'node', include: ['test/ssr.test.ts'] },
      },
    ],
  },
})
