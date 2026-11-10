<script lang="ts">
  /** The pager dots of the effect stages: the current one stretches. `liquid` and `riso` sit in a column at the right. */
  let { count, index, variant = 'plain' }: { count: number; index: number; variant?: 'plain' | 'liquid' | 'riso' } = $props()
</script>

<div class="dots {variant}" aria-hidden="true">
  {#each { length: count } as _, i (i)}<span data-on={i === index || undefined}></span>{/each}
</div>

<style>
  .dots { z-index: 2; color: var(--fg); pointer-events: none; gap: 6px; display: flex; position: absolute; bottom: 16px; left: 50%; translate: -50%; }
  .dots span { opacity: 0.22; background: currentColor; border-radius: 3px; width: 6px; height: 6px; transition: width 0.22s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.22s; }
  .dots span[data-on] { opacity: 0.8; width: 16px; }
  /* Liquid: a small frosted pill. */
  .dots.liquid { z-index: 3; color: #0a0a0a; backdrop-filter: blur(8px); background: #ffffffb8; border-radius: 99px; padding: 5px 8px; box-shadow: 0 0 0 0.5px #00000014; }
  .dots.liquid, .dots.riso { flex-direction: column; align-items: center; inset: 50% 16px auto auto; translate: 0 -50%; }
  .dots.liquid { padding: 8px 5px; }
  .dots.liquid span, .dots.riso span { width: 6px; height: 6px; transition: height 0.22s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.22s; }
  .dots.liquid span[data-on], .dots.riso span[data-on] { width: 6px; height: 16px; }
  @media (prefers-color-scheme: dark) { .dots.liquid { color: #ededed; background: #14141499; box-shadow: 0 0 0 0.5px #ffffff1a; } }
  @media (prefers-reduced-motion: reduce) { .dots span { transition: none; } }
</style>
