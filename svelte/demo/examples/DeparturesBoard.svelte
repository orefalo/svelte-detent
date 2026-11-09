<script lang="ts">
  // In your app: import { DetentText } from '@hayderkg/detent-svelte'
  import { DetentText } from '../../src/lib'

  type Status = 'ON TIME' | 'DELAYED' | 'BOARDING' | 'FINAL CALL' | 'DEPARTED'
  interface Flight { time: number; to: string; code: string; gate: string; status: Status }
  const f = (time: string, to: string, code: string, gate: string, status: Status = 'ON TIME'): Flight => {
    const [h, m] = time.split(':').map(Number)
    return { time: h! * 60 + m!, to, code, gate, status }
  }

  let clock = $state(9 * 60 + 3)
  let step = 0
  let rows = $state<Flight[]>([
    f('09:29', 'LISBON', 'DT 514', 'C18', 'BOARDING'),
    f('09:43', 'REYKJAVIK', 'DT 266', 'B2'),
    f('09:53', 'TOKYO', 'DT 291', 'B13'),
    f('10:10', 'MARRAKECH', 'DT 903', 'B19'),
    f('10:17', 'NEW YORK', 'DT 428', 'C10', 'DELAYED'),
  ])
  const queue = [
    f('10:51', 'OSLO', 'DT 155', 'A23'),
    f('11:16', 'SINGAPORE', 'DT 211', 'B17'),
    f('11:28', 'ATHENS', 'DT 207', 'A18'),
    f('11:44', 'VANCOUVER', 'DT 257', 'A15'),
    f('12:18', 'NAIROBI', 'DT 681', 'C8'),
    f('13:09', 'HELSINKI', 'DT 289', 'A21'),
    f('13:35', 'SANTIAGO', 'DT 340', 'B6'),
    f('14:02', 'MUMBAI', 'DT 118', 'C21'),
  ]
  let upcoming = 0

  const clockText = (t: number) => `${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`
  /** A stable pseudo-random number in [0, 1) from a string, so the demo plays the same way every time. */
  const noise = (s: string) => {
    let h = 2166136261
    for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
    return ((h >>> 0) % 1000) / 1000
  }

  /** One tick of the board: time passes, rows move through their statuses, departed rows leave. */
  function advance() {
    clock += [6, 6, 4, 6, 2, 5, 5, 4, 8][step++ % 9]!
    const next: Flight[] = []
    for (const r of rows) {
      if (r.status === 'DEPARTED') {
        next.push(queue[upcoming++ % queue.length]!)
        continue
      }
      const left = r.time - clock
      let { status, time } = r
      if (left <= 0) status = 'DEPARTED'
      else if (left <= 6) status = 'FINAL CALL'
      else if (left <= 20) status = 'BOARDING'
      else if (status === 'ON TIME' && noise(r.code + clock) < 0.2) (status = 'DELAYED'), (time += 15)
      next.push({ ...r, status, time })
    }
    rows = next.sort((a, b) => a.time - b.time)
  }

  const columns = [
    { key: 'time', title: 'Time', width: 5 },
    { key: 'to', title: 'Destination', width: 12 },
    { key: 'code', title: 'Flight', width: 6 },
    { key: 'gate', title: 'Gate', width: 3 },
    { key: 'status', title: 'Status', width: 10 },
  ] as const
  const cell = (r: Flight, key: (typeof columns)[number]['key']) => (key === 'time' ? clockText(r.time) : r[key])
  /** One character per tile, padded with blank tiles to the width of the column. */
  const tiles = (text: string, width: number) => Array.from(text.padEnd(width).slice(0, width))
</script>

<div class="wrap">
  <div class="panel">
    <div class="head">
      <span class="title">
        <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path fill="currentColor" d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" /></svg>
        Departures
      </span>
      <DetentText text={clockText(clock)} class="clock" snapDuration={450} />
    </div>
    <table>
      <thead>
        <tr>{#each columns as c (c.key)}<th class={c.key}>{c.title}</th>{/each}</tr>
      </thead>
      <tbody>
        {#each rows as r, i (i)}
          <tr>
            {#each columns as c (c.key)}
              <td class="{c.key} {c.key === 'status' ? r.status.toLowerCase().replace(' ', '-') : ''}">
                <span class="sr">{cell(r, c.key)}</span>
                <span class="flaps" aria-hidden="true">
                  {#each tiles(cell(r, c.key), c.width) as ch, j (j)}
                    <span class="tile"><DetentText text={ch} snapDuration={420} /></span>
                  {/each}
                </span>
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  <button type="button" class="next" onclick={advance}>Advance the clock</button>
</div>

<style>
  .wrap { display: grid; justify-items: center; gap: 16px; }
  .panel {
    padding: 14px 14px 16px; border-radius: 18px; color: #f1f1ef;
    background: linear-gradient(#17181c, #0d0e11);
    box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.06), 0 18px 36px -14px rgb(0 0 0 / 0.55);
    font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  }
  .head { display: flex; justify-content: space-between; align-items: center; padding: 2px 4px 12px; color: #f6c343; }
  .title { display: flex; align-items: center; gap: 8px; font: 600 13px/1 ui-monospace, 'SF Mono', Menlo, monospace; letter-spacing: 0.14em; text-transform: uppercase; }
  .head :global(.clock) { font: 500 15px/1 ui-monospace, 'SF Mono', Menlo, monospace; letter-spacing: 0.06em; }
  table { border-collapse: separate; border-spacing: 6px 5px; margin: -5px -6px -5px; }
  th { padding: 0 0 2px; text-align: start; font: 600 9.5px/1.2 ui-sans-serif, system-ui, sans-serif; letter-spacing: 0.14em; text-transform: uppercase; color: rgb(255 255 255 / 0.4); }
  td { padding: 0; }
  .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  .flaps { display: flex; gap: 1.5px; }
  .tile { position: relative; display: grid; place-items: center; width: 10.13px; height: 24px; border-radius: 2.5px; background: linear-gradient(#2c2e33, #1c1e22); box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.06), inset 0 -1px 0 rgb(0 0 0 / 0.45); overflow: hidden; }
  .tile::after { content: ''; position: absolute; left: 0; right: 0; top: 12px; height: 1px; background: rgb(0 0 0 / 0.55); pointer-events: none; z-index: 1; }
  .tile :global([data-detent-text]) { font: 600 13px/24px ui-monospace, 'SF Mono', Menlo, monospace; color: #f1f1ef; }
  .status.boarding .tile :global([data-detent-text]) { color: #5fdc8f; }
  .status.delayed .tile :global([data-detent-text]),
  .status.final-call .tile :global([data-detent-text]) { color: #f6c343; }
  .status.departed .tile :global([data-detent-text]) { color: rgb(255 255 255 / 0.4); }
  .next { padding: 7px 14px; border: 1px solid rgb(128 128 128 / 0.35); border-radius: 999px; background: none; color: inherit; font: 13px system-ui, sans-serif; cursor: pointer; }
</style>
