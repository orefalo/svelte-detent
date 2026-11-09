<script lang="ts" generics="T">
  import { untrack } from 'svelte'
  import { presets } from '@hayderkg/detent/core'
  import { cssText, type CSSProperties } from './css'
  import { createDetent, rowVars } from './createDetent.svelte'
  import { useElasticRows } from './elasticRows.svelte'
  import { useGrip } from './grip.svelte'
  import { indicatorStyle, useIndicator, type IndicatorOptions } from './indicator.svelte'
  import type { DetentProps } from './props'
  import { refractionMap, useRefraction } from './refraction.svelte'
  import type { Key, Slot } from './types'

  let {
    item: itemSnippet,
    itemHeight,
    itemSize,
    gap = 0,
    width,
    height = 64,
    header,
    footer,
    emptyState,
    loadingRow,
    loading,
    perspective = 800,
    curvature = 0.5,
    radius,
    tilt,
    skew = 0,
    align = 'center',
    fade = 0.16,
    scale = 0,
    blur = 0,
    motionBlur = false,
    velocityTilt = false,
    centerLight = false,
    selectedDepth = false,
    elasticRows = false,
    grip = false,
    dim = 0.22,
    spacing = 0,
    easing = 'linear',
    highlight = true,
    highlightStyle = 'rounded',
    highlightShadow,
    indicator,
    indicatorContent,
    magnify = true,
    selectedStyle,
    selectedClassName,
    shadow,
    mask = 'gradient',
    maskSize = '28%',
    gradientBlur,
    glare,
    background,
    preset,
    rowStyle,
    theme,
    class: className,
    style,
    name,
    form,
    nonce,
    visibleCount = 7,
    orientation = 'vertical',
    value = $bindable(),
    onChange,
    ...options
  }: DetentProps<T> = $props()

  const uid = $props.id()
  const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
  /** `true` = the default amount, a number = clamped to `max`, anything else = off. */
  const amountOf = (v: boolean | number | undefined, on: number, max: number) => (v === true ? on : finite(v) ? Math.max(0, Math.min(max, v)) : 0)

  const motionMax = $derived(amountOf(motionBlur, 4, 24))
  const tiltMax = $derived(amountOf(velocityTilt, 2, 6))
  const lightMax = $derived(amountOf(centerLight, 0.12, 0.5))
  const depthMax = $derived(amountOf(selectedDepth, 8, 24))
  const elasticAmount = $derived(amountOf(elasticRows, 0.3, 6))
  const gripAmount = $derived(amountOf(grip, 0.5, 2))
  // Apparent depth as the scale a translateZ would give under an 800px perspective: perspective(800px)
  // translateZ(z) ≡ scale(800 / (800 − z)) on a flat row. A second perspective() in a row's transform chain (the drum
  // has its own) is drawn slanted by WebKit.
  const depthTransform = $derived(depthMax ? 'scale(calc(800 / (800 - var(--detent-depth, 0) * (1 - 2 * min(1, var(--abs-offset)))))) ' : '')
  const lightFilter = $derived(lightMax ? 'brightness(calc(1 + var(--detent-center-light, 0) * max(0, 1 - var(--abs-offset))))' : '')

  const itemPx = $derived(itemHeight ?? itemSize ?? 40)
  const pitch = $derived(Math.max(1, itemPx + gap) || 40)
  const vertical = $derived(orientation !== 'horizontal')
  const elasticTranslate = $derived(vertical ? '0 calc(var(--detent-row-lag, 0) * 1px)' : 'calc(var(--detent-row-lag, 0) * 1px) 0')

  const keyOf = (it: T, i: number): Key => (options.getKey ? options.getKey(it, i) : typeof it === 'string' || typeof it === 'number' ? it : i)

  const d = createDetent<T>(
    () => ({
      ...options,
      value,
      onChange: (it: T, i: number) => {
        value = it
        onChange?.(it, i)
      },
      preset: typeof preset === 'string' ? presets[preset] : preset,
      itemSize: pitch,
      visibleCount,
      orientation,
      header: header != null,
      footer: footer != null,
      loading,
    }),
    `detent-${uid}`,
  )

  // Geometry. Rows sit on a cylinder of radius R, θ = offset·α per row, projected with perspective P.
  const P = $derived(perspective)
  const half = $derived((visibleCount - 1) / 2)
  const alpha = $derived(radius ? 2 * Math.asin(Math.min(1, pitch / (2 * radius))) : (curvature * 1.3) / (half + 0.5))
  const drum = $derived(P > 0 && alpha > 1e-4)
  const R = $derived(radius ?? pitch / (2 * Math.sin(alpha / 2)))
  const base = $derived(half * pitch)
  const extent = $derived(pitch * visibleCount)
  const zoom = $derived(magnify === true ? 1.1 : magnify || 0)
  const dir = $derived(d.rtl && !vertical ? -1 : 1)

  // Indicator: the legacy band props map onto it; `indicator` wins where both are set.
  const ind: IndicatorOptions<T> = $derived({
    shape: highlight === false ? 'none' : typeof highlightStyle === 'string' ? highlightStyle : 'rounded',
    shadow: highlightShadow,
    ...indicator,
  })
  const refractionAmount = $derived(ind.refraction === true ? 0.5 : finite(ind.refraction) ? Math.max(0, Math.min(4, ind.refraction)) : 0)
  const refractionRGB = $derived(ind.refractionRGB === true ? 0.35 : finite(ind.refractionRGB) ? Math.max(0, Math.min(1, ind.refractionRGB)) : 0)
  const hasLens = $derived(zoom > 0 || refractionAmount > 0)
  const fitContent = $derived(ind.fit === 'content')
  // The keyboard focus ring outlines the band when it is a box; a needle, lines or a dot would make an odd
  // outline, so then the ring goes around the whole wheel instead.
  const ring = $derived(!['lines', 'needle', 'underline', 'dot', 'brackets'].includes(ind.shape as string))
  const inset = $derived(ind.inset ?? (ind.shape === 'lines' || ind.shape === 'needle' || ind.shape === 'underline' ? 0 : 6))

  let rootEl = $state<HTMLElement | null>(null)
  let trackEl = $state<HTMLElement | null>(null)
  let slotsEl = $state<HTMLDivElement | null>(null)
  let lensEl = $state<HTMLDivElement | null>(null)
  // Forms: the hidden field resets with its form, back to defaultValue (a controlled wheel is the parent's to reset).
  let field = $state<HTMLInputElement | null>(null)
  $effect(() => {
    const f = field?.form
    void name, form
    if (!f) return
    // A native form reset puts a field back to its default; so does this one (and a bound `value` follows).
    const reset = () => {
      const k = options.defaultValue === undefined ? undefined : keyOf(options.defaultValue, -1)
      const i = Math.max(0, k === undefined ? 0 : options.items.findIndex((it, j) => keyOf(it, j) === k))
      d.scrollTo(i)
      if (value !== undefined && options.items[i] !== undefined) value = options.items[i]
    }
    f.addEventListener('reset', reset)
    return () => f.removeEventListener('reset', reset)
  })

  const indicatorCtl = useIndicator(
    d,
    () => rootEl,
    () => trackEl,
    () => ({ opts: ind, items: options.items, keyOf, loop: !!options.loop, vertical, item: itemPx, pitch }),
  )
  // Physical left edge of the indicator box (vertical wheels), accounting for align and RTL.
  const px0 = $derived(fitContent ? 16 - (ind.paddingX ?? 14) : inset)
  const flip = $derived(d.rtl && vertical)
  const crossStart = $derived(
    !vertical || align === 'center'
      ? 'calc(50% - var(--indicator-w) / 2)'
      : (align === 'start') !== flip
        ? `${px0}px`
        : `calc(100% - ${px0}px - var(--indicator-w))`,
  )

  // JS-driven per-frame values (only when a prop is a function).
  const FALLOFF = {
    fade: ['--o', 'clamp(0, calc(1 - var(--e) * var(--detent-fade)), 1)'],
    scale: ['--s', 'max(0, calc(1 - var(--e) * var(--detent-scale)))'],
    blur: ['--b', 'calc(var(--e) * var(--detent-blur))'],
    dim: ['--d', 'min(1, calc(var(--e) * var(--detent-dim)))'],
    spacing: ['--x', 'calc(var(--offset) * var(--e) * var(--detent-spacing))'],
  } as const
  type FalloffName = keyof typeof FALLOFF
  const EASE = {
    linear: 'var(--abs-offset)',
    quad: 'calc(var(--abs-offset) * var(--abs-offset))',
    cubic: 'calc(var(--abs-offset) * var(--abs-offset) * var(--abs-offset))',
  }
  const fns = $derived({ fade, scale, blur, dim, spacing })
  const live = $derived((Object.keys(fns) as FalloffName[]).filter((k) => typeof fns[k] === 'function'))
  const easeFn = $derived(typeof easing === 'function' ? easing : undefined)
  const perFrame = $derived(live.length > 0 || !!easeFn || !!rowStyle)

  const rowCss = $derived.by((): CSSProperties => {
    const A = vertical ? 'Y' : 'X'
    const v: Record<string, string> = { '--e': easeFn ? '0' : EASE[easing as keyof typeof EASE] }
    for (const k of Object.keys(FALLOFF) as FalloffName[]) v[FALLOFF[k][0]] = FALLOFF[k][1]
    const shift = drum
      ? 'calc((var(--detent-radius) * sin(calc(var(--t) * 1rad)) * var(--k) - var(--offset) * var(--detent-pitch) + var(--x)) * var(--detent-dir) * 1px)'
      : 'calc(var(--x) * var(--detent-dir) * 1px)'
    if (drum) {
      v['--t'] = 'calc(var(--offset) * var(--detent-angle))'
      v['--k'] = 'calc(var(--detent-perspective) / (var(--detent-perspective) + var(--detent-radius) * (1 - cos(calc(var(--t) * 1rad)))))'
      v['--v'] = 'clamp(0, calc(cos(calc(var(--t) * 1rad)) * 6), 1)' // rows past the side of the drum vanish
    }
    const rot = vertical ? 'rotateX(calc(var(--t) * -1rad))' : 'rotateY(calc(var(--t) * var(--detent-dir) * 1rad))'
    return {
      ...v,
      transform:
        depthTransform + `translate${A}(${shift}) scale(calc(${drum ? 'var(--k) * ' : ''}var(--s)))` +
        (drum ? ` perspective(calc(var(--detent-perspective) * 1px)) ${rot}` : '') +
        (skew ? ` skew${vertical ? 'X' : 'Y'}(calc(var(--offset) * var(--detent-skew) * 1deg))` : ''),
      ...(elasticAmount ? { translate: elasticTranslate } : {}),
      ...(tiltMax ? { rotate: 'var(--detent-velocity-tilt, 0deg)' } : {}),
      opacity: drum ? 'calc(var(--o) * var(--v))' : 'var(--o)',
      ...(blur || motionMax || lightMax ? { filter: [lightFilter, blur ? 'blur(calc(var(--b) * 1px))' : '', motionMax ? 'var(--detent-motion-filter, blur(0px))' : ''].filter(Boolean).join(' ') } : {}),
      ...(dim ? { color: 'color-mix(in oklab, var(--detent-fg), var(--detent-dim-color) calc(var(--d) * 100%))' } : {}),
      justifyContent: align === 'center' ? 'center' : align === 'start' ? 'flex-start' : 'flex-end',
      paddingInline: align === 'center' ? 0 : 16,
    }
  })
  const rowCssText = $derived(cssText(rowCss))

  /** Values for function props (and custom easing) at `off`, as CSS variables. */
  const liveVars = (off: number): [string, string][] => {
    const out: [string, string][] = []
    // Junk from user functions (NaN, Infinity) falls back to the neutral value instead of reaching the DOM.
    const safe = (v: number, neutral: number) => String(Number.isFinite(v) ? v : neutral)
    if (easeFn) out.push(['--e', safe(easeFn(Math.abs(off)), Math.abs(off))])
    for (const k of live) out.push([FALLOFF[k][0], safe((fns[k] as (o: number) => number)(off), k === 'fade' || k === 'scale' ? 1 : 0)])
    return out
  }

  const refractionId = $derived(`detent-refraction-${uid}`)
  let refractionImage = $state<SVGFEImageElement | null>(null)
  let displacement = $state<SVGFEDisplacementMapElement | null>(null)
  let redOffset = $state<SVGFEOffsetElement | null>(null)
  let blueOffset = $state<SVGFEOffsetElement | null>(null)
  const refractionSource = $derived(refractionAmount ? refractionMap(vertical, !!ind.refractionInverse) : undefined)
  const motionId = $derived(`detent-motion-${uid}`)
  let motionFilter = $state<SVGFEGaussianBlurElement | null>(null)
  let reducedMotion = true

  useGrip(d, () => rootEl, () => ({ amount: gripAmount, pitch, vertical, rtl: d.rtl, disabled: !!options.disabled }))
  useRefraction(
    d,
    () => rootEl,
    () => refractionImage,
    () => displacement,
    () => ({
      id: refractionId,
      amount: refractionAmount,
      rgb: refractionRGB,
      inverse: !!ind.refractionInverse,
      vertical,
      item: itemPx,
      extent,
      band: () => (fitContent ? (vertical ? indicatorCtl.state.h : indicatorCtl.state.w) : itemPx),
    }),
    [() => redOffset, () => blueOffset],
  )
  useElasticRows(d, [() => trackEl, () => slotsEl, () => lensEl], () => ({ amount: elasticAmount, pitch, vertical, rtl: d.rtl }))

  /** Bring the mirror layers and JS-driven row values in line with the main track at `offset` (rows). */
  function sync(offset: number, velocity = 0) {
    const root = rootEl
    if (tiltMax || root?.style.getPropertyValue('--detent-velocity-tilt')) {
      const angle = reducedMotion ? 0 : Math.max(-1, Math.min(1, velocity / 3)) * tiltMax * (vertical || d.rtl ? -1 : 1)
      root?.style.setProperty('--detent-velocity-tilt', `${Math.abs(angle) < 0.01 ? 0 : Number(angle.toFixed(3))}deg`)
    }
    if (lightMax || root?.style.getPropertyValue('--detent-center-light')) root?.style.setProperty('--detent-center-light', String(reducedMotion ? 0 : lightMax))
    if (depthMax || root?.style.getPropertyValue('--detent-depth')) root?.style.setProperty('--detent-depth', String(reducedMotion ? 0 : depthMax))
    const amount = reducedMotion ? 0 : Math.min(motionMax, Math.abs(velocity) * 1.5)
    const active = amount >= 0.1 && !!motionFilter
    if (motionFilter) {
      const deviation = active ? Number(amount.toFixed(2)) : 0
      motionFilter.setAttribute('stdDeviation', vertical ? `0 ${deviation}` : `${deviation} 0`)
    }
    if (motionMax || root?.style.getPropertyValue('--detent-motion-filter')) {
      root?.style.setProperty('--detent-motion-filter', active ? `url(#${motionId})` : 'blur(0px)')
    }
    const t = trackEl?.style.transform
    for (const m of [slotsEl, lensEl]) {
      if (!m || !t) continue
      m.style.transform = t
      if (m === slotsEl || lightMax || depthMax)
        for (const el of m.children as unknown as HTMLElement[]) {
          const off = Number(el.dataset.detentSlot ?? el.dataset.detentMirror) - offset
          el.style.setProperty('--offset', String(off))
          el.style.setProperty('--abs-offset', String(Math.abs(off)))
        }
    }
    if (!perFrame || !trackEl) return
    for (const el of trackEl.children as unknown as HTMLElement[]) {
      const j = el.dataset.detentIndex
      if (!j) continue
      const off = +j - offset
      for (const [k, v] of liveVars(off)) el.style.setProperty(k, v)
      if (rowStyle) Object.assign(el.style, rowStyle(off, Number(el.dataset.detentItem), Math.abs(off) < 0.5))
    }
  }
  $effect(() => d.subscribe((f) => sync(f.offset, f.mode === 'idle' ? 0 : f.velocity)))

  // Row styles are strings, and Svelte writes a changed string over the whole element: that would wipe the
  // variables the frame loop sets by hand. So a row's string is built once per row and look, and reused on every
  // render; the frame loop owns the live values. A new look (any prop that styles rows) starts a new cache.
  const styleCache = $derived.by(() => {
    void [rowCssText, selectedStyle, rowStyle, fns, easeFn, pitch, vertical, depthTransform, lightFilter, elasticTranslate]
    return new Map<string, string>()
  })
  const box = (j: number): CSSProperties =>
    vertical ? { position: 'absolute', left: 0, right: 0, top: j * pitch, height: pitch } : { position: 'absolute', top: 0, bottom: 0, insetInlineStart: j * pitch, width: pitch }
  function rowStyleFor(r: { virtual: number; offset: number; index: number; selected: boolean }) {
    // Selection only matters to the string when a style depends on it.
    const k = `${r.virtual}:${r.index}:${r.selected && (selectedStyle || rowStyle) ? 1 : 0}`
    let s = styleCache.get(k)
    if (s === undefined) {
      styleCache.set(
        k,
        (s =
          rowCssText +
          cssText({ ...box(r.virtual), ...Object.fromEntries(rowVars(r.offset, visibleCount)), ...Object.fromEntries(liveVars(r.offset)), ...(r.selected ? selectedStyle : undefined), ...rowStyle?.(r.offset, r.index, r.selected) })),
      )
    }
    return s
  }
  function slotStyleFor(s: Slot) {
    const k = `slot:${s.virtual}`
    let v = styleCache.get(k)
    if (v === undefined) styleCache.set(k, (v = rowCssText + cssText({ ...box(s.virtual), '--offset': s.offset, '--abs-offset': Math.abs(s.offset) })))
    return v
  }

  // Masks: the edge fade, and (with the lens) a gap at the band so the magnified copy shows alone.
  const px = (v: number | string) => (typeof v === 'number' ? `${v}px` : v)
  const side = $derived(vertical ? 'bottom' : 'right')
  const edge = $derived(
    mask === 'none' ? '' : mask === 'gradient' ? `linear-gradient(to ${side},transparent,#000 ${px(maskSize)},#000 calc(100% - ${px(maskSize)}),transparent)` : mask,
  )
  const maskStyle = $derived(edge ? cssText({ maskImage: edge, WebkitMaskImage: edge }) : '')
  // With the lens: rows are hidden exactly where the indicator box is (the lens shows them magnified there),
  // so a long word entering a still-narrow indicator shows plain outside and magnified inside, never cut.
  const crossEnd = $derived(`calc(${crossStart} + var(--indicator-w))`)
  const holeMask = $derived(
    vertical
      ? `linear-gradient(to bottom,#000 calc(50% - var(--indicator-h) / 2),transparent 0 calc(50% + var(--indicator-h) / 2),#000 0),linear-gradient(to right,#000 ${crossStart},transparent 0 ${crossEnd},#000 0)`
      : `linear-gradient(to right,#000 calc(50% - var(--indicator-w) / 2),transparent 0 calc(50% + var(--indicator-w) / 2),#000 0),linear-gradient(to bottom,#000 calc(50% - var(--indicator-h) / 2),transparent 0 calc(50% + var(--indicator-h) / 2),#000 0)`,
  )
  const holeStyle = $derived(
    hasLens
      ? cssText({ position: 'absolute', inset: 0, maskImage: holeMask, WebkitMaskImage: holeMask, maskComposite: 'add', WebkitMaskComposite: 'source-over' })
      : 'position:absolute;inset:0',
  )
  const lensClip = $derived(
    vertical
      ? `inset(calc(50% - var(--indicator-h) / 2) calc(100% - ${crossEnd}) calc(50% - var(--indicator-h) / 2) ${crossStart} round var(--indicator-r))`
      : `inset(calc(50% - var(--indicator-h) / 2) calc(50% - var(--indicator-w) / 2) round var(--indicator-r))`,
  )

  // Indicator box: centered on the band, sized by --indicator-w / --indicator-h (px from the frame loop with
  // fit 'content', otherwise the band), drawn by shape × material.
  const hs = $derived(typeof highlightStyle === 'object' ? highlightStyle : undefined)
  const indicatorBox = $derived(
    cssText({
      position: 'absolute',
      width: 'var(--indicator-w)',
      height: 'var(--indicator-h)',
      top: 'calc(50% - var(--indicator-h) / 2)',
      left: vertical ? crossStart : 'calc(50% - var(--indicator-w) / 2)', // physical: crossStart already accounts for RTL
      boxSizing: 'border-box',
      pointerEvents: 'none',
      ...(ind.impact ? { scale: vertical ? 'calc(1 + var(--indicator-impact, 0) * .025) calc(1 - var(--indicator-impact, 0) * .07)' : 'calc(1 - var(--indicator-impact, 0) * .07) calc(1 + var(--indicator-impact, 0) * .025)' } : {}),
      ...indicatorStyle(ind, vertical),
      // The dot sits outside the content (clear of the lens' magnified text): widen only the drawn box.
      // The dot sits just left of the item: room for it beside fitted content (a band already spans the row).
      ...(ind.shape === 'dot' && fitContent ? { width: 'calc(var(--indicator-w) + 24px)', marginLeft: -12 } : {}),
      ...hs,
    }),
  )
  const radiusVar = $derived(ind.shape === 'pill' ? '999px' : ind.shape === 'rounded' || !ind.shape ? `${ind.radius ?? 12}px` : '0px')

  // Progressive edge blur: stacked backdrop-filter layers, each masked to a band that reaches a bit
  // further from the edge than the next stronger one. Overlapping linear ramps = no visible steps.
  const blurLayers = $derived.by((): string[] => {
    const gb = gradientBlur === true ? {} : gradientBlur || undefined
    if (!gb) return []
    const n = Math.max(1, gb.layers ?? 6)
    const strength = gb.strength ?? 8
    // Ramp length from each edge, against the root's real length (% of the gradient line): up to just short of the
    // center row, so it holds when the wheel is sized smaller than visibleCount rows.
    const reach = `(50% - ${pitch / 2 + 2}px)`
    const size = gb.size == null ? reach : `min(${gb.size}px, ${reach})`
    const out: string[] = []
    for (let k = 1; k <= n; k++) {
      const solid = `calc(${size} * ${(n - k) / n})`
      const clear = `calc(${size} * ${Math.min(1, (n - k + 2) / n)})`
      const m = `linear-gradient(to ${side},#000 ${solid},transparent ${clear},transparent calc(100% - ${clear}),#000 calc(100% - ${solid}))`
      const f = `blur(${strength / 2 ** (n - k)}px)`
      out.push(cssText({ backdropFilter: f, WebkitBackdropFilter: f, maskImage: m, WebkitMaskImage: m }))
    }
    return out
  })

  const tiltT = $derived(tilt == null ? '' : typeof tilt === 'number' ? (vertical ? `rotateY(${tilt}deg)` : `rotateX(${tilt}deg)`) : `rotateX(${tilt.x ?? 0}deg) rotateY(${tilt.y ?? 0}deg)`)
  // Band-sized until measured (fit 'content' writes px every frame). The value differs by mode (+ 0px) so the
  // style is written again when fit changes: back to 'band', the last measured px must not linger.
  const indicatorW = $derived((vertical ? `calc(100% - ${2 * inset}px` : `calc(${itemPx}px`) + (fitContent ? ' + 0px)' : ')'))
  const indicatorH = $derived(vertical ? `${itemPx}px` : `calc(100% - ${2 * inset}px)`)
  const rootStyle = $derived(
    d.rootStyle +
      cssText({ ...(vertical ? { width: width ?? '100%' } : { height }), background }) +
      (typeof style === 'string' ? style : cssText(style)),
  )

  // After a render: the root's style string may have been rewritten, rows or layers may be new. Bring every
  // hand-written value up to date (layout phase of the frame loop's world, before paint).
  $effect(() => {
    void [d.rows, styleCache, rootStyle, motionMax, tiltMax, lightMax, depthMax, vertical, d.rtl, trackEl, slotsEl, lensEl, motionFilter]
    untrack(() => {
      sync(d.engine.x / pitch, d.engine.v)
      indicatorCtl.apply()
    })
  })

  $effect(() => {
    if (!motionMax && !tiltMax && !lightMax && !depthMax) return
    void pitch
    const mq = matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => {
      reducedMotion = mq.matches
      sync(d.engine.x / pitch, d.engine.v)
    }
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  })

  const css = (() => {
    const light = '--detent-fg:#0a0a0a;--detent-dim-color:#b4b4b4;--detent-band:rgb(0 0 0/.05);--detent-line:rgb(0 0 0/.16);--detent-ring:rgb(0 0 0/.45);--detent-shade:rgb(0 0 0/.07);--detent-glare:rgb(255 255 255/.55)'
    const dark = '--detent-fg:#ededed;--detent-dim-color:#5a5a5a;--detent-band:rgb(255 255 255/.07);--detent-line:rgb(255 255 255/.16);--detent-ring:rgb(255 255 255/.4);--detent-shade:rgb(0 0 0/.35);--detent-glare:rgb(255 255 255/.08)'
    const U = '[data-detent-ui]'
    return `${U}{${light};color:var(--detent-fg);font-variant-numeric:tabular-nums;font-size:var(--detent-font-size,20px);cursor:grab;outline:none}
@media (prefers-color-scheme:dark){${U}:not([data-theme=light]):not([data-theme=light] *){${dark}}}
[data-theme=dark] ${U},${U}[data-theme=dark]{${dark}}
${U}[data-dragging]{cursor:grabbing}
${U}:focus-visible{outline:none}
${U} [data-ring]{transition:outline-color .15s,outline-offset .15s;outline:1.5px solid transparent;outline-offset:6px}
${U}:focus-visible [data-ring]{outline-color:var(--detent-ring);outline-offset:3px}
${U}:focus-visible:not(:has([data-ring])){border-radius:14px;box-shadow:0 0 0 1.5px var(--detent-ring),0 0 0 5px var(--detent-band)}
${U} [data-detent-row]{display:flex;align-items:center;backface-visibility:hidden;white-space:nowrap}
${U} [data-detent-layer]{position:absolute;inset:0;pointer-events:none}
${U} [data-detent-layer] [data-detent-row]{pointer-events:auto}
${U} img{-webkit-user-drag:none;user-select:none}`
  })()
  const styleTag = $derived(`<style${nonce ? ` nonce="${nonce.replace(/"/g, '&quot;')}"` : ''}>${css}</style>`)
  const trackStyle = $derived(d.trackStyle + (gripAmount ? ';translate:var(--detent-grip-x, 0px) var(--detent-grip-y, 0px)' : ''))
  const mirrorLayer = $derived(trackStyle)
  const bodyOf = (r: { item: T; index: number; selected: boolean; offset: number }, progress: number) =>
    ({ index: r.index, selected: r.selected, offset: r.offset, progress })
