<script lang="ts">
  // In your app: import { DetentText } from 'svelte-detent'
  import { onDestroy } from 'svelte'
  import { DetentText } from '../../src/lib'
  import RecipeCode from '../site/RecipeCode.svelte'

  const tabs = ['Button', 'Morphing', 'Custom'] as const
  type Tab = (typeof tabs)[number]
  const en = { labels: ['Send', 'Sending…', 'Sent'], words: ['play', 'playing', 'replaying', 'replayed'] }
  const de = { labels: ['Senden', 'Wird gesendet…', 'Gesendet'], words: ['spielen', 'mitspielen', 'mitgespielt', 'gespielt'] }

  /** The page's own snippets, in Svelte: per tab, morph off then morph on (chosen by 2 * tab + morph). */
  const snippets = [
    `// morph={false} rolls the whole label.\n// status: 'Send' → 'Sending…' → 'Sent'\n<DetentText morph={false} text={status} />`,
    `// morph={false} rolls the whole label.\n// status: 'Send' → 'Sending…' → 'Sent'\n<DetentText text={status} />`,
    `// Matching letters stay in place.\n<DetentText morph={false} text={word} />`,
    `// Matching letters stay in place.\n<DetentText text={word} />`,
    `// Pass the current label. No predefined list.\n<DetentText morph={false} text={showSecond ? second : first} />`,
    `// Pass the current label. No predefined list.\n<DetentText text={showSecond ? second : first} />`,
  ]
  const importLine = `import { DetentText } from 'svelte-detent'`

  let tab = $state<Tab>('Button')
  /** 0 = send, 1 = sending, 2 = sent. */
  let status = $state(0)
  let german = $state(false)
  let morph = $state(true)
  let wordIndex = $state(0)
  let first = $state('Hello, Detent')
  let second = $state('Hello, world')
  let showSecond = $state(false)
  let timer: ReturnType<typeof setTimeout> | undefined
  onDestroy(() => clearTimeout(timer))

  const copy = $derived(german ? de : en)
  const text = $derived(tab === 'Morphing' ? copy.words[wordIndex]! : showSecond ? second : first)

  const reset = () => {
    clearTimeout(timer)
    timer = undefined
    status = 0
  }
  const send = () => {
    if (status !== 0) return
    status = 1
    timer = setTimeout(() => ((status = 2), (timer = undefined)), 1400)
  }
  const swapLanguage = () => {
    german = !german
    // The default labels follow the language; ones you have written stay.
    if (first === 'Hello, Detent' || first === 'Hallo, Detent') first = german ? 'Hallo, Detent' : 'Hello, Detent'
    if (second === 'Hello, world' || second === 'Hallo, Welt') second = german ? 'Hallo, Welt' : 'Hello, world'
  }
  const stepWord = (d: number) => (wordIndex = (wordIndex + d + copy.words.length) % copy.words.length)
  const flip = () => (showSecond = !showSecond)

  const captions: Record<Tab, string> = {
    Button: 'One button, from send to sent. Roll the whole label or try morphing.',
    Morphing: 'Matching letters stay in place. Only the parts that change roll.',
    Custom: 'Write two labels, then switch between them. No list of values required.',
  }
  const announcement = $derived(tab === 'Button' ? (status === 1 ? 'Sending demo message.' : status === 2 ? 'Demo message sent.' : '') : text)

  const paths = {
    swap: 'M3 6h13m-3-3 3 3-3 3M17 14H4m3-3-3 3 3 3',
    replay: 'M4 7a6.5 6.5 0 1 1-.3 5M4 3v4h4',
    back: 'M16 10H4m5-5-5 5 5 5',
    next: 'M4 10h12m-5-5 5 5-5 5',
  } as const

  const code = $derived(`${importLine}\n\n${snippets[2 * tabs.indexOf(tab) + Number(morph)]}`)
</script>

