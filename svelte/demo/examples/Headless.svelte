<script lang="ts">
  // In your app: import { createDetent } from 'svelte-detent'
  import { ticks } from '@hayderkg/detent/feedback'
  import { createDetent } from '../../src/lib'

  const tick = ticks({ sound: true, haptics: true })
  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL']
  // Your own markup and CSS: the hook brings the physics, input, keyboard, typeahead and ARIA.
  const d = createDetent<string>(() => ({ items: sizes, onTick: tick, defaultValue: 'M', itemSize: 44, visibleCount: 5, label: 'Size' }))
</script>

<div class="headless">
  <div {...d.rootAttrs} class="root" style={d.rootStyle} {@attach d.attachRoot}>
    <div class="band" aria-hidden="true"></div>
    <div {...d.trackAttrs} style={d.trackStyle} {@attach d.attachTrack}>
      {#each d.rows as r (r.key)}
        <div {...r.attrs} class="row" style={r.style}>{r.item}</div>
      {/each}
    </div>
  </div>
  <div {...d.liveRegionAttrs} style={d.liveRegionStyle}>{d.announcement}</div>
  <p class="mono">↑ ↓ · Page Up/Down · Home/End · type “x”</p>
</div>

<style>
  .headless { display: grid; justify-items: center; gap: 14px; }
  .root { width: 160px; border-radius: 14px; perspective: 600px; cursor: grab; outline: none; }
  .root:focus-visible { box-shadow: 0 0 0 2px rgb(128 128 128 / 0.5); }
  .band { position: absolute; inset: 88px 12px auto; height: 44px; border-block: 1px solid rgb(128 128 128 / 0.35); }
  .row { display: grid; place-items: center; font-size: 22px; font-weight: 600; letter-spacing: -0.02em; transform: rotateX(calc(var(--offset) * -20deg)); opacity: calc(1 - var(--abs-offset) * 0.3); }
  .mono { margin: 0; font: 12px 'Geist Mono', ui-monospace, 'SF Mono', Menlo, monospace; opacity: 0.6; }
</style>
