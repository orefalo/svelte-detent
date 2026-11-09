<script lang="ts">
  // In your app: import { createDetent } from '@hayderkg/detent-svelte'
  import { createDetent } from '../../src/lib'

  const symbols = ['🍒', '🍋', '🔔', '⭐️', '💎', '7️⃣', '🍀']
  const PITCH = 64

  // Three headless wheels. Each one rests on a symbol, and a spin sends it a few laps ahead to an exact one.
  const reels = [0, 1, 2].map((i) => createDetent<string>(() => ({ items: symbols, loop: true, itemSize: PITCH, visibleCount: 3, label: `Reel ${i + 1}`, defaultValue: '7️⃣' })))
  let spinning = $state(false)

  function spin() {
    if (spinning) return
    spinning = true
    reels.forEach((d, i) => {
      setTimeout(() => {
        const target = Math.floor(Math.random() * symbols.length)
        const here = d.engine.index
        // Forward, past a few full turns, landing exactly on `target` (the wheel loops, so position mod 7 is the symbol).
        const lands = here + symbols.length * (3 + i * 2) + ((target - here) % symbols.length + symbols.length) % symbols.length
        d.engine.goTo(lands)
      }, i * 260)
    })
    setTimeout(() => (spinning = false), 2 * 260 + 2600)
  }
</script>

<div class="machine">
  <div class="frame">
    {#each reels as d, i (i)}
      <div {...d.rootAttrs} style={d.rootStyle + 'width:72px;border-radius:12px;background:rgb(128 128 128 / 0.08);perspective:400px'} {@attach d.attachRoot}>
        <div {...d.trackAttrs} style={d.trackStyle} {@attach d.attachTrack}>
          {#each d.rows as r (r.key)}
            <div {...r.attrs} style={r.style + 'display:grid;place-items:center;font-size:34px;transform:rotateX(calc(var(--offset) * -30deg))'}>{r.item}</div>
          {/each}
        </div>
      </div>
      <div {...d.liveRegionAttrs} style={d.liveRegionStyle}>{d.announcement}</div>
    {/each}
  </div>
  <button type="button" onclick={spin} disabled={spinning}>Spin</button>
</div>

<style>
  .machine { display: grid; justify-items: center; gap: 16px; }
  .frame { display: flex; gap: 8px; padding: 8px; border-radius: 18px; box-shadow: inset 0 0 0 1px rgb(128 128 128 / 0.2); }
  button { height: 34px; padding: 0 18px; border: 0; border-radius: 99px; background: #0a0a0a; color: #fff; font: 600 14px system-ui, sans-serif; cursor: pointer; }
  button:disabled { opacity: 0.7; cursor: default; }
  @media (prefers-color-scheme: dark) { button { background: #ededed; color: #0a0a0a; } }
</style>
