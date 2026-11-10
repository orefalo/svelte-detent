<script lang="ts">
  // In your app: import { createDetent } from 'svelte-detent'
  import { ticks } from '../../src/lib'
  import { onMount, untrack } from 'svelte'
  import { createDetent } from '../../src/lib'
  import { smoothstep } from '../site/FxCommon'
  import FxDots from '../site/FxDots.svelte'
  import { CARD_H, CARD_W, KANJI, PITCH, atlas, createGl, spriteUrls, type Gl } from '../site/FxLiquid'

  /**
   * A WebGL shader driven by the wheel. The wheel reports its position and velocity every frame through `subscribe`:
   * cards stretch toward the edges, smear with speed and split into color at the outline, then settle back.
   * Three tiers: `webgl` (the shader), `css` (SVG filters and transforms) and `off`. It steps down on its own when the
   * frame rate drops, or without WebGL2, and the effect is off with reduced motion.
   */
  type Tier = 'webgl' | 'css' | 'off'
  const corners = ['Throw', 'Coast', 'Catch', 'Settle']
  const tiers: Tier[] = ['webgl', 'css', 'off']

  let tier = $state<Tier>('webgl')
  let note = $state('')
  const degrade = (to: Tier, why: 'webgl' | 'fps') => {
    tier = to
    note = why === 'webgl' ? 'WebGL is unavailable here: CSS/SVG tier.' : to === 'css' ? 'Stepped down to the CSS/SVG tier to hold frame rate.' : 'Effect off to hold frame rate.'
  }
  onMount(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      tier = 'off'
      note = 'Reduced motion: effect off.'
    } else if (!document.createElement('canvas').getContext('webgl2')) {
      tier = 'css'
      note = 'No WebGL2 here: CSS/SVG tier.'
    }
  })

  /** While a wheel moves, the page is told (`data-heavy` on the root), so it can calm other animations. */
  const heavy = (on: boolean) => {
    const root = document.documentElement
    if (on !== root.hasAttribute('data-heavy')) root.toggleAttribute('data-heavy', on)
  }

  const d = createDetent<(typeof KANJI)[number]>(() => ({
    onTick: ticks({ sound: true, haptics: true }),
    items: KANJI,
    getKey: (c) => c.id,
    getLabel: (c) => c.label,
    itemSize: PITCH,
    visibleCount: 2,
    loop: true,
    defaultValue: KANJI[0],
    label: 'Cards',
  }))

  let sprites = $state<string[] | null>(null)
  let canvas = $state<HTMLCanvasElement | null>(null)
  let track = $state<HTMLElement | null>(null)
  let stage = $state<HTMLElement | null>(null)
  let live: Gl | null = null // the shader pipeline, when there is one
  let last = { offset: 0, v: 0 }
  let visible = true

  // The cards as images, rendered once the page is idle: the CSS tier and the markup use them.
  $effect(() => {
    let alive = true
    let urls: string[] = []
    const idle = window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 1))
    idle(() => {
      spriteUrls(Math.min(2, devicePixelRatio || 1)).then((made) => {
        if (alive) sprites = urls = made
        else made.forEach(URL.revokeObjectURL)
      })
    })
    return () => {
      alive = false
      urls.forEach(URL.revokeObjectURL)
    }
  })

  // The shader tier.
  $effect(() => {
    if (tier !== 'webgl' || !canvas) return
    const cv = canvas
    let alive = true
    let gl: Gl | null = null
    const build = () => {
      try {
        const dpr = Math.min(2, devicePixelRatio || 1)
        return createGl(cv, atlas(dpr), dpr, KANJI.length)
      } catch {
        return null
      }
    }
    const ro = new ResizeObserver(() => gl && (gl.resize(), gl.draw(last.offset, last.v)))
    Promise.resolve().then(() => {
      if (!alive) return
      gl = live = build()
      if (!gl) return degrade('css', 'webgl')
      gl.draw(last.offset, 0)
      ro.observe(cv)
    })
    const lost = (e: Event) => (e.preventDefault(), (live = null))
    const restored = () => {
      gl = live = build()
      gl?.draw(last.offset, 0)
      if (!live) degrade('css', 'webgl')
    }
    cv.addEventListener('webglcontextlost', lost)
    cv.addEventListener('webglcontextrestored', restored)
    return () => {
      cv.removeEventListener('webglcontextlost', lost)
      cv.removeEventListener('webglcontextrestored', restored)
      alive = false
      ro.disconnect()
      gl?.destroy()
      live = null
    }
  })

  /** One frame: the shader's uniforms, or (CSS tier) a stretch per card and a blur and split by speed on the track. */
  function frame(offset: number, v: number) {
    last = { offset, v }
    if (!visible) return
    if (tier === 'webgl') return live?.draw(offset, v)
    const t = track
    if (!t) return
    const speed = Math.min(1, Math.abs(v) / 2.5)
    const level = tier === 'css' ? Math.round(5 * speed) : 0
    const filter = level ? `url(#lq${level})` : ''
    if (t.style.filter !== filter) t.style.filter = filter
    for (const row of Array.from(t.children) as HTMLElement[]) {
      const card = row.firstElementChild as HTMLElement | null
      if (!card || row.dataset.detentIndex === undefined) continue
      if (tier === 'off') {
        card.style.transform = ''
        continue
      }
      const away = Number(row.dataset.detentIndex) - offset
      const e = smoothstep(0.3, 1.05, Math.abs(away))
      const stretch = 1.5 * e * e * 0.5 + 0.35 * speed * (0.3 + 0.7 * e)
      card.style.transformOrigin = away < 0 ? '50% 100%' : '50% 0%'
      card.style.transform = `scale(${1 + 0.4 * e}, ${1 + stretch})`
    }
  }
  // Switching tier, new rows, or the card images arriving (they replace the placeholders): bring the cards to the right look at once.
  $effect(() => {
    void [tier, sprites, d.rows]
    untrack(() => frame(last.offset, 0))
  })

  // Only while the stage is on screen.
  $effect(() => {
    const el = stage
    if (!el) return
    const io = new IntersectionObserver(([e]) => {
      visible = !!e?.isIntersecting
      if (visible) frame(last.offset, 0)
      else heavy(false)
    })
    io.observe(el)
    return () => (io.disconnect(), heavy(false))
  })

  // The wheel's frames, and a frame-rate watchdog: 30 frame times at a time while it moves; two slow windows in a row
  // (median over 22 ms) step the effect down a tier.
  $effect(() => {
    let raf = 0
    let prev = 0
    let skip = 0
    let slow = 0
    let times: number[] = []
    const measure = (now: number) => {
      raf = 0
      if (prev && ++skip > 8) times.push(now - prev)
      prev = now
      if (times.length >= 30) {
        slow = times.sort((a, b) => a - b)[15]! > 22 ? slow + 1 : 0
        times = []
        if (slow >= 2 && tier !== 'off') return degrade(tier === 'webgl' ? 'css' : 'off', 'fps')
      }
      raf = requestAnimationFrame(measure)
    }
    const stop = d.subscribe((f) => {
      heavy(f.mode !== 'idle' && visible && tier !== 'off')
      frame(f.offset, f.mode === 'idle' ? 0 : f.velocity)
      if (f.mode !== 'idle' && !raf && !document.hidden) {
        prev = skip = 0
        raf = requestAnimationFrame(measure)
      }
      if (f.mode === 'idle' && raf) {
        cancelAnimationFrame(raf)
        raf = 0
      }
    })
    return () => (stop(), cancelAnimationFrame(raf))
  })
