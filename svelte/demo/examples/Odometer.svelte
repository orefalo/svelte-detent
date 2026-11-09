<script lang="ts">
  // In your app: import { Detent } from '@hayderkg/detent-svelte'
  import { Detent } from '../../src/lib'
  import { onMount } from 'svelte'

  const digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
  let count = $state(987_634)

  // A live number: a new random value every 3 seconds (6 digits at most, below 1,000,000).
  onMount(() => {
    const id = setInterval(() => (count = Math.floor(Math.random() * 1_000_000)), 3000)
    return () => clearInterval(id)
  })

  /** The number as a row of places, keyed from the right so a digit keeps its wheel when the number grows. */
  const places = $derived.by(() => {
    const text = count.toLocaleString('en-US')
    return Array.from(text).map((ch, i) => ({ ch, key: text.length - i, digit: ch >= '0' && ch <= '9' }))
  })
  const label = (key: number) => `Digit ${key}`
</script>

<div class="odometer">
  <p class="caption">
    <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><path d="M8 1.5 14.5 8 8 14.5 1.5 8Z" fill="none" stroke="#7c6cf0" stroke-width="1.6" stroke-linejoin="round" /></svg>
    Transactions on Monad
  </p>
  <div class="counter" role="img" aria-label={count.toLocaleString('en-US')}>
    {#each places as p (p.key)}
      {#if p.digit}
        <span class="wheel" aria-hidden="true">
          <Detent
            items={digits}
            value={p.ch}
            label={label(p.key)}
            loop
            disabled
            itemHeight={46}
            visibleCount={1}
            width={26}
            highlight={false}
            magnify={false}
            perspective={0}
            fade={0}
            dim={0}
            mask="none"
            motionBlur
            style="--detent-font-size:34px;font-weight:600;cursor:default"
          />
        </span>
      {:else}
        <span class="comma" aria-hidden="true">{p.ch}</span>
      {/if}
    {/each}
  </div>
  <button type="button" onclick={() => (count += 1000)}>+1,000</button>
</div>

<style>
  .odometer { display: grid; justify-items: center; gap: 14px; }
  .caption { display: flex; align-items: center; gap: 7px; margin: 0; font: 13.5px system-ui, sans-serif; opacity: 0.8; }
  .counter { display: flex; align-items: center; padding: 6px 10px; border-radius: 14px; background: rgb(128 128 128 / 0.1); }
  .wheel { display: flex; align-items: center; height: 46px; }
  .comma { font: 600 22px system-ui, sans-serif; opacity: 0.5; padding: 0 1px; align-self: flex-end; line-height: 38px; }
  button { padding: 6px 14px; border: 1px solid rgb(128 128 128 / 0.35); border-radius: 999px; background: none; color: inherit; font: 13px system-ui, sans-serif; cursor: pointer; }
</style>
