<script lang="ts">
  import { ticks } from '@hayderkg/detent/feedback'
  import { createDetent } from '../../src/lib'

  /** One reel of the slot machine: a looping headless wheel that can be spun from code. */
  let { symbols, label, hop, onSettle }: { symbols: string[]; label: string; hop: number | null; onSettle: () => void } = $props()

  const tick = ticks({ sound: true, haptics: true })
  const d = createDetent<string>(() => ({ items: symbols, onTick: tick, loop: true, itemSize: 64, visibleCount: 3, label, defaultValue: '7️⃣', onSettle: () => onSettle() }))

  /** Turn `laps` full circles and land on symbol `target`. */
  export function spin(laps: number, target: number) {
    const e = d.engine
    const n = symbols.length
    const i = Math.round(e.index)
    const at = ((i % n) + n) % n
    e.goTo(i + laps * n + ((target - at + n) % n))
  }
</script>

<div {...d.rootAttrs} class="reel" style={d.rootStyle} {@attach d.attachRoot}>
  <div {...d.trackAttrs} style={d.trackStyle} {@attach d.attachTrack}>
    {#each d.rows as r (r.key)}
      <div {...r.attrs} class="row" style={r.style}>
        <span class="sym" class:hop={r.selected && hop !== null} style:--hop-delay="{hop ?? 0}ms">{r.item}</span>
      </div>
    {/each}
  </div>
</div>
<div {...d.liveRegionAttrs} style={d.liveRegionStyle}></div>

<style>
  .reel { width: 72px; border-radius: 12px; background: rgb(128 128 128 / 0.08); perspective: 400px; }
  .row { display: grid; place-items: center; font-size: 34px; transform: rotateX(calc(var(--offset) * -30deg)); }
  .sym { display: inline-block; }
  .sym.hop { animation: slot-hop 520ms var(--hop-delay) cubic-bezier(0.34, 1.56, 0.64, 1); }
  @keyframes slot-hop { 40% { transform: translateY(-9px) scale(1.12); } }
</style>
