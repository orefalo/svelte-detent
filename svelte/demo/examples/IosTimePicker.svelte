<script lang="ts">
  // In your app: import { Detent } from '@hayderkg/detent-svelte'
  import { Detent } from '../../src/lib'

  const hours = Array.from({ length: 12 }, (_, i) => i + 1)
  const minutes = Array.from({ length: 60 }, (_, i) => i)
  const periods = ['AM', 'PM']

  let hour = $state(9)
  let minute = $state(41)
  let period = $state('AM')

  // Seconds until the alarm next rings.
  let now = $state(Date.now())
  $effect(() => {
    const t = setInterval(() => (now = Date.now()), 1000)
    return () => clearInterval(t)
  })
  const rings = $derived.by(() => {
    const at = new Date(now)
    at.setHours((hour % 12) + (period === 'PM' ? 12 : 0), minute, 0, 0)
    if (at.getTime() <= now) at.setDate(at.getDate() + 1)
    const s = Math.floor((at.getTime() - now) / 1000)
    return `${Math.floor(s / 3600)} h ${Math.floor((s % 3600) / 60)} m ${s % 60} s`
  })

  const common = { itemHeight: 40, visibleCount: 5, highlight: false, magnify: false, perspective: 800 } as const
</script>

<div class="card">
  <div class="head">
    <span class="title">
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" aria-hidden="true">
        <path d="M2.5 9.5V6a4 4 0 0 1 8 0v3.5l.8.8H1.7z" /><path d="M5.5 11.6a1 1 0 0 0 2 0" />
      </svg>
      Wake up
    </span>
    <span class="rings">Rings in {rings}</span>
  </div>

  <div class="wheels">
    <div class="band"></div>
    <div class="wheel"><Detent {...common} items={hours} bind:value={hour} label="Hour" loop align="end" /></div>
    <div class="wheel"><Detent {...common} items={minutes} bind:value={minute} label="Minute" loop getLabel={(m) => String(m).padStart(2, '0')} />
    </div>
    <div class="wheel"><Detent {...common} items={periods} bind:value={period} label="AM or PM" align="start" /></div>
  </div>

  <code class="foot">{hour}:{String(minute).padStart(2, '0')} {period}</code>
</div>

<style>
  .card { display: grid; justify-items: center; gap: 18px; padding: 22px 0; font-size: 13px; }
  .head { display: flex; gap: 28px; align-items: center; }
  .title { display: inline-flex; gap: 6px; align-items: center; font-weight: 500; }
  .rings { color: #6b6b6b; font-variant-numeric: tabular-nums; }
  .wheels { position: relative; display: flex; }
  .wheel { width: 79px; font-size: 22px; }
  .band { position: absolute; left: 0; right: 0; top: 80px; height: 40px; border-radius: 10px; background: rgb(128 128 128 / 0.12); pointer-events: none; }
  .foot { font: 13px ui-monospace, monospace; }
  .wheel :global([data-detent-ui]) { cursor: grab; }
  @media (prefers-color-scheme: dark) { .rings { color: #999; } }
</style>
