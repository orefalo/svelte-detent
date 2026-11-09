import { configDefaults, defineConfig } from 'vitest/config'

// The Svelte package has its own suite (svelte/), run with its own config.
export default defineConfig({ test: { exclude: [...configDefaults.exclude, 'svelte/**'] } })
