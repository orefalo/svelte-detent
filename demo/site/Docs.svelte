<script lang="ts">
  import { Marked } from 'marked'
  import Header from './Header.svelte'
  import source from '../docs/docs.md?raw'

  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const slug = (s: string) => s.toLowerCase().replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  /** One pass, so a replacement is never matched again. */
  const colour = (code: string, lang: string) => {
    const html = esc(code)
    if (lang === 'sh') return html
    return html.replace(
      /(&lt;!--[\s\S]*?--&gt;|\/\/.*$)|('[^']*'|"[^"]*")|\b(import|from|const|let|export|await)\b|\{(@attach|#each|#snippet|\/snippet|\/each)|(&lt;\/?[A-Za-z][\w.]*)/gm,
      (_m, c, str, kw, tag, el) =>
        c ? `<i class="c">${c}</i>` : str ? `<i class="s">${str}</i>` : kw ? `<i class="k">${kw}</i>` : tag ? `{<i class="k">${tag}</i>` : `<i class="t">${el}</i>`,
    )
  }

  const marked = new Marked({
    renderer: {
      heading({ tokens, depth }) {
        const text = this.parser.parseInline(tokens)
        return `<h${depth} id="${slug(text)}">${text}</h${depth}>\n`
      },
      code({ text, lang }) {
        return `<pre><code>${colour(text, lang ?? '')}</code></pre>\n`
      },
    },
  })
  const html = marked.parse(source) as string
</script>

<Header current="docs" />

<main class="docs">{@html html}</main>

<style>
  .docs { max-width: 520px; margin: 0 auto; padding: 24px 0 160px; font: 15px/1.6 Geist, system-ui, sans-serif; }
  @media (max-width: 1000px) { .docs { padding-inline: 16px; box-sizing: border-box; } }
  .docs :global(h1) { margin: 0 0 12px; font-size: 28px; letter-spacing: -0.02em; }
  .docs :global(h2) { margin: 64px 0 12px; font-size: 20px; letter-spacing: -0.01em; scroll-margin-top: 72px; }
  .docs :global(h3) { margin: 36px 0 8px; font-size: 15px; scroll-margin-top: 72px; }
  .docs :global(p) { margin: 12px 0; color: #444; }
  .docs :global(a) { color: inherit; text-decoration-color: #aaa; text-underline-offset: 3px; }
  .docs :global(code) { font: 12.5px 'Geist Mono', ui-monospace, 'SF Mono', Menlo, monospace; background: rgb(128 128 128 / 0.12); border-radius: 4px; padding: 1px 5px; }
  .docs :global(pre) { margin: 14px 0; padding: 14px 16px; overflow-x: auto; border: 1px solid #e8e8e8; border-radius: 12px; background: #fafafa; }
  .docs :global(pre code) { display: block; padding: 0; background: none; font-size: 12.5px; line-height: 1.65; color: #1f2328; white-space: pre; }
  .docs :global(.c) { color: #8b949e; font-style: normal; } .docs :global(.s) { color: #0a7f4f; font-style: normal; }
  .docs :global(.k) { color: #cf222e; font-style: normal; } .docs :global(.t) { color: #0550ae; font-style: normal; }
  .docs :global(table) { width: 100%; margin: 14px 0; border-collapse: collapse; font-size: 13px; line-height: 1.5; }
  .docs :global(th) { text-align: left; font-weight: 600; color: #666; }
  .docs :global(th), .docs :global(td) { padding: 8px 10px 8px 0; border-bottom: 1px solid #eee; vertical-align: top; }
  .docs :global(td:first-child) { white-space: nowrap; font-family: 'Geist Mono', ui-monospace, monospace; font-size: 12px; padding-right: 14px; }
  @media (prefers-color-scheme: dark) {
    .docs :global(p) { color: #bbb; }
    .docs :global(a) { text-decoration-color: #666; }
    .docs :global(pre) { background: #111; border-color: #262626; }
    .docs :global(pre code) { color: #e6edf3; }
    .docs :global(.c) { color: #7d8590; } .docs :global(.s) { color: #7ee787; } .docs :global(.k) { color: #ff7b72; } .docs :global(.t) { color: #79c0ff; }
    .docs :global(th) { color: #999; } .docs :global(th), .docs :global(td) { border-color: #262626; }
  }
</style>
