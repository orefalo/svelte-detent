<script lang="ts">
  // In your app: import { Detent, DetentNumber, DetentText } from 'svelte-detent'
  import { onDestroy, onMount } from 'svelte'
  import { ticks } from '@hayderkg/detent/feedback'
  import { Detent, DetentNumber, DetentText } from '../../src/lib'
  import { watchVisible } from '../site/beyond-helpers'
  import { createFmAudio, type FmStation } from '../site/fm-radio-audio'

  const stations: FmStation[] = [
    { at: 881, name: 'Tidewater', kind: 'Ambient', voice: 'bell', root: 220, scale: [0, 2, 7, 9, 12, 14], bpm: 54 },
    { at: 903, name: 'Blue Hour', kind: 'Jazz', voice: 'keys', root: 196, scale: [0, 3, 5, 7, 10, 14, 15], bpm: 92 },
    { at: 929, name: 'Night Owl', kind: 'Lo-fi', voice: 'pluck', root: 174.6, scale: [0, 3, 7, 10, 12, 15], bpm: 74 },
    { at: 955, name: 'Metro Talk', kind: 'News', voice: 'talk', root: 130, scale: [0], bpm: 300 },
    { at: 987, name: 'Concert Hall', kind: 'Classical', voice: 'keys', root: 261.6, scale: [0, 4, 7, 11, 12, 16, 19], bpm: 66 },
    { at: 1011, name: 'Pulse', kind: 'Electronic', voice: 'pulse', root: 110, scale: [0, 7, 12, 15, 19, 24], bpm: 120 },
    { at: 1045, name: 'Open Road', kind: 'Folk', voice: 'pluck', root: 196, scale: [0, 2, 4, 7, 9, 12], bpm: 100 },
    { at: 1069, name: 'Sundown', kind: 'Soul', voice: 'keys', root: 155.6, scale: [0, 3, 5, 7, 10, 12], bpm: 84 },
  ]
  /** The five preset keys. */
  const presets = [stations[1]!, stations[2]!, stations[4]!, stations[5]!, stations[6]!]
  const frequencies = Array.from({ length: 206 }, (_, i) => 875 + i)
  const byFrequency = new Map(stations.map((s) => [s.at, s]))
  const mhz = (v: number) => (v / 10).toFixed(1)
  const tick = ticks({ sound: { volume: 0.14 }, haptics: true })
  /** How clearly each station comes in at frequency `f`: 1 right on it, 0 three steps away. */
  const signals = (f: number) => stations.map((s) => Math.max(0, 1 - Math.abs(f - s.at) / 3) ** 1.4)

  let freq = $state(987)
  let listening = $state(false)
  let station = $state.raw<FmStation | null>(byFrequency.get(987) ?? null)
  let visible = $state(false)
  let root = $state<HTMLElement | null>(null)
  let body = $state<HTMLElement | null>(null)
  let engine: ReturnType<typeof createFmAudio> | null = null
  /** The dial's position in 0.1 MHz, between steps too (the signal follows the needle frame by frame). */
  let position = 987

  /** Frame by frame: signal strength to the display (a CSS variable, no re-render), the station heard, and the sound. */
  function follow(f: number) {
    position = f
    const s = signals(f)
    const best = Math.max(...s)
    const el = body
    if (el) {
      el.style.setProperty('--fm-signal', best.toFixed(3))
      el.dataset.bars = String(Math.round(5 * best))
      el.toggleAttribute('data-stereo', best > 0.82)
    }
    station = best > 0.3 ? stations[s.indexOf(best)]! : null
    engine?.tune(s)
  }

  onMount(() => {
    follow(position)
    return root ? watchVisible(root, (v) => (visible = v)) : undefined
  })
  // The sound runs only while you listen, and only while the radio is on screen.
  $effect(() => {
    if (!listening) {
      engine?.play(false)
      return
    }
    engine ??= createFmAudio(stations)
    engine.tune(signals(position))
    engine.play(visible)
  })
  onDestroy(() => engine?.close())

  /** The next station up or down the dial, wrapping round. */
  function seek(dir: 1 | -1) {
    const list = dir > 0 ? stations : [...stations].reverse()
    freq = (list.find((s) => (dir > 0 ? s.at > freq : s.at < freq)) ?? list[0]!).at
  }
  const heard = $derived(byFrequency.get(freq))
