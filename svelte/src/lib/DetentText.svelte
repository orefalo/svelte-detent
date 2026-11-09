<script lang="ts">
  import { textController, type SpringConfig, type TextOptions } from '@hayderkg/detent/core'
  import type { HTMLAttributes } from 'svelte/elements'
  import { styleMap, type CSSProperties } from './css'

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'style' | 'class'> {
    /** The current label. No list of possible values is needed. Numbers are converted to strings. */
    text: string | number
    as?: 'span' | 'div' | 'p' | 'label' | 'strong' | 'em' | 'small' | 'output' | 'code' | 'pre' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
    /** Keep matching graphemes; false rolls the entire label. Default true. */
    morph?: boolean
    /** New letters grow in from zero width (so they look clipped while they roll). Default false: they arrive at full width and rise into place. */
    reveal?: boolean
    /** Disable transitions. Reduced motion is always respected. */
    animate?: boolean
    /** Locale used for grapheme segmentation; format numbers before passing them if needed. */
    locale?: string
    spring?: Partial<SpringConfig>
    /** Maximum spring duration in milliseconds. Default 550. */
    snapDuration?: number
    rollDirection?: 'up' | 'down'
    onAnimationStart?: () => void
    onAnimationComplete?: () => void
    onAnimationCancel?: () => void
    class?: string
    style?: string | CSSProperties
    /** The root element. */
    ref?: HTMLElement | null
  }
  const positive = (n: number | undefined, fallback: number) => (n !== undefined && Number.isFinite(n) && n > 0 ? n : fallback)

  /** Short, single-line labels, rolled with Detent's spring physics. Native text at rest, including server rendering. */
  let {
    text,
    as = 'span',
    morph = true,
    reveal = false,
    animate = true,
    locale,
    spring,
    snapDuration = 550,
    rollDirection = 'up',
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
  let controller = $state.raw<ReturnType<typeof textController> | null>(null)
  const label = $derived(String(text))
  const own = $derived(styleMap(style))
  // The rolling layer needs a positioned box that takes a width: position: static becomes relative, and display:
  // inline or contents (no box of its own) becomes inline-block. Everything else in `style` is yours.
  const position = $derived(own.position && own.position !== 'static' ? own.position : 'relative')
  const display = $derived(!own.display || own.display === 'inline' || own.display === 'contents' ? 'inline-block' : own.display)

  $effect(() => {
    if (!ref || !content || !layer) return
    const c = textController(ref, content, layer)
    controller = c
    return () => {
      controller = null
      c.destroy()
    }
  })
  $effect(() => {
    const options: TextOptions = {
      morph,
      reveal,
      animate,
      locale,
      rollDirection,
      width: own.width ?? '',
      spring: { stiffness: positive(spring?.stiffness, 420), damping: positive(spring?.damping, 32), mass: positive(spring?.mass, 1) },
      snapDuration: positive(snapDuration, 550),
      onAnimationStart,
      onAnimationComplete,
      onAnimationCancel,
    }
    controller?.commit(label, options, [className, style, rest.lang, rest.dir])
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
  style:position={position}
  style:display={display}
  data-detent-text=""
  bind:this={ref}
>
  <span bind:this={content} data-detent-text-content="" style="display:inline-block;white-space:pre;width:max-content;min-height:1lh">{label}</span><span bind:this={layer} data-detent-text-layer="" aria-hidden="true" style="position:absolute;inset:0;pointer-events:none;user-select:none"></span>
</svelte:element>
