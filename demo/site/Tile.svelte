<script lang="ts">
  import { untrack } from 'svelte'
  import { DetentText } from '../../src/lib'

  /** One flap of a split-flap board. A new character turns in after `delay` ms, so tiles flip one after another. */
  let { char, delay }: { char: string; delay: number } = $props()
  // svelte-ignore state_referenced_locally
  let shown = $state(char)
  $effect(() => {
    const next = char
    const wait = delay
    if (next === untrack(() => shown)) return
    const timer = setTimeout(() => (shown = next), wait)
    return () => clearTimeout(timer)
  })
</script>

<span class="db-tile" aria-hidden="true">
  <DetentText morph={false} rollDirection="down" snapDuration={380} text={shown === ' ' ? ' ' : shown} />
</span>

<style>
  /* One per character, lit from above, with a hairline across the middle where the flap splits. */
  .db-tile { position: relative; display: grid; place-items: center; width: 1.3ch; height: 24px; border-radius: 2.5px;
    background: linear-gradient(#2c2e33, #1c1e22); box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.06), inset 0 -1px 0 rgb(0 0 0 / 0.45); }
  .db-tile::after { content: ''; position: absolute; left: 0; right: 0; top: 50%; height: 1px; margin-top: -0.5px; background: rgb(0 0 0 / 0.6); pointer-events: none; }
  @container (max-width: 360px) { .db-tile { height: 21px; width: 1.26ch; } }
</style>
