<script lang="ts">
  // In your app: import { createDetent } from '@hayderkg/detent-svelte'
  import { createDetent, type DetentFrame } from '../../src/lib'

  /**
   * Liquid cards. Three renderers share one headless wheel:
   *  - webgl: cards are painted to a 2D canvas and a fragment shader stretches them toward the edges, smears them
   *    with speed and splits the colour channels at the outline;
   *  - css: the real cards, stretched with transforms and an SVG blur / channel-split filter;
   *  - off: plain cards.
   */
  interface Card { id: string; label: string; kanji: string; romaji: string; color: string }
  const cards: Card[] = [
    { id: 'yama', label: 'Mountain', kanji: '山', romaji: 'YAMA', color: '#2f9e6f' },
    { id: 'hana', label: 'Flower', kanji: '花', romaji: 'HANA', color: '#e8559a' },
    { id: 'umi', label: 'Sea', kanji: '海', romaji: 'UMI', color: '#1fa0d8' },
    { id: 'hi', label: 'Fire', kanji: '火', romaji: 'HI', color: '#f6b800' },
    { id: 'hikari', label: 'Light', kanji: '光', romaji: 'HIKARI', color: '#ee5a33' },
    { id: 'kaze', label: 'Wind', kanji: '風', romaji: 'KAZE', color: '#2540ff' },
    { id: 'yuki', label: 'Snow', kanji: '雪', romaji: 'YUKI', color: '#9fb4c8' },
    { id: 'tsuki', label: 'Moon', kanji: '月', romaji: 'TSUKI', color: '#6b4fd8' },
  ]
  const N = cards.length
  const PITCH = 290
  const W = 520
  const H = 580
  const CARD_W = 186
  const CARD_H = 250
  const mod = (n: number, m: number) => ((n % m) + m) % m

  let mode = $state<'webgl' | 'css' | 'off'>('webgl')
  let phase = $state<'throw' | 'coast' | 'catch' | 'settle' | ''>('')
  let index = $state(0)

  const d = createDetent<Card>(() => ({
    items: cards,
    getKey: (c) => c.id,
    getLabel: (c) => c.label,
    label: 'Cards',
    loop: true,
    itemSize: PITCH,
    visibleCount: 3,
    overscan: 2,
    onSettle: (_, i) => (index = i),
  }))

  let root = $state<HTMLElement | null>(null)
  let canvas = $state<HTMLCanvasElement | null>(null)
  let blur = $state<SVGFEGaussianBlurElement | null>(null)

  // ---- state labels: throw (finger moving it), coast, catch (grabbing a moving wheel), settle (spring) ----
  let catchTimer = 0
  $effect(() => {
    const el = root
    if (!el) return
    const down = () => {
      if (d.engine.mode === 'coast' || d.engine.mode === 'spring') {
        phase = 'catch'
        clearTimeout(catchTimer)
        catchTimer = window.setTimeout(() => phase === 'catch' && (phase = ''), 450)
      }
    }
    el.addEventListener('pointerdown', down, true)
    return () => (el.removeEventListener('pointerdown', down, true), clearTimeout(catchTimer))
  })
  $effect(() =>
    d.subscribe((f) => {
      if (phase === 'catch' && f.mode !== 'drag') return
      phase = f.mode === 'drag' ? 'throw' : f.mode === 'coast' ? 'coast' : f.mode === 'spring' ? 'settle' : ''
    }),
  )

  // ---- webgl ----
  const VERT = `attribute vec2 p; varying vec2 uv; void main(){ uv = p * .5 + .5; gl_Position = vec4(p, 0., 1.); }`
  const FRAG = `precision mediump float;
varying vec2 uv; uniform sampler2D scene; uniform float v; uniform vec2 px;
vec4 at(vec2 c){ return texture2D(scene, c); }
void main(){
  float cy = uv.y - .5;
  float e = pow(abs(cy) * 2., 2.);
  // Stretch toward the edges: sample nearer the middle, and flare the sides out.
  vec2 s = vec2(.5 + (uv.x - .5) * (1. - .42 * e), .5 + cy * (1. - .5 * e));
  // Smear along the scroll axis, proportional to speed.
  float smear = v * .016;
  // Colour split: along the smear, and sideways toward the edges.
  vec2 split = vec2(.006 * e, smear * .35 + .0009 * e);
  vec4 sum = vec4(0.); float tw = 0.;
  for (int i = 0; i < 9; i++) {
    float t = float(i) / 8. - .5;
    vec2 o = vec2(0., smear * t);
    float r = at(s + o + split).r, g = at(s + o).g, b = at(s + o - split).b;
    float a = at(s + o).a;
    float w = 1. - abs(t) * .8;
    sum += vec4(r, g, b, a) * w; tw += w;
  }
  gl_FragColor = sum / tw;
}`

  $effect(() => {
    const cv = canvas
    if (!cv || mode !== 'webgl') return
    const gl = cv.getContext('webgl', { premultipliedAlpha: true, alpha: true })
    if (!gl) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    cv.width = W * dpr
    cv.height = H * dpr
    gl.viewport(0, 0, cv.width, cv.height)
    const shader = (type: number, src: string) => {
      const s = gl.createShader(type)!
      gl.shaderSource(s, src)
      gl.compileShader(s)
      return s
    }
    const prog = gl.createProgram()!
    gl.attachShader(prog, shader(gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(prog)
    gl.useProgram(prog)
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, 'p')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
    const tex = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true)
    const uV = gl.getUniformLocation(prog, 'v')
    gl.clearColor(0, 0, 0, 0)

    // The scene: stadium cards with a big kanji and two small captions, at the wheel's position.
    const scene = document.createElement('canvas')
    scene.width = W * dpr
    scene.height = H * dpr
    const g = scene.getContext('2d')!
    g.scale(dpr, dpr)
    const paint = (offset: number) => {
      g.clearRect(0, 0, W, H)
      const first = Math.floor(offset - 1.5) - 1
      for (let j = first; j <= first + 5; j++) {
        const c = cards[mod(j, N)]!
        const cy = H / 2 + (j - offset) * PITCH
        if (cy < -CARD_H || cy > H + CARD_H) continue
        const x = (W - CARD_W) / 2
        const y = cy - CARD_H / 2
        g.fillStyle = c.color
        g.beginPath()
        g.roundRect(x, y, CARD_W, CARD_H, CARD_W / 2)
        g.fill()
        g.fillStyle = '#0a0a0a'
        g.textAlign = 'center'
        g.textBaseline = 'middle'
        g.font = '900 128px "Hiragino Sans", "Noto Sans JP", "Yu Gothic", sans-serif'
        g.fillText(c.kanji, W / 2, cy - 8)
        g.font = '600 8px system-ui, sans-serif'
        g.textAlign = 'left'
        g.fillText(c.romaji, x + 30, cy + 74)
        g.textAlign = 'right'
        g.fillText(c.label.toUpperCase(), x + CARD_W - 30, cy + 74)
      }
    }
    const draw = (f: Pick<DetentFrame, 'offset' | 'velocity'>) => {
      paint(f.offset)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, scene)
      gl.uniform1f(uV, Math.max(-6, Math.min(6, f.velocity)))
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }
    const off = d.subscribe(draw)
    draw({ offset: d.engine.x / PITCH, velocity: 0 })
    return () => {
      off()
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
  })

  // ---- css: stretch with the distance and smear with speed through an SVG filter ----
  const cssRow = (offset: number) => {
    const a = Math.min(1.5, Math.abs(offset))
    return { transform: `scale(${1 + 0.12 * a}, ${1 + 0.5 * a * a})`, transformOrigin: offset < 0 ? '50% 100%' : '50% 0%' }
  }
  $effect(() => {
    if (mode !== 'css') return
    return d.subscribe((f) => blur?.setAttribute('stdDeviation', `0 ${Math.min(10, Math.abs(f.velocity) * 2.2).toFixed(2)}`))
  })
  const rowFor = (offset: number) => {
    if (mode !== 'css') return ''
    const s = cssRow(offset)
    return `transform:${s.transform};transform-origin:${s.transformOrigin};filter:url(#liquid-css)`
  }
