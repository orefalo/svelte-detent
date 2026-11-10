<script lang="ts">
  // In your app: import { DetentText } from 'svelte-detent'
  import { onMount } from 'svelte'
  import { DetentText } from '../../src/lib'
  import Flaps from '../site/Flaps.svelte'

  interface Flight { at: number; to: string; code: string; gate: string; delayed?: boolean }
  const cities = ['LISBON', 'REYKJAVIK', 'TOKYO', 'NEW YORK', 'MARRAKECH', 'OSLO', 'SINGAPORE', 'ATHENS', 'VANCOUVER', 'NAIROBI', 'HELSINKI', 'MEXICO CITY', 'SEOUL', 'CAPE TOWN', 'SYDNEY', 'BUENOS AIRES']
  const clock = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
  const status = (f: Flight, now: number) => {
    const left = f.at - now
    return left <= 0 ? 'DEPARTED' : left <= 10 ? 'FINAL CALL' : left <= 30 ? 'BOARDING' : f.delayed ? 'DELAYED' : 'ON TIME'
  }

  // A small seeded simulation, so the board runs the same way every time.
  let seed = 7
  const rnd = () => ((seed = Math.imul(seed ^ (seed >>> 15), 0x85ebca6b) ^ Math.imul(seed ^ (seed >>> 13), 0xc2b2ae35)) >>> 0) / 0x100000000
  const flight = (at: number, k: number): Flight => ({
    at,
    to: cities[k % cities.length]!,
    code: `DT ${100 + Math.floor(900 * rnd())}`,
    gate: `${'ABC'[Math.floor(3 * rnd())]}${1 + Math.floor(24 * rnd())}`,
  })
  let at = 552
  let now = $state(540)
  let next = 5
  let flights = $state<Flight[]>(Array.from({ length: 5 }, (_, i) => flight((at += 6 + Math.floor(12 * rnd())), i)))

  /** The clock moves on 2 to 4 minutes; a departed flight leaves and a new one joins; now and then one is delayed or changes gate. */
  function advance() {
    const t = now + 2 + Math.floor(3 * rnd())
    let list = flights.map((f) => ({ ...f }))
    if (status(list[0]!, now) === 'DEPARTED') {
      list = list.slice(1)
      list.push(flight(list.at(-1)!.at + 8 + Math.floor(14 * rnd()), next++))
    }
    const open = list.filter((f) => f.at - t > 40 && !f.delayed)
    const roll = rnd()
    if (open.length && roll < 0.22) {
      const f = open[Math.floor(rnd() * open.length)]!
      f.at += 15
      f.delayed = true
    } else if (open.length && roll < 0.36) {
      open[Math.floor(rnd() * open.length)]!.gate = `${'ABC'[Math.floor(3 * rnd())]}${1 + Math.floor(24 * rnd())}`
    }
    now = t
    flights = list
  }

  // The clock runs on its own only while the board is on screen.
  let root = $state<HTMLElement | null>(null)
  let visible = $state(false)
  onMount(() => {
    let inView = false
    const update = () => (visible = inView && !document.hidden)
    const io = new IntersectionObserver(([e]) => ((inView = !!e?.isIntersecting), update()))
    if (root) io.observe(root)
    document.addEventListener('visibilitychange', update)
    return () => (io.disconnect(), document.removeEventListener('visibilitychange', update))
  })
  $effect(() => {
    if (!visible) return
    const id = setInterval(advance, 2600)
    return () => clearInterval(id)
  })
</script>

