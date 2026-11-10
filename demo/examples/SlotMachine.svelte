<script lang="ts">
  // In your app: import { DetentText } from 'svelte-detent'
  import { DetentText } from '../../src/lib'
  import SlotReel from '../site/SlotReel.svelte'

  const symbols = ['🍒', '🍋', '🔔', '⭐️', '💎', '7️⃣', '🍀']
  let reels = $state<(SlotReel | undefined)[]>([])
  let settled = 0
  let targets: number[] = []
  let jackpot = $state<string | null>(null)
  let ring = $state(0)

  /** When all three have landed: three alike is a jackpot. */
  const landed = () => {
    if (++settled < 3) return
    const [a, b, c] = targets
    if (a !== undefined && a === b && b === c) {
      jackpot = symbols[a]!
      ring++
    }
  }
  /** One spin in four is a jackpot; the others land on any three symbols. Each reel turns longer than the one before. */
  function spin() {
    const one = Math.random() < 0.25 ? Math.floor(Math.random() * symbols.length) : -1
    targets = [0, 1, 2].map(() => (one >= 0 ? one : Math.floor(Math.random() * symbols.length)))
    settled = 0
    jackpot = null
    reels.forEach((reel, i) => reel?.spin(3 + 2 * i, targets[i]!))
  }
</script>

<div class="slot">
  <div class="frame" class:win={jackpot}>
    {#each ['Reel 1', 'Reel 2', 'Reel 3'] as label, i (label)}
      <SlotReel bind:this={reels[i]} {symbols} {label} hop={jackpot ? 70 * i : null} onSettle={landed} />
    {/each}
    {#if jackpot}
      {#key ring}
        <span class="ring" aria-hidden="true"></span>
        {#each Array(7) as _, r (r)}
          <span class="float" aria-hidden="true" style="left:{12 + 13 * r}%;--dx:{(r - 3) * 9}px;--r:{(r % 2 ? 1 : -1) * (10 + 4 * r)}deg;--delay:{60 * r}ms">{jackpot}</span>
        {/each}
      {/key}
    {/if}
  </div>
  <button type="button" class="spin" onclick={spin}><DetentText style="color:var(--bg, #fff);font-weight:600;font-size:14px" text={jackpot ? 'Jackpot. Again?' : 'Spin'} /></button>
  <output aria-live="polite" class="sr">{jackpot ? `Jackpot: three ${jackpot}` : ''}</output>
</div>

<style>
  .slot { --bg: #fff; display: grid; justify-items: center; gap: 16px; }
  .frame { position: relative; display: flex; gap: 8px; padding: 8px; border-radius: 18px; box-shadow: inset 0 0 0 1px rgb(128 128 128 / 0.2); transition: box-shadow 300ms ease; }
  .frame.win { box-shadow: inset 0 0 0 1.5px rgb(128 128 128 / 0.35); }
  .ring { position: absolute; inset: 0; border-radius: 18px; pointer-events: none; animation: slot-ring 900ms cubic-bezier(0.23, 1, 0.32, 1) both; }
  .float { position: absolute; top: 42%; font-size: 16px; pointer-events: none; animation: slot-float 1100ms var(--delay) cubic-bezier(0.23, 1, 0.32, 1) both; }
  .spin { display: inline-flex; align-items: center; justify-content: center; height: 34px; padding: 0 18px; border-radius: 99px; border: 0; background: currentColor; cursor: pointer; }
  .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
  @keyframes slot-ring { from { box-shadow: 0 0 0 0 rgb(128 128 128 / 0.45); } to { box-shadow: 0 0 0 18px rgb(128 128 128 / 0); } }
  @keyframes slot-float { from { opacity: 0; transform: translate(0, 0) scale(0.6); } 25% { opacity: 1; } to { opacity: 0; transform: translate(var(--dx), -86px) rotate(var(--r)) scale(1); } }
  @media (prefers-color-scheme: dark) { .slot { --bg: #0a0a0a; } }
</style>
