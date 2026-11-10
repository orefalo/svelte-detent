<script lang="ts">
  // In your app: import { Detent, DetentText } from 'svelte-detent'
  import { tick } from 'svelte'
  import { Detent, DetentText } from '../../src/lib'

  const digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '✓']
  const rules = [
    { label: '8 or more characters', test: (s: string) => [...s].length >= 8 },
    { label: 'Includes a digit', test: (s: string) => /\p{N}/u.test(s) },
    { label: 'One capital letter', test: (s: string) => /\p{Lu}/u.test(s) },
    { label: 'A special character', test: (s: string) => /[^\p{L}\p{N}\s]/u.test(s) },
  ]
  /** What the drums show before you type. */
  const resting = ['3', '7', '8', '9']
  /** Typing turns the drums to a digit that depends on the text and the drum (a small hash), until its rule is met. */
  const digitFor = (text: string, drum: number) => {
    let h = 0x811c9dc5 ^ drum
    for (const ch of text) h = Math.imul(h ^ ch.codePointAt(0)!, 0x1000193)
    return String((h >>> 0) % 10)
  }

  const id = $props.id()
  let input = $state<HTMLInputElement | null>(null)
  let password = $state('')
  let shown = $state(false)
  let phase = $state<'idle' | 'creating' | 'done'>('idle')
  const met = $derived(rules.map((r) => r.test(password)))
  const ok = $derived(met.every(Boolean))

  $effect(() => {
    if (phase !== 'creating') return
    const timer = setTimeout(() => (phase = 'done'), 1100)
    return () => clearTimeout(timer)
  })

  /** Show or hide the password without losing the caret or the selection. */
  async function toggleEye() {
    const el = input
    const range = el ? [el.selectionStart ?? el.value.length, el.selectionEnd ?? el.value.length] : null
    shown = !shown
    await tick()
    if (el && range && document.activeElement === el) el.setSelectionRange(range[0]!, range[1]!)
  }
</script>

