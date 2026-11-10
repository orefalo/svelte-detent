import { flushSync, untrack } from 'svelte'
import { createEngine, mod, type EngineOptions, type Mode } from './core'
import { cssText } from './css'
import type { Attrs, DetentApi, DetentFrame, DetentOptions, DetentRow, DetentSlot, Key, Slot } from './types'

const fmt = (n: number) => String(Math.round(n * 1e4) / 1e4)

/** Writes a row's CSS variables straight to its element (no arrays or objects: this runs for every row, every frame). */
export function writeRowVars(el: HTMLElement, off: number, visible: number) {
  const abs = Math.abs(off)
  const st = el.style
  st.setProperty('--offset', fmt(off))
  st.setProperty('--abs-offset', fmt(abs))
  st.setProperty('--progress', fmt(Math.max(0, 1 - abs / (visible / 2))))
  st.setProperty('--selected', abs < 0.5 ? '1' : '0')
}

/** The CSS variables of a row at distance `off` from the center. */
export const rowVars = (off: number, visible: number): [string, string][] => {
  const abs = Math.abs(off)
  return [
    ['--offset', fmt(off)],
    ['--abs-offset', fmt(abs)],
    ['--progress', fmt(Math.max(0, 1 - abs / (visible / 2)))],
    ['--selected', abs < 0.5 ? '1' : '0'],
  ]
}

/** Layout derived from the options: pure, made live in the commit effect. */
interface Layout<T> {
  o: DetentOptions<T>
  keys: Key[]
  n: number
  size: number
  visible: number
  vertical: boolean
  loop: boolean
  /** Track offset that centers row 0. */
  base: number
  head: boolean
  loadAt: number
  footAt: number
}

let uid = 0

/**
 * The headless wheel: physics, input, virtualization and accessibility, with no markup of its own.
 *
 *     const d = createDetent(() => ({ items, value, onChange }))
 *
 * `options` is a function so that reactive values (props, `$state`) are read where they change.
 * Everything stateful lives in this closure; Svelte only re-renders when rows or the selection change, and the
 * per-frame position (track transform, row CSS variables) is written straight to the DOM.
 */