</script>

<div class="liquid-stage">
  <div class="liquid" data-tier={tier} bind:this={stage}>
    <!-- CSS tier: a blur along the scroll axis, with the red and blue channels pulled apart by a fraction of it. -->
    <svg width="0" height="0" aria-hidden="true" style="position:absolute">
      {#each [1, 2, 3, 4, 5] as n (n)}
        <filter id="lq{n}" x="-10%" y="-40%" width="120%" height="180%" color-interpolation-filters="sRGB">
          <feGaussianBlur in="SourceGraphic" stdDeviation="0 {n}" result="b" />
          <feColorMatrix in="b" values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" result="r" />
          <feOffset in="r" dy={-(0.5 * n)} result="ro" />
          <feColorMatrix in="b" values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0" result="g" />
          <feColorMatrix in="b" values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0" result="bl" />
          <feOffset in="bl" dy={0.5 * n} result="bo" />
          <feBlend in="ro" in2="g" mode="screen" result="rg" />
          <feBlend in="rg" in2="bo" mode="screen" />
        </filter>
      {/each}
    </svg>
    {#each ['tl', 'tr', 'bl', 'br'] as pos, i (pos)}
      <span class="corner {pos}" aria-hidden="true">{corners[i]}</span>
    {/each}
    <div {...d.rootAttrs} class="root" style="{d.rootStyle}width:100%" {@attach d.attachRoot}>
      <div {...d.trackAttrs} style={d.trackStyle} bind:this={track} {@attach d.attachTrack}>
        {#each d.rows as r (r.key)}
          <div {...r.attrs} class="row" style={r.style}>
            {#if sprites}
              <img src={sprites[r.index]} alt={r.item.label} width={CARD_W} height={CARD_H} decoding="async" draggable="false" class="card" />
            {:else}
              <div class="card" role="img" aria-label={r.item.label}></div>
            {/if}
          </div>
        {/each}
      </div>
      <canvas bind:this={canvas} class="gl" aria-hidden="true" hidden={tier !== 'webgl'}></canvas>
    </div>
    <FxDots count={KANJI.length} index={d.selectedIndex} variant="liquid" />
    <div {...d.liveRegionAttrs} style={d.liveRegionStyle}>{d.announcement}</div>
  </div>
  <div class="controls">
    <div class="seg" role="group" aria-label="Liquid tier">
      {#each tiers as t (t)}
        <button type="button" aria-pressed={t === tier} onclick={() => ((tier = t), (note = ''))}>{t}</button>
      {/each}
    </div>
    <p class="note" aria-live="polite">{note}</p>
  </div>
</div>

<style>
  .liquid-stage { --bg: #fff; --fg: #0a0a0a; --muted: #6b6b6b; --faint: #737373; --line: #00000014; --ring: #00000073;
    color-scheme: light; color: #0a0a0a; background: #fff; border-radius: 16px; justify-items: stretch; gap: 12px; padding: 0 0 14px; display: grid; overflow: hidden; box-shadow: inset 0 0 0 0.5px #0000001a;
    width: 100%; font-family: Geist, system-ui, sans-serif; }
  .liquid { width: 100%; position: relative; min-height: 580px; }
  .corner { z-index: 2; font: 600 11px/1 Geist, system-ui, sans-serif; letter-spacing: 0.22em; text-transform: uppercase; color: #0a0a0a; pointer-events: none; position: absolute; }
  .corner.tl { top: 22px; left: 22px; } .corner.tr { top: 22px; right: 22px; } .corner.bl { bottom: 22px; left: 22px; } .corner.br { bottom: 22px; right: 22px; }
  .root { cursor: grab; outline: none; }
  .root:focus-visible { box-shadow: inset 0 0 0 1.5px #00000073; }
  .root[data-dragging] { cursor: grabbing; }
  .row { place-items: center; display: grid; }
  .card { will-change: transform; border-radius: 93px; width: 186px; height: 250px; display: block; }
  .liquid[data-tier='webgl'] .card { opacity: 0; }
  .gl { pointer-events: none; width: 100%; height: 100%; position: absolute; inset: 0; }

  .controls { justify-items: center; gap: 6px; display: grid; }
  .seg { flex-wrap: wrap; justify-content: flex-end; align-items: baseline; gap: 2px 14px; display: inline-flex; position: relative; }
  .seg button { font-family: 'Geist Mono', ui-monospace, monospace; color: var(--faint); cursor: pointer; -webkit-tap-highlight-color: transparent; background: 0 0; border: 0; padding: 2px 0; font-size: 12.5px; line-height: 18px; transition: color 0.15s; }
  .seg button[aria-pressed='true'] { color: var(--fg); font-weight: 600; }
  .seg button:focus-visible { outline: 1.5px solid var(--ring); outline-offset: 2px; border-radius: 4px; }
  @media (hover: hover) and (pointer: fine) { .seg button:hover:not([aria-pressed='true']) { color: var(--fg); } }
  .note { color: #6b6b6b; min-height: 20px; margin: 0; font: 12.5px 'Geist Mono', ui-monospace, monospace; }
  .note:empty { display: none; }

  @media (prefers-color-scheme: dark) {
    .liquid-stage { --bg: #0b0b0c; --fg: #ededed; --muted: #9a9a9a; --faint: #8a8a8a; --line: #ffffff1a; --ring: #ffffff80; color-scheme: dark; color: #ededed; background: #0b0b0c; box-shadow: inset 0 0 0 0.5px #ffffff14; }
    .corner { color: #ededed; }
    .note { color: #9a9a9a; }
    .root:focus-visible { box-shadow: inset 0 0 0 1.5px #ffffff80; }
  }
</style>
