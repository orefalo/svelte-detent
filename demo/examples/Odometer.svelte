<script lang="ts">
  // In your app: import { Detent } from 'svelte-detent'
  import { ticks } from '../../src/lib'
  import { onMount } from 'svelte'
  import { Detent } from '../../src/lib'

  /** Replace `base` with wherever you host the logo. */
  let { base = 'https://detent.hayder.sh' }: { base?: string } = $props()

  const digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
  const tick = ticks({ sound: true, haptics: true })
  let count = $state(987_058)
  let root = $state<HTMLElement | null>(null)
  let visible = $state(false)

  // A live number: a new random value every 3 seconds (6 digits at most), only while the counter is on screen.
  onMount(() => {
    let inView = false
    const update = () => (visible = inView && !document.hidden)
    const io = new IntersectionObserver(([e]) => ((inView = !!e?.isIntersecting), update()))
    if (root) io.observe(root)
    document.addEventListener('visibilitychange', update)
    return () => (io.disconnect(), document.removeEventListener('visibilitychange', update))
  })
  $effect(() => {
    if (!visible) return
    const id = setInterval(() => (count = Math.floor(Math.random() * 1_000_000)), 3000)
    return () => clearInterval(id)
  })

  const text = $derived(String(count))
</script>

<div class="odo" bind:this={root} data-active={visible}>
  <span class="caption"><img src="{base}/tokens/monad-mark.svg" alt="" width="16" height="16" />Transactions on Monad</span>
  <div class="counter" aria-label={count.toLocaleString('en')} role="img">
    <!-- Keyed by place from the right, so a digit keeps its wheel when the number grows or shrinks. -->
    {#each [...text] as ch, r (text.length - r)}
      {@const place = text.length - r}
      <span class="digit">
        {#if r > 0 && place % 3 === 0}<span class="comma">,</span>{/if}
        <Detent
          onTick={tick}
          items={digits}
          value={ch}
          loop
          disabled
          label="Digit {r + 1}"
          itemHeight={46}
          visibleCount={1}
          width={26}
          perspective={0}
          indicator={{ shape: 'none' }}
          magnify={false}
          mask="none"
          fade={0}
          dim={0}
          preset="snappy"
          motionBlur={2.5}
          style="font-weight:600;font-variant-numeric:tabular-nums;cursor:default"
        />
      </span>
    {/each}
  </div>
  <button type="button" onclick={() => (count += 1000)}>+1,000</button>
</div>

<style>
  .odo { display: grid; justify-items: center; gap: 14px; }
  .caption { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; opacity: 0.7; }
  .counter { display: flex; align-items: center; padding: 6px 10px; border-radius: 14px; background: rgb(128 128 128 / 0.1); --detent-font-size: 34px; }
  .digit { display: flex; align-items: center; animation: odo-in 360ms cubic-bezier(0.23, 1, 0.32, 1); }
  .comma { font-size: 28px; opacity: 0.4; margin: 0 1px; }
  button { height: 30px; padding: 0 14px; border-radius: 99px; border: 1px solid rgb(128 128 128 / 0.3); background: transparent; font: inherit; font-size: 13px; color: inherit; cursor: pointer; }
  @keyframes odo-in { from { opacity: 0; transform: translateX(-6px); } }
</style>
