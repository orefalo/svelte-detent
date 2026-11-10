<script lang="ts">
  // In your app: import { Detent, DetentText, presets, release, resolvePhysics, tau, ticks } from 'svelte-detent'
  import { onMount } from 'svelte'
  import { Detent, DetentText, presets, release, resolvePhysics, tau, ticks, type PresetName } from '../../src/lib'

  const items = Array.from({ length: 200 }, (_, i) => String(i))
  const names: PresetName[] = ['ios', 'scroll', 'snappy', 'heavy', 'elastic', 'linear']
  const tick = ticks({ sound: true, haptics: true })
  const defaultValue = '100'
  const x0 = Math.max(0, items.indexOf(defaultValue)).toFixed(2)

  const from = (n: PresetName) => ({ decay: presets[n].decay, ...presets[n].spring })
  const round = (n: number, digits = 3) => Math.round(n * 10 ** digits) / 10 ** digits

  let optimized = $state(true)
  let phys = $state(from('ios'))
  let preset = $state<PresetName | 'custom'>('ios')
  let copied = $state(false)

  let wheel = $state<HTMLElement | null>(null)
  let graph = $state<HTMLCanvasElement | null>(null)
  let vEl = $state<HTMLElement | null>(null)
  let oEl = $state<HTMLElement | null>(null)
  let sEl = $state<HTMLElement | null>(null)

  /** The live numbers: velocity (px/ms, from the change in offset), offset in rows, and the engine's state. */
  let last: { o: number; t: number } | undefined
  const readout = (offset: number) => {
    if (!oEl || !vEl || !sEl) return
    const now = performance.now()
    const v = last && now > last.t ? ((offset - last.o) * 40) / (now - last.t) : 0
    last = { o: offset, t: now }
    const state = wheel?.querySelector<HTMLElement>('[data-detent-ui]')?.dataset.state ?? 'idle'
    vEl.textContent = (state === 'idle' ? 0 : v).toFixed(2)
    oEl.textContent = offset.toFixed(2)
    sEl.textContent = state
  }

  interface Sample { t: number; x: number; v: number }
  /** What the graph draws: the last throw while you make it, or the planned throw when you move a slider. */
  let samples: Sample[] = []
  let recording = false
  let frame = 0

  const zeta = $derived(phys.damping / (2 * Math.sqrt(phys.stiffness * phys.mass)))
  const config = $derived(
    `{ decay: ${round(phys.decay, 4)}, spring: { stiffness: ${round(phys.stiffness, 1)}, damping: ${round(phys.damping, 1)}${phys.mass === 1 ? '' : `, mass: ${phys.mass}`} } }`,
  )
  const overshoot = $derived(Math.max(0, Math.min(1, (1 - zeta) / 0.7)))

  const set = (key: 'decay' | 'stiffness' | 'damping', value: number) => {
    preset = 'custom'
    phys = { ...phys, [key]: value }
  }
  const pick = (name: PresetName | 'custom') => {
    if (name === 'custom') return
    preset = name
    phys = from(name)
  }

  function draw() {
    frame = 0
    const c = graph
    if (!c || samples.length < 2) return
    const dpr = devicePixelRatio || 1
    const w = c.clientWidth
    const h = c.clientHeight
    if (c.width !== w * dpr) {
      c.width = w * dpr
      c.height = h * dpr
    }
    const g = c.getContext('2d')!
    g.setTransform(dpr, 0, 0, dpr, 0, 0)
    g.clearRect(0, 0, w, h)
    const css = getComputedStyle(c)
    const t0 = samples[0]!.t
    const span = Math.max(1200, samples.at(-1)!.t - t0)
    const xs = samples.map((s) => s.x)
    const lo = Math.min(...xs)
    const hi = Math.max(...xs, lo + 1)
    const vmax = Math.max(0.5, ...samples.map((s) => Math.abs(s.v)))
    const px = (t: number) => ((t - t0) / span) * (w - 16) + 8
    g.strokeStyle = css.getPropertyValue('--line')
    g.lineWidth = 1
    g.beginPath()
    g.moveTo(0, h / 2 + 0.5)
    g.lineTo(w, h / 2 + 0.5)
    g.stroke()
    const line = (color: string, y: (s: Sample) => number) => {
      g.strokeStyle = color
      g.lineWidth = 1.5
      g.beginPath()
      samples.forEach((s, i) => (i ? g.lineTo(px(s.t), y(s)) : g.moveTo(px(s.t), y(s))))
      g.stroke()
    }
    line(css.getPropertyValue('--fg'), (s) => h - 10 - ((s.x - lo) / (hi - lo)) * (h - 20))
    line(css.getPropertyValue('--accent'), (s) => h / 2 - (s.v / vmax) * (h / 2 - 10))
  }
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(draw)
  }

  // Moving a slider plots the throw those numbers would make (1.6 px/ms from rest).
  $effect(() => {
    const p = resolvePhysics({ spring: { stiffness: phys.stiffness, damping: phys.damping, mass: phys.mass }, decay: phys.decay })
    const m = release(0, 1.6, 40, { min: -1e6, max: 1e6, loop: false, count: 2e6 }, p)
    const out: Sample[] = []
    for (let t = 0; t <= m.duration + 120; t += 8) {
      const s = m.at(Math.min(t, m.duration))
      out.push({ t, x: s.x, v: t > m.duration ? 0 : s.v })
    }
    samples = out
    recording = false
    schedule()
  })
  onMount(() => () => cancelAnimationFrame(frame))

  const onProgress = (offset: number) => {
    readout(offset)
    if (!recording) return
    const now = performance.now()
    const prev = samples.at(-1)
    const v = prev && now > prev.t ? ((offset - prev.x / 40) * 40) / (now - prev.t) : 0
    samples.push({ t: now, x: 40 * offset, v })
    if (samples.length > 600) samples.shift()
    schedule()
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(config)
      copied = true
      setTimeout(() => (copied = false), 1200)
    } catch {
      /* clipboard unavailable */
    }
  }

  const sliders = [
    ['decay', 0.985, 0.999, 0.0005],
    ['stiffness', 50, 900, 10],
    ['damping', 5, 80, 0.5],
  ] as const
  const pct = (v: number, min: number, max: number) => `${Math.max(0, Math.min(100, ((v - min) / (max - min || 1)) * 100))}%`