export function createDetent<T>(options: () => DetentOptions<T>, id = `detent-${++uid}`): DetentApi<T> {
  const init = untrack(options)
  let version = $state(0)
  const update = () => void version++

  // Keys, recomputed only when items or getKey change.
  let memo: { items?: readonly T[]; getKey?: DetentOptions<T>['getKey']; keys: Key[] } = { keys: [] }
  const keyFn =
    (o: DetentOptions<T>) =>
    (item: T, i: number): Key =>
      o.getKey ? o.getKey(item, i) : typeof item === 'string' || typeof item === 'number' ? item : i

  function derive(o: DetentOptions<T>): Layout<T> {
    if (o.items !== memo.items || o.getKey !== memo.getKey)
      memo = { items: o.items, getKey: o.getKey, keys: o.items.map(keyFn(o)) }
    const n = o.items.length
    const size = Math.max(1, o.itemSize ?? 36) || 36
    const visible = Math.max(1, Math.round(o.visibleCount ?? 5)) || 5
    const loop = !!o.loop
    // Virtual layout: [header -1] items 0..n-1 [loading n] [footer].
    return {
      o,
      keys: memo.keys,
      n,
      size,
      visible,
      vertical: o.orientation !== 'horizontal',
      loop,
      base: ((visible - 1) / 2) * size,
      head: !loop && !!o.header,
      loadAt: !loop && o.loading ? n : NaN,
      footAt: !loop && o.footer ? n + (o.loading ? 1 : 0) : NaN,
    }
  }

  /** The live layout (what is on screen), also unpacked into locals for the per-frame code. */
  let L = derive(init)
  let { o, keys, n, size, visible, vertical, loop, base, head, loadAt, footAt } = L
  const live = (next: Layout<T>) =>
    ({ o, keys, n, size, visible, vertical, loop, base, head, loadAt, footAt } = L = next)

  const keyOf = (S: Layout<T>, v: T | undefined) => (v === undefined ? undefined : keyFn(S.o)(v, -1))
  const label = (S: Layout<T>, i: number) => (S.o.getLabel ? S.o.getLabel(S.o.items[i] as T, i) : String(S.o.items[i]))
  const itemAt = (S: Layout<T>, j: number) => (S.loop ? mod(j, S.n) : j >= 0 && j < S.n ? j : -1)
  const enabled = (S: Layout<T>, j: number) => {
    const i = itemAt(S, j)
    return i < 0 ? j !== S.loadAt : !S.o.isDisabled?.(S.o.items[i] as T, i)
  }
  const span = (S: Layout<T>, c: number, lead = 0): [number, number] => {
    const half = (S.visible - 1) / 2
    const over = S.o.overscan ?? 3
    return [Math.floor(c - half) - over - Math.max(0, -lead), Math.ceil(c + half) + over + Math.max(0, lead)]
  }

  let rtl = init.dir === 'rtl'
  /** The `dir` option as of the last commit: a change re-reads the direction (from the option, or the DOM). */
  let dirProp = init.dir
  let root: HTMLElement | null = null
  let track: HTMLElement | null = null
  let announce = ''
  let endFor = -1
  let spinning = false
  let committing = false
  let jumping = false
  const subs = new Set<(f: DetentFrame) => void>()

  /** Virtual index the wheel rests on (may be a header/footer). */
  let rest = Math.max(0, keys.indexOf(keyOf(L, init.value ?? init.defaultValue) as Key))
  /** Last item index the wheel rested on, and the last one reported through onChange. */
  let sel = rest
  let emitted = rest
  let valueKey = keyOf(L, init.value)
  let win = span(L, rest)

  const transform = (S: Layout<T>, x: number) => {
    const d = S.base - x
    return S.vertical ? `translate3d(0,${d}px,0)` : `translate3d(${rtl ? -d : d}px,0,0)`
  }
  const publish = (velocity: number) => {
    if (!subs.size) return
    // One frame object for every subscriber, not one each.
    const frame: DetentFrame = {
      offset: engine.x / size,
      velocity,
      mode: engine.mode,
      target: engine.target,
      from: engine.from,
    }
    subs.forEach((fn) => fn(frame))
  }

  function emit(i: number) {
    if (i !== emitted) o.onChange?.(o.items[(emitted = i)] as T, i)
  }

  /** Track transform and every rendered row's CSS variables, for a wheel at `x` px. */
  function paint(x: number) {
    if (!track) return
    const c = x / size
    track.style.transform = transform(L, x)
    const interactive = !!o.interactive
    for (const r of track.children as unknown as HTMLElement[]) {
      const j = r.dataset.detentIndex
      if (!j) continue
      writeRowVars(r, +j - c, visible)
      // Interactive rows: only the centered one takes focus and input. Off again: nothing stays inert.
      const inert = interactive && Math.abs(+j - c) >= 0.5
      if (r.inert !== inert) r.inert = inert
    }
  }

  const moving = () => !committing && !jumping && !!track && engine.mode !== 'idle'

  function onRender(x: number, v: number) {
    const c = x / size
    paint(x)
    // Keep the rendered window ahead of the motion (lead by ~3 frames of travel).
    const half = (visible - 1) / 2
    if (Math.floor(c - half) - 1 < win[0] || Math.ceil(c + half) + 1 > win[1]) {
      win = span(L, c, Math.round((v * 48) / size))
      // While the wheel moves (animation frames, pointer and wheel events), the rows must be there before this
      // frame paints: flush. A jump made from code (scrollTo, possibly inside an effect, where flushSync is not
      // allowed) renders normally.
      moving() ? flushSync(update) : update()
    }
    if (!loop && o.onEndReached && n && c >= n - 1 - (o.endReachedThreshold ?? 5) && endFor !== n) {
      endFor = n
      o.onEndReached()
    }
    o.onScrollProgress?.(c)
    publish(v)
  }

  function onMode(m: Mode) {
    if (root) root.dataset.state = m
    if (track) track.style.willChange = m === 'idle' ? '' : 'transform'
    const active = m !== 'idle'
    if (active !== spinning) {
      spinning = active
      if (active) o.onSpinStart?.()
      else o.onSpinEnd?.()
    }
    publish(engine.v)
  }

  function onTick(j: number, v: number) {
    const i = itemAt(L, j)
    if (i < 0) return
    o.onTick?.(i, v)
    if (o.changeOn === 'tick' && enabled(L, j)) emit(i)
  }

  function onSettle(j: number) {
    rest = j
    const i = itemAt(L, j)
    // An item first: a looping wheel's position runs past both ends (−6 in a loop of 12 is item 6), and only a
    // position with no item is the header (−1) or the footer.
    if (i >= 0) {
      sel = i
      announce = label(L, i)
      o.onSettle?.(o.items[i] as T, i)
      emit(i)
    } else if (j < 0) o.onHeaderRest?.()
    else if (j === footAt) o.onFooterRest?.()
    // Re-render (batched with any state the parent sets in onChange): the commit then sees the parent's answer.
    // The selected row is always rendered (see `view`), so the listbox never references a row that isn't there.
    update()
  }

  const engineOptions = (): EngineOptions => ({
    ...o,
    count: n,
    itemSize: size,
    visibleCount: visible,
    loop: loop,
    rtl,
    min: head ? -1 : 0,
    max: footAt === footAt ? footAt : n - 1,
    isEnabled: (j) => enabled(L, j),
    getLabel: (i) => label(L, i),
    onRender,
    onMode,
    onTick,
    onSettle,
  })
  const engine = createEngine(rest, engineOptions())
  // The track's transform is owned by the engine after mount; markup only ever sets this first one (SSR-correct).
  const initial = transform(L, rest * size)

  /** Make a layout live, keep identity across item changes, follow `value`. */
  function commit(next: Layout<T>) {
    committing = true
    const prev = L
    live(next)
    // Direction: from the option, or (when it is removed) from the DOM again.
    let redraw = prev.vertical !== vertical || prev.base !== base || !prev.o.interactive !== !o.interactive
    if (o.dir !== dirProp) {
      dirProp = o.dir
      const r = dirProp ? dirProp === 'rtl' : root ? getComputedStyle(root).direction === 'rtl' : rtl
      if (r !== rtl) ((rtl = r), (redraw = true), update())
    }
    engine.set(engineOptions()) // a new row size rescales positions: the same rows stay centered
    if (prev.keys !== keys) {
      const ci = loop ? mod(engine.index, prev.keys.length || 1) : engine.index
      if (ci >= 0 && ci < prev.keys.length) {
        const ni = keys.indexOf(prev.keys[ci] as Key)
        if (ni >= 0 && ni !== ci) {
          engine.shift(ni - ci) // the centered item keeps its place on screen
          rest += ni - ci
          sel = emitted = ni
          update()
        } else if (ni < 0 && engine.mode === 'idle' && n) engine.goTo(Math.min(n - 1, ci), false)
      }
    }
    // The row the wheel rests on may have disappeared (footer/header removed, list shortened): re-seat.
    if (!loop && engine.mode === 'idle' && (n || head)) {
      const lo = head ? -1 : 0
      const hi = footAt === footAt ? footAt : n - 1
      const at = engine.index
      if (at < lo || at > hi || at === loadAt)
        engine.goTo(Math.max(lo, Math.min(hi, at === loadAt ? n - 1 : at)), false)
    }
    // Controlled value. A new value turns the wheel to it. While the user turns it, the wheel follows the user
    // and reports through onChange; once it rests, it agrees with the parent: if the parent kept another value
    // (it rejected the change), the wheel turns back to it. Never mid-motion, so a throw is never steered.
    const vk = keyOf(L, o.value)
    if (vk !== valueKey && (valueKey = vk) !== undefined) {
      const i = keys.indexOf(vk as Key)
      if (i >= 0 && i !== emitted) engine.scrollTo((emitted = i), o.animate ?? true)
    } else if (
      vk !== undefined &&
      engine.mode === 'idle' &&
      rest === engine.index &&
      itemAt(L, rest) >= 0 &&
      keys[itemAt(L, rest)] !== vk
    ) {
      const i = keys.indexOf(vk as Key)
      if (i >= 0 && enabled(L, i)) engine.scrollTo((emitted = i), o.animate ?? true)
    }
    if (redraw) engine.sync()
    committing = false
  }

  const layout = $derived(derive(options()))
  // After the DOM has caught up with the options, exactly this layout becomes live.
  $effect(() => {
    const next = layout
    untrack(() => commit(next))
  })

  /** Mount: pick up the text direction from the DOM, then attach input. */
  function attachRoot(el: HTMLElement) {
    root = el
    const r = o.dir ? o.dir === 'rtl' : getComputedStyle(el).direction === 'rtl'
    if (r !== rtl) {
      engine.set({ rtl: (rtl = r) })
      update()
    }
    committing = true // attach renders once; inside an effect, render without flushSync
    const detach = engine.attach(el)
    committing = false
    return () => {
      detach()
      if (root === el) root = null
    }
  }
  function attachTrack(el: HTMLElement) {
    track = el
    paint(engine.x)
    return () => {
      if (track === el) track = null
    }
  }

  const optionId = (j: number) => `${id}-${j}`

  const view = $derived.by(() => {
    void version // re-derive whenever the controller reports a change
    const S = layout
    const { o, n, size, visible, vertical, head, loadAt, footAt } = S
    const now = engine.x / L.size
    const box = (j: number) =>
      vertical
        ? { position: 'absolute', left: 0, right: 0, top: j * size, height: size }
        : { position: 'absolute', top: 0, bottom: 0, insetInlineStart: j * size, width: size }
    const slot = (j: number, role: string, extra: Attrs = {}): Slot => ({
      virtual: j,
      offset: j - now,
      selected: j === rest,
      attrs: {
        id: optionId(j),
        role,
        'data-detent-index': j,
        'data-selected': j === rest ? '' : undefined,
        'aria-selected': role === 'option' ? j === rest : undefined,
        ...extra,
      },
      // Built when read: the styled component sets its own row styles and never reads this one.
      get style() {
        return cssText({ ...box(j), ...Object.fromEntries(rowVars(j - now, visible)) })
      },
    })
    // The rendered window follows the motion; the row the listbox references (aria-activedescendant: the resting
    // one) is always rendered too, even when the wheel has moved far from it, so it always exists.
    const shows = (j: number) => (j >= win[0] && j <= win[1]) || j === rest
    const rows: DetentRow<T>[] = []
    const used = new Set<Key>()
    const order: number[] = []
    if (rest < win[0]) order.push(rest)
    for (let j = win[0]; j <= win[1]; j++) order.push(j)
    if (rest > win[1]) order.push(rest)
    for (const j of n ? order : []) {
      const index = itemAt(S, j)
      if (index < 0) continue
      const disabled = !enabled(S, j)
      // Name options from getLabel: rich or inert (interactive) content may not name them otherwise.
      const named: Attrs = o.getLabel || o.interactive ? { 'aria-label': label(S, index) } : {}
      // Object.assign, not a spread: a spread would read the lazy `style` getter for every row.
      rows.push(
        Object.assign(slot(j, 'option', disabled ? { ...named, 'aria-disabled': true, 'data-disabled': '' } : named), {
          item: o.items[index] as T,
          index,
          // Duplicate item keys must not become duplicate keyed-each keys (that is an error in Svelte).
          key: ((k: Key) => (used.has(k) ? `${k}#${j}` : (used.add(k), k)))(
            S.loop ? `${S.keys[index]}:${Math.floor(j / n)}` : (S.keys[index] as Key),
          ),
          disabled,
        }),
      )
    }
    const selectedIndex = n ? Math.min(n - 1, sel) : -1
    const rootAttrs: Attrs = {
      role: 'listbox',
      tabindex: o.disabled ? -1 : 0,
      'aria-label': o.label,
      'aria-orientation': vertical ? 'vertical' : 'horizontal',
      'aria-activedescendant': n || head ? optionId(rest) : undefined,
      'aria-disabled': o.disabled || undefined,
      'data-detent': '',
      'data-state': 'idle',
      'data-orientation': vertical ? 'vertical' : 'horizontal',
    }
    const rootStyle = cssText({
      position: 'relative',
      overflow: 'hidden',
      [vertical ? 'height' : 'width']: size * visible,
      touchAction: vertical ? 'pan-x' : 'pan-y',
      // Contain only our axis: the root is a scroll container (overflow: hidden), so containing both
      // axes would also stop cross-axis pans (a vertical swipe over a horizontal wheel) reaching the page.
      [vertical ? 'overscrollBehaviorY' : 'overscrollBehaviorX']: 'contain',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      WebkitTouchCallout: 'none',
      WebkitTapHighlightColor: 'transparent',
    })
    const trackStyle = cssText({
      position: 'absolute',
      // Centered on the root's real size: the rows assume a root of size × visible (its default), so if the
      // root is resized (style width/height), offset by half the difference instead of anchoring to the start.
      ...(vertical
        ? { left: 0, right: 0, top: `calc(50% - ${(size * visible) / 2}px)`, height: size }
        : { top: 0, bottom: 0, insetInlineStart: `calc(50% - ${(size * visible) / 2}px)`, width: size }),
      transform: initial,
    })
    return {
      rootAttrs,
      rootStyle,
      trackAttrs: { role: 'presentation' } as Attrs,
      trackStyle,
      liveRegionAttrs: { role: 'status', 'aria-live': 'polite', 'aria-atomic': true } as Attrs,
      announcement: announce,
      rows,
      header: head && shows(-1) ? slot(-1, 'option') : null,
      footer: shows(footAt) ? slot(footAt, 'option') : null,
      loadingRow: shows(loadAt) ? slot(loadAt, 'presentation', { 'aria-busy': true }) : null,
      selectedIndex,
      selectedItem: selectedIndex >= 0 ? o.items[selectedIndex] : undefined,
      rtl,
    }
  })

  return {
    get rootAttrs() {
      return view.rootAttrs
    },
    get rootStyle() {
      return view.rootStyle
    },
    get trackAttrs() {
      return view.trackAttrs
    },
    get trackStyle() {
      return view.trackStyle
    },
    liveRegionAttrs: { role: 'status', 'aria-live': 'polite', 'aria-atomic': true },
    liveRegionStyle: cssText({
      position: 'absolute',
      width: 1,
      height: 1,
      overflow: 'hidden',
      clipPath: 'inset(50%)',
      whiteSpace: 'nowrap',
    }),
    get announcement() {
      return view.announcement
    },
    attachRoot,
    attachTrack,
    get rows() {
      return view.rows
    },
    get header(): DetentSlot {
      return view.header
    },
    get footer(): DetentSlot {
      return view.footer
    },
    get loadingRow(): DetentSlot {
      return view.loadingRow
    },
    get selectedIndex() {
      return view.selectedIndex
    },
    get selectedItem() {
      return view.selectedItem
    },
    scrollTo(i, opt) {
      jumping = true
      try {
        engine.scrollTo(i, opt?.animate ?? L.o.animate ?? true)
      } finally {
        jumping = false
      }
    },
    subscribe(fn) {
      subs.add(fn)
      return () => void subs.delete(fn)
    },
    get rtl() {
      return view.rtl
    },
    engine,
  }
}
