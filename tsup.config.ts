import { defineConfig } from 'tsup'

export default defineConfig({
  entry: { index: 'src/index.ts', core: 'src/core.ts', feedback: 'src/feedback/index.ts', text: 'src/text/index.tsx', number: 'src/number/index.tsx' },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  minify: false,
  target: 'es2020',
  external: ['react', 'react-dom'],
  banner: { js: "'use client';" },
})
