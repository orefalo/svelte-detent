<script lang="ts">
  // In your app: import { Detent } from 'svelte-detent'
  import { ticks } from '@hayderkg/detent/feedback'
  import { Detent } from '../../src/lib'

  const tick = ticks({ sound: true, haptics: true })
  const colors = [
    { name: 'Ember', hex: '#ff5a1f' },
    { name: 'Saffron', hex: '#f5b700' },
    { name: 'Moss', hex: '#5b8c3a' },
    { name: 'Lagoon', hex: '#0f9d9a' },
    { name: 'Cobalt', hex: '#2f5bff' },
    { name: 'Iris', hex: '#7c5cff' },
    { name: 'Orchid', hex: '#d946ef' },
    { name: 'Rose', hex: '#f43f5e' },
  ]

  /** The color at a fractional position: a blend of the two neighbours. */
  const blend = (position: number) => {
    const a = Math.max(0, Math.min(colors.length - 1, Math.floor(position)))
    const b = Math.min(colors.length - 1, a + 1)
    const pct = Math.round(100 * Math.max(0, Math.min(1, position - a)))
    return `color-mix(in oklab, ${colors[a]!.hex}, ${colors[b]!.hex} ${pct}%)`
  }
  /** The surface behind the wheel: a faint wash of the color at the center and the one after it. */
  const wash = (position: number) =>
    `linear-gradient(160deg, color-mix(in oklab, ${blend(position)} 9%, var(--bg, white)), color-mix(in oklab, ${blend(position + 1)} 6%, var(--bg, white)))`
  /** The swatch of a row: its color, lit from above, drifting toward the next one. */
  const swatch = (i: number) => {
    const here = colors[i]!.hex
    const next = colors[Math.min(colors.length - 1, i + 1)]!.hex
    return `linear-gradient(160deg, color-mix(in oklab, ${here} 82%, white), color-mix(in oklab, ${here} 72%, ${next}))`
  }

  let surface: HTMLElement | undefined = $state()
</script>

<!-- The original paints the whole card; here the example brings its own box. -->
<div class="frame" bind:this={surface} style:background={wash(4)}>
  <Detent
    onTick={tick}
    curvature={0.65}
    fade={0.14}
    dim={0}
    items={colors}
    getKey={(c) => c.name}
    getLabel={(c) => c.name}
    defaultValue={colors[4]}
    label="Color"
    itemHeight={48}
    visibleCount={5}
    width={220}
    align="start"
    magnify={false}
    onScrollProgress={(position) => surface?.style.setProperty('background', wash(position))}
  >
    {#snippet item(c, { index })}
      <span class="row"><span class="swatch" aria-hidden="true" style:background={swatch(index)}></span>{c.name}</span>
    {/snippet}
  </Detent>
</div>

<style>
  .frame { --bg: #fff; position: relative; display: grid; place-items: center; width: 100%; min-height: 252px; border-radius: 12px; overflow: hidden; }
  .row { display: flex; align-items: center; gap: 12px; font-size: 16px; }
  .swatch { width: 22px; height: 22px; border-radius: 7px; box-shadow: inset 0 0 0 1px rgb(128 128 128 / 0.2); }
  @media (prefers-color-scheme: dark) { .frame { --bg: #0a0a0a; } }
</style>