</script>

<svelte:head>{@html styleTag}</svelte:head>

{#snippet body(it: T, state: { index: number; selected: boolean; offset: number; progress: number })}
  {#if itemSnippet}{@render itemSnippet(it, state)}{:else}{String(it)}{/if}
{/snippet}

{#snippet slotRow(s: Slot | null, content: typeof header | string)}
  {#if s}
    <div {...s.attrs} style={slotStyleFor(s)} data-detent-row="" data-detent-slot={s.virtual}>
      {#if typeof content === 'string'}{content}{:else if content}{@render content()}{/if}
    </div>
  {/if}
{/snippet}

{#if refractionAmount > 0}
  <svg width="0" height="0" aria-hidden="true" focusable="false" style="position:absolute;pointer-events:none">
    <defs>
      <filter id={refractionId} x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
        <feFlood flood-color="rgb(128,128,128)" result="neutral" />
        <feImage bind:this={refractionImage} href={refractionSource} x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="curve" />
        <feComposite in="curve" in2="neutral" operator="over" result="map" />
        <feDisplacementMap bind:this={displacement} in="SourceGraphic" in2="map" scale="0" xChannelSelector="R" yChannelSelector="G" result="refracted" />
        {#if refractionRGB > 0}
          <feOffset bind:this={redOffset} in="refracted" dx="0" dy="0" result="red-shift" />
          <feColorMatrix in="red-shift" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="red" />
          <feColorMatrix in="refracted" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="green" />
          <feOffset bind:this={blueOffset} in="refracted" dx="0" dy="0" result="blue-shift" />
          <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="blue" />
          <feComposite in="red" in2="green" operator="arithmetic" k2="1" k3="1" />
          <feComposite in2="blue" operator="arithmetic" k2="1" k3="1" result="channels" />
          <!-- Channel colors alone cannot fringe black glyphs. Alpha differences add their colored rims,
               while identical coverage (the center and opaque images) contributes nothing. -->
          <feComposite in="red-shift" in2="blue-shift" operator="arithmetic" k2="1" k3="-1" result="red-rim" />
          <feFlood flood-color="#ff3040" />
          <feComposite in2="red-rim" operator="in" result="red-fringe" />
          <feComposite in="blue-shift" in2="red-shift" operator="arithmetic" k2="1" k3="-1" result="cyan-rim" />
          <feFlood flood-color="#00cfff" />
          <feComposite in2="cyan-rim" operator="in" result="cyan-fringe" />
          <feMerge result="chromatic"><feMergeNode in="channels" /><feMergeNode in="red-fringe" /><feMergeNode in="cyan-fringe" /></feMerge>
          <!-- Keep the RGB pass away from the neutral reading area, including antialiasing. -->
          <feColorMatrix in="map" values={`0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${vertical ? '0 1' : '1 0'} 0 0 0`} />
          <feComponentTransfer result="dispersion-mask"><feFuncA type="table" tableValues="1 .75 .5 .25 0 0 0 .25 .5 .75 1" /></feComponentTransfer>
          <feComposite in="chromatic" in2="dispersion-mask" operator="in" result="dispersion" />
          <!-- Replace the masked area: drawing it over the original hides separated channels in white text. -->
          <feComposite in="refracted" in2="dispersion-mask" operator="out" result="clear-center" />
          <feComposite in="clear-center" in2="dispersion" operator="arithmetic" k2="1" k3="1" />
        {/if}
      </filter>
    </defs>
  </svg>
{/if}
{#if motionMax > 0}
  <svg width="0" height="0" aria-hidden="true" focusable="false" style="position:absolute;pointer-events:none">
    <defs>
      <filter id={motionId} x="-50%" y="-50%" width="200%" height="200%" color-interpolation-filters="sRGB">
        <feGaussianBlur bind:this={motionFilter} stdDeviation="0 0" />
      </filter>
    </defs>
  </svg>
{/if}

<div
  {...d.rootAttrs}
  class={className}
  style={rootStyle}
  style:--detent-pitch={pitch}
  style:--detent-angle={drum ? alpha : 0}
  style:--detent-radius={drum ? R : 0}
  style:--detent-perspective={P || 1}
  style:--detent-fade={typeof fade === 'number' ? fade : 0}
  style:--detent-scale={typeof scale === 'number' ? scale : 0}
  style:--detent-blur={typeof blur === 'number' ? blur : 0}
  style:--detent-dim={typeof dim === 'number' ? dim : 0}
  style:--detent-spacing={typeof spacing === 'number' ? spacing : 0}
  style:--detent-skew={skew}
  style:--detent-dir={dir}
  style:--detent-magnify={zoom || 1}
  style:--indicator-w={indicatorW}
  style:--indicator-h={indicatorH}
  style:--indicator-r={radiusVar}
  data-detent-ui=""
  data-theme={theme}
  bind:this={rootEl}
  {@attach d.attachRoot}
>
  <div data-detent-layer="" style={tiltT ? `transform:perspective(${P || 800}px) ${tiltT}` : undefined}>
    {#if ind.shape !== 'none' || indicatorContent || typeof highlight === 'function'}
      <div data-detent-band="" data-ring={ring ? '' : undefined} style={indicatorBox}>
        {#if typeof highlight === 'function'}{@render highlight()}{/if}
        {#if indicatorContent}
          {@render indicatorContent({ width: indicatorCtl.state.w, height: indicatorCtl.state.h, progress: 1, velocity: 0, item: d.selectedItem })}
        {/if}
      </div>
    {/if}
    <div data-detent-layer="" style={maskStyle}>
      <div style={holeStyle}>
        <div {...d.trackAttrs} style={trackStyle} bind:this={trackEl} {@attach d.attachTrack}>
          {#each d.rows as r (r.key)}
            <div
              {...r.attrs}
              class={r.selected ? selectedClassName : undefined}
              style={rowStyleFor(r)}
              data-detent-row=""
              data-detent-item={r.index}
            >
              <!-- With fit 'content' the content box is measured (ResizeObserver) to size the indicator. -->
              {#if fitContent}
                <span data-detent-content="" style="display:inline-flex;align-items:center">{@render body(r.item, bodyOf(r, Math.max(0, 1 - Math.abs(r.offset) / (visibleCount / 2))))}</span>
              {:else}
                {@render body(r.item, bodyOf(r, Math.max(0, 1 - Math.abs(r.offset) / (visibleCount / 2))))}
              {/if}
            </div>
          {/each}
        </div>
      </div>
    </div>
    {#if header != null || footer != null || loading}
      <div data-detent-layer="" style={maskStyle}>
        <div bind:this={slotsEl} style={mirrorLayer}>
          {@render slotRow(d.header, header)}
          {@render slotRow(d.loadingRow, loadingRow ?? '…')}
          {@render slotRow(d.footer, footer)}
        </div>
      </div>
    {/if}
    {#each blurLayers as s, i (i)}
      <div data-detent-layer="" style={s}></div>
    {/each}
    {#if hasLens}
      <!-- The lens is a visual copy: inert keeps its controls (interactive rows) out of tab order and clicks. -->
      <div data-detent-layer="" aria-hidden="true" inert style={`clip-path:${lensClip}`}>
        <div data-detent-optics="" style={cssText({ position: 'absolute', inset: 0, ...(refractionAmount ? { filter: 'var(--detent-refraction-filter, none)' } : {}) })}>
          <div bind:this={lensEl} style={mirrorLayer}>
            {#each d.rows as r (r.key)}
              <div
                data-detent-row=""
                data-detent-mirror={r.virtual}
                style={cssText({
                  ...box(r.virtual),
                  ...(elasticAmount ? { translate: elasticTranslate } : {}),
                  ...(depthMax ? { transform: depthTransform } : {}),
                  justifyContent: rowCss.justifyContent,
                  paddingInline: rowCss.paddingInline,
                  pointerEvents: 'none',
                  ...(tiltMax ? { rotate: 'var(--detent-velocity-tilt, 0deg)' } : {}),
                  ...(motionMax || lightMax ? { filter: [lightFilter, motionMax ? 'var(--detent-motion-filter, blur(0px))' : ''].filter(Boolean).join(' ') } : {}),
                })}
              >
                <div style={`transform:scale(${zoom || 1});transform-origin:${align === 'center' ? 'center' : align === 'start' ? 'left center' : 'right center'}`}>
                  {@render body(r.item, bodyOf(r, 1))}
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>
    {/if}
    {#if shadow}
      <div
        data-detent-layer=""
        style={cssText({ background: shadow === true ? `linear-gradient(to ${side},var(--detent-shade),transparent 22%,transparent 78%,var(--detent-shade))` : shadow })}
      ></div>
    {/if}
    {#if glare}
      <div
        data-detent-layer=""
        style={cssText({ background: `linear-gradient(to ${side},transparent 30%,var(--detent-glare) 47%,transparent 64%)`, mixBlendMode: 'soft-light' })}
      ></div>
    {/if}
  </div>
  {#if !d.rows.length && header == null && emptyState}
    <div data-detent-layer="" style="display:grid;place-items:center">
      {@render emptyState()}
    </div>
  {/if}
</div>
<!-- A sibling, not a child: a listbox may only own options. -->
<div {...d.liveRegionAttrs} style={d.liveRegionStyle}>{d.announcement}</div>
{#if name}
  <input
    bind:this={field}
    type="hidden"
    {name}
    {form}
    disabled={options.disabled}
    value={d.selectedItem === undefined ? '' : String(keyOf(d.selectedItem, d.selectedIndex))}
  />
{/if}
