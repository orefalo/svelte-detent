<script lang="ts">
  import Tile from './Tile.svelte'

  /** A word on a split-flap board: `width` tiles, padded with blanks. `delay` offsets the row; each tile adds 16 ms. */
  let { text, width, delay = 0 }: { text: string; width: number; delay?: number } = $props()
  const chars = $derived([...text.padEnd(width)].slice(0, width))
</script>

<span class="db-flaps">
  <span class="db-sr">{text}</span>
  {#each chars as ch, i (i)}<Tile char={ch} delay={delay + 16 * i} />{/each}
</span>

<style>
  .db-flaps { display: flex; gap: 1.5px; font: 600 13px/24px 'Geist Mono', ui-monospace, 'SF Mono', Menlo, monospace; color: inherit; }
  .db-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  @container (max-width: 360px) { .db-flaps { font-size: 11.5px; line-height: 21px; } }
</style>
