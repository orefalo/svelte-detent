import { svelte } from '@sveltejs/vite-plugin-svelte'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const here = (path: string) => fileURLToPath(new URL(path, import.meta.url))

// `pnpm dev` serves this folder; `pnpm build:demo` builds the site for GitHub Pages (served under /svelte-detent/).
export default defineConfig(({ command }) => ({
  root: here('.'),
  base: command === 'build' ? (process.env.DEMO_BASE ?? '/svelte-detent/') : '/',
  plugins: [svelte()],
  server: { fs: { allow: [here('..')] } },
  build: {
    outDir: here('../demo-dist'),
    emptyOutDir: true,
    rollupOptions: { input: { main: here('index.html'), examples: here('examples/index.html'), docs: here('docs/index.html') } },
  },
}))
