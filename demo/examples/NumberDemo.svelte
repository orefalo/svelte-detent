<script lang="ts">
  // In your app: import { DetentNumber } from 'svelte-detent'
  import { DetentNumber } from '../../src/lib'
  import CodeSlot from '../site/CodeSlot.svelte'

  const tabs = ['Counter', 'Currency', 'Percentage'] as const
  type Tab = (typeof tabs)[number]
  const recipes: Record<Tab, { values: number[]; format: Intl.NumberFormatOptions }> = {
    Currency: { values: [1249.9, 2000, 1999.99, 99.99, 100, -48.5, 12890.75], format: { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 } },
    Counter: { values: [99, 100, 999, 1000, 9999, 10000, 9, 0, -12], format: { maximumFractionDigits: 0 } },
    Percentage: { values: [0.125, -0.032, 0, 0.0784, -0.0045, 0.9999], format: { style: 'percent', signDisplay: 'exceptZero', minimumFractionDigits: 1, maximumFractionDigits: 2 } },
  }
  /** The parts of the formatted number that get their own look. */
  const parts = { currency: 'rolling-currency', fraction: 'rolling-fraction', decimal: 'rolling-fraction', group: 'rolling-group', sign: 'rolling-sign', unit: 'rolling-sign' }
  const captions: Record<Tab, string> = {
    Currency: 'Across thousands, cents, and a change of sign.',
    Counter: 'From 99 to 100. Then back again.',
    Percentage: 'Up, down, and back through zero.',
  }
  /** The code panel: one per tab and language (the page's own snippets, in Svelte). */
  const snippets: Record<Tab, [string, string]> = {
    Counter: ['<DetentNumber value={count} locales="en-US" />', '<DetentNumber value={count} locales="de-DE" />'],
    Currency: [
      `<DetentNumber value={price} locales="en-US"\n  format={{ style: 'currency', currency: 'USD' }} />`,
      `<DetentNumber value={price} locales="de-DE"\n  format={{ style: 'currency', currency: 'EUR' }} />`,
    ],
    Percentage: [
      `// 0.125 → +12.5%\n<DetentNumber value={change} locales="en-US"\n  format={{ style: 'percent', signDisplay: 'exceptZero',\n    maximumFractionDigits: 2 }} />`,
      `// 0.125 → +12,5 %\n<DetentNumber value={change} locales="de-DE"\n  format={{ style: 'percent', signDisplay: 'exceptZero',\n    maximumFractionDigits: 2 }} />`,
    ],
  }
  const importLine = `import { DetentNumber } from 'svelte-detent'`

  let tab = $state<Tab>('Counter')
  let index = $state(0)
  let german = $state(false)

  const recipe = $derived(recipes[tab])
  const value = $derived(recipe.values[index % recipe.values.length]!)
  const format = $derived(tab === 'Currency' ? { ...recipe.format, currency: german ? 'EUR' : 'USD' } : recipe.format)
  const code = $derived(`${importLine}\n\n${snippets[tab][Number(german)]}`)
  const step = (d: number) => (index = (index + d + recipe.values.length) % recipe.values.length)

  const paths = { swap: 'M3 6h13m-3-3 3 3-3 3M17 14H4m3-3-3 3 3 3', back: 'M16 10H4m5-5-5 5 5 5', next: 'M4 10h12m-5-5 5 5-5 5' } as const
</script>

