<script lang="ts">
  // In your app: import { Detent, DetentText } from '@hayderkg/detent-svelte'
  import { Detent, DetentText } from '../../src/lib'

  const HOME = { name: 'Madrid', tz: 'Europe/Madrid' }
  const CITIES = [
    HOME,
    { name: 'New York', tz: 'America/New_York' },
    { name: 'London', tz: 'Europe/London' },
    { name: 'Tokyo', tz: 'Asia/Tokyo' },
    { name: 'Sydney', tz: 'Australia/Sydney' },
    { name: 'Los Angeles', tz: 'America/Los_Angeles' },
    { name: 'Dubai', tz: 'Asia/Dubai' },
    { name: 'Singapore', tz: 'Asia/Singapore' },
  ]
  const QUARTERS = Array.from({ length: 96 }, (_, i) => i)
  const MIN = 60_000

  /** Wall-clock parts of an instant in a zone. */
  const parts = (at: number, tz: string) => {
    const p = Object.fromEntries(
      new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' })
        .formatToParts(at)
        .map((x) => [x.type, +x.value]),
    ) as Record<'year' | 'month' | 'day' | 'hour' | 'minute', number>
    const local = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute)
    return { ...p, day0: Date.UTC(p.year, p.month - 1, p.day), offset: Math.round((local - Math.floor(at / MIN) * MIN) / MIN) }
  }

  // The scrub covers the home zone's day, in quarter hours, starting from now.
  const start = Math.floor(Date.now() / (15 * MIN)) * 15 * MIN
  const h0 = parts(start, HOME.tz)
  const midnight = Date.UTC(h0.year, h0.month - 1, h0.day) - h0.offset * MIN
  const nowQuarter = Math.round((start - midnight) / (15 * MIN))

  let quarter = $state(nowQuarter)
  let h24 = $state(false)
  let more = $state(false)
  const instant = $derived(midnight + quarter * 15 * MIN)
  const home = $derived(parts(instant, HOME.tz))
  const shown = $derived(more ? CITIES : CITIES.slice(0, 5))

  const money = (n: number) => (n < 0 ? '−' : '+') + Math.abs(n)
  const hhmm = (p: { hour: number; minute: number }) => {
    const mm = String(p.minute).padStart(2, '0')
    return h24 ? { time: `${String(p.hour).padStart(2, '0')}:${mm}`, ap: '' } : { time: `${p.hour % 12 || 12}:${mm}`, ap: p.hour < 12 ? 'AM' : 'PM' }
  }
  const city = (c: (typeof CITIES)[number]) => {
    const p = parts(instant, c.tz)
    const rel = (p.offset - home.offset) / 60
    const status = p.hour >= 22 || p.hour < 7 ? 'Asleep' : p.hour >= 9 && p.hour < 18 ? 'Working' : 'Free'
    const gmt = p.offset / 60
    const days = Math.round((p.day0 - home.day0) / 864e5)
    return {
      ...c,
      ...hhmm(p),
      hour: p.hour + p.minute / 60,
      sub: c === HOME ? `GMT${money(gmt)}` : `${money(rel)} h`,
      status,
      day: days < 0 ? 'Yesterday' : days > 0 ? 'Tomorrow' : 'Today',
    }
  }
  const rows = $derived(shown.map(city))

  // --- the sky, from the hour of day -------------------------------------------------
  const STOPS: [number, [number, number, number]][] = [
    [0, [11, 14, 40]], [5, [30, 28, 70]], [6.5, [226, 130, 130]], [9, [110, 175, 235]],
    [15, [90, 165, 232]], [18, [232, 140, 96]], [19.5, [60, 40, 90]], [24, [11, 14, 40]],
  ]
  const sky = (h: number) => {
    h = ((h % 24) + 24) % 24
    const i = STOPS.findIndex(([t]) => t > h)
    const [t0, a] = STOPS[i - 1]!
    const [t1, b] = STOPS[i]!
    const k = (h - t0) / (t1 - t0)
    return `rgb(${a.map((v, j) => Math.round(v + (b[j]! - v) * k)).join(',')})`
  }
  const skyline = (name: string) => {
    let s = [...name].reduce((n, c) => n + c.charCodeAt(0), 7)
    return Array.from({ length: 7 }, (_, i) => ({ x: 3 + i * 4, h: 7 + ((s = (s * 31 + 11) % 97) % 12) }))
  }
  /** Sun by day, moon by night, each on an arc across the sky. */
  const body = (h: number) => {
    const day = h >= 6 && h < 18
    const t = day ? (h - 6) / 12 : ((h + 6) % 24) / 12
    return { day, x: 4 + t * 24, y: 22 - Math.sin(t * Math.PI) * 16 }
  }

  // The strip under the ruler shows the sky across the hours around the needle.
  const strip = $derived(
    `linear-gradient(90deg, transparent, ${[-4, -2, 0, 2, 4].map((d, i) => `${sky(home.hour + home.minute / 60 + d)} ${10 + i * 20}%`).join(',')}, transparent)`,
  )
  const dateLine = $derived(new Intl.DateTimeFormat('en-US', { timeZone: HOME.tz, weekday: 'short', day: 'numeric', month: 'short' }).format(instant).replace(/^(\w+),? (.*)$/, '$1 $2'))
  const tickLabel = (i: number) => {
    if (i % 12) return ''
    const h = i / 4
    return h24 ? String(h).padStart(2, '0') : `${h % 12 || 12}${h < 12 ? 'a' : 'p'}`
  }
