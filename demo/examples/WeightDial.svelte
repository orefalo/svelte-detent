<script lang="ts">
  // In your app: import { createDetent, DetentNumber } from 'svelte-detent'
  import { ticks } from '../../src/lib'
  import { createDetent, DetentNumber } from '../../src/lib'
  import WheelNudge from '../site/WheelNudge.svelte'

  const tick = ticks({ sound: { volume: 0.35 }, haptics: true })
  const values = Array.from({ length: 101 }, (_, i) => 15 + i)
  const STEP = 4.5 // degrees of dial per kg
  /** Ticks further than this from the needle are hidden: the dial shows 96° of its ring. */
  const REACH = Math.floor(96 / STEP)

  // The wheel is the input (keys, drag, wheel, accessibility); its rows are invisible. The SVG dial draws the value.
  const d = createDetent<number>(() => ({
    items: values,
    onTick: tick,
    defaultValue: 72,
    itemSize: 9,
    visibleCount: 21,
    orientation: 'horizontal',
    label: 'Weight',
    getLabel: (kg) => `${kg} kilograms`,
  }))

  let ring: SVGGElement | undefined = $state()
  const marks: (SVGGElement | undefined)[] = []
  /** The position the readout shows, live; `selectedIndex` is the one the wheel last rested on. */
  let shown = $state(d.selectedIndex)

  $effect(() =>
    d.subscribe(({ offset }) => {
      shown = Math.min(values.length - 1, Math.max(0, Math.round(offset)))
      ring?.setAttribute('transform', `rotate(${(-(STEP * offset)).toFixed(3)} 160 168)`)
      marks.forEach((g, i) => {
        if (!g) return
        const far = Math.abs(i - offset) > REACH
        if (g.hasAttribute('visibility') !== far) far ? g.setAttribute('visibility', 'hidden') : g.removeAttribute('visibility')
      })
    }),
  )

  const selected = $derived(d.selectedIndex)
  const atLimit = $derived(selected === values.length - 1)
</script>

<div class="note-scene">
  <div class="weight-demo" data-limit={atLimit ? '' : undefined}>
    <div {...d.rootAttrs} class="dial" style={d.rootStyle + 'position:relative;width:min(320px, 100%);aspect-ratio:320 / 192;cursor:grab;border-radius:16px;outline-offset:4px'} {@attach d.attachRoot}>
      <svg viewBox="0 0 320 192" aria-hidden="true">
        <defs>
          <linearGradient id="weight-fade" x1="0" x2="1">
            <stop offset="0" stop-color="#fff" stop-opacity="0" />
            <stop offset="0.24" stop-color="#fff" />
            <stop offset="0.76" stop-color="#fff" />
            <stop offset="1" stop-color="#fff" stop-opacity="0" />
          </linearGradient>
          <mask id="weight-mask"><rect x="0" y="0" width="320" height="172" fill="url(#weight-fade)" /></mask>
        </defs>
        <path d="M 26 168 A 134 134 0 0 1 294 168" fill="none" stroke="color-mix(in srgb, currentColor 6%, transparent)" stroke-width="46" stroke-linecap="round" />
        <g mask="url(#weight-mask)">
          <g bind:this={ring} transform="rotate({-(STEP * selected)} 160 168)">
            {#each values as kg, i (kg)}
              {@const major = kg % 5 === 0}
              <g bind:this={marks[i]} transform="rotate({STEP * i} 160 168)" visibility={Math.abs(i - selected) > REACH ? 'hidden' : undefined}>
                <line x1="160" x2="160" y1="40" y2={40 + (major ? 22 : 12)} stroke="currentColor" stroke-width={major ? 2 : 1.25} stroke-linecap="round" opacity={major ? 0.9 : 0.35} />
                {#if kg % 10 === 0}
                  <text x="160" y="78" text-anchor="middle" font-size="10" fill="currentColor" opacity="0.5" class="mono">{kg}</text>
                {/if}
              </g>
            {/each}
          </g>
        </g>
        <line x1="160" x2="160" y1="10" y2="66" stroke="var(--accent, #ff5a1f)" stroke-width="3" stroke-linecap="round" />
        <circle cx="160" cy="66" r="4.5" fill="var(--accent, #ff5a1f)" />
      </svg>

      <div class="readout-wrap">
        <output class="weight-readout" aria-label="{values[selected]} kilograms"><DetentNumber value={values[shown]!} locales="en-US" snapDuration={320} /></output>
        <span class="mono unit">kg</span>
      </div>
      <div {...d.trackAttrs} style={d.trackStyle + 'opacity:0;pointer-events:none'} {@attach d.attachTrack}>
        {#each d.rows as r (r.key)}<div {...r.attrs} style={r.style}></div>{/each}
      </div>
    </div>
    <div {...d.liveRegionAttrs} style={d.liveRegionStyle}>{d.announcement}</div>
    <p class="mono range">{atLimit ? '115 kg · end of the dial' : '15–115 kg'}</p>
  </div>
  <WheelNudge arrow="sideways" style="top:-18px;left:calc(50% + 62px)">drag sideways</WheelNudge>
</div>

<style>
  .note-scene { justify-items: center; width: 100%; display: grid; position: relative; --accent: #ff5a1f; }
  .weight-demo { display: grid; justify-items: center; gap: 10px; width: 100%; }
  .weight-demo[data-limit] .weight-readout { animation: weight-limit 420ms cubic-bezier(0.23, 1, 0.32, 1); }
  @keyframes weight-limit { 0%, 100% { transform: scale(1); } 35% { transform: scale(1.035); } }
  .dial:focus-visible { outline: 1.5px solid currentColor; }
  .dial > svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
  .mono { font-family: 'Geist Mono', ui-monospace, monospace; }
  .readout-wrap { position: absolute; left: 0; right: 0; top: 52%; display: grid; justify-items: center; pointer-events: none; }
  .weight-readout { font-size: 52px; font-weight: 650; letter-spacing: -0.05em; line-height: 1; font-variant-numeric: tabular-nums; }
  .unit { margin-top: 6px; font-size: 12px; opacity: 0.55; }
  .range { margin: 0; font-size: 12px; opacity: 0.55; }
  @media (prefers-reduced-motion: reduce) { .weight-demo[data-limit] .weight-readout { animation: none; } }
</style>
