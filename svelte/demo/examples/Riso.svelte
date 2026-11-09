<script lang="ts">
  // In your app: import { createDetent } from '@hayderkg/detent-svelte'
  import { createDetent, type DetentFrame } from '../../src/lib'

  /**
   * Photos printed in two inks as a halftone. Both screens use one dot lattice for every photo, so turning the wheel
   * dissolves a print into the next dot by dot (each dot swaps at its own moment), and speed slides the two plates
   * apart, out of register.
   */
  let { base = 'https://detent.hayder.sh/photos' }: { base?: string } = $props()
  const prints = [1, 2, 3, 4, 5, 6].map((n) => ({ id: `mist-${n}`, label: `Mist ${n}`, src: `${base}/mist-${n}.webp` }))
  const N = prints.length
  const W = 520
  const H = 460
  const PW = 225 // the print, css px
  const PH = 400
  const PX = 148
  const PY = 30
  const CELL = 5.2
  const PITCH = 270
  const PAPER = '#f2eee6'
  const PINK = '#ff4f95'
  const BLUE = '#2b3fc4'
  const mod = (n: number, m: number) => ((n % m) + m) % m

  let index = $state(0)
  const d = createDetent<(typeof prints)[number]>(() => ({
    items: prints,
    getKey: (p) => p.id,
    getLabel: (p) => p.label,
    label: 'Prints',
    loop: true,
    itemSize: PITCH,
    visibleCount: 3,
    onSettle: (_, i) => (index = i),
  }))

  let canvas = $state<HTMLCanvasElement | null>(null)

  interface Screen { x: Float32Array; y: Float32Array; thr: Float32Array; r: Float32Array[] }

  /** One halftone lattice at `deg`, with the ink radius of each dot for every print. */
  function lattice(deg: number, ink: (rgb: Uint8ClampedArray, i: number) => number, pix: Uint8ClampedArray[]): Screen {
    const a = (deg * Math.PI) / 180
    const cos = Math.cos(a)
    const sin = Math.sin(a)
    const xs: number[] = []
    const ys: number[] = []
    const reach = Math.hypot(PW, PH)
    for (let v = -reach; v <= reach; v += CELL)
      for (let u = -reach; u <= reach; u += CELL) {
        const x = PW / 2 + u * cos - v * sin
        const y = PH / 2 + u * sin + v * cos
        if (x >= 0 && x < PW && y >= 0 && y < PH) (xs.push(x), ys.push(y))
      }
    const n = xs.length
    const thr = new Float32Array(n)
    // A fixed hash per dot decides when it swaps during a dissolve.
    for (let i = 0; i < n; i++) thr[i] = ((Math.sin(i * 12.9898 + deg) * 43758.5453) % 1 + 1) % 1
    const r = pix.map((p) => {
      const out = new Float32Array(n)
      for (let i = 0; i < n; i++) {
        const k = (Math.floor(ys[i]!) * PW + Math.floor(xs[i]!)) * 4
        // radius from ink coverage: area ∝ r², so r = √coverage × the half-diagonal of a cell
        out[i] = Math.sqrt(Math.min(1, Math.max(0, ink(p, k)))) * CELL * 0.7
      }
      return out
    })
    return { x: Float32Array.from(xs), y: Float32Array.from(ys), thr, r }
  }

  $effect(() => {
    const cv = canvas
    if (!cv) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    cv.width = W * dpr
    cv.height = H * dpr
    const g = cv.getContext('2d')!
    let screens: { pink: Screen; blue: Screen } | null = null
    let alive = true
    let last: Pick<DetentFrame, 'offset' | 'velocity'> = { offset: d.engine.x / PITCH, velocity: 0 }
    const smooth = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
      return t * t * (3 - 2 * t)
    }

    const draw = (f: Pick<DetentFrame, 'offset' | 'velocity'>) => {
      last = f
      g.setTransform(dpr, 0, 0, dpr, 0, 0)
      g.globalCompositeOperation = 'source-over'
      g.fillStyle = PAPER
      g.fillRect(0, 0, W, H)
      if (!screens) return
      const a = Math.floor(f.offset)
      const t = f.offset - a
      const A = mod(a, N)
      const B = mod(a + 1, N)
      // Speed pulls the plates apart along the scroll axis.
      const slip = Math.max(-9, Math.min(9, f.velocity * 4))
      g.save()
      g.beginPath()
      g.rect(PX, PY, PW, PH)
      g.clip()
      g.globalCompositeOperation = 'multiply'
      const plate = (s: Screen, color: string, dy: number) => {
        g.fillStyle = color
        g.beginPath()
        for (let i = 0; i < s.x.length; i++) {
          const m = t <= 0 ? 0 : smooth(s.thr[i]! - 0.12, s.thr[i]! + 0.12, t * 1.24 - 0.12)
          const r = s.r[A]![i]! * (1 - m) + s.r[B]![i]! * m
          if (r < 0.25) continue
          const cx = PX + s.x[i]!
          const cy = PY + s.y[i]! + dy
          g.moveTo(cx + r, cy)
          g.arc(cx, cy, r, 0, Math.PI * 2)
        }
        g.fill()
      }
      plate(screens.pink, PINK, -slip)
      plate(screens.blue, BLUE, slip)
      g.restore()
    }
    const off = d.subscribe(draw)
    draw(last)

    // Read each photo once, at print size, and turn it into dot radii for the two screens.
    Promise.all(
      prints.map(
        (p) =>
          new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image()
            img.crossOrigin = 'anonymous'
            img.onload = () => resolve(img)
            img.onerror = reject
            img.src = p.src
          }),
      ),
    ).then((imgs) => {
      if (!alive) return
      const c = document.createElement('canvas')
      c.width = PW
      c.height = PH
      const x = c.getContext('2d', { willReadFrequently: true })!
      const pix = imgs.map((img) => {
        // cover-fit
        const s = Math.max(PW / img.naturalWidth, PH / img.naturalHeight)
        x.clearRect(0, 0, PW, PH)
        x.drawImage(img, (PW - img.naturalWidth * s) / 2, (PH - img.naturalHeight * s) / 2, img.naturalWidth * s, img.naturalHeight * s)
        return x.getImageData(0, 0, PW, PH).data
      })
      const lum = (p: Uint8ClampedArray, k: number) => (0.3 * p[k]! + 0.59 * p[k + 1]! + 0.11 * p[k + 2]!) / 255
      // Each photo is stretched to its own tonal range first, so a dark one prints as lightly as a pale one.
      const range = pix.map((p) => {
        const hist = new Uint32Array(256)
        for (let k = 0; k < p.length; k += 4) hist[Math.round(lum(p, k) * 255)]!++
        const at = (q: number) => {
          let n = 0
          for (let i = 0; i < 256; i++) if ((n += hist[i]!) >= q * (PW * PH)) return i / 255
          return 1
        }
        return [at(0.03), Math.max(at(0.97), at(0.03) + 0.1)] as const
      })
      const tone = (p: Uint8ClampedArray, k: number) => {
        const [lo, hi] = range[pix.indexOf(p)]!
        return Math.min(1, Math.max(0, (lum(p, k) - lo) / (hi - lo)))
      }
      screens = {
        // Pink carries the body of the picture; blue carries the shadows.
        pink: lattice(15, (p, k) => Math.pow(1 - tone(p, k), 1.15) * 0.78, pix),
        blue: lattice(75, (p, k) => Math.pow(Math.max(0, 0.55 - tone(p, k)) / 0.55, 1.3) * 0.95, pix),
      }
      draw(last)
    })
    return () => ((alive = false), off())
  })
