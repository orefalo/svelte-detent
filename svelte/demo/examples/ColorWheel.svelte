<script lang="ts">
  // In your app: import { Detent } from '@hayderkg/detent-svelte'
  import { Detent } from '../../src/lib'

  const colors = [
    { name: 'Ember', hex: '#f4512c' },
    { name: 'Saffron', hex: '#f5a623' },
    { name: 'Moss', hex: '#6b9b6e' },
    { name: 'Lagoon', hex: '#2a9d9d' },
    { name: 'Cobalt', hex: '#3b5bff' },
    { name: 'Iris', hex: '#8b5cf6' },
    { name: 'Orchid', hex: '#e879f9' },
    { name: 'Rose', hex: '#fb5c8a' },
  ]
  let value = $state(colors[4]!)
  let card: HTMLElement | undefined

  /** Every frame: blend the two colors around the center and tint the surface behind the wheel. No re-render. */
  function tint(position: number) {
    const i = Math.max(0, Math.min(colors.length - 1, Math.floor(position)))
    const next = Math.min(colors.length - 1, i + 1)
    const t = Math.max(0, Math.min(1, position - i)) * 100
    card?.style.setProperty('--tint', `color-mix(in oklab, ${colors[i]!.hex}, ${colors[next]!.hex} ${t.toFixed(1)}%)`)
  }
  // The first frame, before any motion.
  const start = (el: HTMLElement) => {
    card = el
    tint(colors.findIndex((c) => c.name === value.name))
  }
</script>

<div class="card" {@attach start}>
  <div class="wheel">
    <Detent
      items={colors}
      bind:value
      getKey={(c) => c.name}
      getLabel={(c) => c.name}
      label="Color"
      width={220}
      itemHeight={48}
      visibleCount={5}
      curvature={0.65}
      fade={0.14}
      align="start"
      magnify={false}
      onScrollProgress={tint}
      indicator={{ shape: 'rounded', background: 'color-mix(in oklab, var(--tint) 14%, transparent)' }}
    >
      {#snippet item(c)}
        <span class="row"><i style:background={c.hex}></i>{c.name}</span>
      {/snippet}
    </Detent>
  </div>
</div>

<style>
  .card {
    --tint: #3b5bff;
    display: grid; place-items: center; min-height: 230px; width: 100%; padding: 0; border-radius: 12px;
    background: color-mix(in oklab, var(--tint) 10%, white);
  }
  .wheel { padding: 0; }
  .row { display: flex; align-items: center; gap: 12px; font-size: 15px; padding-inline: 8px; }
  i { display: block; width: 16px; height: 16px; border-radius: 5px; }
  @media (prefers-color-scheme: dark) { .card { background: color-mix(in oklab, var(--tint) 16%, #111); } }
</style>