</script>

<div class="tuner">
  <div class="tuner-wheel" bind:this={wheel}>
    <Detent
      {items}
      {defaultValue}
      label="Tuner"
      curvature={0.75}
      decay={phys.decay}
      spring={{ stiffness: phys.stiffness, damping: phys.damping, mass: phys.mass }}
      wheelMode={optimized ? 'auto' : 'smooth'}
      onTick={tick}
      onSpinStart={() => {
        recording = true
        samples = []
      }}
      onSpinEnd={() => readout(Number(oEl?.textContent ?? x0))}
      onScrollProgress={onProgress}
    />
    <dl class="readout mono" aria-hidden="true">
      <div><dt>px/ms</dt><dd bind:this={vEl}>0.00</dd></div>
      <div><dt>offset</dt><dd bind:this={oEl}>{x0}</dd></div>
      <div><dt>state</dt><dd bind:this={sEl}>idle</dd></div>
    </dl>
    <p class="tuner-keys mono" aria-hidden="true">↑ ↓ · Page Up/Down · Home/End · type “t”</p>
    <button type="button" role="switch" aria-checked={optimized} class="switch-row" onclick={() => (optimized = !optimized)}>
      <span class="switch" aria-hidden="true"></span>
      <span>Mouse wheel <DetentText class="switch-state" text={optimized ? 'optimized' : 'unoptimized'} /></span>
    </button>
  </div>

  <div class="tuner-side">
    <div class="seg seg-start" role="group" aria-label="Preset">
      {#each preset === 'custom' ? [...names, 'custom' as const] : names as n (n)}
        <button type="button" aria-pressed={n === preset} onclick={() => pick(n)}>{n}</button>
      {/each}
    </div>
    <canvas bind:this={graph} class="graph" aria-label="Position and velocity of the last throw"></canvas>
    <div class="legend mono">
      <span><i style="background:var(--fg)"></i>x(t)</span>
      <span><i style="background:var(--accent)"></i>v(t)</span>
      <span>τ {Math.round(tau(phys.decay))}ms · ζ {zeta.toFixed(2)}</span>
    </div>
    {#each sliders as [key, min, max, step] (key)}
      <label class="pg-row">
        <span>{key}</span>
        <span class="pg-range">
          <input class="range" type="range" {min} {max} {step} value={phys[key]} style:--p={pct(phys[key], min, max)} oninput={(e) => set(key, Number(e.currentTarget.value))} />
          <output class="mono">{round(phys[key], key === 'decay' ? 4 : 1)}</output>
        </span>
      </label>
    {/each}
    <label class="pg-row">
      <span>overshoot</span>
      <span class="pg-range">
        <input
          class="range"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={overshoot}
          style:--p={pct(overshoot, 0, 1)}
          oninput={(e) => set('damping', 2 * (1 - 0.7 * Number(e.currentTarget.value)) * Math.sqrt(phys.stiffness * phys.mass))}
        />
        <output class="mono">{overshoot.toFixed(2)}</output>
      </span>
    </label>
    <div class="tuner-config">
      <DetentText as="code" class="mono" text={config} />
      <button type="button" class="copy" onclick={copy} aria-label="Copy config">{copied ? '✓' : 'Copy'}</button>
    </div>
  </div>
</div>

<style>
  .tuner {
    --fg: #111; --bg: #fff; --line: #e5e5e5; --muted: #666; --faint: #999; --accent: #ff5a1f; --ring: #3b82f6; --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
    grid-template-columns: minmax(0, 1fr); gap: 20px; width: 100%; min-width: 0; display: grid; font: 14px/1.4 Geist, system-ui, sans-serif; color: var(--fg);
  }
  .mono { font-family: 'Geist Mono', ui-monospace, 'SF Mono', Menlo, monospace; font-size: 12.5px; }
  .tuner-wheel { border: 1px solid var(--line); border-radius: 12px; place-items: center; padding: 28px 16px 22px; display: grid; gap: 18px; }
  .tuner-wheel > :global(*) { width: 100%; max-width: 260px; }
  .tuner-wheel > .readout, .tuner-wheel > .switch-row, .tuner-wheel > .tuner-keys { width: auto; max-width: none; }
  .tuner-side { flex-direction: column; gap: 10px; display: flex; }
  .readout { color: var(--faint); font-variant-numeric: tabular-nums; text-align: left; grid-template-columns: repeat(3, auto); gap: 2px 22px; font-size: 11px; display: grid; margin: 0; }
  .readout dd { color: var(--fg); min-width: 7ch; margin: 0; }
  .tuner-keys { text-wrap: balance; color: var(--faint); text-align: center; margin: -6px 0 0; font-size: 12.5px; }
  @media (min-width: 480px) { .tuner-keys { white-space: nowrap; } }
  .graph { border: 1px solid var(--line); border-radius: 10px; width: 100%; height: 140px; }
  .legend { color: var(--muted); gap: 16px; font-size: 14px; display: flex; }
  .legend i { vertical-align: middle; width: 10px; height: 2px; margin-right: 6px; display: inline-block; }
  .legend span:last-child { margin-left: auto; }
  .tuner-config { border: 1px solid var(--line); border-radius: 10px; align-items: center; gap: 8px; padding: 4px 4px 4px 12px; font-size: 14px; display: flex; }
  .tuner-config :global(code) { white-space: normal; overflow-wrap: anywhere; flex: 1; padding: 6px 0; line-height: 1.5; }
  .copy { font: inherit; font-size: 12.5px; color: var(--muted); cursor: pointer; background: none; border: 0; border-radius: 8px; padding: 6px 10px; transition: color 0.15s var(--ease-out), background-color 0.15s var(--ease-out); }
  .copy:hover { color: var(--fg); background: color-mix(in srgb, var(--fg) 6%, transparent); }
  .pg-row { justify-content: space-between; align-items: center; gap: 12px; font-size: 14px; display: flex; }
  .pg-row > span:first-child { color: var(--muted); }
  .pg-range { align-items: center; gap: 8px; display: flex; }
  .pg-range output { text-align: right; font-variant-numeric: tabular-nums; width: 5ch; font-size: 14px; }
  .pg-range input { width: 180px; }

  .seg { flex-wrap: wrap; align-items: baseline; gap: 2px 14px; display: inline-flex; position: relative; }
  .seg-start { justify-content: flex-start; align-self: flex-start; }
  .seg button { font-family: 'Geist Mono', ui-monospace, monospace; color: var(--faint); cursor: pointer; -webkit-tap-highlight-color: transparent; background: none; border: 0; padding: 2px 0; font-size: 12.5px; line-height: 18px; transition: color 0.15s; }
  .seg button[aria-pressed='true'] { color: var(--fg); font-weight: 600; }
  .seg button:focus-visible { outline: 1.5px solid var(--ring); outline-offset: 2px; border-radius: 4px; }
  @media (hover: hover) and (pointer: fine) { .seg button:hover:not([aria-pressed='true']) { color: var(--fg); } }

  .range { appearance: none; cursor: pointer; touch-action: pan-y; --track: color-mix(in srgb, var(--fg) 10%, transparent); --fill: color-mix(in srgb, var(--fg) 78%, transparent); background: none; width: 140px; height: 20px; margin: 0; }
  .range::-webkit-slider-runnable-track { background: linear-gradient(to right, var(--fill) var(--p, 50%), var(--track) var(--p, 50%)); border-radius: 99px; height: 4px; }
  .range::-moz-range-track { background: var(--track); border-radius: 99px; height: 4px; }
  .range::-moz-range-progress { background: var(--fill); border-radius: 99px; height: 4px; }
  .range::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; transition: transform 0.15s var(--ease-out); background: #fff; border: 0; border-radius: 50%; margin-top: -5px; box-shadow: 0 0 0 0.5px #0003, 0 1px 3px #00000038; }
  .range::-moz-range-thumb { width: 14px; height: 14px; transition: transform 0.15s var(--ease-out); background: #fff; border: 0; border-radius: 50%; box-shadow: 0 0 0 0.5px #0003, 0 1px 3px #00000038; }
  .range:active::-webkit-slider-thumb { transform: scale(1.2); }
  .range:active::-moz-range-thumb { transform: scale(1.2); }
  .range:focus-visible { outline: none; }
  .range:focus-visible::-webkit-slider-thumb { box-shadow: 0 0 0 2px var(--bg), 0 0 0 3.5px var(--ring); }
  .range:focus-visible::-moz-range-thumb { box-shadow: 0 0 0 2px var(--bg), 0 0 0 3.5px var(--ring); }

  .switch-row { color: var(--muted); cursor: pointer; -webkit-tap-highlight-color: transparent; background: none; border: 0; align-items: center; gap: 10px; padding: 0; font: inherit; font-size: 14px; display: inline-flex; transition: transform 0.15s var(--ease-out), color 0.15s var(--ease-out); }
  .switch-row :global(.switch-state) { color: var(--fg); }
  .switch { background: color-mix(in srgb, var(--fg) 14%, transparent); border-radius: 999px; flex: none; width: 30px; height: 18px; transition: background-color 0.2s; position: relative; }
  .switch::after { content: ''; transform-origin: 0; width: 14px; height: 14px; transition: transform 0.22s var(--ease-out); background: #fff; border-radius: 50%; position: absolute; top: 2px; left: 2px; box-shadow: 0 0 0 0.5px #0000001f, 0 1px 2px #00000040; }
  .switch-row[aria-checked='true'] .switch { background: var(--fg); }
  .switch-row[aria-checked='true'] .switch::after { transform: translate(12px); }
  .switch-row:active .switch::after { transform: scaleX(1.15); }
  .switch-row[aria-checked='true']:active .switch::after { transform: translate(10px) scaleX(1.15); }
  .switch-row:focus-visible { outline: none; }
  .switch-row:focus-visible .switch { box-shadow: 0 0 0 2px var(--bg), 0 0 0 3.5px var(--ring); }

  @media (prefers-color-scheme: dark) {
    .tuner { --fg: #ededed; --bg: #0a0a0a; --line: #262626; --muted: #a1a1a1; --faint: #777; }
    .switch-row[aria-checked='true'] .switch::after { background: var(--bg); box-shadow: 0 1px 2px #0006; }
    .switch-row:not([aria-checked='true']) .switch { background: color-mix(in srgb, var(--fg) 20%, transparent); }
  }
  @media (prefers-reduced-motion: reduce) { .switch-row, .switch, .switch::after, .range::-webkit-slider-thumb { transition: none; } }
</style>
