<script lang="ts">
  // In your app: import { Detent } from '@hayderkg/detent-svelte'
  import { Detent } from '../../src/lib'

  const sections = ['Install', 'Quickstart', 'Layout', 'Drum', 'Indicator', 'Surface', 'Headless', 'Physics', 'Feedback', 'Accessibility']
  let value = $state('Drum')
  let open = $state(true)

  /** The arc: every row turns about a point far to the right of the list, so the labels fan out from the button. */
  const arc = (offset: number, _index: number, selected: boolean) => ({
    transform: `translateY(0px) rotate(${-offset * 0.1622}rad)`,
    transformOrigin: '410px 50%',
    opacity: Math.max(0, 1 - Math.abs(offset) * 0.28),
    ...(selected ? { color: 'var(--accent, #ff5a1f)', fontWeight: 600 } : {}),
  })
</script>

<div class="demo">
  <div class="note" aria-hidden="true">
    <span>scroll through</span>
    <svg width="34" height="46" viewBox="0 0 34 46" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M24 4C10 8 6 22 9 38" /><path d="M3 31l6 8 7-7" /></svg>
  </div>

  <div class="menu">
    <div class="wheel" class:closed={!open} inert={!open}>
      <Detent
        items={sections}
        bind:value
        label="Section"
        itemHeight={44}
        visibleCount={9}
        width={194}
        height={396}
        align="end"
        perspective={0}
        fade={0}
        dim={0}
        highlight={false}
        magnify={false}
        mask="none"
        rowStyle={arc}
        style="font-size:16px"
      />
    </div>
    <button type="button" class="toggle" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onclick={() => (open = !open)}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
        {#if open}<path d="M3 3l10 10M13 3L3 13" />{:else}<path d="M2 4h12M2 8h12M2 12h12" />{/if}
      </svg>
    </button>
  </div>
</div>

<style>
  .demo { position: relative; display: flex; justify-content: center; gap: 48px; padding-top: 40px; --accent: #ff5a1f; }
  .note { color: #e0301e; font: 20px/1 'Caveat', 'Bradley Hand', 'Segoe Print', cursive; transform: rotate(-4deg); align-self: flex-start; display: grid; justify-items: start; gap: 4px; }
  .menu { position: relative; width: 216px; height: 396px; }
  .wheel { transition: opacity 0.25s; }
  .wheel.closed { opacity: 0; pointer-events: none; }
  .toggle { position: absolute; right: 0; top: 176px; width: 44px; height: 44px; border: 0; border-radius: 99px; background: rgb(10 10 10 / 0.07); color: inherit; display: grid; place-items: center; cursor: pointer; }
  @media (prefers-color-scheme: dark) { .toggle { background: rgb(255 255 255 / 0.1); } }
</style>