{#snippet icon(name: keyof typeof paths)}
  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-2px"><path d={paths[name]} /></svg>
{/snippet}

<div class="recipe">
  <div class="demo">
    <div class="toolbar">
      <div class="tabs" role="group" aria-label="Text example">
        {#each tabs as t (t)}
          <button type="button" aria-pressed={tab === t} onclick={() => (reset(), (tab = t))}>{t}</button>
        {/each}
      </div>
      <div class="tools">
        <button type="button" class="locale" aria-label="Switch text to {german ? 'English' : 'German'}" onclick={swapLanguage}>{german ? 'DE' : 'EN'} {@render icon('swap')}</button>
        <button type="button" role="switch" aria-checked={morph} class="morph" onclick={() => (morph = !morph)}>
          Morphing <span class="switch" aria-hidden="true"><span></span></span>
        </button>
      </div>
    </div>

    <div class="stage">
      {#if tab === 'Button'}
        <button type="button" class="action" aria-label={copy.labels[status]} aria-disabled={status !== 0} data-sent={status === 2 ? '' : undefined} onclick={send}>
          <span class="icon" aria-hidden="true">
            {#if status === 2}<svg viewBox="0 0 20 20"><path d="m4 10 4 4 8-8" /></svg>{:else}<svg viewBox="0 0 20 20"><path d="M5 15 15 5M5 5h10v10" /></svg>{/if}
          </span>
          <DetentText lang={german ? 'de' : 'en'} {morph} text={copy.labels[status]!} />
        </button>
      {:else}
        <div class="large"><DetentText lang={german ? 'de' : 'en'} {morph} {text} /></div>
      {/if}
      {#if tab === 'Custom'}
        <div class="custom">
          <label>First label<input bind:value={first} maxlength="80" /></label>
          <label>Second label<input bind:value={second} maxlength="80" /></label>
        </div>
      {/if}
    </div>

    <div class="controls">
      {#if tab !== 'Button'}
        <button type="button" class="back" aria-label={tab === 'Morphing' ? 'Previous word' : 'Switch labels'} onclick={() => (tab === 'Morphing' ? stepWord(-1) : flip())}>{@render icon('back')}</button>
      {/if}
      <button type="button" class="next" data-secondary={tab === 'Button' ? '' : undefined} disabled={tab === 'Button' && status === 0} onclick={() => (tab === 'Button' ? reset() : tab === 'Morphing' ? stepWord(1) : flip())}>
        {tab === 'Button' ? 'Replay' : tab === 'Morphing' ? 'Next word' : 'Switch labels'}
        {@render icon(tab === 'Button' ? 'replay' : 'next')}
      </button>
    </div>
    <p class="caption">{captions[tab]}</p>
    <span class="status" role="status" aria-live="polite" aria-atomic="true">{announcement}</span>
  </div>

  <RecipeCode {code} tag="DetentText" attrs={['text', 'morph']} />
</div>

<style>
  .recipe { --fg: #111; --bg: #fff; --muted: #888; --line: #ddd; --accent: #ff5a1f; width: 100%; min-width: 0; font-family: system-ui, sans-serif; }
  .recipe > :global(.code) { margin-top: 14px; }

  .demo { display: grid; justify-items: center; width: 100%; gap: 16px; padding: 12px 0; }
  .toolbar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; width: 100%; }
  .tabs { display: flex; gap: 14px; font-size: 12px; }
  .tabs button { border: 0; background: none; color: var(--muted); font: inherit; padding: 6px 0; cursor: pointer; }
  .tabs button[aria-pressed='true'] { color: var(--fg); font-weight: 600; }
  .tools { display: flex; align-items: center; gap: 16px; }
  .locale { display: inline-flex; align-items: center; gap: 6px; border: 0; background: none; color: var(--muted); font: 11px ui-monospace, monospace; padding: 6px 0; cursor: pointer; }
  .morph { display: flex; align-items: center; gap: 10px; justify-self: end; border: 0; padding: 4px 0; background: none; color: var(--muted); font: 12px system-ui, sans-serif; cursor: pointer; }
  .switch { display: block; width: 28px; height: 16px; padding: 2px; border-radius: 99px; background: var(--line); box-sizing: border-box; transition: background-color 150ms ease; }
  .switch > span { display: block; width: 12px; height: 12px; border-radius: 50%; background: var(--bg); box-shadow: 0 1px 2px #0002; transition: transform 180ms ease; }
  .morph[aria-checked='true'] .switch { background: var(--fg); }
  .morph[aria-checked='true'] .switch > span { transform: translateX(12px); }

  .stage { display: grid; place-items: center; align-content: center; gap: 12px; min-height: 154px; width: 100%; }
  .large { display: flex; justify-content: center; width: 100%; font-size: clamp(26px, 6vw, 40px); font-weight: 550; letter-spacing: -0.035em; line-height: 1.2; min-width: 0; max-width: 100%; overflow: hidden; padding: 12px 0; }

  .action { min-height: 48px; display: inline-flex; overflow: hidden; align-items: center; gap: 9px; padding: 10px 20px 10px 17px; border: 0; border-radius: 999px; background: var(--fg); color: var(--bg); font: 500 15px system-ui, sans-serif; cursor: pointer; transition: background-color 200ms ease, color 200ms ease, transform 150ms ease; -webkit-tap-highlight-color: transparent; }
  /* Sent: a green wash over the page, the label back in the text colour, and a green check. */
  .action[data-sent] { background: color-mix(in srgb, #16a34a 13%, var(--bg)); color: var(--fg); }
  .action[aria-disabled='true'] { cursor: default; }
  .action:not([aria-disabled='true']):active { transform: scale(0.97); }
  .icon { display: grid; place-items: center; width: 18px; height: 18px; flex: none; }
  .icon svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
  .action[data-sent] .icon { color: #16a34a; }

  .custom { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 12px; width: 100%; max-width: 360px; font: 12px system-ui, sans-serif; color: var(--muted); }
  .custom label { display: grid; gap: 8px; margin: 0; }
  .custom input { min-width: 0; width: 100%; box-sizing: border-box; border: 1px solid var(--line); border-radius: 8px; padding: 9px 12px; background: var(--bg); color: var(--fg); font: inherit; }

  .controls { display: flex; gap: 8px; font-size: 13px; }
  .controls button { display: inline-flex; align-items: center; justify-content: center; gap: 14px; height: 36px; border-radius: 99px; border: 0; font: inherit; cursor: pointer; transition: transform 150ms ease, background-color 150ms ease; }
  .back { width: 36px; background: none; color: var(--fg); box-shadow: inset 0 0 0 1px var(--line); }
  .next { padding: 0 18px; background: var(--fg); color: var(--bg); }
  .next[data-secondary] { background: transparent; color: var(--muted); box-shadow: inset 0 0 0 1px var(--line); }
  .next :global(svg) { opacity: 0.65; }
  .next:disabled { opacity: 0.4; cursor: default; }
  .controls button:not(:disabled):active { transform: scale(0.96); }
  .demo button:focus-visible { outline: 2px solid var(--accent); outline-offset: 4px; }
  .caption { font: 12px/1.4 system-ui, sans-serif; color: var(--muted); margin: 0; text-align: center; min-height: 34px; }
  .status { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }

  @media (prefers-reduced-motion: reduce) {
    .action, .switch, .switch > span, .controls button { transition: none; }
  }
  @media (prefers-color-scheme: dark) {
    .recipe { --fg: #ededed; --bg: #0a0a0a; --line: #333; }
  }
</style>
