<script lang="ts">
  // In your app: import { Detent } from 'svelte-detent'
  import { ticks } from '@hayderkg/detent/feedback'
  import { Detent } from '../../src/lib'

  interface Section { name: string; id: string }
  const sections: Section[] = [
    { name: 'Install', id: 'install' },
    { name: 'Quickstart', id: 'quickstart' },
    { name: 'Layout', id: 'layout' },
    { name: 'Drum', id: 'drum' },
    { name: 'Indicator', id: 'indicator' },
    { name: 'Surface', id: 'surface-and-motion' },
    { name: 'Headless', id: 'usedetent' },
    { name: 'Physics', id: 'why-its-own-physics' },
    { name: 'Feedback', id: 'feedback' },
    { name: 'Accessibility', id: 'accessibility' },
  ]

  const ROW = 44
  /** Each row turns by this much about the point 410px to the right: the chord between rows stays one row high. */
  const STEP = Math.asin(42 / 260)

  let open = $state(true)
  let value = $state<Section>(sections[3]!)
  let toggle = $state<HTMLButtonElement | null>(null)
  const tick = ticks({ sound: { volume: 0.3 }, haptics: true })

  /**
   * The arc. Rows are laid out one under another; this cancels that (translateY) so they all start at the same
   * place, then turns each one about a point far to the right, so the labels fan out from the button.
   */
  const arc = (offset: number) => ({
    transformOrigin: '410px 50%',
    transform: `translateY(${-(ROW * offset)}px) rotate(${-offset * STEP}rad)`,
    opacity: Math.max(0, 1 - 0.3 * Math.abs(offset)),
  })

  function onkeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && open) {
      open = false
      toggle?.focus()
    }
  }
</script>

<div class="demo">
  <div class="note" aria-hidden="true">
    <span>scroll through</span>
    <svg width="34" height="46" viewBox="0 0 34 46" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M24 4C10 8 6 22 9 38" /><path d="M3 31l6 8 7-7" /></svg>
  </div>

  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="menu" {onkeydown}>
    <div class="wheel" class:closed={!open} inert={!open}>
      <Detent
        items={sections}
        getKey={(s) => s.id}
        getLabel={(s) => s.name}
        bind:value
        onTick={tick}
        label="Section"
        itemHeight={ROW}
        visibleCount={9}
        width={194}
        align="end"
        perspective={0}
        curvature={0}
        fade={0}
        dim={0}
        magnify={false}
        indicator={{ shape: 'none' }}
        mask="none"
        selectedStyle={{ color: 'var(--accent, #ff5a1f)', fontWeight: 600 }}
        rowStyle={arc}
        style="--detent-font-size:16px"
      >
        {#snippet item(s: Section)}
          <span class="label">{s.name}</span>
        {/snippet}
      </Detent>
    </div>
    <button
      bind:this={toggle}
      type="button"
      class="toggle"
      aria-expanded={open}
      aria-label={open ? 'Close menu' : 'Open menu'}
      onclick={() => (open = !open)}
    >
      <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">
        <path d={open ? 'M3.5 3.5l9 9M12.5 3.5l-9 9' : 'M2.5 5h11M2.5 11h11'} />
      </svg>
    </button>
  </div>
</div>

<style>
  .demo { position: relative; display: flex; justify-content: center; gap: 48px; padding-top: 24px; --accent: #ff5a1f; }
  .note { color: #e0301e; font: 20px/1 'Caveat', 'Bradley Hand', 'Segoe Print', cursive; transform: rotate(-4deg); align-self: flex-start; display: grid; justify-items: start; gap: 4px; }
  .menu { position: relative; width: 216px; height: 396px; }
  /* Closed, the wheel folds back toward the button: turned about its right edge, smaller, and faded. */
  .wheel { transform-origin: 194px 50%; transition: transform 420ms cubic-bezier(0.32, 0.72, 0, 1), opacity 240ms ease; }
  .wheel.closed { transform: rotate(-28deg) scale(0.86); opacity: 0; }
  .label { padding-inline-end: 44px; white-space: nowrap; }
  .toggle { position: absolute; left: 172px; top: calc(50% - 22px); width: 44px; height: 44px; padding: 0; border: 0; border-radius: 99px; background: color-mix(in srgb, currentColor 7%, transparent); color: inherit; display: grid; place-items: center; cursor: pointer; }
  .toggle path { transition: d 240ms ease; }
  @media (prefers-reduced-motion: reduce) {
    .wheel { transition: opacity 120ms linear; }
    .wheel.closed { transform: none; }
    .toggle path { transition: none; }
  }
</style>
