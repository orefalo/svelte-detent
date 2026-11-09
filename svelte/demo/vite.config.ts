import { svelte } from '@sveltejs/vite-plugin-svelte'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

// The core straight from source, so edits anywhere in the repo reload the demo.
export default defineConfig({
  plugins: [svelte()],
  resolve: { alias: { '@hayderkg/detent/core': fileURLToPath(new URL('../../src/core.ts', import.meta.url)) } },
  server: { fs: { allow: ['../..'] } },
})
