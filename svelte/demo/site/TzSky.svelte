<script lang="ts">
  import { EIFFEL_PATH, RAIN, SKYLINES, SNOW, STARS, type City } from './TzData.svelte'

  /**
   * One city's sky: a 32 × 32 disc with its gradient, stars, sun, moon, flight, birds, clouds, skyline, lights, windows
   * and weather. Its colours and positions are written by `paintSky` (TzData) as the scrub moves; this is the markup.
   */
  let { city, utcOffset, phase, grain, index }: { city: City; utcOffset: number; phase: string; grain: string; index: number } = $props()

  const uid = $props.id()
  const sky = $derived(SKYLINES[city.skyline]!)
  const south = $derived(city.lat < 0)
  const n = $derived(index)
  const cloud = $derived(
    [
      { cls: 'tz-cloud1', d: 'M0 4.2a2.1 2.1 0 0 1 1.9-2.4 2.9 2.9 0 0 1 5.4-.6 2.2 2.2 0 0 1 2.9 2.2 1.4 1.4 0 0 1-.4 2.8H1.3A1.5 1.5 0 0 1 0 4.2Z', delay: -(11 * n) - 20 },
      { cls: 'tz-cloud2', d: 'M0 3a1.6 1.6 0 0 1 1.5-1.8 2.2 2.2 0 0 1 4.1-.3 1.6 1.6 0 0 1 1.7 2.1 1 1 0 0 1-.3 2H1A1.1 1.1 0 0 1 0 3Z', delay: -(17 * n) - 55 },
      { cls: 'tz-cloud3', d: 'M0 4.6a2.4 2.4 0 0 1 2.2-2.7 3.3 3.3 0 0 1 6.2-.7 2.5 2.5 0 0 1 3.3 2.5 1.6 1.6 0 0 1-.5 3.2H1.5A1.7 1.7 0 0 1 0 4.6Z', delay: -(23 * n) - 30 },
      { cls: 'tz-cloud4', d: 'M0 3.4a1.9 1.9 0 0 1 1.7-2.1 2.6 2.6 0 0 1 4.9-.5 1.9 1.9 0 0 1 2.6 2 1.2 1.2 0 0 1-.4 2.5H1.2A1.3 1.3 0 0 1 0 3.4Z', delay: -(29 * n) - 70 },
    ],
  )
</script>