</script>

<div class="liquid" class:webgl={mode === 'webgl'}>
  <svg width="0" height="0" aria-hidden="true" style="position:absolute">
    <filter id="liquid-css" x="-10%" y="-40%" width="120%" height="180%" color-interpolation-filters="sRGB">
      <feGaussianBlur bind:this={blur} in="SourceGraphic" stdDeviation="0 0" />
    </filter>
  </svg>
  <span class="corner tl" class:on={phase === 'throw'}>Throw</span>
  <span class="corner tr" class:on={phase === 'coast'}>Coast</span>
  <span class="corner bl" class:on={phase === 'catch'}>Catch</span>
  <span class="corner br" class:on={phase === 'settle'}>Settle</span>

  <div class="stage" {...d.rootAttrs} style={d.rootStyle + 'height:580px;touch-action:pan-x'} bind:this={root} {@attach d.attachRoot}>
    <div {...d.trackAttrs} style={d.trackStyle} {@attach d.attachTrack}>
      {#each d.rows as r (r.key)}
        <div {...r.attrs} style={r.style} class="row">
          <div
            class="card"
            class:hidden={mode === 'webgl'}
            role="img"
            aria-label={r.item.label}
            style="background:{r.item.color};{rowFor(r.offset)}"
          >
            <b>{r.item.kanji}</b>
            <span>{r.item.romaji}</span><span>{r.item.label.toUpperCase()}</span>
          </div>
        </div>
      {/each}
    </div>
    {#if mode === 'webgl'}<canvas bind:this={canvas} class="gl" aria-hidden="true"></canvas>{/if}
  </div>

  <div class="dots" aria-hidden="true">
    {#each cards as c, i (c.id)}<i class:on={i === index}></i>{/each}
  </div>
  <div class="live" {...d.liveRegionAttrs} style={d.liveRegionStyle}>{d.announcement}</div>
</div>

<div class="modes">
  {#each ['webgl', 'css', 'off'] as m (m)}
    <button type="button" class:on={mode === m} onclick={() => (mode = m as typeof mode)}>{m}</button>
  {/each}
</div>

<style>
  .liquid { position: relative; width: 520px; max-width: 100%; height: 580px; margin: 0 auto; border: 1px solid #e5e5e5; border-radius: 16px; overflow: hidden; background: #fff; font-family: system-ui, sans-serif; }
  .stage { width: 100%; cursor: grab; outline: none; }
  .stage:active { cursor: grabbing; }
  .row { display: grid; place-items: center; }
  .card { position: relative; width: 186px; height: 250px; border-radius: 93px; display: grid; place-items: center; color: #0a0a0a; box-sizing: border-box; }
  .card.hidden { visibility: hidden; }
  .card b { font: 900 128px/1 'Hiragino Sans', 'Noto Sans JP', 'Yu Gothic', sans-serif; transform: translateY(-8px); }
  .card span { position: absolute; bottom: 52px; font: 600 8px/1 system-ui, sans-serif; letter-spacing: 0.04em; }
  .card span:nth-of-type(1) { left: 30px; }
  .card span:nth-of-type(2) { right: 30px; }
  .gl { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
  .corner { position: absolute; z-index: 2; font: 700 11px/1 system-ui, sans-serif; letter-spacing: 0.18em; text-transform: uppercase; color: #0a0a0a; opacity: 0.45; transition: opacity 0.15s; pointer-events: none; }
  .corner.on { opacity: 1; }
  .tl { top: 22px; left: 22px; } .tr { top: 22px; right: 22px; } .bl { bottom: 22px; left: 22px; } .br { bottom: 22px; right: 22px; }
  .dots { position: absolute; z-index: 3; right: 14px; top: 50%; transform: translateY(-50%); display: grid; gap: 6px; justify-items: center; padding: 8px 5px; border-radius: 99px; background: rgb(255 255 255 / 0.72); box-shadow: 0 0 0 0.5px rgb(0 0 0 / 0.08); pointer-events: none; }
  .dots i { width: 5px; height: 5px; border-radius: 99px; background: #c4c4c4; transition: height 0.2s, background 0.2s; }
  .dots i.on { height: 15px; background: #222; }
  .modes { display: flex; gap: 14px; justify-content: center; margin-top: 12px; font: 12.5px ui-monospace, monospace; }
  .modes button { border: 0; background: none; padding: 0; font: inherit; color: #888; cursor: pointer; }
  .modes button.on { color: #111; font-weight: 700; }
  @media (prefers-color-scheme: dark) {
    .liquid { background: #0a0a0a; border-color: #2a2a2a; } .corner { color: #ededed; }
    .dots { background: rgb(20 20 20 / 0.6); } .dots i { background: #555; } .dots i.on { background: #eee; }
    .modes button.on { color: #eee; }
  }
</style>