{#snippet icon(name: keyof typeof paths)}
  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-2px"><path d={paths[name]} /></svg>
{/snippet}

<div class="value-recipe">
  <div class="rolling-demo">
    <div class="rolling-toolbar">
      <div role="group" aria-label="Number example" class="rolling-tabs">
        {#each tabs as t (t)}
          <button type="button" aria-pressed={tab === t} onclick={() => ((tab = t), (index = 0))}>{t}</button>
        {/each}
      </div>
      <button type="button" class="rolling-locale" aria-label="Switch number format to {german ? 'English' : 'German'}" onclick={() => (german = !german)}>
        {german ? 'DE' : 'EN'} {@render icon('swap')}
      </button>
    </div>

    <div class="rolling-stage" style:color={tab === 'Percentage' ? (value < 0 ? '#dc2626' : value > 0 ? '#16a34a' : undefined) : undefined}>
      <output aria-live="polite" aria-atomic="true"><DetentNumber {value} locales={german ? 'de-DE' : 'en-US'} {format} classNames={parts} /></output>
    </div>

    <div class="rolling-controls">
      <button type="button" class="rolling-back" aria-label="Previous value" onclick={() => step(-1)}>{@render icon('back')}</button>
      <button type="button" class="rolling-next" onclick={() => step(1)}>Next value <span>{@render icon('next')}</span></button>
    </div>
    <p class="rolling-caption">{captions[tab]}</p>
  </div>

  <CodeSlot {code} file="NumberDemo.svelte" />
</div>

<style>
  .value-recipe { --fg: #111; --bg: #fff; --muted: #888; --line: #ddd; --accent: #ff5a1f; width: 100%; min-width: 0; font-family: system-ui, sans-serif; }

  .rolling-stage :global(.rolling-currency) { font-size: 0.55em; color: var(--muted); margin-inline: 0.05em; }
  .rolling-stage :global(.rolling-fraction) { font-size: 0.72em; }
  .rolling-stage :global(.rolling-group) { opacity: 0.4; }
  .rolling-stage :global(.rolling-sign) { font-size: 0.65em; }
  .rolling-demo { width: 100%; max-width: 420px; margin: 0 auto; display: grid; justify-items: center; gap: 20px; padding: 8px 0; }
  .rolling-toolbar { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 12px; font-size: 12px; }
  .rolling-tabs { display: flex; gap: 14px; }
  .rolling-demo button { font: inherit; color: inherit; border: 0; background: none; cursor: pointer; -webkit-tap-highlight-color: transparent; }
  .rolling-tabs button { padding: 6px 0; opacity: 0.45; transition: opacity 150ms ease; }
  .rolling-tabs button[aria-pressed='true'] { opacity: 1; font-weight: 600; }
  .rolling-demo .rolling-locale { display: inline-flex; align-items: center; gap: 6px; font-family: 'Geist Mono', ui-monospace, monospace; font-size: 11px; opacity: 0.65; padding: 6px 0; }
  .rolling-stage { width: 100%; min-height: 132px; display: grid; place-items: center; font-size: clamp(40px, 7vw, 64px); font-weight: 550; letter-spacing: -0.035em; }
  .rolling-stage output { display: block; line-height: 1; }
  .rolling-controls { display: flex; gap: 8px; font-size: 13px; }
  .rolling-controls button { height: 36px; border-radius: 99px; transition: transform 150ms ease, background-color 150ms ease; }
  .rolling-back { width: 36px; box-shadow: inset 0 0 0 1px var(--line); }
  .rolling-demo .rolling-next { padding: 0 18px; background: var(--fg); color: var(--bg); }
  .rolling-next span { display: inline-block; margin-left: 14px; opacity: 0.6; }
  .rolling-controls button:active { transform: scale(0.96); }
  .rolling-demo button:focus-visible { outline: 2px solid var(--accent); outline-offset: 4px; }
  .rolling-demo p.rolling-caption { font-family: system-ui, sans-serif; margin: 0; font-size: 12px; color: var(--muted); text-align: center; line-height: 1.4; }
  @media (hover: hover) { .rolling-tabs button:hover { opacity: 1; } .rolling-back:hover { background: #eee; } }
  @media (prefers-reduced-motion: reduce) { .rolling-demo button { transition: none; } }
  @media (prefers-color-scheme: dark) {
    .value-recipe { --fg: #ededed; --bg: #0a0a0a; --line: #333; }
    @media (hover: hover) { .rolling-back:hover { background: #222; } }
  }
</style>
