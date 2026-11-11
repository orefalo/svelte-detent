import type { Engine, KeyAcceleration, Mode, Orientation, PhysicsOptions, WheelMode } from './core'

export type Key = string | number

export interface DetentOptions<T> extends PhysicsOptions {
  items: readonly T[]
  /** Stable identity, so the selection survives items being inserted or removed. Defaults to the item for strings/numbers, else its index. */
  getKey?: (item: T, index: number) => Key
  /** Text for typeahead and screen-reader announcements. Defaults to String(item). */
  getLabel?: (item: T, index: number) => string
  /** Controlled selection (compared by key). */
  value?: T
  defaultValue?: T
  onChange?: (item: T, index: number) => void
  /**
   * Fire onChange when the wheel settles (default), or live on every row that crosses the center while a hand
   * turns it (drag, throw, mouse wheel, trackpad). Turns from keys, a tap on a row or a new `value` report only
   * where they land, so a parent's own value never comes back through the rows on the way.
   */
  changeOn?: 'settle' | 'tick'
  isDisabled?: (item: T, index: number) => boolean
  /** Row size in px along the scroll axis. */
  itemSize?: number
  /** Rows visible at once (odd). */
  visibleCount?: number
  loop?: boolean
  orientation?: Orientation
  /** Text direction. Detected from the DOM after mount; pass it to get RTL right in the server render. */
  dir?: 'ltr' | 'rtl'
  disabled?: boolean
  dragThreshold?: number
  dragRatio?: number
  wheelStep?: number
  wheelMode?: WheelMode
  /** Holding an arrow key speeds up after 2 s (×1.5) and 4 s (×2.5), or after your own `[ms, rate]` stages. On by default; `false` turns it off. */
  keyAcceleration?: KeyAcceleration
  /** A non-selectable row before the first item (e.g. a search field) that the wheel can rest on. Ignored when looping. */
  header?: boolean
  /** A non-selectable row after the last item that the wheel can rest on. Ignored when looping. */
  footer?: boolean
  /** Show a loading row after the last item (not restable), e.g. while onEndReached fetches more. */
  loading?: boolean
  onHeaderRest?: () => void
  onFooterRest?: () => void
  /**
   * Rows hold interactive content (buttons, links, inputs): rows off the center are inert, so Tab only
   * reaches the centered row's controls and a tap there activates them. Off-center taps turn the wheel.
   */
  interactive?: boolean
  /** Extra rows rendered beyond the visible ones on each side. */
  overscan?: number
  /** Animate programmatic value changes. */
  animate?: boolean
  /** Accessible name. */
  label?: string
  onTick?: (index: number, velocity: number) => void
  onSpinStart?: () => void
  onSpinEnd?: () => void
  onSettle?: (item: T, index: number) => void
  /** Continuous position in rows (float), every frame. */
  onScrollProgress?: (offset: number) => void
  onEndReached?: () => void
  /**
   * Rows from the end at which onEndReached fires, when the wheel moves that near the end (not as it mounts there
   * or as rows come in): once per list length, and again after `loading` ends without new rows (a failed or empty
   * load), the next time it moves there.
   */
  endReachedThreshold?: number
}

/** Attributes to spread on an element (`<div {...row.attrs}>`). */
export type Attrs = Record<string, string | number | boolean | undefined>

export interface Slot {
  /** Position on the wheel (virtual index). */
  virtual: number
  /** Distance from the center in rows at the last render (live values are in CSS variables). */
  offset: number
  /** The wheel rests on this row. */
  selected: boolean
  /** Attributes: id, role, aria-*, data-*. */
  attrs: Attrs
  /** Inline style string: the row's box on the track and its CSS variables. */
  style: string
}

export interface DetentRow<T> extends Slot {
  item: T
  /** Index in `items`. */
  index: number
  key: Key
  disabled: boolean
}

/** A non-item row (header, footer, loading), or null when it is off-screen or not enabled. */
export type DetentSlot = Slot | null

export interface DetentFrame {
  /** Position in rows (float). */
  offset: number
  /** px/ms */
  velocity: number
  mode: Mode
  /** Coast/spring only: the row the motion lands on (virtual index), and where it started (rows). */
  target: number
  from: number
}

export interface DetentApi<T> {
  /** Spread on the root element, together with `style={d.rootStyle}` and `{@attach d.attachRoot}`. */
  readonly rootAttrs: Attrs
  readonly rootStyle: string
  /** Spread on the track (the moving child of the root), with `style={d.trackStyle}` and `{@attach d.attachTrack}`. */
  readonly trackAttrs: Attrs
  readonly trackStyle: string
  /** A visually hidden live region announcing the selection when the wheel settles. Render it next to the root, not inside it. */
  readonly liveRegionAttrs: Attrs
  readonly liveRegionStyle: string
  readonly announcement: string
  attachRoot(el: HTMLElement): () => void
  attachTrack(el: HTMLElement): () => void
  readonly rows: DetentRow<T>[]
  readonly header: DetentSlot
  readonly footer: DetentSlot
  readonly loadingRow: DetentSlot
  readonly selectedIndex: number
  readonly selectedItem: T | undefined
  scrollTo(index: number, options?: { animate?: boolean }): void
  /** Per-frame position, outside the component tree. Returns an unsubscribe function. */
  subscribe(fn: (frame: DetentFrame) => void): () => void
  /** Right-to-left (detected after mount, or from `dir`): horizontal wheels run from the right. */
  readonly rtl: boolean
  readonly engine: Engine
}