<div class="pw">
  <div class="pw-lock" class:pw-open={ok} aria-hidden="true">
    <div class="pw-window">
      {#each rules as rule, a (rule.label)}
        <div class="pw-drum">
          <Detent
            items={digits}
            value={met[a] ? '✓' : password ? digitFor(password, a) : resting[a]}
            loop
            disabled
            label={rule.label}
            itemHeight={28}
            visibleCount={3}
            width={19}
            perspective={240}
            curvature={0.9}
            fade={0.25}
            indicator={{ shape: 'none' }}
            magnify={false}
            preset="snappy"
            motionBlur={2}
            style="--detent-fg:#ededed"
          >
            {#snippet item(v: string)}
              {#if v === '✓'}
                <svg class="pw-check" viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M4.5 10.5l3.6 3.4L15.5 6.5" /></svg>
              {:else}
                <span class="pw-digit">{v}</span>
              {/if}
            {/snippet}
          </Detent>
        </div>
      {/each}
    </div>
  </div>

  <p class="pw-title">Create a password</p>

  <div class="pw-field">
    <input
      bind:this={input}
      {id}
      type={shown ? 'text' : 'password'}
      value={password}
      oninput={(e) => ((password = e.currentTarget.value), (phase = 'idle'))}
      placeholder="Password"
      aria-label="Password"
      aria-describedby="{id}-rules"
      autocomplete="new-password"
      autocapitalize="off"
      spellcheck={false}
    />
    <button type="button" class="pw-eye" aria-label={shown ? 'Hide password' : 'Show password'} aria-controls={id} aria-pressed={shown} onpointerdown={(e) => e.preventDefault()} onclick={toggleEye}>
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" class={shown ? 'pw-crossed' : undefined}>
        <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
        <circle cx="12" cy="12" r="3" class="pw-pupil" />
        <path d="M4 4l16 16" pathLength="1" class="pw-gap" />
        <path d="M4 4l16 16" pathLength="1" class="pw-slash" />
      </svg>
    </button>
  </div>

  <ul id="{id}-rules" class="pw-rules">
    {#each rules as rule, i (rule.label)}
      <li class={met[i] ? 'pw-met' : undefined}>
        <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="9" /><path d="M6 10.4l2.6 2.5L14 7.4" pathLength="1" /></svg>
        {rule.label}<span class="pw-sr">{met[i] ? ', met' : ', not met'}</span>
      </li>
    {/each}
  </ul>
  <p class="pw-sr" aria-live="polite">{met.filter(Boolean).length} of {rules.length} requirements met</p>

  <button type="button" class="pw-submit pw-{phase}" disabled={!ok || phase === 'creating'} aria-disabled={phase === 'done' || undefined} onclick={() => phase === 'idle' && (phase = 'creating')}>
    <DetentText text={phase === 'creating' ? 'Securing…' : phase === 'done' ? 'Password saved' : 'Save password'} />
  </button>
  <p class="pw-legal">You can change it anytime in Settings, under Security.</p>
</div>

<style>
  .pw { --pw-ok: #1f9d55; --pw-ease: cubic-bezier(0.23, 1, 0.32, 1); --fg: #0a0a0a; --bg: #fff; --muted: #6b6b6b; --line: #00000014; --band: #0000000a;
    width: 100%; max-width: 320px; display: grid; justify-items: center; gap: 16px; padding: 8px 4px; font: 15px/1.4 'Geist', system-ui, sans-serif; color: var(--fg); }
  :global(:root[data-theme='dark']) .pw { --pw-ok: #4ade80; }
  @media (prefers-color-scheme: dark) { :global(:root:not([data-theme='light'])) .pw { --pw-ok: #4ade80; --fg: #ededed; --bg: #0a0a0a; --muted: #8f8f8f; --line: #ffffff1a; --band: #ffffff0f; } }
  .pw-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }

  /* The lock: a dark, softly lit body with a recessed window of four drums. */
  .pw-lock { width: 116px; height: 116px; border-radius: 27px; display: grid; place-items: center;
    background: linear-gradient(165deg, #4b4b4f, #232325 55%, #1a1a1c);
    box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.14), inset 0 -1px 0 rgb(0 0 0 / 0.6), 0 14px 30px -10px rgb(0 0 0 / 0.55), 0 2px 5px rgb(0 0 0 / 0.18); }
  .pw-window { position: relative; display: flex; gap: 3px; padding: 4px 7px; border-radius: 14px; background: #111112;
    box-shadow: inset 0 3px 8px rgb(0 0 0 / 0.85), inset 0 0 0 1px rgb(0 0 0 / 0.7), 0 1px 0 rgb(255 255 255 / 0.07), 0 0 0 0 transparent;
    transition: box-shadow 250ms var(--pw-ease); }
  .pw-open .pw-window { box-shadow: inset 0 3px 8px rgb(0 0 0 / 0.85), inset 0 0 0 1px rgb(74 222 128 / 0.28), 0 1px 0 rgb(255 255 255 / 0.07), 0 0 18px -4px rgb(74 222 128 / 0.45); }
  .pw-drum { position: relative; font: 500 24px/1 'Geist Mono', ui-monospace, monospace; }
  /* Tall, narrow numerals, like a printed drum: the same glyph, drawn condensed. */
  .pw-digit { display: inline-block; transform: scaleX(0.84); }
  /* A cylinder's light: dark at the top and bottom, a faint highlight across the middle. */
  .pw-drum::after { content: ''; position: absolute; inset: 0; pointer-events: none; border-radius: 3px;
    background: linear-gradient(to bottom, rgb(0 0 0 / 0.72), transparent 32%, rgb(255 255 255 / 0.05) 50%, transparent 68%, rgb(0 0 0 / 0.72)); }
  /* Perforated dividers between the drums. */
  .pw-drum + .pw-drum::before { content: ''; position: absolute; left: -3px; top: 2px; bottom: 2px; width: 2px; z-index: 1;
    background: repeating-linear-gradient(to bottom, rgb(255 255 255 / 0.16) 0 1px, transparent 1px 3px); }
  .pw-check { display: block; fill: none; stroke: #4ade80; stroke-width: 2.6; stroke-linecap: round; stroke-linejoin: round; filter: drop-shadow(0 0 4px rgb(74 222 128 / 0.5)); }

  .pw-title { margin: 6px 0 2px; font: 600 22px/1.25 'Geist', system-ui, sans-serif; letter-spacing: -0.02em; color: var(--fg); }

  .pw-field { position: relative; width: 100%; }
  .pw-field input { box-sizing: border-box; width: 100%; height: 50px; padding: 0 50px 0 16px; border-radius: 15px; border: 1px solid var(--line);
    background: var(--bg); color: var(--fg); font: 16px/1 'Geist Mono', ui-monospace, monospace; letter-spacing: 0; outline: none;
    box-shadow: 0 1px 2px rgb(0 0 0 / 0.04); transition: border-color 150ms var(--pw-ease), box-shadow 150ms var(--pw-ease); }
  /* What you type is set in mono, dots included; the placeholder stays in the sans of the rest of the form. */
  .pw-field input::placeholder { color: var(--muted); font-family: 'Geist', system-ui, sans-serif; }
  .pw-field input:focus-visible { outline: none; border-color: color-mix(in srgb, var(--fg) 30%, transparent); box-shadow: 0 0 0 4px color-mix(in srgb, var(--fg) 7%, transparent); }
  .pw-eye { position: absolute; right: 6px; top: 50%; width: 38px; height: 38px; margin-top: -19px; display: grid; place-items: center; border: 0; border-radius: 11px;
    background: none; color: var(--muted); cursor: pointer; -webkit-tap-highlight-color: transparent; transition: color 150ms var(--pw-ease), background-color 150ms var(--pw-ease), transform 150ms var(--pw-ease); }
  .pw-eye:active { transform: scale(0.92); }
  @media (hover: hover) { .pw-eye:hover { color: var(--fg); background: var(--band); } }
  .pw-eye svg { fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; overflow: visible; }
  .pw-pupil { transform-origin: 12px 12px; transition: transform 200ms var(--pw-ease); }
  .pw-crossed .pw-pupil { transform: scale(0.6); }
  .pw-slash, .pw-gap { stroke-dasharray: 1; stroke-dashoffset: 1; transition: stroke-dashoffset 200ms var(--pw-ease); }
  .pw-gap { stroke: var(--bg); stroke-width: 4.5; }
  @media (hover: hover) { .pw-eye:hover .pw-gap { stroke: color-mix(in srgb, var(--bg) 96%, var(--fg)); } }
  .pw-crossed .pw-slash, .pw-crossed .pw-gap { stroke-dashoffset: 0; }

  .pw-rules { list-style: none; margin: 2px 0 0; padding: 0; width: 100%; display: grid; gap: 10px; }
  .pw-rules li { display: flex; align-items: center; gap: 11px; margin: 0; font-size: 13.5px; color: var(--muted); transition: color 200ms var(--pw-ease); }
  .pw-rules svg { width: 20px; height: 20px; flex: none; overflow: visible; }
  .pw-rules circle { fill: transparent; stroke: var(--line); stroke-width: 1.5; transform-origin: 10px 10px;
    transition: fill 200ms var(--pw-ease), stroke 200ms var(--pw-ease), transform 250ms var(--pw-ease); }
  .pw-rules path { fill: none; stroke: #fff; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 1; stroke-dashoffset: 1; transition: stroke-dashoffset 150ms var(--pw-ease); }
  .pw-rules .pw-met { color: var(--pw-ok); }
  .pw-met circle { fill: var(--pw-ok); stroke: var(--pw-ok); animation: pw-pop 300ms var(--pw-ease); }
  .pw-met path { stroke-dashoffset: 0; transition-duration: 220ms; transition-delay: 60ms; }
  @keyframes pw-pop { from { transform: scale(0.72); } }

  .pw-submit { width: 100%; height: 50px; margin-top: 6px; border-radius: 15px; border: 1px solid var(--line); background: var(--band);
    color: var(--muted); font: inherit; font-size: 16px; font-weight: 550; cursor: not-allowed; -webkit-tap-highlight-color: transparent;
    transition: background-color 200ms var(--pw-ease), color 200ms var(--pw-ease), border-color 200ms var(--pw-ease), transform 150ms var(--pw-ease); }
  .pw-submit:enabled { background: var(--fg); border-color: transparent; color: var(--bg); cursor: pointer; }
  .pw-submit:enabled:active { transform: scale(0.98); }
  .pw-submit.pw-creating { background: var(--fg); border-color: transparent; color: var(--bg); opacity: 0.75; cursor: progress; }
  .pw-submit.pw-done { background: var(--pw-ok); border-color: transparent; color: #fff; cursor: default; }
  .pw-legal { margin: 2px 0 0; max-width: 270px; text-align: center; font: 12.5px/1.45 'Geist', system-ui, sans-serif; color: var(--muted); }
  @media (prefers-reduced-motion: reduce) { .pw :global(*) { transition: none !important; animation: none !important; } }
</style>
