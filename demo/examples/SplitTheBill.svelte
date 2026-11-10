<script lang="ts">
  // In your app: import { Detent, DetentNumber } from 'svelte-detent'
  import { ticks } from '../../src/lib'
  import { Detent, DetentNumber } from '../../src/lib'

  const BILL = 128.4
  const tips = [0, 5, 10, 12, 15, 18, 20, 22, 25]
  const people = Array.from({ length: 12 }, (_, i) => i + 1)
  const faces = ['#f4a261', '#7cc6a4', '#8fa8f8', '#f28fad', '#c3a6f5', '#f6d365']
  const money = { style: 'currency', currency: 'USD' } as const
  /** The currency sign and the cents are styled as parts of one formatted number. */
  const parts = { currency: 'sb-currency', fraction: 'sb-cents', decimal: 'sb-cents' }

  let tip = $state(18)
  let count = $state(3)
  let roundUp = $state(false)

  const withTip = $derived(BILL * (1 + tip / 100))
  const share = $derived(roundUp ? Math.ceil(withTip / count) : Math.round((withTip / count) * 100) / 100)
  const total = $derived(roundUp ? share * count : withTip)
  const tick = ticks({ sound: { volume: 0.3 }, haptics: true })
</script>

{#snippet picker(label: string, items: number[], value: number, size: number, set: (v: number) => void, suffix: string)}
  <Detent
    changeOn="tick"
    onTick={tick}
    orientation="horizontal"
    visibleCount={5}
    height={38}
    curvature={0.5}
    magnify={1.22}
    fade={0.3}
    dim={0}
    indicator={{ shape: 'pill', material: 'glass' }}
    style="width:100%;--detent-font-size:14px;font-weight:550;font-variant-numeric:tabular-nums"
    {items}
    {value}
    onChange={set}
    {label}
    itemHeight={size}
  >
    {#snippet item(v: number)}{v}{suffix}{/snippet}
  </Detent>
{/snippet}

<div class="sb">
  <div class="sb-head">
    <div><span class="sb-place">Dinner at Ostra</span><span class="sb-muted">Table 12 · 4 Nov</span></div>
    <DetentNumber class="sb-bill" value={BILL} format={money} locales="en-US" />
  </div>

  <div class="sb-field">
    <span class="sb-label">Tip</span>
    {@render picker('Tip', tips, tip, 54, (v) => (tip = v), '%')}
  </div>

  <div class="sb-field">
    <span class="sb-label">
      Split between
      <!-- Avatars that pop in and out with the count. -->
      <span class="sb-faces" aria-hidden="true">
        {#each faces.slice(0, Math.min(count, 6)) as c, i (i)}<i style:background={c} style:z-index={6 - i}></i>{/each}
        {#if count > 6}<b>+<DetentNumber value={count - 6} /></b>{/if}
      </span>
    </span>
    {@render picker('People', people, count, 46, (v) => (count = v), '')}
  </div>

  <div class="sb-foot">
    <output class="sb-result" aria-live="polite" aria-atomic="true">
      <span class="sb-each-label">
        {count === 1 ? 'You pay' : 'Each pays'}
        <span class="sb-muted">tip <DetentNumber value={total - BILL} format={money} locales="en-US" /> · total <DetentNumber value={total} format={money} locales="en-US" /></span>
      </span>
      <span class="sb-each"><DetentNumber value={share} format={money} locales="en-US" classNames={parts} /></span>
    </output>
    <button type="button" role="switch" aria-checked={roundUp} class="sb-switch" onclick={() => (roundUp = !roundUp)}>
      Round up each share
      <span class="sb-track" aria-hidden="true"><span class="sb-knob"></span></span>
    </button>
  </div>
</div>

<style>
  .sb { --sb-ease: cubic-bezier(0.23, 1, 0.32, 1); --fg: #111; --bg: #fff; --muted: #888; --line: rgb(0 0 0 / 0.1); --band: rgb(0 0 0 / 0.04);
    width: 100%; max-width: 330px; display: grid; gap: 14px; padding: 16px; box-sizing: border-box; border-radius: 20px;
    background: var(--bg); box-shadow: 0 0 0 1px var(--line), 0 1px 2px rgb(0 0 0 / 0.04), 0 16px 32px -22px rgb(0 0 0 / 0.3);
    font: 14px/1.4 system-ui, sans-serif; color: var(--fg); }
  .sb-muted { color: var(--muted); }
  .sb-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 0 2px 2px; }
  .sb-head > div { display: grid; gap: 1px; }
  .sb-place { font-weight: 600; color: var(--fg); }
  .sb-head .sb-muted { font-size: 12px; }
  .sb :global(.sb-bill) { font-size: 15px; font-weight: 600; font-variant-numeric: tabular-nums; color: var(--fg); }
  .sb-field { display: grid; gap: 4px; padding: 10px 10px 6px; border-radius: 14px; background: var(--band); }
  .sb-label { display: flex; align-items: center; justify-content: space-between; padding: 0 2px; font-size: 12.5px; font-weight: 500; color: var(--muted); }
  .sb-faces { display: inline-flex; align-items: center; height: 18px; }
  .sb-faces i { width: 16px; height: 16px; margin-left: -5px; border-radius: 50%; box-shadow: 0 0 0 1.5px var(--bg); animation: sb-in 220ms var(--sb-ease); }
  .sb-faces i:first-child { margin-left: 0; }
  .sb-faces b { margin-left: 5px; font-size: 11.5px; font-weight: 600; color: var(--fg); font-variant-numeric: tabular-nums; }
  @keyframes sb-in { from { transform: scale(0.4); opacity: 0; } }
  .sb-foot { display: grid; gap: 6px; padding: 4px 2px 0; }
  .sb-result { display: flex; align-items: flex-end; justify-content: space-between; gap: 10px; font-variant-numeric: tabular-nums; }
  .sb-each-label { display: grid; gap: 2px; padding-bottom: 6px; font-size: 13px; font-weight: 500; color: var(--fg); }
  .sb-each-label .sb-muted { font-size: 11.5px; font-weight: 400; white-space: nowrap; }
  /* Room above and below the digits: while they roll, each one is seen through a window the height of the line. */
  .sb-each { font-size: 28px; font-weight: 600; letter-spacing: -0.03em; line-height: 1.3; color: var(--fg); white-space: nowrap; }
  /* On the baseline, smaller and quieter. (Raising them with vertical-align would lift them out of that window.) */
  .sb-each :global(.sb-currency) { font-size: 0.55em; margin-right: 0.06em; color: var(--muted); font-weight: 500; }
  .sb-each :global(.sb-cents) { font-size: 0.55em; color: var(--muted); }
  .sb-switch { display: flex; align-items: center; justify-content: space-between; gap: 10px; width: 100%; padding: 10px 2px 0; border: 0; border-top: 1px solid var(--line);
    background: none; color: inherit; font: inherit; font-size: 13px; cursor: pointer; -webkit-tap-highlight-color: transparent; }
  .sb-switch:focus-visible { outline-offset: 2px; }
  .sb-track { position: relative; flex: none; width: 34px; height: 20px; border-radius: 99px; background: color-mix(in srgb, var(--fg) 16%, transparent); transition: background-color 200ms var(--sb-ease); }
  .sb-knob { position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgb(0 0 0 / 0.25); transition: transform 200ms var(--sb-ease), width 150ms var(--sb-ease); }
  .sb-switch[aria-checked='true'] .sb-track { background: #1f9d55; }
  .sb-switch[aria-checked='true'] .sb-knob { transform: translateX(14px); }
  .sb-switch:active .sb-knob { width: 20px; }
  .sb-switch[aria-checked='true']:active .sb-knob { transform: translateX(10px); }
  @media (prefers-reduced-motion: reduce) { .sb :global(*) { transition: none !important; animation: none !important; } }
  @media (prefers-color-scheme: dark) { .sb { --fg: #ededed; --bg: #1a1a1a; --line: rgb(255 255 255 / 0.12); --band: rgb(255 255 255 / 0.06); } }
</style>
