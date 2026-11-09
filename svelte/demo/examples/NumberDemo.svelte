<script lang="ts">
  // In your app: import { DetentNumber } from '@hayderkg/detent-svelte'
  import { DetentNumber } from '../../src/lib'

  type Tab = 'counter' | 'currency' | 'percentage'
  const tabs: { id: Tab; label: string }[] = [
    { id: 'counter', label: 'Counter' },
    { id: 'currency', label: 'Currency' },
    { id: 'percentage', label: 'Percentage' },
  ]
  const values: Record<Tab, number[]> = {
    counter: [99, 100, 999, 1000],
    currency: [1249.9, 2000, 1999.99, 99.99],
    percentage: [0.125, -0.032, 0, 0.0784],
  }
  const captions: Record<Tab, string> = {
    counter: 'From 99 to 100. Then back again.',
    currency: 'Across thousands, cents, and a change of sign.',
    percentage: 'Up, down, and back through zero.',
  }
  const formats: Record<'en' | 'de', Record<Tab, { locales: string; format?: Intl.NumberFormatOptions }>> = {
    en: {
      counter: { locales: 'en-US' },
      currency: { locales: 'en-US', format: { style: 'currency', currency: 'USD' } },
      percentage: { locales: 'en-US', format: { style: 'percent', signDisplay: 'exceptZero', minimumFractionDigits: 1, maximumFractionDigits: 2 } },
    },
    de: {
      counter: { locales: 'de-DE' },
      currency: { locales: 'de-DE', format: { style: 'currency', currency: 'EUR' } },
      percentage: { locales: 'de-DE', format: { style: 'percent', signDisplay: 'exceptZero', minimumFractionDigits: 1, maximumFractionDigits: 2 } },
    },
  }
  const snippets: Record<Tab, string> = {
    counter: `<DetentNumber value={count} locales="en-US" />`,
    currency: `<DetentNumber value={price} locales="en-US"\n  format={{ style: 'currency', currency: 'USD' }} />`,
    percentage: `// 0.125 → +12.5%\n<DetentNumber value={change} locales="en-US"\n  format={{ style: 'percent', signDisplay: 'exceptZero',\n    maximumFractionDigits: 2 }} />`,
  }
  const importLine = `import { DetentNumber } from '@hayderkg/detent-svelte'`

  let tab = $state<Tab>('counter')
  let lang = $state<'en' | 'de'>('en')
  let step = $state(0)
  const value = $derived(values[tab][step]!)
  const f = $derived(formats[lang][tab])
  let copied = $state(false)

  const go = (d: number) => (step = (step + d + 4) % 4)
  const pick = (t: Tab) => ((tab = t), (step = 0))

  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
  /** Light syntax colouring, in one pass so a replacement is never matched again. */
  const hl = (code: string) =>
    esc(code).replace(
      /(\/\/.*$)|('[^']*'|"[^"]*")|\b(import|from)\b|&lt;(DetentNumber)|\b(value|locales|format)=/gm,
      (_m, comment, str, kw, tag, attr) =>
        comment ? `<i class="c">${comment}</i>` : str ? `<i class="s">${str}</i>` : kw ? `<i class="k">${kw}</i>` : tag ? `&lt;<i class="t">${tag}</i>` : `<i class="a">${attr}</i>=`,
    )
  const full = $derived(`${importLine}\n\n${snippets[tab]}`)

  async function copy() {
    try {
      await navigator.clipboard.writeText(full)
      copied = true
      setTimeout(() => (copied = false), 1200)
    } catch {
      /* clipboard unavailable */
    }
  }
</script>

<div class="demo">
  <div class="bar">
    <div class="tabs" role="tablist">
      {#each tabs as t (t.id)}
        <button type="button" role="tab" aria-selected={tab === t.id} class:on={tab === t.id} onclick={() => pick(t.id)}>{t.label}</button>
      {/each}
    </div>
    <button type="button" class="lang" aria-label="Switch number format to {lang === 'en' ? 'German' : 'English'}" onclick={() => (lang = lang === 'en' ? 'de' : 'en')}>
      {lang.toUpperCase()}
      <svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true"><path d="M2 5.5h11M10.5 3 13 5.5 10.5 8M14 10.5H3M5.5 8 3 10.5 5.5 13" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" /></svg>
    </button>
  </div>

  <div class="number"><DetentNumber {value} locales={f.locales} format={f.format} /></div>

  <div class="steps">
    <button type="button" class="prev" aria-label="Previous value" onclick={() => go(-1)}>
      <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path d="M13 8H3m4-4L3 8l4 4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
    </button>
    <button type="button" class="next" onclick={() => go(1)}>
      Next value
      <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
    </button>
  </div>
  <p class="caption">{captions[tab]}</p>

  <div class="code">
    <div class="head">
      <span>@hayderkg/detent-svelte</span>
      <button type="button" aria-label="Copy" onclick={copy}>{copied ? '✓' : 'copy'}</button>
    </div>
    <pre>{@html hl(full)}</pre>
  </div>
</div>

<style>
  .demo { display: grid; justify-items: center; gap: 18px; width: 100%; font-family: system-ui, sans-serif; }
  .bar { display: flex; justify-content: space-between; align-items: center; width: 100%; max-width: 360px; }
  .tabs { display: flex; gap: 12px; }
  .tabs button, .lang { border: 0; background: none; padding: 0; font: 500 11px/1 system-ui, sans-serif; color: #999; cursor: pointer; }
  .tabs button.on { color: #0a0a0a; font-weight: 600; }
  .lang { display: flex; align-items: center; gap: 4px; font-family: ui-monospace, monospace; color: #666; }
  .number { margin: 14px 0 6px; font-size: 64px; font-weight: 550; line-height: 1.1; letter-spacing: -0.02em; min-height: 70px; }
  .steps { display: flex; align-items: center; gap: 6px; }
  .prev { display: grid; place-items: center; width: 28px; height: 28px; border-radius: 50%; border: 1px solid #e3e3e3; background: none; color: inherit; cursor: pointer; }
  .next { display: flex; align-items: center; gap: 8px; height: 28px; padding: 0 12px; border: 0; border-radius: 999px; background: #0a0a0a; color: #fff; font: 500 11px system-ui, sans-serif; cursor: pointer; }
  .caption { margin: 0; font-size: 11px; color: #777; }
  .code { width: 100%; margin-top: 8px; border: 1px solid #ececec; border-radius: 10px; background: #fafafa; overflow: hidden; text-align: left; }
  .head { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; border-bottom: 1px solid #ececec; font: 11px ui-monospace, monospace; color: #888; }
  .head button { border: 0; background: none; font: inherit; color: #888; cursor: pointer; }
  pre { margin: 0; padding: 12px; font: 11.5px/1.7 ui-monospace, 'SF Mono', Menlo, monospace; overflow-x: auto; }
  pre :global(i) { font-style: normal; }
  pre :global(.k) { color: #d73a49; } pre :global(.s) { color: #1c4a8f; } pre :global(.t) { color: #3560d3; }
  pre :global(.a) { color: #6f42c1; } pre :global(.c) { color: #8a8a8a; }
  @media (prefers-color-scheme: dark) {
    .tabs button.on { color: #ededed; } .next { background: #ededed; color: #0a0a0a; } .prev { border-color: #333; }
    .code { background: #111; border-color: #262626; } .head { border-color: #262626; }
    pre :global(.k) { color: #ff7b72; } pre :global(.s) { color: #a5d6ff; } pre :global(.t) { color: #79c0ff; } pre :global(.a) { color: #d2a8ff; }
  }
</style>
