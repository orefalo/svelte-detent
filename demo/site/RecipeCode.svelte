<script lang="ts">
  /** The code panel under a demo: package name, a copy button, and lightly coloured code. */
  let { code, tag, attrs }: { code: string; tag: string; attrs: string[] } = $props()

  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
  /** One pass, so a replacement is never matched again. */
  const html = $derived(
    esc(code).replace(
      new RegExp(`(\\/\\/.*$)|('[^']*'|"[^"]*")|\\b(import|from)\\b|&lt;(${tag})|\\b(${attrs.join('|')})=`, 'gm'),
      (_m, comment, str, kw, t, attr) =>
        comment ? `<i class="c">${comment}</i>` : str ? `<i class="s">${str}</i>` : kw ? `<i class="k">${kw}</i>` : t ? `&lt;<i class="t">${t}</i>` : `<i class="a">${attr}</i>=`,
    ),
  )

  let copied = $state(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      copied = true
      setTimeout(() => (copied = false), 1200)
    } catch {
      /* clipboard unavailable */
    }
  }
</script>

<div class="code">
  <div class="head">
    <span>svelte-detent</span>
    <button type="button" aria-label="Copy" onclick={copy}>{copied ? '✓' : 'copy'}</button>
  </div>
  <pre>{@html html}</pre>
</div>

<style>
  .code { width: 100%; border: 1px solid #ececec; border-radius: 10px; background: #fafafa; overflow: hidden; text-align: left; }
  .head { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; border-bottom: 1px solid #ececec; font: 11px 'Geist Mono', ui-monospace, monospace; color: #888; }
  .head button { border: 0; background: none; font: inherit; color: #888; cursor: pointer; }
  pre { margin: 0; padding: 12px; font: 11.5px/1.7 'Geist Mono', ui-monospace, 'SF Mono', Menlo, monospace; overflow-x: auto; }
  pre :global(i) { font-style: normal; }
  pre :global(.k) { color: #d73a49; } pre :global(.s) { color: #1c4a8f; } pre :global(.t) { color: #3560d3; }
  pre :global(.a) { color: #6f42c1; } pre :global(.c) { color: #8a8a8a; }
  @media (prefers-color-scheme: dark) {
    .code { background: #111; border-color: #262626; } .head { border-color: #262626; }
    pre :global(.k) { color: #ff7b72; } pre :global(.s) { color: #a5d6ff; } pre :global(.t) { color: #79c0ff; } pre :global(.a) { color: #d2a8ff; }
  }
</style>
