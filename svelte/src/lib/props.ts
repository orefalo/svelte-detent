import type { Physics, PresetName } from '@hayderkg/detent/core'
import type { Snippet } from 'svelte'
import type { CSSProperties } from './css'
import type { IndicatorOptions, IndicatorState } from './indicator.svelte'
import type { DetentOptions } from './types'

/** A falloff by distance from the center: per-row amount, or a function of the signed offset (rows) returning the value. */
export type Falloff = number | ((offset: number) => number)
export type Easing = 'linear' | 'quad' | 'cubic' | ((distance: number) => number)

export interface GradientBlur {
  /** Blur at the very edge, px. Default 8. */
  strength?: number
  /** Stacked backdrop-filter layers; more = smoother ramp. Default 6. */
  layers?: number
  /** How far it reaches from each edge, px. Default: up to just short of the center row. */
  size?: number
}

export interface ItemState {
  index: number
  selected: boolean
  /** Distance from the center in rows at render time. */
  offset: number
  /** 1 at the center, 0 at the edges of the visible rows. */
  progress: number
}

export interface DetentProps<T> extends Omit<DetentOptions<T>, 'preset' | 'header' | 'footer' | 'loading'> {
  /** Render a row: `{#snippet item(value, { index, selected, offset, progress })}`. `offset` is the distance from the center at render time (live: the --offset CSS variable). */
  item?: Snippet<[T, ItemState]>

  // Layout
  /** Row size along the scroll axis, px (height when vertical, width when horizontal). Default 40. */
  itemHeight?: number
  /** Gap between rows, px. */
  gap?: number
  /** Cross size of a vertical wheel (default 100%). */
  width?: number | string
  /** Cross size of a horizontal wheel. Default 64. */
  height?: number | string
  /** A non-selectable row before the items (e.g. a search field) the wheel can rest on. */
  header?: Snippet
  /** A non-selectable row after the items the wheel can rest on. */
  footer?: Snippet
  /** Shown when `items` is empty. */
  emptyState?: Snippet
  /** Row shown after the items while `loading` is true. Default: an ellipsis. */
  loadingRow?: Snippet
  loading?: boolean

  // Drum
  /** Depth of the 3D drum, px. 0 = flat list. Default 800. */
  perspective?: number
  /** 0–1: how far rows rotate away from the center (0 flat, 1 a full half-cylinder). Default 0.5. */
  curvature?: number
  /** Drum radius, px. Derived from curvature by default; overrides it. */
  radius?: number
  /** Tilt the whole wheel, deg: a number rotates about the scroll axis' cross axis, or give { x, y }. */
  tilt?: number | { x?: number; y?: number }
  /** Rows lean sideways as they move away, deg per row. */
  skew?: number
  /** Alignment of row content across the wheel. Default 'center'. */
  align?: 'center' | 'start' | 'end'

  // Rows by distance from the center
  /** Opacity lost per row. Default 0.16. */
  fade?: Falloff
  /** Size lost per row (on top of the drum's own perspective). Default 0. */
  scale?: Falloff
  /** Depth-of-field blur per row, px. Default 0. */
  blur?: Falloff
  /** Velocity-driven blur along the scroll axis. true = 4px maximum; a number sets the maximum (0–24px). Off by default; disabled with reduced motion. */
  motionBlur?: boolean | number
  /** Rows lean with velocity. true = 2deg maximum, or a maximum angle (0–6deg). Off by default. */
  velocityTilt?: boolean | number
  /** Illumination as rows cross the center. true = 0.12, or intensity 0–0.5. */
  centerLight?: boolean | number
  /** Apparent Z depth in px: center forward, neighbors back. true = 8, or 0–24px. */
  selectedDepth?: boolean | number
  /** Independent elastic lag of outer rows. true = 0.3, or intensity 0–6. The center stays precise. */
  elasticRows?: boolean | number
  /** Brief visual absorption when catching a moving wheel. true = 0.5, or intensity 0–2. Disabled with reduced motion. */
  grip?: boolean | number
  /** Color falloff toward --detent-dim-color, per row (keeps backgrounds solid, unlike fade). Default 0.22. */
  dim?: Falloff
  /** Extra gap that grows with distance, px. Default 0. */
  spacing?: Falloff
  /** Curve applied to the distance before the falloffs. Default 'linear'. */
  easing?: Easing

  // Selection indicator
  /**
   * The selection marker: shape, material, style, and fit. `fit: 'content'` makes it follow the centered
   * item's size, morphing between items as they pass and straight to the target on a throw.
   */
  indicator?: IndicatorOptions<T>
  /** Your own indicator content; live values are also CSS variables (--indicator-w, -h, -progress, -velocity, -color). */
  indicatorContent?: Snippet<[IndicatorState<T>]>
  /** The band behind the center row, or your own element. Default true. (Shorthand: `indicator.shape: 'none'` turns it off.) */
  highlight?: boolean | Snippet
  /** 'rounded' (default), 'pill', 'lines' (iOS hairlines above and below), or your own styles. */
  highlightStyle?: 'rounded' | 'pill' | 'lines' | CSSProperties
  /** Shadow on the band: true for a lifted look, or any box-shadow. */
  highlightShadow?: boolean | string
  /**
   * iOS lens: the center row renders larger inside the band only. true = 1.1. Default true.
   * The lens is a second, inert copy of the rows: `renderItem` runs twice per visible row. With rows that have
   * effects, ids or heavy content, turn it off (`magnify={false}` and no `indicator.refraction`).
   * Refraction uses the same second copy even with magnify off.
   */
  magnify?: boolean | number
  selectedStyle?: CSSProperties
  selectedClassName?: string

  // Depth and surface
  /** Inner shadows at the edges (recessed drum): true, or any CSS background for the overlay. */
  shadow?: boolean | string
  /** Edge fade: 'gradient' (default), 'none', or a custom CSS mask-image. */
  mask?: 'gradient' | 'none' | (string & {})
  /** How far the edge fade reaches (px or CSS length). Default '28%'. */
  maskSize?: number | string
  /** Progressive blur toward the edges, Apple-style. Default off. */
  gradientBlur?: boolean | GradientBlur
  /** A subtle light streak across the center (glossy drum). */
  glare?: boolean
  /** The drum's surface. */
  background?: string

  // Motion and feedback
  /**
   * A tuned bundle: 'ios' | 'scroll' | 'snappy' | 'heavy' | 'elastic' | 'linear', or your own physics.
   * Sound and haptics are opt-in so they cost nothing unless used:
   * `onTick={ticks({ haptics: true, sound: true })}` from '@hayderkg/detent/feedback'.
   */
  preset?: PresetName | Physics

  // Escape hatch
  /** Any per-row style from the live offset, applied every frame. */
  rowStyle?: (offset: number, index: number, selected: boolean) => CSSProperties
  /** Force a color scheme (otherwise follows prefers-color-scheme or an ancestor's data-theme). */
  theme?: 'light' | 'dark'
  class?: string
  style?: string | CSSProperties

  // Forms and CSP
  /** Submit the selection with a form: a hidden input named `name` holds the selected item's key. */
  name?: string
  /** The id of the form the hidden input belongs to, when the wheel sits outside it. */
  form?: string
  /** Nonce for the component's <style> element, under a strict Content Security Policy. */
  nonce?: string
}
