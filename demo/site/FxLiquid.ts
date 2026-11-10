/** The Liquid effect's cards and shader, ported from the site's own demo (kanji cards: the set the site shows). */
export interface Card { id: number; kind: 'kanji'; label: string; glyph: string; romaji: string; bg: string; fg: string }

export const CARD_W = 186
export const CARD_H = 250
/** Row pitch in the atlas and on the wheel: card height plus 40 px. */
export const PITCH = 290

export const KANJI: Card[] = (
  [
    ['光', 'Hikari', 'Light', '#ec5a35', '#141210'],
    ['風', 'Kaze', 'Wind', '#2f4cf0', '#ffffff'],
    ['雪', 'Yuki', 'Snow', '#eef0f3', '#1b2a4a'],
    ['月', 'Tsuki', 'Moon', '#141414', '#f2e6c8'],
    ['山', 'Yama', 'Mountain', '#2f5d46', '#e9efe6'],
    ['花', 'Hana', 'Flower', '#f3c9d3', '#7a1f3d'],
    ['海', 'Umi', 'Sea', '#0e3b5c', '#9fd3e6'],
    ['火', 'Hi', 'Fire', '#f5b700', '#141210'],
  ] as const
).map(([glyph, romaji, label, bg, fg], id) => ({ id, kind: 'kanji', label, glyph, romaji, bg, fg }))

/** Small caps at the foot of a card: one label at each side. */
const caps = (g: CanvasRenderingContext2D, left: string, right: string, y: number, w: number, color: string) => {
  g.fillStyle = color
  g.font = '600 6.5px ui-monospace, Menlo, monospace'
  g.textBaseline = 'middle'
  g.textAlign = 'left'
  g.fillText(left, 30, y)
  g.textAlign = 'right'
  g.fillText(right, w - 30, y)
  g.textAlign = 'left'
}

/** One card, drawn in a pill shape (corner radius = half the width). */
export function drawCard(g: CanvasRenderingContext2D, card: Card, w = CARD_W, h = CARD_H) {
  g.save()
  g.beginPath()
  g.roundRect(0, 0, w, h, w / 2)
  g.clip()
  g.fillStyle = card.bg
  g.fillRect(0, 0, w, h)
  g.fillStyle = card.fg
  g.font = '700 128px "Hiragino Sans", "Noto Sans JP", "Yu Gothic", sans-serif'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText(card.glyph, w / 2, 0.45 * h)
  g.textAlign = 'left'
  g.globalAlpha = 0.7
  caps(g, card.romaji.toUpperCase(), card.label.toUpperCase(), 0.8 * h, w, card.fg)
  g.globalAlpha = 1
  g.restore()
}

/** Every card as a PNG object URL, for the CSS tier and the markup (so the wheel has something to show before WebGL does). */
export const spriteUrls = (dpr: number, cards = KANJI) =>
  Promise.all(
    cards.map(
      (card) =>
        new Promise<string>((done) => {
          const c = document.createElement('canvas')
          c.width = CARD_W * dpr
          c.height = CARD_H * dpr
          const g = c.getContext('2d')!
          g.scale(dpr, dpr)
          drawCard(g, card)
          c.toBlob((blob) => done(blob ? URL.createObjectURL(blob) : ''), 'image/png')
        }),
    ),
  )

/** All cards in one tall canvas (234 wide, 290 per card, each centred with room around it): the shader's texture. */
export function atlas(dpr: number, cards = KANJI) {
  const c = document.createElement('canvas')
  c.width = 234 * dpr
  c.height = PITCH * cards.length * dpr
  const g = c.getContext('2d')!
  g.scale(dpr, dpr)
  cards.forEach((card, i) => {
    g.save()
    g.translate(24, PITCH * i + 20)
    drawCard(g, card)
    g.restore()
  })
  return c
}

const VERT = `#version 300 es
out vec2 uv;
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  uv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`