</script>

<div bind:this={root} class="fm">
  <div bind:this={body} class="fm-body" data-on={listening || undefined}>
    <div class="fm-display">
      <div class="fm-freq" aria-hidden="true">
        <DetentNumber value={freq / 10} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} locales="en-US" snapDuration={260} /><span class="fm-unit">MHz</span>
      </div>
      <div class="fm-meters" aria-hidden="true">
        <span class="fm-bars">{#each [1, 2, 3, 4, 5] as n (n)}<i style:height="{3 + 2 * n}px"></i>{/each}</span>
        <span class="fm-stereo">Stereo</span>
      </div>
      <div class="fm-station" aria-hidden="true">
        <DetentText class="fm-name" snapDuration={420} text={station ? station.name : 'No signal'} />
        <span class="fm-kind"><DetentText snapDuration={420} text={station ? station.kind : ' '} /></span>
      </div>
      <span class="fm-sr" role="status">{heard ? `${mhz(freq)} MHz, ${heard.name}, ${heard.kind}` : `${mhz(freq)} MHz, no station`}</span>
    </div>

    <div class="fm-dial">
      <Detent
        items={frequencies}
        bind:value={freq}
        changeOn="tick"
        onTick={tick}
        onScrollProgress={(rows) => follow(875 + rows)}
        getLabel={(v) => `${mhz(v)} MHz${byFrequency.has(v) ? `, ${byFrequency.get(v)!.name}` : ''}`}
        label="Frequency"
        orientation="horizontal"
        itemHeight={8}
        visibleCount={41}
        height={46}
        curvature={0.35}
        fade={0.05}
        dim={0}
        magnify={false}
        grip={0.3}
        indicator={{ shape: 'needle', color: '#ff4f2a' }}
        style="width:100%"
      >
        {#snippet item(v: number)}
          <span class="fm-tick" data-major={v % 10 === 0 || undefined} data-half={v % 5 === 0 || undefined}>
            <b data-station={byFrequency.has(v) || undefined}></b>
            <i></i>
            <span>{v % 20 === 0 ? v / 10 : ''}</span>
          </span>
        {/snippet}
      </Detent>
    </div>

    <div class="fm-presets" role="group" aria-label="Presets">
      {#each presets as p, i (p.at)}
        <button type="button" aria-label="Preset {i + 1}: {p.name}, {mhz(p.at)} MHz" aria-pressed={freq === p.at} onclick={() => (freq = p.at)}>
          <span>{i + 1}</span>
          <small>{mhz(p.at)}</small>
        </button>
      {/each}
    </div>

    <div class="fm-controls">
      <button type="button" class="fm-listen" aria-pressed={listening} onclick={() => (listening = !listening)}>
        <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
          <path class="fm-cone" d="M3 7.8h2.3l3.5-3.1v10.6l-3.5-3.1H3z" />
          <path class="fm-wave fm-wave1" d="M11.7 7.6a3.3 3.3 0 0 1 0 4.8" />
          <path class="fm-wave fm-wave2" d="M14.2 5.4a6.5 6.5 0 0 1 0 9.2" />
        </svg>
        <DetentText text={listening ? 'Listening' : 'Listen'} />
      </button>
      <span class="fm-grille" aria-hidden="true"></span>
      <div class="fm-seek">
        <button type="button" aria-label="Previous station" onclick={() => seek(-1)}>
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M8 3.5v9L2.5 8zM14 3.5v9L8.5 8z" /></svg>
        </button>
        <button type="button" aria-label="Next station" onclick={() => seek(1)}>
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M2 3.5v9L7.5 8zM8 3.5v9L13.5 8z" /></svg>
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  .fm { --fm-ease: cubic-bezier(0.23, 1, 0.32, 1); --fm-amber: #ffb547; --fg: #0a0a0a; --bg: #fff; --muted: #6b6b6b; --line: #00000014; --band: #0000000a;
    width: 100%; max-width: 360px; display: grid; container-type: inline-size; font: 14px/1.4 'Geist', system-ui, sans-serif; color: var(--fg); }
  @media (prefers-color-scheme: dark) { .fm { --fg: #ededed; --bg: #0a0a0a; --muted: #8f8f8f; --line: #ffffff1a; --band: #ffffff0f; } }
  .fm-body { --fm-signal: 0; display: grid; gap: 14px; padding: 14px; border-radius: 22px; background: var(--bg);
    box-shadow: 0 0 0 1px var(--line), 0 1px 2px rgb(0 0 0 / 0.05), 0 18px 36px -24px rgb(0 0 0 / 0.35); }
  /* The display: a dark window with an amber readout that glows a little more when the station comes in clearly. */
  .fm-display { position: relative; display: grid; grid-template-columns: 1fr auto; align-items: end; gap: 6px 12px; padding: 14px 16px 13px; border-radius: 12px;
    background: radial-gradient(120% 140% at 30% 0%, #1d1b17, #0c0b0a); color: var(--fm-amber);
    box-shadow: inset 0 2px 6px rgb(0 0 0 / 0.7), inset 0 0 0 1px rgb(0 0 0 / 0.6), 0 1px 0 rgb(255 255 255 / 0.05); }
  .fm-display::after { content: ''; position: absolute; inset: 0; border-radius: inherit; pointer-events: none; background: linear-gradient(170deg, rgb(255 255 255 / 0.07), transparent 40%); }
  .fm-freq { display: flex; align-items: baseline; gap: 6px; font: 500 30px/1.15 'Geist Mono', ui-monospace, monospace; letter-spacing: -0.02em;
    font-variant-numeric: tabular-nums; text-shadow: 0 0 calc(3px + 8px * var(--fm-signal)) rgb(255 181 71 / calc(0.1 + 0.24 * var(--fm-signal))); }
  .fm-unit { font-size: 12px; letter-spacing: 0.08em; opacity: 0.6; }
  .fm-meters { display: grid; justify-items: end; gap: 6px; padding-bottom: 6px; }
  .fm-bars { display: flex; align-items: flex-end; gap: 2px; height: 13px; }
  .fm-bars i { width: 3px; border-radius: 1px; background: currentColor; opacity: 0.16; transition: opacity 120ms var(--fm-ease); }
  .fm-body[data-bars='1'] .fm-bars i:nth-child(-n + 1), .fm-body[data-bars='2'] .fm-bars i:nth-child(-n + 2), .fm-body[data-bars='3'] .fm-bars i:nth-child(-n + 3),
  .fm-body[data-bars='4'] .fm-bars i:nth-child(-n + 4), .fm-body[data-bars='5'] .fm-bars i { opacity: 1; }
  .fm-stereo { font: 600 8.5px/1 'Geist Mono', ui-monospace, monospace; letter-spacing: 0.14em; text-transform: uppercase; padding: 2px 4px; border-radius: 3px;
    box-shadow: inset 0 0 0 1px currentColor; opacity: 0.16; transition: opacity 200ms var(--fm-ease), box-shadow 200ms var(--fm-ease); }
  .fm-body[data-stereo] .fm-stereo { opacity: 1; box-shadow: inset 0 0 0 1px currentColor, 0 0 6px rgb(255 181 71 / 0.25); }
  .fm-station { grid-column: 1 / -1; display: flex; align-items: baseline; justify-content: space-between; gap: 10px; padding-top: 8px; border-top: 1px solid rgb(255 181 71 / 0.14);
    font: 500 13px/1.3 'Geist Mono', ui-monospace, monospace; letter-spacing: 0.02em; white-space: nowrap; }
  .fm-station :global(.fm-name) { transition: opacity 200ms var(--fm-ease); }
  .fm-kind { font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; opacity: 0.6; }
  .fm-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  /* The dial: a printed scale. Every 1 MHz a long mark, every 2 MHz its number, and a dot over each station. */
  .fm-dial { margin: 0 -4px; color: var(--fg); }
  .fm-tick { display: grid; justify-items: center; align-self: center; gap: 3px; width: 8px; }
  .fm-tick b { width: 3px; height: 3px; border-radius: 50%; background: transparent; }
  .fm-tick b[data-station] { background: var(--fm-amber); box-shadow: 0 0 4px rgb(255 181 71 / 0.6); }
  .fm-tick i { width: 1px; height: 7px; background: currentColor; opacity: 0.35; }
  .fm-tick[data-half] i { height: 10px; opacity: 0.5; }
  .fm-tick[data-major] i { width: 1.5px; height: 15px; opacity: 0.9; }
  .fm-tick span { height: 12px; font: 500 9.5px/12px 'Geist Mono', ui-monospace, monospace; color: var(--muted); white-space: nowrap; }
  .fm-controls { display: flex; align-items: center; gap: 10px; }
  .fm-grille { flex: 1; align-self: stretch; margin: 4px 0; border-radius: 6px; opacity: 0.5;
    background: radial-gradient(circle at center, color-mix(in srgb, var(--fg) 45%, transparent) 1.1px, transparent 1.5px) center / 6px 6px; }
  .fm-body[data-on] .fm-grille { animation: fm-speaker 900ms ease-in-out infinite alternate; }
  @keyframes fm-speaker { to { opacity: 0.72; } }
  .fm button { display: inline-flex; align-items: center; justify-content: center; gap: 7px; height: 32px; padding: 0 10px; border: 0; border-radius: 9px; background: var(--band);
    color: var(--fg); font: 500 13px/1 'Geist', system-ui, sans-serif; cursor: pointer; -webkit-tap-highlight-color: transparent;
    transition: background-color 150ms var(--fm-ease), color 150ms var(--fm-ease), transform 150ms var(--fm-ease), box-shadow 150ms var(--fm-ease); }
  .fm button:active { transform: scale(0.95); }
  .fm button:focus-visible { outline: 2px solid var(--fg); outline-offset: 2px; }
  .fm button svg { fill: currentColor; }
  /* Waves are strokes, the cone a solid shape (rounded by a stroke of its own colour). */
  .fm .fm-listen svg { fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
  .fm-listen .fm-cone { fill: currentColor; stroke-width: 1.2; }
  .fm-wave { opacity: 0; transition: opacity 200ms var(--fm-ease); }
  .fm-listen[aria-pressed='true'] { background: var(--fg); color: var(--bg); }
  .fm-listen[aria-pressed='true'] .fm-wave { opacity: 1; animation: fm-wave 1.6s ease-in-out infinite; }
  .fm-listen[aria-pressed='true'] .fm-wave2 { animation-delay: 0.2s; }
  @keyframes fm-wave { 50% { opacity: 0.35; } }
  .fm-listen { padding: 0 12px 0 10px; }
  /* Preset keys, like a car radio's: the number, and the frequency it holds. */
  .fm-presets { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 5px; }
  .fm .fm-presets button { position: relative; display: grid; align-content: center; gap: 3px; height: 44px; padding: 9px 0 0; background: none;
    box-shadow: inset 0 0 0 1px var(--line); font: 500 12.5px/1 'Geist Mono', ui-monospace, monospace; }
  /* A lamp on each key: lit amber on the one the dial is tuned to. */
  .fm .fm-presets button::before, .fm .fm-presets button::after { content: ''; position: absolute; left: 50%; width: 10px; margin-left: -5px; pointer-events: none; }
  .fm .fm-presets button::before { top: 5px; height: 2px; border-radius: 1px; background: linear-gradient(color-mix(in srgb, var(--fg) 10%, transparent), color-mix(in srgb, var(--fg) 18%, transparent));
    transition: opacity 200ms var(--fm-ease); }
  /* Lit: the lamp itself, a touch brighter at the top, and its light falling straight down (no spill to the sides). */
  .fm .fm-presets button::after { top: 7px; height: 9px; opacity: 0; background: linear-gradient(rgb(255 181 71 / 0.28), rgb(255 181 71 / 0)); transition: opacity 200ms var(--fm-ease); }
  .fm .fm-presets button[aria-pressed='true']::before { background: linear-gradient(#ffd892, #f5a524); }
  .fm .fm-presets button[aria-pressed='true']::after { opacity: 1; }
  .fm-presets small { font-size: 9px; line-height: 1; color: var(--muted); }
  .fm-seek { display: flex; gap: 4px; }
  .fm-seek button { width: 32px; padding: 0; }
  @media (hover: hover) and (pointer: fine) {
    .fm button:hover { background: color-mix(in srgb, var(--fg) 10%, transparent); }
    .fm-listen[aria-pressed='true']:hover { background: color-mix(in srgb, var(--fg) 86%, transparent); }
  }
  @media (prefers-reduced-motion: reduce) { .fm :global(*) { transition: none !important; animation: none !important; } }
</style>