</script>

<div class="tz">
  <header class="head">
    <div>
      <div class="label">YOUR TIME · {HOME.name.toUpperCase()}</div>
      <div class="date">{dateLine}</div>
    </div>
    <span class="note" aria-hidden="true">give it a slow drag
      <svg width="26" height="36" viewBox="0 0 36 50" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 4c14 6 22 18 24 38" /><path d="M20 36l8 8 6-10" /></svg>
    </span>
    <div class="seg" role="group" aria-label="Clock format">
      <button type="button" class:on={!h24} onclick={() => (h24 = false)}>12h</button>
      <button type="button" class:on={h24} onclick={() => (h24 = true)}>24h</button>
    </div>
    {#if quarter !== nowQuarter}<button type="button" class="now" onclick={() => (quarter = nowQuarter)}>Now</button>{/if}
  </header>

  <div class="scrub">
    <Detent
      items={QUARTERS}
      bind:value={quarter}
      label="Your time"
      loop
      orientation="horizontal"
      itemHeight={10}
      visibleCount={39}
      height={52}
      width="100%"
      highlight={false}
      magnify={false}
      perspective={0}
      fade={0.06}
      dim={0}
      mask="none"
      getLabel={(q) => `${String(Math.floor(q / 4)).padStart(2, '0')}:${String((q % 4) * 15).padStart(2, '0')}`}
    >
      {#snippet item(q: number)}
        <span class="tick" class:hour={q % 4 === 0}><span class="lbl">{tickLabel(q)}</span><i></i></span>
      {/snippet}
    </Detent>
    <div class="needle"></div>
    <div class="strip" style:background={strip}></div>
  </div>

  <ul class="list">
    {#each rows as r (r.name)}
      <li class:home={r.name === HOME.name}>
        <svg class="avatar" width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
          <clipPath id="c-{r.name.replace(/\W/g, '')}"><circle cx="16" cy="16" r="15.5" /></clipPath>
          <g clip-path="url(#c-{r.name.replace(/\W/g, '')})">
            <rect width="32" height="32" fill={sky(r.hour)} />
            {#if body(r.hour).day}
              <circle cx={body(r.hour).x} cy={body(r.hour).y} r="3.4" fill="#fff6c8" />
            {:else}
              <circle cx={body(r.hour).x} cy={body(r.hour).y} r="3" fill="#e9eaf5" />
            {/if}
            {#each skyline(r.name) as b}<rect x={b.x} y={32 - b.h} width="3.2" height={b.h} fill="rgb(20 20 30 / 0.78)" />{/each}
          </g>
          <circle cx="16" cy="16" r="15.5" fill="none" stroke="rgb(0 0 0 / 0.12)" />
        </svg>
        <div class="who">
          <b>{r.name}{#if r.name === HOME.name} <span class="you">YOU</span>{/if}</b>
          <small>{r.sub} · <span class={r.status.toLowerCase()}>{r.status}</span></small>
        </div>
        <div class="when">
          <span class="clock"><DetentText text={r.time} as="span" />{#if r.ap}<small class="ap">{r.ap}</small>{/if}</span>
          <small>{r.day}</small>
        </div>
      </li>
    {/each}
  </ul>
  <button type="button" class="more" onclick={() => (more = !more)}>{more ? 'View less −' : 'View more +'}</button>
</div>

<style>
  .tz { width: 100%; max-width: 486px; margin: 0 auto; padding: 18px 0 14px; font-size: 13px; }
  .head { position: relative; display: flex; align-items: flex-start; justify-content: space-between; padding: 0 22px; }
  .label { font-size: 11px; letter-spacing: 0.06em; color: #6b6b6b; }
  .date { margin-top: 2px; font-size: 17px; font-weight: 600; }
  .note { position: absolute; left: 200px; top: -2px; display: flex; flex-direction: column; font: 600 17px/1 'Caveat', 'Bradley Hand', 'Segoe Script', cursive; color: #d93025; transform: rotate(-4deg); }
  .note svg { margin: 2px 0 0 78px; transform: scale(0.75); transform-origin: top left; }
  .seg { display: flex; padding: 2px; border-radius: 999px; background: rgb(128 128 128 / 0.14); }
  .seg button { border: 0; padding: 3px 10px; border-radius: 999px; background: none; font: inherit; color: #888; cursor: pointer; }
  .seg button.on { background: #fff; color: #111; box-shadow: 0 1px 2px rgb(0 0 0 / 0.12); }
  .now { position: absolute; left: 150px; margin-top: 0; top: 3px; border: 0; padding: 2px 10px; border-radius: 999px; background: rgb(0 0 0 / 0.06); font: inherit; cursor: pointer; }
  .scrub { position: relative; margin: 8px 24px 0; font-size: 20px; }
  .tick { position: relative; display: block; width: 10px; height: 52px; }
  .tick .lbl { position: absolute; left: 50%; top: 4px; translate: -50% 0; font-size: 9.5px; color: #6b6b6b; white-space: nowrap; }
  .tick i { position: absolute; left: 50%; bottom: 8px; translate: -50% 0; width: 1px; height: 5.7px; background: #0a0a0a; opacity: 0.28; }
  .tick.hour i { width: 1.3px; height: 10.6px; opacity: 0.75; }
  .needle { position: absolute; left: 50%; top: 20px; width: 2px; height: 35px; translate: -1px 0; background: #0a0a0a; border-radius: 1px; pointer-events: none; }
  .strip { height: 4px; margin-top: -4px; border-radius: 4px; pointer-events: none; position: relative; }
  .list { list-style: none; margin: 14px 22px 0; padding: 6px; border-radius: 20px; background: linear-gradient(rgb(128 128 128 / 0.1), rgb(128 128 128 / 0.07)); }
  li { display: grid; grid-template-columns: 32px 1fr auto; gap: 12px; align-items: center; padding: 8px 8px; border-radius: 14px; }
  li.home { background: rgb(210 120 120 / 0.1); }
  .who { display: grid; gap: 1px; }
  .who b { font-size: 15px; font-weight: 600; }
  .you { display: inline-block; margin-left: 4px; padding: 1px 6px; border-radius: 5px; background: #0a0a0a; color: #fff; font-size: 10px; letter-spacing: 0.04em; }
  small { color: #6b6b6b; font-size: 12px; }
  .working { color: #2d8a4e; }
  .when { display: grid; justify-items: end; gap: 1px; }
  .clock { font: 600 17px ui-monospace, 'SF Mono', Menlo, monospace; display: inline-flex; align-items: baseline; gap: 3px; }
  .ap { font: 600 9px ui-monospace, monospace; color: #444; }
  .more { display: block; margin: 8px auto 0; border: 0; background: none; font: inherit; color: #555; cursor: pointer; }
  @media (prefers-color-scheme: dark) {
    .label, small, .tick .lbl { color: #999; } .seg button.on { background: #333; color: #fff; } .ap { color: #bbb; }
    .tick i, .needle { background: #eee; } .you { background: #eee; color: #111; } .more { color: #aaa; }
  }
</style>
