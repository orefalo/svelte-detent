<script lang="ts">
  /** The code under an example: a usage snippet pulled from its source, a copy button and a link to the full file. */
  let { code, file }: { code: string; file: string } = $props()

  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  /** One pass, so a replacement is never matched again. */
  const html = $derived(
    esc(code).replace(
      /(&lt;!--[\s\S]*?--&gt;|\/\/.*$)|('[^'\n]*'|"[^"\n]*"|`[^`\n]*`)|\b(import|from|const|let|export|await|as)\b|\{(@attach|@render|#each|#if|#snippet|\/snippet|\/each|\/if|:else)|(&lt;\/?[A-Za-z][\w.]*)/gm,
      (_m, c, str, kw, block, tag) =>
        c ? `<i class="c">${c}</i>` : str ? `<i class="s">${str}</i>` : kw ? `<i class="k">${kw}</i>` : block ? `{<i class="k">${block}</i>` : `<i class="t">${tag}</i>`,
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

<figure class="code">
  <figcaption>
    <span>{file}</span>
    <span class="actions">
      <a href="https://github.com/orefalo/svelte-detent/blob/main/demo/examples/{file}" target="_blank" rel="noopener">full source ↗</a>
      <button type="button" aria-label="Copy code" onclick={copy}>{copied ? '✓' : 'copy'}</button>
    </span>
  </figcaption>
  <pre><code>{@html html}</code></pre>
</figure>

<style>
  .code { margin: 12px 0 0; border: 1px solid #e8e8e8; border-radius: 12px; background: #fafafa; overflow: hidden; text-align: left; }
  figcaption { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; border-bottom: 1px solid #ececec; font: 11px 'Geist Mono', ui-monospace, monospace; color: #888; }
  .actions { display: flex; gap: 14px; }
  .actions a, .actions button { color: #888; text-decoration: none; border: 0; background: none; font: inherit; cursor: pointer; padding: 0; }
  .actions a:hover, .actions button:hover { color: #0a0a0a; }
  pre { margin: 0; padding: 12px; max-height: 360px; overflow: auto; }
  code { display: block; font: 11.5px/1.65 'Geist Mono', ui-monospace, 'SF Mono', Menlo, monospace; color: #1f2328; white-space: pre; tab-size: 2; }
  code :global(i) { font-style: normal; }
  code :global(.k) { color: #cf222e; } code :global(.s) { color: #0a3069; } code :global(.t) { color: #0550ae; } code :global(.c) { color: #8b949e; }
  @media (prefers-color-scheme: dark) {
    .code { background: #111; border-color: #262626; } figcaption { border-color: #262626; }
    .actions a:hover, .actions button:hover { color: #ededed; }
    code { color: #e6edf3; }
    code :global(.k) { color: #ff7b72; } code :global(.s) { color: #a5d6ff; } code :global(.t) { color: #79c0ff; } code :global(.c) { color: #7d8590; }
  }
</style>
