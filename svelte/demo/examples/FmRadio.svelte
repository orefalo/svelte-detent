<script lang="ts">
  // In your app: import { Detent, DetentNumber } from '@hayderkg/detent-svelte'
  import { Detent, DetentNumber } from '../../src/lib'

  const tenths = Array.from({ length: 1080 - 875 + 1 }, (_, i) => 875 + i) // 87.5 – 108.0 MHz, 0.1 steps
  const stations = [
    { f: 903, name: 'Late Jazz', kind: 'JAZZ' },
    { f: 929, name: 'Morning Desk', kind: 'TALK' },
    { f: 987, name: 'Concert Hall', kind: 'CLASSICAL' },
    { f: 1011, name: 'Night Drive', kind: 'ELECTRONIC' },
    { f: 1045, name: 'Old Gold', kind: 'OLDIES' },
  ]
  let tenth = $state(987)
  let position = $state(987) // live, every frame
  let listening = $state(false)

  const mhz = $derived(tenth / 10)
  const nearest = $derived(stations.reduce((a, b) => (Math.abs(b.f - position) < Math.abs(a.f - position) ? b : a)))
  /** 0 on a station, 1 far from any: the sound and the signal bars follow the needle frame by frame. */
  const strength = $derived(Math.max(0, 1 - Math.abs(nearest.f - position) / 6))
  const locked = $derived(strength > 0.95)
  const station = $derived(locked ? stations.find((s) => s.f === nearest.f) : undefined)

  // Static between stations, a soft chord on one. Web Audio, started by the Listen button.
  let ctx: AudioContext | undefined
  let noise: GainNode | undefined
  let music: GainNode | undefined
  function start() {
    ctx ??= new AudioContext()
    const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    const src = ctx.createBufferSource()
    src.buffer = buffer
    src.loop = true
    noise = ctx.createGain()
    src.connect(noise).connect(ctx.destination)
    src.start()
    music = ctx.createGain()
    music.connect(ctx.destination)
    for (const hz of [220, 277.2, 329.6]) {
      const o = ctx.createOscillator()
      o.frequency.value = hz
      o.connect(music)
      o.start()
    }
    void ctx.resume()
  }
  $effect(() => {
    if (!ctx || !noise || !music) return
    noise.gain.value = listening ? 0.08 * (1 - strength) : 0
    music.gain.value = listening ? 0.06 * strength * strength : 0
  })
  function listen() {
    if (!ctx) start()
    listening = !listening
    if (!listening) void ctx?.suspend()
    else void ctx?.resume()
  }
  const tune = (f: number) => (tenth = f)
  const step = (dir: 1 | -1) => {
    const next = dir > 0 ? stations.find((s) => s.f > tenth) ?? stations[0]! : [...stations].reverse().find((s) => s.f < tenth) ?? stations.at(-1)!
    tune(next.f)
  }
</script>