</script>

<div class="riso">
  <div class="stage" {...d.rootAttrs} style={d.rootStyle + `width:${W}px;height:${H}px;touch-action:pan-x`} {@attach d.attachRoot}>
    <div {...d.trackAttrs} style={d.trackStyle} {@attach d.attachTrack}>
      {#each d.rows as r (r.key)}
        <div {...r.attrs} style={r.style} aria-label={r.item.label} class="row">{r.item.label}</div>
      {/each}
    </div>
    <canvas bind:this={canvas} aria-hidden="true"></canvas>
  </div>
  <span class="tag">MIST</span>
  <span class="inks" aria-hidden="true"><i style="background:{PINK}"></i><i style="background:{BLUE}"></i></span>
  <span class="count">{String(index + 1).padStart(2, '0')} / {String(N).padStart(2, '0')}</span>
  <div class="dots" aria-hidden="true">
    {#each prints as p, i (p.id)}<i class:on={i === index}></i>{/each}
  </div>
  <div {...d.liveRegionAttrs} style={d.liveRegionStyle}>{d.announcement}</div>
</div>

<style>
  .riso { position: relative; width: 520px; max-width: 100%; height: 460px; margin: 0 auto; border-radius: 16px; overflow: hidden; background: #f2eee6; font: 10px/1 ui-monospace, monospace; letter-spacing: 0.04em; color: #222; }
  .stage { cursor: grab; outline: none; }
  .stage:active { cursor: grabbing; }
  .row { opacity: 0; pointer-events: none; }
  canvas { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
  .tag { position: absolute; left: 384px; top: 30px; }
  .inks { position: absolute; left: 384px; bottom: 44px; display: flex; gap: 3px; }
  .inks i { width: 8px; height: 8px; }
  .count { position: absolute; left: 384px; bottom: 28px; }
  .dots { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); display: grid; gap: 6px; justify-items: center; }
  .dots i { width: 5px; height: 5px; border-radius: 99px; background: #c9c3b6; transition: height 0.2s, background 0.2s; }
  .dots i.on { height: 16px; background: #222; }
  @media (prefers-color-scheme: dark) { .riso { color: #ddd; } }
</style>
