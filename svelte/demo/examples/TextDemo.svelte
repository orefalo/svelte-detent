<script lang="ts">
  // In your app: import { DetentText } from '@hayderkg/detent-svelte'
  import { onDestroy } from 'svelte'
  import { DetentText } from '../../src/lib'

  type Tab = 'button' | 'morphing' | 'custom'
  type Lang = 'en' | 'de'
  const tabs: { id: Tab; label: string }[] = [
    { id: 'button', label: 'Button' },
    { id: 'morphing', label: 'Morphing' },
    { id: 'custom', label: 'Custom' },
  ]
  const copy = {
    en: {
      status: { idle: 'Send', sending: 'Sending…', sent: 'Sent' },
      words: ['play', 'playing', 'replaying', 'replayed'],
      labels: ['Hello, Detent', 'Hello, world'],
    },
    de: {
      status: { idle: 'Senden', sending: 'Wird gesendet…', sent: 'Gesendet' },
      words: ['spielen', 'mitspielen', 'mitgespielt', 'gespielt'],
      labels: ['Hallo, Detent', 'Hallo, Welt'],
    },
  } as const
  const captions: Record<Tab, string> = {
    button: 'One button, from send to sent. Roll the whole label or try morphing.',
    morphing: 'Matching letters stay in place. Only the parts that change roll.',
    custom: 'Write two labels, then switch between them. No list of values required.',
  }
  const snippets: Record<Tab, string> = {
    button: `// morph={false} rolls the whole label.\n// status: 'Send' → 'Sending…' → 'Sent'\n<DetentText text={status} />`,
    morphing: `// Matching letters stay in place.\n<DetentText text={word} />`,
    custom: `// Pass the current label. No predefined list.\n<DetentText text={showSecond ? second : first} />`,
  }
  const importLine = `import { DetentText } from '@hayderkg/detent-svelte'`

  let tab = $state<Tab>('button')
  let lang = $state<Lang>('en')
  let morph = $state(true)

  // Button
  let status = $state<'idle' | 'sending' | 'sent'>('idle')
  let timer: ReturnType<typeof setTimeout> | undefined
  const send = () => {
    if (status !== 'idle') return
    status = 'sending'
    timer = setTimeout(() => (status = 'sent'), 1300)
  }
  const replay = () => {
    clearTimeout(timer)
    status = 'idle'
  }
  onDestroy(() => clearTimeout(timer))

  // Morphing
  let wordIndex = $state(0)
  const step = (d: number) => (wordIndex = (wordIndex + d + 4) % 4)

  // Custom: the two labels are yours to edit; switching language starts from its defaults.
  let first = $state<string>(copy.en.labels[0])
  let second = $state<string>(copy.en.labels[1])
  let showSecond = $state(false)
  const toggleLang = () => {
    lang = lang === 'en' ? 'de' : 'en'
    first = copy[lang].labels[0]
    second = copy[lang].labels[1]
  }

  const text = $derived(
    tab === 'button' ? copy[lang].status[status] : tab === 'morphing' ? copy[lang].words[wordIndex]! : showSecond ? second : first,
  )

  const full = $derived(`${importLine}\n\n${snippets[tab]}`)
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
  /** Light syntax colouring, in one pass so a replacement is never matched again. */
  const hl = (code: string) =>
    esc(code).replace(
      /(\/\/.*$)|('[^']*'|"[^"]*")|\b(import|from)\b|&lt;(DetentText)|\b(text|morph)=/gm,
      (_m, comment, str, kw, tag, attr) =>
        comment ? `<i class="c">${comment}</i>` : str ? `<i class="s">${str}</i>` : kw ? `<i class="k">${kw}</i>` : tag ? `&lt;<i class="t">${tag}</i>` : `<i class="a">${attr}</i>=`,
    )
  let copied = $state(false)
  async function copyCode() {
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
        <button type="button" role="tab" aria-selected={tab === t.id} aria-pressed={tab === t.id} class:on={tab === t.id} onclick={() => (tab = t.id)}>{t.label}</button>
      {/each}
    </div>
    <div class="right">
      <button type="button" class="lang" aria-label="Switch text to {lang === 'en' ? 'German' : 'English'}" onclick={toggleLang}>
        {lang.toUpperCase()}
        <svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true"><path d="M2 5.5h11M10.5 3 13 5.5 10.5 8M14 10.5H3M5.5 8 3 10.5 5.5 13" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" /></svg>
      </button>
      <span class="switch-label">Morphing</span>
      <button type="button" role="switch" aria-checked={morph} aria-label="Morphing" class="switch" class:on={morph} onclick={() => (morph = !morph)}><i></i></button>
    </div>
  </div>

  <div class="stage">
    {#if tab === 'button'}
      <button type="button" class="send" onclick={send} disabled={status === 'sending'}>
        <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><path d="M4 12 12 4M5.5 4H12v6.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>
        <DetentText {text} {morph} />
      </button>
      <button type="button" class="replay" disabled={status !== 'sent'} onclick={replay}>
        Replay
        <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path d="M13 8a5 5 0 1 1-1.6-3.7M13 2.5v3h-3" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" /></svg>
      </button>
    {:else}
      <div class="big"><DetentText {text} {morph} /></div>
      {#if tab === 'custom'}
        <div class="fields">
          <label><span>First label</span><input type="text" bind:value={first} /></label>
          <label><span>Second label</span><input type="text" bind:value={second} /></label>
        </div>
      {/if}
      <div class="steps">
        <button type="button" class="prev" aria-label="Previous {tab === 'morphing' ? 'word' : 'label'}" onclick={() => (tab === 'morphing' ? step(-1) : (showSecond = !showSecond))}>
          <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path d="M13 8H3m4-4L3 8l4 4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
        </button>
        <button type="button" class="next" aria-label={tab === 'morphing' ? 'Next word' : 'Switch labels'} onclick={() => (tab === 'morphing' ? step(1) : (showSecond = !showSecond))}>
          {tab === 'morphing' ? 'Next word' : 'Switch labels'}
          <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
        </button>
      </div>
    {/if}
  </div>
  <p class="caption">{captions[tab]}</p>

  <div class="code">
    <div class="head">
      <span>@hayderkg/detent-svelte</span>
      <button type="button" aria-label="Copy" onclick={copyCode}>{copied ? '✓' : 'copy'}</button>
    </div>
    <pre>{@html hl(full)}</pre>
  </div>
</div>

<style>
  .demo { display: grid; justify-items: center; gap: 16px; width: 100%; font-family: system-ui, sans-serif; }
  .bar { display: flex; justify-content: space-between; align-items: center; width: 100%; }
  .tabs { display: flex; gap: 12px; }
  .right { display: flex; align-items: center; gap: 12px; }
  .tabs button, .lang { border: 0; background: none; padding: 0; font: 500 11px/1 system-ui, sans-serif; color: #999; cursor: pointer; }
  .tabs button.on { color: #0a0a0a; font-weight: 600; }
  .lang { display: flex; align-items: center; gap: 4px; font-family: ui-monospace, monospace; color: #666; }
  .switch-label { font-size: 11px; color: #666; margin-right: -6px; }
  .switch { position: relative; width: 28px; height: 16px; padding: 0; border: 0; border-radius: 999px; background: #ddd; cursor: pointer; transition: background 0.2s; }
  .switch.on { background: #0a0a0a; }
  .switch i { position: absolute; top: 2px; left: 2px; width: 12px; height: 12px; border-radius: 50%; background: #fff; transition: transform 0.2s; }
  .switch.on i { transform: translateX(12px); }

  .stage { display: grid; justify-items: center; align-content: center; gap: 14px; min-height: 180px; width: 100%; }
  .big { font-size: 40px; font-weight: 550; letter-spacing: -0.02em; line-height: 1.2; }
  .send { display: flex; align-items: center; justify-content: center; gap: 8px; min-width: 100px; height: 48px; padding: 0 20px; border: 0; border-radius: 999px; background: #0a0a0a; color: #fff; font: 500 15px system-ui, sans-serif; cursor: pointer; }
  .send:disabled { cursor: default; }
  .replay { display: flex; align-items: center; gap: 6px; margin-top: 40px; padding: 6px 14px; border: 1px solid #e3e3e3; border-radius: 999px; background: none; color: inherit; font: 12px system-ui, sans-serif; cursor: pointer; }
  .replay:disabled { opacity: 0.35; cursor: default; }
  .fields { display: flex; gap: 12px; }
  .fields label { display: grid; gap: 4px; font-size: 10.5px; color: #888; }
  .fields input { width: 150px; height: 28px; padding: 0 10px; box-sizing: border-box; border: 1px solid #e3e3e3; border-radius: 8px; background: none; color: #0a0a0a; font: 500 11px system-ui, sans-serif; outline: none; }
  .fields input:focus { border-color: #999; }
  .steps { display: flex; align-items: center; gap: 6px; }
  .prev { display: grid; place-items: center; width: 28px; height: 28px; border-radius: 50%; border: 1px solid #e3e3e3; background: none; color: inherit; cursor: pointer; }
  .next { display: flex; align-items: center; gap: 8px; height: 28px; padding: 0 12px; border: 0; border-radius: 999px; background: #0a0a0a; color: #fff; font: 500 11px system-ui, sans-serif; cursor: pointer; }
  .caption { margin: 0; font-size: 11px; color: #777; text-align: center; }

  .code { width: 100%; border: 1px solid #ececec; border-radius: 10px; background: #fafafa; overflow: hidden; text-align: left; }
  .head { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; border-bottom: 1px solid #ececec; font: 11px ui-monospace, monospace; color: #888; }
  .head button { border: 0; background: none; font: inherit; color: #888; cursor: pointer; }
  pre { margin: 0; padding: 12px; font: 11.5px/1.7 ui-monospace, 'SF Mono', Menlo, monospace; overflow-x: auto; }
  pre :global(i) { font-style: normal; }
  pre :global(.k) { color: #d73a49; } pre :global(.s) { color: #1c4a8f; } pre :global(.t) { color: #3560d3; }
  pre :global(.a) { color: #6f42c1; } pre :global(.c) { color: #8a8a8a; }
  @media (prefers-color-scheme: dark) {
    .tabs button.on { color: #ededed; } .next, .send { background: #ededed; color: #0a0a0a; } .prev, .replay, .fields input { border-color: #333; color: #ededed; }
    .switch { background: #444; } .switch.on { background: #ededed; } .switch i { background: #0a0a0a; }
    .code { background: #111; border-color: #262626; } .head { border-color: #262626; }
    pre :global(.k) { color: #ff7b72; } pre :global(.s) { color: #a5d6ff; } pre :global(.t) { color: #79c0ff; } pre :global(.a) { color: #d2a8ff; }
  }
</style>