<div class="fm">
  <div class="display">
    <div class="freq"><DetentNumber value={mhz} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} /><span class="unit">MHz</span></div>
    <div class="meters" aria-hidden="true">
      <span class="bars">{#each [5, 7, 9, 11, 13] as h, i (h)}<i style:height="{h}px" style:opacity={strength * 5 > i ? 1 : 0.22}></i>{/each}</span>
      <span class="stereo" style:opacity={locked ? 1 : 0.22}>STEREO</span>
    </div>
    <div class="station"><span class="name">{station?.name ?? '· · ·'}</span><span class="kind">{station?.kind ?? ''}</span></div>
    <span class="sr" aria-live="polite">{mhz.toFixed(1)} MHz{station ? `, ${station.name}` : ''}</span>
  </div>

  <div class="dial">
    <Detent
      items={tenths}
      value={tenth}
      onChange={(v) => (tenth = v)}
      onScrollProgress={(rows) => (position = 875 + rows)}
      label="Frequency"
      orientation="horizontal"
      itemHeight={8}
      visibleCount={43}
      height={46}
      width={340}
      curvature={0.37}
      fade={0.05}
      dim={0}
      mask="none"
      magnify={false}
      changeOn="tick"
      indicator={{ shape: 'needle', color: '#ff4f2a' }}
    >
      {#snippet item(v: number)}
        <span class="mark">
          <span class="tick" class:half={v % 10 === 5} class:whole={v % 10 === 0}></span>
          <span class="lbl">{v % 20 === 0 ? v / 10 : ''}</span>
        </span>
      {/snippet}
    </Detent>
  </div>

  <div class="presets">
    {#each stations as s, i (s.f)}
      <button type="button" class:on={s.f === tenth} onclick={() => tune(s.f)}><span>{i + 1}</span><small>{(s.f / 10).toFixed(1)}</small></button>
    {/each}
  </div>

  <div class="controls">
    <button type="button" class="listen" aria-pressed={listening} onclick={listen}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">{#if listening}<path d="M3 6h3l4-3v10l-4-3H3z" /><path d="M12 5.5a3.5 3.5 0 0 1 0 5" fill="none" stroke="currentColor" stroke-width="1.4" />{:else}<path d="M3 6h3l4-3v10l-4-3H3z" />{/if}</svg>
      <span>Listen</span>
    </button>
    <span class="grille"></span>
    <div class="seek">
      <button type="button" aria-label="Previous station" onclick={() => step(-1)}><svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><path d="M7 3 2 7l5 4zM12 3 7 7l5 4z" /></svg></button>
      <button type="button" aria-label="Next station" onclick={() => step(1)}><svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><path d="m2 3 5 4-5 4zM7 3l5 4-5 4z" /></svg></button>
    </div>
  </div>
</div>

<style>
  .fm { width: 360px; box-sizing: border-box; padding: 14px; border-radius: 22px; background: #fff; color: #0a0a0a; box-shadow: 0 0 0 1px rgb(0 0 0 / 0.08), 0 1px 2px rgb(0 0 0 / 0.05), 0 18px 36px -24px rgb(0 0 0 / 0.35); display: grid; gap: 14px; margin: 0 auto; font-family: ui-monospace, 'SF Mono', Menlo, monospace; --amber: #ffb547; }
  .display { position: relative; height: 96px; border-radius: 12px; padding: 17px 16px; box-sizing: border-box; color: var(--amber); background: radial-gradient(120% 140% at 30% 0%, #1d1b17, #0c0b0a); box-shadow: inset 0 2px 6px rgb(0 0 0 / 0.7), inset 0 0 0 1px rgb(0 0 0 / 0.6), 0 1px 0 rgb(255 255 255 / 0.05); }
  .freq { font-size: 30px; line-height: 35px; display: flex; align-items: baseline; gap: 6px; text-shadow: 0 0 12px rgb(255 181 71 / 0.45); }
  .unit { font-size: 12px; }
  .meters { position: absolute; right: 16px; top: 14px; display: grid; justify-items: end; gap: 6px; }
  .bars { display: flex; align-items: flex-end; gap: 2px; height: 13px; }
  .bars i { width: 3px; border-radius: 1px; background: var(--amber); }
  .stereo { font-size: 8.5px; padding: 1px 5px; border-radius: 3px; box-shadow: inset 0 0 0 1px var(--amber); letter-spacing: 0.1em; }
  .station { position: absolute; left: 16px; right: 16px; bottom: 12px; display: flex; justify-content: space-between; font-size: 13px; padding-top: 8px; border-top: 1px solid rgb(255 181 71 / 0.15); }
  .kind { font-size: 11px; letter-spacing: 0.12em; opacity: 0.8; }
  .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
  .dial { margin: 0 -4px; --detent-font-size: 10px; }
  .mark { display: grid; justify-items: center; gap: 4px; }
  .tick { width: 1px; height: 8px; background: currentColor; opacity: 0.35; }
  .tick.half { height: 12px; opacity: 0.6; }
  .tick.whole { height: 16px; opacity: 1; }
  .lbl { font-size: 9px; height: 12px; opacity: 0.55; }
  .presets { display: grid; grid-template-columns: repeat(5, 1fr); gap: 5px; }
  .presets button { height: 44px; border: 0; border-radius: 9px; background: transparent; box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.08); display: grid; place-items: center; align-content: center; gap: 2px; font: inherit; color: inherit; cursor: pointer; }
  .presets span { font-size: 12.5px; font-weight: 600; }
  .presets small { font-size: 9px; opacity: 0.6; }
  .presets button.on { box-shadow: inset 0 0 0 1px var(--amber), inset 0 2px 0 var(--amber); }
  .controls { display: flex; align-items: center; gap: 14px; }
  .controls button { border: 0; border-radius: 9px; background: rgb(0 0 0 / 0.04); color: inherit; font: inherit; cursor: pointer; height: 32px; }
  .listen { display: flex; align-items: center; gap: 8px; padding: 0 10px; font-size: 13px; }
  .grille { flex: 1; height: 24px; border-radius: 6px; background: radial-gradient(circle, rgb(0 0 0 / 0.25) 0.8px, transparent 1.2px) 0 0 / 6px 6px; }
  .seek { display: flex; gap: 4px; }
  .seek button { width: 32px; display: grid; place-items: center; }
</style>
