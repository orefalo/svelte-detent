<script lang="ts">
  // In your app: import { createDetent } from 'svelte-detent'
  import { ticks } from '../../src/lib'
  import { createDetent } from '../../src/lib'
  import FxDots from '../site/FxDots.svelte'
  import { clamp01, isDark, mod, onTheme, smooth, watchCanvas } from '../site/FxCommon'

  /**
   * Words made of particles. Each word is drawn once to an offscreen canvas and sampled into 2,200 points; between two
   * words every particle flies from its point in one to its point in the other, on its own delay and arc. A fast throw
   * widens the arcs, so the words scatter. The wheel reports its position and velocity every frame through `subscribe`.
   */
  const words = [
    { text: 'Drift', hue: 205 },
    { text: 'Ember', hue: 18 },
    { text: 'Bloom', hue: 330 },
    { text: 'Tide', hue: 175 },
    { text: 'Flare', hue: 42 },
    { text: 'Hush', hue: 262 },
  ]
  const N = 2200
  const PITCH = 120

  const d = createDetent<(typeof words)[number]>(() => ({
    onTick: ticks({ sound: true, haptics: true }),
    items: words,
    getKey: (w) => w.text,
    getLabel: (w) => w.text,
    orientation: 'horizontal',
    itemSize: PITCH,
    visibleCount: 5,
    loop: true,
    label: 'Words',
  }))

  let canvas = $state<HTMLCanvasElement | null>(null)

  $effect(() => {
    const cv = canvas
    if (!cv) return
    const ctx = cv.getContext('2d')!
    // Per-particle randoms, shared by every word so a particle keeps its character from word to word.
    const delay = Float32Array.from({ length: N }, () => 0.35 * Math.random())
    const angle = Float32Array.from({ length: N }, () => Math.random() * Math.PI * 2)
    const reach = Float32Array.from({ length: N }, () => 18 + 70 * Math.random())
    const size = Float32Array.from({ length: N }, () => 0.6 + 0.8 * Math.random())
    let points: Float32Array[] = []
    let frame = { offset: d.engine.x / PITCH, velocity: 0, moving: false }

    const draw = () => {
      const w = cv.clientWidth
      const h = cv.clientHeight
      if (!points.length) return
      const { offset, velocity, moving } = frame
      const dark = isDark()
      ctx.globalCompositeOperation = 'source-over'
      // The background takes the hue of the word it is turning into; while moving it only fades toward it (trails).
      const i0 = Math.floor(offset)
      const h0 = words[mod(i0, words.length)]!.hue
      const hue = h0 + (((words[mod(i0 + 1, words.length)]!.hue - h0 + 540) % 360) - 180) * smooth(offset - i0)
      const base = dark ? `hsl(${hue} 38% 7%` : `hsl(${hue} 60% 96.5%`
      ctx.fillStyle = `${base} / ${moving ? 0.32 : 1})`
      ctx.fillRect(0, 0, w, h)
      ctx.globalCompositeOperation = dark ? 'lighter' : 'multiply'
      const from = Math.floor(offset)
      const k = offset - from
      const a = mod(from, words.length)
      const b = mod(from + 1, words.length)
      const pa = points[a]!
      const pb = points[b]!
      const speed = Math.min(3, Math.abs(velocity))
      for (let n = 0; n < N; n++) {
        const t = smooth((k - delay[n]!) / 0.65)
        const arc = Math.sin(Math.PI * t) * (reach[n]! * (0.55 + 0.8 * speed))
        const x = pa[2 * n]! + (pb[2 * n]! - pa[2 * n]!) * t + Math.cos(angle[n]!) * arc - 10 * velocity * Math.sin(Math.PI * t)
        const y = pa[2 * n + 1]! + (pb[2 * n + 1]! - pa[2 * n + 1]!) * t + Math.sin(angle[n]!) * arc
        const hh = words[a]!.hue + (((words[b]!.hue - words[a]!.hue + 540) % 360) - 180) * t
        ctx.fillStyle = `hsl(${hh} ${dark ? 90 : 80}% ${dark ? 62 + 14 * Math.sin(Math.PI * t) : 40 - 6 * Math.sin(Math.PI * t)}% / ${0.55 + 0.45 * clamp01(1 - arc / 120)})`
        const s = size[n]! * (dark ? 1 : 1.3)
        ctx.fillRect(x - s / 2, y - s / 2, s, s)
      }
    }

    /** The points of a word: its glyphs drawn to a canvas, sampled every 3 px, then dealt out to the particles. */
    const sample = (text: string, w: number, h: number, family: string) => {
      const c = document.createElement('canvas')
      c.width = w
      c.height = h
      const g = c.getContext('2d', { willReadFrequently: true })!
      let px = Math.min(0.5 * h, 170)
      g.font = `700 ${px}px ${family}`
      const fit = (0.82 * w) / g.measureText(text).width
      if (fit < 1) px *= fit
      g.font = `700 ${px}px ${family}`
      g.textAlign = 'center'
      g.textBaseline = 'middle'
      g.fillText(text, w / 2, h / 2)
      const data = g.getImageData(0, 0, w, h).data
      const pts: number[] = []
      for (let y = 0; y < h; y += 3) for (let x = 0; x < w; x += 3) if (data[(y * w + x) * 4 + 3]! > 128) pts.push(x, y)
      const out = new Float32Array(N * 2)
      const count = pts.length / 2
      for (let n = 0; n < N; n++) {
        const p = Math.floor(Math.random() * count)
        out[2 * n] = pts[2 * p]! + (Math.random() - 0.5) * 3
        out[2 * n + 1] = pts[2 * p + 1]! + (Math.random() - 0.5) * 3
      }
      return out
    }

    let alive = true
    const resample = async () => {
      await document.fonts.ready
      if (!alive) return
      const family = getComputedStyle(document.body).getPropertyValue('--font-geist-sans').trim() || "Geist, system-ui, sans-serif"
      const w = Math.max(1, Math.round(cv.clientWidth))
      const h = Math.max(1, Math.round(cv.clientHeight))
      points = words.map((word) => sample(word.text, w, h, family))
      draw()
    }
    const stopSize = watchCanvas(cv, () => void resample())
    const stopTheme = onTheme(draw)
    const stopFrames = d.subscribe((f) => {
      frame = { offset: f.offset, velocity: f.mode === 'idle' ? 0 : f.velocity, moving: f.mode !== 'idle' }
      draw()
    })
    return () => {
      alive = false
      stopSize()
      stopTheme()
      stopFrames()
    }
  })
