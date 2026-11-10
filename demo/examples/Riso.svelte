<script lang="ts">
  // In your app: import { createDetent } from 'svelte-detent'
  import { ticks } from '../../src/lib'
  import { createDetent } from '../../src/lib'
  import FxDots from '../site/FxDots.svelte'
  import { isDark, mod, onTheme, smooth, watchCanvas } from '../site/FxCommon'

  /**
   * Photos printed in two inks as a halftone. Each print is turned into a rank map (its darkest pixels first), and
   * each ink prints dots on its own screen angle where the map is dark enough. Between two prints the dots dissolve
   * from one to the next; speed pulls the two plates out of register.
   */
  /** Where the photos are served from. */
  let { base = 'https://detent.hayder.sh' }: { base?: string } = $props()

  const prints = [1, 2, 3, 4, 5, 6].map((n) => ({ src: `/photos/mist-${n}.webp`, label: `Mist ${n}` }))
  const PITCH = 92
  /** The inks: pink and blue on paper, and (on a dark page) the same screens in light. */
  const light = [
    { ink: '#ff5ca8', angle: (15 * Math.PI) / 180, gamma: 1.1, gain: 0.7, dir: 1 },
    { ink: '#3f86ff', angle: (75 * Math.PI) / 180, gamma: 2.2, gain: 0.85, dir: -1 },
  ]
  const dark = [
    { ink: '#ff5c9f', angle: (15 * Math.PI) / 180, gamma: 0.9, gain: 0.7, dir: 1 },
    { ink: '#1f4fbf', angle: (75 * Math.PI) / 180, gamma: 2.8, gain: 0.8, dir: -1 },
  ]
  /** The print's rectangle in a stage of this size: 9:16, with room for the labels on the right. */
  const frameOf = (w: number, h: number) => {
    const ph = h - 60
    const pw = Math.min(w - 60 - 120, (9 / 16) * ph)
    return { x: Math.round((w - pw) / 2), y: 30, w: Math.round(pw), h: Math.round(ph) }
  }
  type Rank = { data: Float32Array; w: number; h: number }
  const rankAt = (r: Rank, x: number, y: number) => {
    const i = Math.min(r.w - 1, Math.max(0, Math.floor(x / 2)))
    const j = Math.min(r.h - 1, Math.max(0, Math.floor(y / 2)))
    return r.data[j * r.w + i]!
  }

  const d = createDetent<(typeof prints)[number]>(() => ({
    onTick: ticks({ sound: true, haptics: true }),
    items: prints,
    getKey: (p) => p.src,
    getLabel: (p) => p.label,
    itemSize: PITCH,
    visibleCount: 5,
    loop: true,
    label: 'Prints',
  }))

  let canvas = $state<HTMLCanvasElement | null>(null)

  $effect(() => {
    const cv = canvas
    if (!cv) return
    const ctx = cv.getContext('2d')!
    let images: HTMLImageElement[] = []
    let ranks: Rank[] = []
    let frame = { offset: d.engine.x / PITCH, velocity: 0 }
    const mono = getComputedStyle(document.body).getPropertyValue('--font-geist-mono').trim() || "'Geist Mono', ui-monospace, monospace"

    const draw = () => {
      const w = cv.clientWidth
      const h = cv.clientHeight
      const night = isDark()
      const inks = night ? dark : light
      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = night ? '#121110' : '#f4f0e8'
      ctx.fillRect(0, 0, w, h)
      if (!ranks.length) return
      const f = frameOf(w, h)
      const { offset, velocity } = frame
      const i0 = Math.floor(offset)
      const k = offset - i0
      const a = ranks[mod(i0, ranks.length)]!
      const b = ranks[mod(i0 + 1, ranks.length)]!
      const v = Math.max(-3, Math.min(3, velocity))
      ctx.globalCompositeOperation = night ? 'screen' : 'multiply'
      const R = Math.hypot(f.w, f.h) / 2 + 4
      const cx = f.x + f.w / 2
      const cy = f.y + f.h / 2
      for (const plate of inks) {
        // Speed pulls the plates apart, each its own way: out of register.
        const dx = plate.dir * v * 3
        const dy = plate.dir * v * 9
        const cos = Math.cos(plate.angle)
        const sin = Math.sin(plate.angle)
        ctx.fillStyle = plate.ink
        ctx.beginPath()
        for (let u = -R; u <= R; u += 4)
          for (let s = -R; s <= R; s += 4) {
            const x = cx + u * cos - s * sin
            const y = cy + u * sin + s * cos
            if (x < f.x || y < f.y || x > f.x + f.w || y > f.y + f.h) continue
            // The next print arrives from the top down, as a soft edge.
            const t = smooth(1.6 * k - ((y - f.y) / f.h) * 0.6)
            const rank = rankAt(a, x - f.x, y - f.y) * (1 - t) + rankAt(b, x - f.x, y - f.y) * t
            const r = 2.24 * Math.sqrt(Math.pow(night ? 1 - rank : rank, plate.gamma) * plate.gain)
            if (r < 0.35) continue
            ctx.moveTo(x + dx + r, y + dy)
            ctx.arc(x + dx, y + dy, r, 0, 2 * Math.PI)
          }
        ctx.fill()
      }
      ctx.globalCompositeOperation = 'source-over'
      const n = mod(Math.round(offset), prints.length)
      ctx.fillStyle = night ? 'rgb(240 236 228 / 0.7)' : 'rgb(20 20 20 / 0.7)'
      ctx.font = `600 10px ${mono}`
      ctx.textBaseline = 'alphabetic'
      ctx.textAlign = 'left'
      const lx = f.x + f.w + 18
      ctx.fillText(`${String(n + 1).padStart(2, '0')} / ${String(prints.length).padStart(2, '0')}`, lx, f.y + f.h)
      ctx.fillText('MIST', lx, f.y + 10)
      ctx.fillStyle = inks[0]!.ink
      ctx.fillRect(lx, f.y + f.h - 34, 10, 10)
      ctx.fillStyle = inks[1]!.ink
      ctx.fillRect(lx + 14, f.y + f.h - 34, 10, 10)
    }

    /** A print as a rank map at half resolution: 0 for its darkest pixel to 1 for its lightest. */
    const rank = (img: HTMLImageElement, w: number, h: number): Rank => {
      const rw = Math.max(1, Math.ceil(w / 2))
      const rh = Math.max(1, Math.ceil(h / 2))
      const c = document.createElement('canvas')
      c.width = rw
      c.height = rh
      const g = c.getContext('2d', { willReadFrequently: true })!
      const cover = Math.max(rw / img.naturalWidth, rh / img.naturalHeight)
      g.drawImage(img, (rw - img.naturalWidth * cover) / 2, (rh - img.naturalHeight * cover) / 2, img.naturalWidth * cover, img.naturalHeight * cover)
      const px = g.getImageData(0, 0, rw, rh).data
      const lum = new Float32Array(rw * rh)
      for (let i = 0; i < lum.length; i++) lum[i] = 1 - (0.2126 * px[4 * i]! + 0.7152 * px[4 * i + 1]! + 0.0722 * px[4 * i + 2]!) / 255
      const order = Array.from(lum.keys()).sort((p, q) => lum[p]! - lum[q]!)
      order.forEach((p, i) => void (lum[p] = i / (order.length - 1)))
      return { data: lum, w: rw, h: rh }
    }
    const rebuild = () => {
      const w = cv.clientWidth
      const h = cv.clientHeight
      if (!images.length || !w || !h) return draw()
      const f = frameOf(w, h)
      ranks = images.map((img) => rank(img, f.w, f.h))
      draw()
    }

    let alive = true
    Promise.all(
      prints.map(
        (p) =>
          new Promise<HTMLImageElement>((done) => {
            const img = new Image()
            img.decoding = 'async'
            // A canvas read of a cross-origin photo needs the host's permission to be read back.
            img.crossOrigin = 'anonymous'
            img.onload = img.onerror = () => done(img)
            img.src = base + p.src
          }),
      ),
    ).then((loaded) => {
      if (!alive) return
      images = loaded.filter((img) => img.naturalWidth > 0)
      rebuild()
    })
    const stopSize = watchCanvas(cv, rebuild)
    const stopTheme = onTheme(draw)
    const stopFrames = d.subscribe((f) => {
      frame = { offset: f.offset, velocity: f.mode === 'idle' ? 0 : f.velocity }
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
  <div {...d.rootAttrs} class="root" style="{d.rootStyle}width:100%" {@attach d.attachRoot}>
    <div {...d.trackAttrs} style={d.trackStyle} {@attach d.attachTrack}>
      {#each d.rows as r (r.key)}
        <div {...r.attrs} class="row" style={r.style}>{r.item.label}</div>
      {/each}
    </div>
    <canvas bind:this={canvas} class="canvas" aria-hidden="true"></canvas>
  </div>
  <FxDots count={prints.length} index={d.selectedIndex} variant="riso" />
  <div {...d.liveRegionAttrs} style={d.liveRegionStyle}>{d.announcement}</div>
</div>

<style>
  .stage { --fg: #0a0a0a; background: #f4f0e8; border-radius: 16px; width: 100%; position: relative; overflow: hidden; box-shadow: inset 0 0 0 0.5px #0000001a; }
  .root { cursor: grab; outline: none; position: relative; }
  .root:focus-visible { border-radius: 16px; box-shadow: inset 0 0 0 1.5px #00000073; }
  .root[data-dragging] { cursor: grabbing; }
  .row { opacity: 0; place-items: center; display: grid; }
  .canvas { pointer-events: none; width: 100%; height: 100%; position: absolute; inset: 0; }
  @media (prefers-color-scheme: dark) {
    .stage { --fg: #ededed; background: #121110; box-shadow: inset 0 0 0 0.5px #ffffff14; }
    .root:focus-visible { box-shadow: inset 0 0 0 1.5px #ffffff80; }
  }
</style>
