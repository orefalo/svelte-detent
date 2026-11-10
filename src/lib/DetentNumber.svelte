<script lang="ts">
  import { numberController, numberGlyphs, numberTokens, type RollOptions, type SpringConfig } from './core'
  import { untrack } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { styleMap, type CSSProperties } from './css'

  /** The parts of a formatted number that `classNames` can style. */
  type NumberPart = 'integer' | 'fraction' | 'decimal' | 'group' | 'currency' | 'sign' | 'unit'
  const partOf = (type: string): string =>
    type === 'minusSign' || type === 'plusSign' ? 'sign' : type === 'percentSign' || type === 'compact' ? 'unit' : type

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'style' | 'class'> {
    value: number | bigint
    /** Passed to `Intl.NumberFormat`, like `format`. */
    locales?: string | string[]
    format?: Intl.NumberFormatOptions
    /** Which way the digits roll. `'auto'` (default): up when the value grows, down when it shrinks. */
    trend?: 'auto' | 'up' | 'down'
    /**
     * A class per part of the number, e.g. a smaller currency or fraction. The native text is then split into one span
     * per part, still one selectable, accessible label, and the rolling copies carry the same classes.
     */
    classNames?: Partial<Record<NumberPart, string>>
    as?: 'span' | 'div' | 'p' | 'label' | 'strong' | 'em' | 'small' | 'output' | 'code' | 'data' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
    /** Disable transitions. Reduced motion is always respected. */
    animate?: boolean
    spring?: Partial<SpringConfig>
    /** Maximum spring duration in milliseconds. Default 700. */
    snapDuration?: number
    onAnimationStart?: () => void
    onAnimationComplete?: () => void
    onAnimationCancel?: () => void
    class?: string
    style?: string | CSSProperties
    /** The root element. */
    ref?: HTMLElement | null
  }
  const positive = (n: number | undefined, fallback: number) => (n !== undefined && Number.isFinite(n) && n > 0 ? n : fallback)

  /**
   * A formatted number whose digits roll on Detent's spring physics, through the values between. Native text at
   * rest, including server rendering; values that format the same do not move.
   */
  let {
    value,
    locales,
    format,
    trend = 'auto',
    classNames,
    as = 'span',
    animate = true,
    spring,
    snapDuration = 700,
    onAnimationStart,
    onAnimationComplete,
    onAnimationCancel,
    class: className,
    style,
    ref = $bindable(null),
    ...rest
  }: Props = $props()

  let content = $state<HTMLSpanElement | null>(null)
  let layer = $state<HTMLSpanElement | null>(null)
  let controller = $state.raw<ReturnType<typeof numberController> | null>(null)
  let settled = untrack(() => value)
  // Inline objects are new on every parent update; the formatter only changes when what they say does.
  const formatKey = $derived(JSON.stringify([locales, format]))
  const formatter = $derived.by(() => {
    void formatKey
    const f = new Intl.NumberFormat(untrack(() => locales), untrack(() => format))
    return { f, glyphs: numberGlyphs(f) }
  })
  const parts = $derived(formatter.f.formatToParts(value as number))
  const label = $derived(parts.map((p) => p.value).join(''))
  const own = $derived(styleMap(style))
  // The rolling layer needs a positioned box that takes a width: position: static becomes relative, and display:
  // inline or contents (no box of its own) becomes inline-block. Everything else in `style` is yours.
  const position = $derived(own.position && own.position !== 'static' ? own.position : 'relative')
  const display = $derived(!own.display || own.display === 'inline' || own.display === 'contents' ? 'inline-block' : own.display)

  $effect(() => {
    if (!ref || !content || !layer) return
    const c = numberController(ref, content, layer)
    controller = c
    return () => {
      controller = null
      c.destroy()
    }
  })
  $effect(() => {
    const c = controller
    const next = value
    const options: RollOptions = {
      animate,
      width: own.width ?? '',
      spring: { stiffness: positive(spring?.stiffness, 460), damping: positive(spring?.damping, 38), mass: positive(spring?.mass, 1) },
      snapDuration: positive(snapDuration, 700),
      onAnimationStart,
      onAnimationComplete,
      onAnimationCancel,
    }
    const previous = settled
    settled = next
    const direction = trend === 'up' ? 1 : trend === 'down' ? -1 : next > previous ? 1 : next < previous ? -1 : 0
    c?.commit(label, options, [className, style, rest.lang, rest.dir, classNames], numberTokens(parts, formatter.glyphs), formatter.glyphs, direction)
  })
</script>

<!-- The two inner spans must touch: the root is white-space: pre, so any whitespace between them would be drawn as a space and widen the label. -->
<svelte:element
  this={as}
  {...rest}
  class={className}
  style={typeof style === 'string' ? style : undefined}
  style:vertical-align={own['vertical-align'] ?? 'baseline'}
  style:white-space={own['white-space'] ?? 'pre'}
  style:font-variant-numeric={own['font-variant-numeric'] ?? 'tabular-nums'}
  style:position={position}
  style:display={display}
  data-detent-number=""
  bind:this={ref}
>
  <span bind:this={content} data-detent-number-content="" style="display:inline-block;white-space:pre;width:max-content;min-height:1lh">{#if classNames}{#each parts as p, i (i)}<span class={classNames[partOf(p.type) as NumberPart]}>{p.value}</span>{/each}{:else}{label}{/if}</span><span bind:this={layer} data-detent-number-layer="" aria-hidden="true" style="position:absolute;inset:0;pointer-events:none;user-select:none"></span>
</svelte:element>