</script>

<div class="stage">
  <div {...d.rootAttrs} class="root" style="{d.rootStyle}width:100%;height:380px" {@attach d.attachRoot}>
    <div {...d.trackAttrs} style={d.trackStyle} {@attach d.attachTrack}>
      {#each d.rows as r (r.key)}
        <div {...r.attrs} class="row" style={r.style}>{r.item.text}</div>
      {/each}
    </div>
    <canvas bind:this={canvas} class="canvas" aria-hidden="true"></canvas>
  </div>
  <FxDots count={words.length} index={d.selectedIndex} />
  <div {...d.liveRegionAttrs} style={d.liveRegionStyle}>{d.announcement}</div>
</div>

<style>
  .stage { --fg: #0a0a0a; background: #09090b; border-radius: 16px; width: 100%; position: relative; overflow: hidden; box-shadow: inset 0 0 0 0.5px #ffffff14; }
  /* Light by default, dark when the page is: the stage follows the theme. */
  .stage { background: #fafaf9; box-shadow: inset 0 0 0 0.5px #0000001a; }
  .root { cursor: grab; outline: none; position: relative; }
  .root:focus-visible { border-radius: 16px; box-shadow: inset 0 0 0 1.5px #00000073; }
  .root[data-dragging] { cursor: grabbing; }
  /* The words themselves are drawn on the canvas: the rows only carry the text for assistive technology and input. */
  .row { opacity: 0; place-items: center; display: grid; }
  .canvas { pointer-events: none; width: 100%; height: 100%; position: absolute; inset: 0; }
  @media (prefers-color-scheme: dark) {
    .stage { --fg: #ededed; background: #09090b; box-shadow: inset 0 0 0 0.5px #ffffff14; }
    .root:focus-visible { box-shadow: inset 0 0 0 1.5px #ffffff80; }
  }
</style>
