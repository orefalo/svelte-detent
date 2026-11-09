<script lang="ts">
  // In your app: import { createDetent } from '@hayderkg/detent-svelte'
  import { createDetent, type DetentFrame } from '../../src/lib'

  /**
   * Words made of particles. Each word is rendered once to an offscreen canvas and sampled into points; between two
   * words every particle flies from its point in one to its point in the other, on its own delay and arc. A fast throw
   * widens the arcs, so the words scatter.
   */
  const words = ['Drift', 'Ember', 'Bloom', 'Tide', 'Flare', 'Hush']
  const N = words.length
  const W = 520
  const H = 380
  const PARTICLES = 3200
  const SHADES = ['#0a3d8f', '#1b66cc', '#4f93e8', '#0b2a63']
  const mod = (n: number, m: number) => ((n % m) + m) % m

  let index = $state(0)
  const d = createDetent<string>(() => ({
    items: words,
    label: 'Words',
    loop: true,
    orientation: 'horizontal',
    itemSize: 260,
    visibleCount: 3,
    onSettle: (_, i) => (index = i),
  }))

  let canvas = $state<HTMLCanvasElement | null>(null)

  /** Per-particle randoms, shared by every word so a particle keeps its character from word to word. */
  const rand = (() => {
    let s = 7
    const next = () => ((s = (s * 16807) % 2147483647) / 2147483647)
    return { next }
  })()
  const delay = Float32Array.from({ length: PARTICLES }, () => rand.next() * 0.45)
  const angle = Float32Array.from({ length: PARTICLES }, () => rand.next() * Math.PI * 2)
  const reach = Float32Array.from({ length: PARTICLES }, () => 0.35 + rand.next() * 0.9)
  const shade = Uint8Array.from({ length: PARTICLES }, () => Math.floor(rand.next() * SHADES.length))
  const size = Float32Array.from({ length: PARTICLES }, () => 1 + rand.next() * 1.1)

  /** The points of each word: sampled from its rendered glyphs, then dealt out to PARTICLES particles. */
  function sample(word: string): Float32Array {
    const c = document.createElement('canvas')
    c.width = W
    c.height = H
    const g = c.getContext('2d', { willReadFrequently: true })!
    g.fillStyle = '#000'
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.font = '700 118px system-ui, "Helvetica Neue", Arial, sans-serif'
    g.fillText(word, W / 2, H / 2 - 12)
    const data = g.getImageData(0, 0, W, H).data
    const pts: number[] = []
    for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) if (data[(y * W + x) * 4 + 3]! > 128) pts.push(x, y)
    const count = pts.length / 2
    const out = new Float32Array(PARTICLES * 2)
    for (let k = 0; k < PARTICLES; k++) {
      // A shuffled stride keeps neighbours in the word from sharing a delay.
      const p = Math.floor(((k * 2654435761) >>> 0) % Math.max(1, count))
      out[k * 2] = (pts[p * 2] ?? W / 2) + (rand.next() - 0.5) * 2
      out[k * 2 + 1] = (pts[p * 2 + 1] ?? H / 2) + (rand.next() - 0.5) * 2
    }
    return out
  }

  $effect(() => {
    const cv = canvas
    if (!cv) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    cv.width = W * dpr
    cv.height = H * dpr
    const g = cv.getContext('2d')!
    let targets: Float32Array[] = []
    const ease = (t: number) => t * t * (3 - 2 * t)
    let last: Pick<DetentFrame, 'offset' | 'velocity'> = { offset: d.engine.x / 260, velocity: 0 }

    const draw = (f: Pick<DetentFrame, 'offset' | 'velocity'>) => {
      last = f
      g.setTransform(dpr, 0, 0, dpr, 0, 0)
      g.clearRect(0, 0, W, H)
      if (!targets.length) return
      const a = Math.floor(f.offset)
      const t = f.offset - a
      const A = targets[mod(a, N)]!
      const B = targets[mod(a + 1, N)]!
      const scatter = 46 + Math.min(220, Math.abs(f.velocity) * 90)
      for (let k = 0; k < PARTICLES; k++) {
        const e = ease(Math.min(1, Math.max(0, (t - delay[k]! * 0.7) / 0.55)))
        const x0 = A[k * 2]!
        const y0 = A[k * 2 + 1]!
        const x = x0 + (B[k * 2]! - x0) * e
        const y = y0 + (B[k * 2 + 1]! - y0) * e
        // An arc away from the straight line, widest mid-flight.
        const bow = Math.sin(Math.PI * e) * scatter * reach[k]!
        g.fillStyle = SHADES[shade[k]!]!
        g.globalAlpha = 0.85 - 0.35 * Math.sin(Math.PI * e)
        const s = size[k]!
        g.fillRect(x + Math.cos(angle[k]!) * bow, y + Math.sin(angle[k]!) * bow, s, s)
      }
      g.globalAlpha = 1
    }
    const off = d.subscribe(draw)
    // Glyph shapes need the page font: wait for fonts, then sample once.
    let alive = true
    ;(document.fonts?.ready ?? Promise.resolve()).then(() => {
      if (!alive) return
      targets = words.map(sample)
      draw(last)
    })
    return () => ((alive = false), off())
  })
</script>

<div class="dust">
  <div class="stage" {...d.rootAttrs} style={d.rootStyle + `width:${W}px;height:${H}px;touch-action:pan-y`} {@attach d.attachRoot}>
    <div {...d.trackAttrs} style={d.trackStyle} {@attach d.attachTrack}>
      {#each d.rows as r (r.key)}
        <div {...r.attrs} style={r.style} aria-label={r.item} class="row">{r.item}</div>
      {/each}
    </div>
    <canvas bind:this={canvas} aria-hidden="true"></canvas>
  </div>
  <div class="dots" role="group" aria-label="Choose a word">
    {#each words as w, i (w)}
      <button type="button" class="dot" class:on={i === index} aria-label={w} onclick={() => d.scrollTo(i)}></button>
    {/each}
  </div>
  <div {...d.liveRegionAttrs} style={d.liveRegionStyle}>{d.announcement}</div>
</div>

<style>
  .dust { position: relative; width: 520px; max-width: 100%; height: 380px; margin: 0 auto; border-radius: 16px; overflow: hidden; background: #eff5fd; }
  .stage { cursor: grab; outline: none; border-radius: inherit; }
  .stage:active { cursor: grabbing; }
  .row { opacity: 0; pointer-events: none; }
  canvas { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
  .dots { position: absolute; left: 0; right: 0; bottom: 16px; display: flex; gap: 6px; justify-content: center; align-items: center; }
  .dot { width: 6px; height: 6px; padding: 0; border: 0; border-radius: 99px; background: #c2cbd8; cursor: pointer; transition: width 0.25s, background 0.25s; }
  .dot.on { width: 18px; background: #222; }
  @media (prefers-color-scheme: dark) {
    .dust { background: #0d1626; } .dot { background: #3a4558; } .dot.on { background: #eee; }
  }
</style>
