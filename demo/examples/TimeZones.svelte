<script lang="ts">
  // In your app: import { Detent, DetentText } from 'svelte-detent'
  import { ticks } from '../../src/lib'
  import { onMount, untrack } from 'svelte'
  import { Detent, DetentText } from '../../src/lib'
  import {
    CITIES, HOME, MORE, NEARBY, QUARTERS, clockFace, dayStrip, homeTint, moonPath, moonPhase, paintSky, weatherAt, weatherUrl, zoneParts, zonedDate,
    type Weather,
  } from '../site/TzData.svelte'
  import TzSky from '../site/TzSky.svelte'
  import { css, theme } from '../site/TzStyles.svelte'

  const uid = $props.id()
  const grain = `${uid}-grain`
  const tick = ticks({ sound: { volume: 0.2 }, haptics: true })

  // --- the day: Madrid's, from today, scrubbed in quarter hours ----------------------------------------------------
  const init = (() => {
    const z = zoneParts(HOME.tz, new Date())
    const [y, m, d] = z.date.split('-').map(Number) as [number, number, number]
    return { y, m, d, q: Math.floor(4 * z.hour) }
  })()
  /** The scrub position (a quarter of the day) and how many days the scrub has wrapped past today. */
  let quarter = $state(init.q)
  let dayShift = $state(0)
  /** Which way the rolling labels turn: the way the scrub moves. */
  let direction = $state<'up' | 'down'>('up')
  /** "Now" jumps; the day shift must not follow that jump through midnight. */
  let jumped = false
  let lastQuarter = init.q
  /** The wheel's position in hours, every frame (the skies move between ticks). */
  let liveHour = init.q / 4
  let expanded = $state(false)

  // --- 12 / 24 hour, remembered --------------------------------------------------------------------------------------
  let h12 = $state(
    (() => {
      try {
        const saved = localStorage.getItem('detent-tz-clock')
        if (saved) return saved === '12'
      } catch {
        /* storage unavailable */
      }
      return new Intl.DateTimeFormat(undefined, { hour: 'numeric' }).resolvedOptions().hourCycle?.startsWith('h1') ?? false
    })(),
  )
  function setClock(value: boolean) {
    h12 = value
    try {
      localStorage.setItem('detent-tz-clock', value ? '12' : '24')
    } catch {
      /* storage unavailable */
    }
  }

  // --- derived: the instant, each city's wall clock ------------------------------------------------------------------
  const dayStart = $derived(zonedDate(HOME.tz, init.y, init.m, init.d + dayShift, 0).getTime())
  const at = $derived(zonedDate(HOME.tz, init.y, init.m, init.d + dayShift, 15 * quarter))
  const home = $derived(zoneParts(HOME.tz, at))
  const rows = $derived([{ ...HOME, ...home, me: true }, ...[...NEARBY, ...MORE].map((c) => ({ ...c, ...zoneParts(c.tz, at), me: false }))])
  const atNow = $derived(dayShift === 0 && quarter === init.q)
  const phase = $derived(moonPath(moonPhase(at.getTime())))
  const dateLabel = $derived(at.toLocaleDateString('en-GB', { timeZone: HOME.tz, weekday: 'short', day: 'numeric', month: 'short' }))
  const sunDay = $derived(dayStrip(dayStart, HOME))

  const statusOf = (hour: number) => (hour >= 9 && hour < 18 ? 'Working' : hour >= 23 || hour < 7 ? 'Asleep' : 'Free')
  const offsetLabel = (minutes: number) => {
    if (!minutes) return 'Same time'
    const h = Math.floor(Math.abs(minutes) / 60)
    const m = Math.abs(minutes) % 60
    return `${minutes > 0 ? '+' : '−'}${h}${m ? `:${String(m).padStart(2, '0')}` : ''} h`
  }

  // --- the weather: hourly, for every city, cached for half an hour -------------------------------------------------
  let weather = $state.raw<Weather[]>()
  onMount(() => {
    const KEY = 'detent-tz-weather'
    try {
      const cached = JSON.parse(sessionStorage.getItem(KEY) ?? 'null')
      if (cached && Date.now() - cached.at < 18e5) {
        weather = cached.w
        return
      }
    } catch {
      /* no cache */
    }
    const controller = new AbortController()
    fetch(weatherUrl(CITIES), { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: { hourly: { time: number[]; weather_code: number[]; cloud_cover: number[]; precipitation: number[] } }[]) => {
        const w = data.map(({ hourly }) => ({ t0: 1000 * hourly.time[0]!, code: hourly.weather_code, cloud: hourly.cloud_cover, rain: hourly.precipitation }))
        weather = w
        try {
          sessionStorage.setItem(KEY, JSON.stringify({ at: Date.now(), w }))
        } catch {
          /* storage unavailable */
        }
      })
      .catch(() => {
        /* no weather: the skies are just the sun and moon */
      })
    return () => controller.abort()
  })

  // --- painting the skies: straight to the DOM, every frame --------------------------------------------------------
  let root = $state<HTMLElement | null>(null)
  let strip = $state<HTMLElement | null>(null)
  let stripWidth = 0
  function redraw() {
    if (!root) return
    const instant = dayStart + 36e5 * liveHour
    // The first five skies always; the rest once the list is open.
    for (const el of root.querySelectorAll<SVGElement>('.tz-sky')) {
      const i = Number(el.dataset.w)
      if (i < 5 || expanded) paintSky(el, instant, weather?.[i])
    }
    root.style.setProperty('--tz-tint', homeTint(instant))
    if (strip) strip.style.backgroundPositionX = `${(stripWidth / 2 - 40 * liveHour).toFixed(2)}px`
  }
  // After every render, as the original does in a layout effect.
  $effect(() => {
    void [dayStart, expanded, weather, rows, phase, strip]
    untrack(redraw)
  })
  onMount(() => {
    if (!strip) return
    const el = strip
    stripWidth = el.clientWidth
    const ro = new ResizeObserver(([entry]) => {
      if (!entry) return
      stripWidth = entry.contentRect.width
      el.style.backgroundPositionX = `${(stripWidth / 2 - 40 * liveHour).toFixed(2)}px`
    })
    ro.observe(el)
    return () => ro.disconnect()
  })

  // --- the scrub -----------------------------------------------------------------------------------------------------
  function onQuarter(q: number) {
    const previous = lastQuarter
    lastQuarter = q
    // Wrapping past midnight moves to the next (or previous) day, unless "Now" made the jump.
    if (!jumped) {
      if (previous >= 72 && q < 24) dayShift++
      else if (previous < 24 && q >= 72) dayShift--
    }
    const step = ((q - previous + 144) % 96) - 48
    if (step) direction = step > 0 ? 'up' : 'down'
  }
  function goNow() {
    jumped = quarter !== init.q
    direction = dayShift > 0 || (dayShift === 0 && quarter > init.q) ? 'down' : 'up'
    dayShift = 0
    quarter = init.q
  }
  const tickLabel = (q: number) => (q % 12 ? '' : h12 ? `${(q / 4) % 12 || 12}${q < 48 ? 'a' : 'p'}` : String(q / 4).padStart(2, '0'))
  const quarterLabel = (q: number) => {
    const f = clockFace(`${String(Math.floor(q / 4)).padStart(2, '0')}:${String((q % 4) * 15).padStart(2, '0')}`, h12)
    return f.half ? `${f.time} ${f.half}` : f.time
  }

  // --- the lens: a larger sky that follows the pointer over a city's sky -------------------------------------------
  let lens = $state<HTMLElement | null>(null)
  const hover = { x: 0, y: 0, sky: null as Element | null, raf: 0 }
  function moveLens() {
    hover.raf = 0
    if (!lens || !hover.sky || !root) return
    const sky = hover.sky.getBoundingClientRect()
    const box = root.getBoundingClientRect()
    const cx = sky.left + sky.width / 2
    const cy = sky.top + sky.height / 2
    // It leans toward the pointer: 35% of the way from the little sky's centre.
    lens.style.translate = `${(cx + (hover.x - cx) * 0.35 - box.left).toFixed(1)}px ${(cy + (hover.y - cy) * 0.35 - box.top).toFixed(1)}px`
    lens.setAttribute('data-on', '')
  }
  function onPointerMove(e: PointerEvent) {
    if (!lens || !root || e.pointerType !== 'mouse') return
    const sky = (e.target as Element).closest('.tz-sky')
    if (!sky) {
      hover.sky = null
      lens.removeAttribute('data-on')
      return
    }
    if (sky !== hover.sky) {
      hover.sky = sky
      lens.querySelector('use')!.setAttribute('href', `#${sky.id}`)
      if (!lens.hasAttribute('data-on')) {
        // Appearing: it grows out of the little sky, so start there without a slide.
        const r = sky.getBoundingClientRect()
        const box = root.getBoundingClientRect()
        lens.style.transition = 'none'
        lens.style.translate = `${(r.left + r.width / 2 - box.left).toFixed(1)}px ${(r.top + r.height / 2 - box.top).toFixed(1)}px`
        void lens.offsetWidth
        lens.style.transition = ''
      }
    }
    hover.x = e.clientX
    hover.y = e.clientY
    hover.raf ||= requestAnimationFrame(moveLens)
  }
  function onPointerLeave() {
    hover.sky = null
    lens?.removeAttribute('data-on')
  }