const FRAG = `#version 300 es
precision highp float;
in vec2 uv;
out vec4 o;
uniform sampler2D atlas;
uniform vec2 view;
uniform float offset, vel, pitch, total, atlasW, start;
vec4 tex(float x, float y) {
  if (x < 0.0 || x > atlasW) return vec4(0.0);
  return texture(atlas, vec2(x / atlasW, y / total));
}
void main() {
  vec2 p = vec2(uv.x, 1.0 - uv.y) * view;
  float s = p.y - view.y * 0.5;
  float dir = s < 0.0 ? -1.0 : 1.0;
  // The warp starts where the neighbours start (the centered card is never touched) and grows to the edge.
  float len = max(1.0, view.y * 0.5 - start);
  float t = max(0.0, abs(s) - start);
  float e = smoothstep(0.0, 1.0, t / len);
  float sm = clamp(abs(vel) / 2.5, 0.0, 1.0);
  // Content position: slope 1 at the start, falling to 1 - K at the edge (the card stretches up to 1 / (1 - K)).
  float K = min(0.85, 1.500 * 0.4 + 0.350 * sm);
  float u = abs(s) - K * t * t / (2.0 * len);
  float cy = offset * pitch + pitch * 0.5 + dir * u;
  float fl = 1.0 + 0.800 * pow(e, 2.4) + 0.15 * sm * e; // late: the rounded end facing the center keeps its shape
  float cx = p.x - view.x * 0.5;
  float x = cx / fl + atlasW * 0.5;
  float smear = 46.000 * e * e + abs(vel) * 7.000 * (0.3 + 0.7 * e);
  float ca = 3.200 * e + 1.600 * sm;
  float side = cx < 0.0 ? -1.0 : 1.0;
  vec4 acc = vec4(0.0);
  for (int i = 0; i < 10; i++) {
    float q = float(i) / 9.0 * smear * -dir;
    vec4 r = tex(x - ca * side, cy + q - ca * dir);
    vec4 g = tex(x, cy + q);
    vec4 b = tex(x + ca * side, cy + q + ca * dir);
    acc += vec4(r.r, g.g, b.b, max(max(r.a, g.a), b.a));
  }
  o = acc / 10.0;
}`

export interface Gl {
  resize(): void
  draw(offset: number, velocity: number): void
  destroy(): void
}

/** The shader pipeline for a canvas: the atlas as a texture and one full-screen triangle. Null when WebGL2 is unavailable. */
export function createGl(canvas: HTMLCanvasElement, tex: HTMLCanvasElement, dpr: number, count: number): Gl | null {
  const gl = canvas.getContext('webgl2', { premultipliedAlpha: true, antialias: false })
  if (!gl) return null
  const compile = (type: number, src: string) => {
    const sh = gl.createShader(type)!
    gl.shaderSource(sh, src)
    gl.compileShader(sh)
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(sh) ?? 'shader')
    return sh
  }
  if (gl.isContextLost()) return null
  const program = gl.createProgram()!
  gl.attachShader(program, compile(gl.VERTEX_SHADER, VERT))
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAG))
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null
  gl.useProgram(program)
  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tex)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT)
  const u = Object.fromEntries(['view', 'offset', 'vel', 'pitch', 'total', 'atlasW', 'start'].map((n) => [n, gl.getUniformLocation(program, n)])) as Record<string, WebGLUniformLocation | null>
  gl.uniform1f(u.pitch!, PITCH)
  gl.uniform1f(u.start!, 165)
  gl.uniform1f(u.total!, PITCH * count)
  gl.uniform1f(u.atlasW!, 234)
  gl.enable(gl.BLEND)
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
  const out: Gl = {
    resize() {
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.uniform2f(u.view!, w, h)
    },
    draw(offset, velocity) {
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.uniform1f(u.offset!, offset)
      gl.uniform1f(u.vel!, velocity)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    },
    destroy() {
      gl.deleteTexture(texture)
      gl.deleteProgram(program)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
    },
  }
  out.resize()
  return out
}