<div class="db" bind:this={root}>
  <div class="db-panel">
    <div class="db-head">
      <span class="db-title">
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M21 15.5v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V8.5l-8 5v2l8-2.5V18l-2 1.5V21l3.5-1 3.5 1v-1.5L13 18v-5l8 2.5Z" /></svg>
        Departures
      </span>
      <span class="db-clock" aria-label="Time {clock(now)}"><DetentText text={clock(now)} /></span>
    </div>
    <table aria-label="Departures">
      <thead>
        <tr><th scope="col">Time</th><th scope="col">Destination</th><th scope="col" class="db-code">Flight</th><th scope="col" class="db-gate">Gate</th><th scope="col">Status</th></tr>
      </thead>
      <tbody>
        {#each flights as f, i (i)}
          {@const st = status(f, now)}
          <!-- Rows turn one after another (90 ms apart), and within a row each character a little later. -->
          <tr>
            <td class="db-time"><Flaps text={clock(f.at)} width={5} delay={90 * i} /></td>
            <td class="db-to"><Flaps text={f.to} width={12} delay={90 * i} /></td>
            <td class="db-code"><Flaps text={f.code} width={6} delay={90 * i} /></td>
            <td class="db-gate"><Flaps text={f.gate} width={3} delay={90 * i} /></td>
            <td class="db-status" data-status={st}><Flaps text={st} width={10} delay={90 * i} /></td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  <button type="button" class="db-next" onclick={advance}>Advance the clock</button>
</div>

<style>
  .db { --db-ease: cubic-bezier(0.23, 1, 0.32, 1); width: 100%; max-width: 560px; display: grid; justify-items: center; gap: 16px; container-type: inline-size; }
  .db-panel { max-width: 100%; box-sizing: border-box; padding: 14px 14px 16px; border-radius: 18px; background: linear-gradient(#17181c, #0d0e11); color: #f1f1ef;
    box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.06), 0 16px 34px -14px rgb(0 0 0 / 0.55), 0 2px 4px rgb(0 0 0 / 0.15); }
  .db-head { display: flex; align-items: center; justify-content: space-between; padding: 2px 4px 12px; }
  .db-title { display: inline-flex; align-items: center; gap: 8px; font: 600 13px/1 system-ui, sans-serif; letter-spacing: 0.14em; text-transform: uppercase; color: #f6c343; }
  .db-title svg { fill: currentColor; transform: rotate(45deg); }
  .db-clock { font: 500 15px/1 'Geist Mono', ui-monospace, monospace; font-variant-numeric: tabular-nums; color: #f6c343; letter-spacing: 0.06em; }
  table { width: 100%; border-collapse: separate; border-spacing: 6px 5px; margin: -5px -6px; table-layout: auto; }
  th { padding: 0 0 2px; border: 0; text-align: left; font: 600 9.5px/1 system-ui, sans-serif; letter-spacing: 0.14em; text-transform: uppercase; color: rgb(255 255 255 / 0.4); background: none; }
  td { padding: 0; border: 0; background: none; vertical-align: middle; }
  .db-status { transition: color 200ms var(--db-ease); }
  .db-status[data-status='BOARDING'] { color: #5fdc8f; }
  .db-status[data-status='FINAL CALL'] { color: #ff6b5b; }
  .db-status[data-status='DELAYED'] { color: #f6c343; }
  .db-status[data-status='DEPARTED'] { color: rgb(255 255 255 / 0.38); }
  .db-next { height: 32px; padding: 0 14px; border-radius: 99px; border: 1px solid rgb(128 128 128 / 0.3); background: transparent; color: inherit;
    font: 13px/1 system-ui, sans-serif; cursor: pointer; -webkit-tap-highlight-color: transparent; transition: background-color 150ms var(--db-ease), transform 150ms var(--db-ease); }
  .db-next:active { transform: scale(0.96); }
  @media (hover: hover) { .db-next:hover { background: rgb(128 128 128 / 0.1); } }
  /* Narrow containers: drop the flight number, then the gate, and set the type smaller. */
  @container (max-width: 470px) { .db-code { display: none; } }
  @container (max-width: 360px) { .db-gate { display: none; } .db-panel { padding: 12px 10px 14px; } table { border-spacing: 4px 4px; margin: -4px; } }
  @media (prefers-reduced-motion: reduce) { .db * { transition: none !important; } }
</style>