</script>

{#snippet city(r: (typeof rows)[number], n: number)}
  {@const state = statusOf(r.hour)}
  {@const face = clockFace(r.time, h12)}
  {@const day = r.date === home.date ? 'Today' : r.date > home.date ? 'Tomorrow' : 'Yesterday'}
  {@const label = weatherAt(weather?.[n], at.getTime())?.label}
  <li data-state={state} data-me={r.me ? '' : undefined}>
    <TzSky city={CITIES[n]!} utcOffset={r.offset} {phase} {grain} index={n} />
    <span class="tz-city">
      <span class="tz-name">{r.name}{#if r.me}<span class="tz-you">You</span>{/if}</span>
      <span class="tz-meta">{r.me ? r.gmt : offsetLabel(r.offset - home.offset)} · <DetentText rollDirection={direction} snapDuration={320} text={state} /></span>
    </span>
    <span class="tz-when">
      <span class="tz-clockface">
        <DetentText class="tz-time" rollDirection={direction} snapDuration={320} text={face.time} />{#if face.half}<DetentText class="tz-half" rollDirection={direction} snapDuration={320} text={face.half} />{/if}
      </span>
      <DetentText class="tz-day" rollDirection={direction} snapDuration={320} text={day} />
    </span>
    <span class="tz-sr">{r.name}: {face.half ? `${face.time} ${face.half}` : face.time}, {day.toLowerCase()}, {state.toLowerCase()}{label ? `, ${label}` : ''}</span>
  </li>
{/snippet}

<div class="tz" bind:this={root}>
  {@html `<style>${theme}${css}</style>`}
  <!-- The film grain on every sky. -->
  <svg width="0" height="0" style="position:absolute" aria-hidden="true">
    <filter id={grain} x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="1.15" numOctaves="2" seed="7" stitchTiles="stitch" />
      <feColorMatrix type="saturate" values="0" />
    </filter>
  </svg>

  <div class="tz-head">
    <div>
      <span class="tz-label">Your time · {HOME.name}</span>
      <span class="tz-dateline">
        <span class="tz-date"><DetentText rollDirection={direction} text={dateLabel} /></span>
        <button type="button" class="tz-now" onclick={goNow} data-hidden={atNow ? '' : undefined} tabindex={atNow ? -1 : undefined} aria-hidden={atNow ? true : undefined}>
          <svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true"><path d="M3 8a5 5 0 1 0 1.6-3.7M3 2.5v2.8h2.8" /></svg>Now
        </button>
      </span>
    </div>
    <div class="tz-clock" role="group" aria-label="Clock" data-h12={h12 ? '' : undefined}>
      <span class="tz-clock-thumb" aria-hidden="true"></span>
      <button type="button" aria-pressed={h12} onclick={() => setClock(true)}>12h</button>
      <button type="button" aria-pressed={!h12} onclick={() => setClock(false)}>24h</button>
    </div>
  </div>

  <div class="tz-scrub">
    <span class="tz-needle" aria-hidden="true"></span>
    <span class="tz-strip" bind:this={strip} aria-hidden="true" style:background-image={sunDay.strip}></span>
    <Detent
      items={QUARTERS}
      bind:value={quarter}
      onChange={onQuarter}
      onSettle={() => (jumped = false)}
      onScrollProgress={(rowsFromStart) => {
        liveHour = (((rowsFromStart % 96) + 96) % 96) / 4
        redraw()
      }}
      changeOn="tick"
      onTick={tick}
      loop
      getLabel={quarterLabel}
      label="Your time"
      orientation="horizontal"
      itemHeight={10}
      visibleCount={33}
      height={52}
      curvature={0.3}
      fade={0.06}
      dim={0}
      magnify={false}
      indicator={{ shape: 'none' }}
      style="width:100%"
    >
      {#snippet item(q: number)}
        <span class="tz-tick" data-hour={q % 4 === 0 ? '' : undefined}>
          <span>
            {#if q === sunDay.sunrise}<svg class="tz-mark" viewBox="0 0 10 10" width="8" height="8" aria-hidden="true"><path d="M2.2 7a2.8 2.8 0 0 1 5.6 0M1 7h8M5 1.4v1.4M1.8 3.3l1 1M8.2 3.3l-1 1" /></svg>
            {:else if q === sunDay.sunset}<svg class="tz-mark" viewBox="0 0 10 10" width="8" height="8" aria-hidden="true"><path d="M6.6 2.2a3.2 3.2 0 1 0 1.7 4.6 2.6 2.6 0 0 1-1.7-4.6Z" /></svg>{/if}{tickLabel(q)}
          </span>
          <i></i>
        </span>
      {/snippet}
    </Detent>
  </div>

  <div class="tz-lens" bind:this={lens} aria-hidden="true"><svg viewBox="0 0 32 32"><use /></svg></div>

  <div class="tz-list" onpointermove={onPointerMove} onpointerleave={onPointerLeave} role="presentation">
    <ul aria-label="Cities">
      {#each rows.slice(0, 5) as r, i (r.tz)}{@render city(r, i)}{/each}
    </ul>
    <div class="tz-more" data-open={expanded ? '' : undefined} inert={!expanded}>
      <div>
        <ul aria-label="More cities">
          {#each rows.slice(5) as r, i (r.tz)}{@render city(r, i + 5)}{/each}
        </ul>
      </div>
    </div>
    <button type="button" class="tz-viewmore" aria-expanded={expanded} onclick={() => (expanded = !expanded)}>
      <DetentText text={expanded ? 'View less' : 'View more'} />
      <svg viewBox="0 0 12 12" width="11" height="11" aria-hidden="true"><path d="M2.5 6h7" /><path class="tz-plus" d="M6 2.5v7" /></svg>
    </button>
  </div>
</div>
