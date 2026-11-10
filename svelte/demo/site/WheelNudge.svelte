<script lang="ts">
  import type { Snippet } from 'svelte'

  /** The site's handwritten hint: a few words and a hand-drawn arrow. Position it with `style` (top/left/right). */
  const arrows = {
    up: { box: '0 0 40 50', d: ['M12 47c10-6 17-18 16-40', 'M20 14c3-4 6-7 8-9 2 3 4 7 5 11'] },
    'up-left': { box: '0 0 48 38', d: ['M40 35C34 22 22 12 6 8', 'M14 3c-3 2-6 3-9 5 2 3 4 6 5 10'] },
    right: { box: '0 0 60 36', d: ['M3 30c10-12 26-19 50-17', 'M45 6c4 3 7 5 9 7-3 3-6 6-8 10'] },
    left: { box: '0 0 60 36', d: ['M57 30c-10-12-26-19-50-17', 'M15 6c-4 3-7 5-9 7 3 3 6 6 8 10'] },
    'down-right': { box: '0 0 56 48', d: ['M6 4c-2 18 10 34 42 38', 'M38 33c4 4 8 7 11 9-4 2-8 4-12 7'] },
    down: { box: '0 0 36 50', d: ['M8 3c12 6 18 22 16 42', 'M15 37c3 3 6 6 9 9 2-4 5-8 8-11'] },
    arc: { box: '0 0 44 92', d: ['M30 4C10 22 6 56 24 86', 'M15 80c4 2 7 4 9 6 1-4 3-8 4-12'] },
    sideways: { box: '0 0 92 26', d: ['M8 13c20-7 56-7 76 0', 'M15 5c-4 3-7 6-9 8 3 2 7 4 10 6', 'M77 5c4 3 7 6 9 8-3 2-7 4-10 6'] },
  } as const

  let { arrow, style = '', children }: { arrow: keyof typeof arrows; style?: string; children: Snippet } = $props()
  const shape = $derived(arrows[arrow])
</script>

<svelte:head>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Covered+By+Your+Grace&display=swap" />
</svelte:head>

<span class="nudge nudge-{arrow}" {style} aria-hidden="true">
  <span class="nudge-text">{@render children()}</span>
  <svg class="nudge-arrow" viewBox={shape.box}>{#each shape.d as d (d)}<path {d} />{/each}</svg>
</span>

<style>
  .nudge { z-index: 3; pointer-events: none; color: #e5261b; animation: nudge-in 0.5s cubic-bezier(0.23, 1, 0.32, 1) 0.3s both; display: flex; position: absolute; }
  .nudge-text { white-space: nowrap; font-size: 19px; line-height: 1; rotate: -4deg; font-family: 'Covered By Your Grace', 'Bradley Hand', 'Segoe Script', cursive; font-weight: 400; font-style: normal; }
  .nudge-arrow { fill: none; stroke: currentColor; stroke-width: 2px; stroke-linecap: round; stroke-linejoin: round; }
  .nudge-up { flex-direction: column-reverse; align-items: flex-end; }
  .nudge-up .nudge-arrow { width: 30px; height: 38px; margin-right: 30px; }
  .nudge-right { align-items: center; gap: 4px; }
  .nudge-right .nudge-arrow { width: 40px; height: 24px; }
  .nudge-left { flex-direction: row-reverse; align-items: center; gap: 4px; }
  .nudge-left .nudge-arrow { width: 40px; height: 24px; }
  .nudge-down-right { flex-direction: column; align-items: flex-start; gap: 2px; }
  .nudge-down-right .nudge-arrow { width: 44px; height: 38px; margin-left: 18px; }
  .nudge-down { flex-direction: column; align-items: flex-end; gap: 2px; }
  .nudge-down .nudge-arrow { width: 26px; height: 36px; margin-right: 4px; }
  .nudge-arc { flex-direction: column; align-items: flex-start; gap: 0; }
  .nudge-arc .nudge-arrow { width: 34px; height: 72px; margin-left: 10px; }
  .nudge-up-left { flex-direction: column-reverse; align-items: flex-start; gap: 2px; }
  .nudge-up-left .nudge-arrow { width: 38px; height: 30px; margin-left: -6px; }
  .nudge-sideways { flex-direction: column; align-items: center; gap: 1px; }
  .nudge-sideways .nudge-arrow { width: 70px; height: 20px; }
  @keyframes nudge-in { 0% { opacity: 0; translate: 0 6px; } }
  @media (prefers-reduced-motion: reduce) { .nudge { animation-name: nudge-fade; } @keyframes nudge-fade { 0% { opacity: 0; } } }
  @media (prefers-color-scheme: dark) { .nudge { color: #ff4f3f; } }
</style>
