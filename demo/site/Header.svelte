<script lang="ts">
  let { current }: { current: 'examples' | 'docs' } = $props()
  const base = import.meta.env.BASE_URL
</script>

<header>
  <nav>
    <a class="logo" href="{base}examples/">svelte-detent</a>
    <a class:on={current === 'examples'} href="{base}examples/">Examples</a>
    <a class:on={current === 'docs'} href="{base}docs/">Docs</a>
    <a href="https://github.com/orefalo/svelte-detent" aria-label="GitHub">GitHub</a>
  </nav>
</header>

<style>
  :global(html) { scroll-behavior: smooth; }
  :global(body) { margin: 0; background: #fff; color: #0a0a0a; font-family: Geist, system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
  header { position: sticky; top: 0; z-index: 50; backdrop-filter: blur(12px); background: rgb(255 255 255 / 0.8); }
  nav { max-width: 520px; margin: 0 auto; display: flex; align-items: center; gap: 20px; height: 56px; font-size: 14px; }
  nav a { color: #666; text-decoration: none; }
  nav a:hover, nav a.on { color: #0a0a0a; }
  .logo { font: italic 600 26px/1 Newsreader, Georgia, serif; color: #0a0a0a; margin-right: auto; letter-spacing: -0.02em; }
  @media (max-width: 1000px) { nav { padding-inline: 16px; box-sizing: border-box; } }
  @media (prefers-color-scheme: dark) {
    :global(body) { background: #0a0a0a; color: #ededed; }
    header { background: rgb(10 10 10 / 0.8); }
    nav a:hover, nav a.on, .logo { color: #ededed; }
  }
</style>