<svg id="{uid}sky" class="tz-sky" viewBox="0 0 32 32" width="32" height="32" aria-hidden="true" data-lat={city.lat} data-lon={city.lon} data-utc={utcOffset} data-w={index}>
  <defs>
    <linearGradient id="{uid}s" x1="0" y1="0" x2="0" y2="1">
      <stop class="tz-z" offset="0" /><stop class="tz-m" offset="0.55" /><stop class="tz-h" offset="0.8" />
    </linearGradient>
    <linearGradient id="{uid}w" x1="0" y1="0" x2="0" y2="1"><stop class="tz-wa" offset="0" /><stop class="tz-wb" offset="1" /></linearGradient>
    <radialGradient id="{uid}g">
      <stop offset="0" stop-color="#ffbe7a" stop-opacity="0.9" /><stop offset="0.45" stop-color="#ff9466" stop-opacity="0.35" /><stop offset="1" stop-color="#ff8a5c" stop-opacity="0" />
    </radialGradient>
    <linearGradient class="tz-rim-g" id="{uid}r" gradientUnits="userSpaceOnUse" x1="0" x2="32" y1="0" y2="0">
      <stop offset="0" stop-color="#ffd59a" stop-opacity="0" /><stop offset="0.5" stop-color="#ffd59a" stop-opacity="1" /><stop offset="1" stop-color="#ffd59a" stop-opacity="0" />
    </linearGradient>
    <linearGradient id="{uid}f" gradientUnits="userSpaceOnUse" x1="0" x2="6" y1="0" y2="0">
      <stop offset="0" stop-color="#fff" stop-opacity="0" /><stop offset="1" stop-color="#fff" stop-opacity="1" />
    </linearGradient>
  </defs>
  <rect width="32" height="32" fill="url(#{uid}s)" />

  <g class="tz-stars">
    <g class="tz-pole">
      {#each STARS as [x, y, r, dur], i (i)}<circle cx={x} cy={y} {r} style="animation-duration:{dur}s;animation-delay:{-(1.3 * i)}s" />{/each}
    </g>
    <line class="tz-shoot" x1="0" y1="0" x2="6" y2="0" stroke="url(#{uid}f)" style="animation-duration:{9 + 2.7 * n}s;animation-delay:{-(3.1 * n) - 2}s" />
  </g>
  <circle class="tz-glow" r="15" fill="url(#{uid}g)" />
  <g class="tz-sun-at">
    <g class="tz-corona"><path d="M0-7.4v1.6M0 5.8v1.6M-7.4 0h1.6M5.8 0h1.6M-5.2-5.2l1.1 1.1M4.1 4.1l1.1 1.1M-5.2 5.2l1.1-1.1M4.1-4.1l1.1-1.1" /></g>
    <circle class="tz-sun" r="4.2" />
  </g>
  <g class="tz-moon-at">
    <g transform="rotate({south ? 24 : -24}) scale({south ? -1 : 1} 1)">
      <circle class="tz-earthshine" r="3.6" />
      <path class="tz-moon" d={phase} />
    </g>
  </g>
  <g class="tz-day">
    <g class="tz-flight" style="animation-duration:{26 + 7 * n}s;animation-delay:{-(9 * n) - 4}s">
      <path class="tz-trail" d="M-4 9.5 36 4.5" pathLength="1" />
      <circle class="tz-plane" r="0.55" />
    </g>
    <g class="tz-birds" style="animation-duration:{34 + 9 * n}s;animation-delay:{-(13 * n) - 15}s">
      <path d="M0 0q.7-.6 1.3 0q.6-.6 1.3 0" /><path d="M3.2 1.3q.6-.5 1.1 0q.5-.5 1.1 0" />
    </g>
  </g>
  <g class="tz-clouds">
    {#each cloud as c (c.cls)}<path class="tz-cloud {c.cls}" d={c.d} style="animation-delay:{c.delay}s" />{/each}
  </g>

  <path class="tz-far" d={sky.far} />
  {#if sky.water}
    <rect class="tz-water" y="25.6" width="32" height="6.4" fill="url(#{uid}w)" />
    <ellipse class="tz-glint" cy="28.4" rx="0.9" ry="3" />
  {/if}
  {#if city.skyline === 'tokyo'}
    <path class="tz-snow" d="M9.1 16.9C9.5 16.4 10.5 16.4 10.9 16.9 11.6 17.8 12.3 18.7 13 19.5L12 19 11.2 19.7 10.4 18.9 9.6 19.6 8.8 19 7.6 19.4C8.1 18.6 8.6 17.7 9.1 16.9Z" />
  {/if}
  {#if city.skyline === 'madrid'}
    <g class="tz-dayonly">
      <path class="tz-ink" d="M0 15.4 32 19.4" fill="none" stroke-width="0.14" />
      <g class="tz-cablecar"><path class="tz-inkfill" d="M-.07 0h.14v.9h-.14ZM-.5.9h1v.9h-1Z" /></g>
    </g>
  {:else if city.skyline === 'dubai'}
    <g class="tz-camel"><path class="tz-inkfill" d="M0 .4C.3-.4 1-.5 1.3.2c.3-.3.6-.2.7-.6h.3l-.1.7c0 .3-.2.4-.4.4v.9h-.2V.8H.4v.8H.2V.7C0 .7 0 .5 0 .4Z" /></g>
  {/if}
  <g class="tz-fog">
    <rect class="tz-fog1" x="-8" y="19" width="40" height="3.2" rx="1.6" />
    <rect class="tz-fog2" x="0" y="22.6" width="40" height="2.6" rx="1.3" />
  </g>
  <path class="tz-near" d={sky.near} />
  {#if city.skyline === 'london'}
    <g class="tz-eye">
      <g class="tz-eye-turn">
        <circle class="tz-ink" cx="18" cy="17.3" r="6" fill="none" stroke-width="0.45" />
        <path class="tz-ink" d="M18 11.3v12M12 17.3h12M13.76 13.06l8.48 8.48M22.24 13.06l-8.48 8.48" fill="none" stroke-width="0.16" />
        {#each Array.from({ length: 12 }, (_, a) => a) as a (a)}<circle class="tz-inkfill" cx={18 + 6 * Math.cos((a * Math.PI) / 6)} cy={17.3 + 6 * Math.sin((a * Math.PI) / 6)} r="0.38" />{/each}
      </g>
    </g>
  {:else if city.skyline === 'sydney'}
    <path class="tz-ink" d="M17.4 25.4C20 18.6 27.6 18.6 30.2 25.4" fill="none" stroke-width="0.65" />
    <path class="tz-ink" d="M20 22.6V21.1M22 22.6v-2.3M23.8 22.6v-2.7M25.6 22.6v-2.3M27.6 22.6V21.1" fill="none" stroke-width="0.16" />
    <path class="tz-sails" d="M4.6 24.7C5 22.6 6.2 21 7.9 20.2 7.6 21.8 7.4 23.3 7.6 24.7ZM7.2 24.7C7.6 22.2 9.1 20.2 11.2 19.3 10.8 21.2 10.6 23 10.8 24.7ZM10.3 24.7C10.7 22.6 11.9 21.1 13.6 20.4 13.3 21.9 13.2 23.3 13.4 24.7ZM13 24.7C13.3 23.4 14 22.5 15 22 14.8 22.9 14.8 23.8 14.9 24.7Z" />
  {:else if city.skyline === 'rio'}
    <ellipse class="tz-inkfill" cx="4.2" cy="8.6" rx="0.36" ry="0.42" />
  {/if}
  <path class="tz-rim" d={sky.near} stroke="url(#{uid}r)" />

  <!-- The gags: each on its own slow schedule. -->
  {#if city.skyline === 'newyork'}
    <g class="tz-kong-climb">
      <g class="tz-kong">
        <path class="tz-kongfill" d="M16.3 12.1c-.1-.7.1-1.3.6-1.6l.2-.6c.3-.3.8-.2.9.2.1.3 0 .6-.2.8.4.3.5.9.4 1.4l.3.6c.1.3-.1.5-.4.4l-.4-.4c-.2.2-.5.3-.8.2l-.2.5c-.1.3-.5.3-.5 0Z" />
        <path class="tz-kongarm" d="M17.6 10.4 16.1 9.3" fill="none" stroke-width="0.32" stroke-linecap="round" />
      </g>
    </g>
    <g class="tz-dayonly" transform="translate(16.6 10.4)"><g class="tz-biplane"><path class="tz-inkfill" d="M-.7 0h1.4l.3-.25h.2V.25h-.2L.7 0ZM-.2-.55h.25v1.1H-.2Z" /></g></g>
  {:else if city.skyline === 'london'}
    <g class="tz-bus">
      <path d="M0 0h2.6v1.25H0Z" fill="#d62f2a" />
      <path d="M.25.2h2.1v.25H.25ZM.25.65h1.7v.25H.25Z" fill="#ffe4b8" opacity="0.8" />
      <circle cx=".55" cy="1.3" r=".22" fill="#1d1d1f" /><circle cx="2.05" cy="1.3" r=".22" fill="#1d1d1f" />
    </g>
  {:else if city.skyline === 'tokyo'}
    <g class="tz-train">
      <path d="M0 0h5.2c.8 0 1.4.3 1.8.75H0Z" fill="#f4f4f2" />
      <path d="M0 .5h6.6v.18H0Z" fill="#2d5fb8" />
      <path d="M.4.12h4.6v.16H.4Z" fill="#3a4250" opacity="0.7" />
    </g>
  {:else if city.skyline === 'sydney'}
    <g class="tz-whale">
      <path class="tz-ink-whale" d="M0 0c-.1-.9-.6-1.7-1.5-2.1.7.1 1.2.4 1.5.8.3-.4.8-.7 1.5-.8C.6-1.7.1-.9 0 0Z" />
      <path d="M-1.4.1h2.8" stroke="#fff" stroke-opacity="0.55" stroke-width="0.18" stroke-linecap="round" />
    </g>
  {:else if city.skyline === 'rio'}
    <g>
      <path class="tz-ink" d="M18 21.5 25 16.3" fill="none" stroke-width="0.12" />
      <g class="tz-bondinho"><path class="tz-inkfill" d="M-.06 0h.12v.6h-.12ZM-.4.6h.8v.6h-.8Z" /></g>
    </g>
  {/if}

  <g class="tz-lights">
    {#if city.skyline === 'newyork'}
      <path class="tz-warm" d="M15 11.6h2v1H15ZM15.55 9.6h.9v2h-.9Z" />
      <path class="tz-warm" d="M6 13.4 7 10.4 8 13.4Z" opacity="0.85" />
    {:else if city.skyline === 'london'}
      <circle class="tz-warm" cx="6" cy="13.6" r="0.75" />
      <circle class="tz-eye-lit" cx="18" cy="17.3" r="6" fill="none" stroke-width="0.45" />
    {:else if city.skyline === 'tokyo'}
      <path class="tz-orange" d="M20.2 25.5C21.6 22 22.4 18.5 22.7 14.2H23.7C24 18.5 24.8 22 26.2 25.5H25.1C24.2 23.2 23.6 21.4 23.2 19.6 22.8 21.4 22.2 23.2 21.3 25.5ZM22.1 17.4h2.2v1h-2.2ZM22.55 13.6h1.3v.7h-1.3ZM23.12 13.7 23.2 6.8 23.28 13.7Z" />
      <path class="tz-lavender" d="M4.15 25.5 4.4 13.4H4.8L5.05 25.5ZM3.95 13.6h1.3v-1.1H3.95ZM4.15 10.9h.9v-.8h-.9Z" />
    {:else if city.skyline === 'sydney'}
      {#each [[19, 22.3], [21, 20.7], [23.8, 19.9], [26.6, 20.7], [28.6, 22.3]] as [x, y], i (i)}<circle class="tz-warm" cx={x} cy={y} r="0.32" />{/each}
      <g class="tz-ripple">
        {#each [[6.5, 28], [9.5, 28.6], [12.5, 28], [21, 28.4], [26.6, 28.2]] as [x, y], i (i)}<ellipse class="tz-warm" cx={x} cy={y} rx="0.35" ry="1.2" opacity="0.5" />{/each}
      </g>
    {:else if city.skyline === 'paris'}
      <path class="tz-gold" d={EIFFEL_PATH} />
      <path class="tz-beam" d="M19 6.8 36 4.6V9Z" />
      <g class="tz-sparkle">
        {#each [[16.4, 24.4], [17.5, 21.4], [18.4, 17.2], [18.9, 11.4], [19.6, 15.2], [20.6, 20.2], [21.7, 24.2], [19.1, 9.6], [17.9, 23.4], [20.2, 22.6], [18.7, 19.6], [19.4, 13.4]] as [x, y], i (i)}<circle cx={x} cy={y} r="0.28" style="animation-delay:{-(0.13 * i)}s" />{/each}
      </g>
    {:else if city.skyline === 'dubai'}
      <path class="tz-pale" d="M14.6 25.5V20.5h.9V16h.8v-4.5h.6V8h.2V2.6h.1V8h.2v3.5h.6V16h.8v4.5h.9v5Z" opacity="0.55" />
      <path class="tz-lavender" d="M24.6 25.5C25 21 26 17.4 27.8 14.8V25.5Z" opacity="0.6" />
    {:else if city.skyline === 'rio'}
      <path class="tz-pale" d="M3.55 14.3V13.4h1.3v.9ZM1.75 9.75 3.75 9.35 3.95 9.05h.5L4.65 9.35 6.65 9.75V10.05L5.6 10 5 10.9 4.75 12.2 4.95 13.4H3.45L3.65 12.2 3.4 10.9 2.8 10 1.75 10.05Z" />
      <ellipse class="tz-pale" cx="4.2" cy="8.6" rx="0.36" ry="0.42" />
    {/if}
    {#each sky.beacons as [x, y], i (i)}<circle class="tz-beacon" cx={x} cy={y} r="0.38" style="animation-delay:{-(0.45 * i) - 0.3 * n}s" />{/each}
  </g>
  <g class="tz-windows">
    {#each sky.windows as [x, y, at], i (i)}<rect x={x - 0.3} y={y - 0.3} width="0.6" height="0.6" rx="0.1" data-at={at} />{/each}
  </g>
  <g class="tz-rain">
    {#each RAIN as [x, delay], i (i)}<line x1={x} y1="0" x2={x - 0.5} y2="1.8" style="animation-delay:{delay}s" />{/each}
  </g>
  <g class="tz-snowfall">
    {#each SNOW as [x, delay, k], i (i)}<circle cx={x} cy="0" r="0.34" style="animation-delay:{delay}s;--k:{k}" />{/each}
  </g>
  <g class="tz-storm" style="animation-delay:{-(2.3 * n)}s">
    <rect class="tz-flash" width="32" height="32" style="animation-delay:{-(2.3 * n)}s" />
    <path class="tz-bolt" d="M19 6 16.6 12h2l-2.4 6.4 4.6-8h-2.2L20.4 6Z" style="animation-delay:{-(2.3 * n)}s" />
  </g>
  <rect class="tz-grain" width="32" height="32" filter="url(#{grain})" />
</svg>
