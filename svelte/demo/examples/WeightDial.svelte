<script lang="ts">
  // In your app: import { createDetent } from '@hayderkg/detent-svelte'
  import { createDetent } from '../../src/lib'

  const MIN = 15
  const MAX = 115
  const STEP = 4.5 // degrees of dial per kg
  const SIZE = 9 // px of wheel travel per kg (rows are invisible: the SVG draws the dial)
  const values = Array.from({ length: MAX - MIN + 1 }, (_, i) => MIN + i)
  const CX = 160
  const CY = 168

  let value = $state(72)

  const d = createDetent<number>(() => ({
    items: values,
    value,
    onChange: (v) => (value = v),
    changeOn: 'tick', // the readout follows the dial live
    itemSize: SIZE,
    visibleCount: 21,
    orientation: 'horizontal',
    label: 'Weight',
  }))

  let ticks: SVGGElement | undefined = $state()
  let marks: SVGGElement[] = []

  /** Turn the ring under the fixed needle and show only the ticks near it. */
  function paint(offset: number) {
    ticks?.setAttribute('transform', `rotate(${-offset * STEP} ${CX} ${CY})`)
    marks.forEach((g, i) => g.setAttribute('visibility', Math.abs(i - offset) <= 20 ? 'visible' : 'hidden'))
  }
  $effect(() => {
    paint(d.engine.x / SIZE)
    return d.subscribe((f) => paint(f.offset))
  })
</script>

<svelte:head>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Covered+By+Your+Grace&display=swap" />
</svelte:head>

<div class="card">
  <div class="stack">
    <div class="note" aria-hidden="true">
      <span>drag sideways</span>
      <svg viewBox="0 0 92 26" width="70" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M8 13c20-7 56-7 76 0" /><path d="M15 5c-4 3-7 6-9 8 3 2 7 4 10 6" /><path d="M77 5c4 3 7 6 9 8-3 2-7 4-10 6" />
      </svg>
    </div>

    <div {...d.rootAttrs} class="dial" style={d.rootStyle + 'width:min(320px,100%);aspect-ratio:320/192;border-radius:16px;'} {@attach d.attachRoot}>
      <div {...d.trackAttrs} style={d.trackStyle} {@attach d.attachTrack}>
        {#each d.rows as r (r.key)}
          <div {...r.attrs} style={r.style}></div>
        {/each}
      </div>

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
          <g bind:this={ticks}>
            {#each values as v, i (v)}
              {@const major = i % 5 === 0}
              <g transform="rotate({i * STEP} {CX} {CY})" visibility="hidden" bind:this={marks[i]}>
                <line x1={CX} x2={CX} y1="40" y2={major ? 62 : 52} stroke="currentColor" stroke-width={major ? 2 : 1.25} stroke-linecap="round" opacity={major ? 0.9 : 0.35} />
                {#if v % 10 === 0}
                  <text x={CX} y="78" text-anchor="middle" font-size="10" fill="currentColor" opacity="0.5" class="mono">{v}</text>
                {/if}
              </g>
            {/each}
          </g>
        </g>
        <line x1={CX} x2={CX} y1="10" y2="66" stroke="var(--accent, #ff5a1f)" stroke-width="3" stroke-linecap="round" />
        <circle cx={CX} cy="66" r="4.5" fill="var(--accent, #ff5a1f)" />
      </svg>

      <div class="readout">
        <output>{value}</output>
        <span class="mono">kg</span>
      </div>
    </div>
    <div {...d.liveRegionAttrs} style={d.liveRegionStyle}>{d.announcement}</div>
    <p class="mono range">{MIN}–{MAX} kg</p>
  </div>
</div>

<style>
  .card { display: grid; place-items: center; width: 100%; }
  .stack { position: relative; display: grid; justify-items: center; gap: 10px; width: 100%; }
  .dial { position: relative; cursor: grab; outline-offset: 4px; color: #0a0a0a; }
  .dial:focus-visible { outline: 1.5px solid currentColor; }
  .dial > svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
  .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
  .readout { position: absolute; left: 0; right: 0; top: 52%; display: grid; justify-items: center; pointer-events: none; }
  output { font-size: 52px; font-weight: 650; letter-spacing: -2.6px; line-height: 1; font-variant-numeric: tabular-nums; }
  .readout span { font-size: 12px; opacity: 0.55; }
  .range { margin: 0; font-size: 12px; opacity: 0.55; }
  .note { position: absolute; right: 12%; top: -4px; display: grid; justify-items: center; color: #e5261b; transform: rotate(-3deg); pointer-events: none; }
  .note span { font: 19px 'Covered By Your Grace', cursive; }
  @media (prefers-color-scheme: dark) { .dial { color: #ededed; } }
</style>
