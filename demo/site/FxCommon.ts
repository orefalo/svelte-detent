/** Shared by the Liquid, Dust and Riso examples (ported from the site's own demo helpers). */
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x))
/** Smoothstep of a 0..1 progress. */
export const smooth = (x: number) => {
  const a = clamp01(x)
  return a * a * (3 - 2 * a)
}
/** Smoothstep between two edges. */
export const smoothstep = (lo: number, hi: number, x: number) => smooth((x - lo) / (hi - lo))
export const mod = (n: number, m: number) => ((n % m) + m) % m

/** Dark when the page says so (`data-theme`), otherwise when the system does. */
export const isDark = () => {
  const t = document.documentElement.dataset.theme
  return t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches
}

/** Calls `cb` when the theme changes. Returns a stop function. */
export function onTheme(cb: () => void) {
  const mo = new MutationObserver(cb)
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  const mq = matchMedia('(prefers-color-scheme: dark)')
  mq.addEventListener('change', cb)
  return () => (mo.disconnect(), mq.removeEventListener('change', cb))
}

/** Keeps a canvas's backing store at the device pixel ratio (up to 2) of its CSS size, and calls `draw` after each resize. */
export function watchCanvas(canvas: HTMLCanvasElement, draw: () => void) {
  const ro = new ResizeObserver(() => {
    const dpr = Math.min(2, devicePixelRatio || 1)
    const w = Math.round(canvas.clientWidth * dpr)
    const h = Math.round(canvas.clientHeight * dpr)
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w
      canvas.height = h
    }
    canvas.getContext('2d')!.setTransform(dpr, 0, 0, dpr, 0, 0)
    draw()
  })
  ro.observe(canvas)
  return () => ro.disconnect()
}
