<script lang="ts">
  // In your app: import { Detent } from '@hayderkg/detent-svelte'
  import { Detent } from '../../src/lib'

  const months = Array.from({ length: 12 }, (_, i) => new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(2000, i, 1)))
  const years = Array.from({ length: 151 }, (_, i) => 1950 + i)

  let year = $state(2026)
  let month = $state('February')
  let day = $state(14)

  const monthIndex = $derived(months.indexOf(month))
  // Days that don't exist in the chosen month are skipped.
  const daysIn = $derived(new Date(year, monthIndex + 1, 0).getDate())
  const days = $derived(Array.from({ length: daysIn }, (_, i) => i + 1))
  // A shorter month takes the day with it (31 → 28), instead of leaving it on a day that is gone.
  $effect(() => {
    if (day > daysIn) day = daysIn
  })

  const text = $derived(
    new Intl.DateTimeFormat('en-US', { dateStyle: 'full' }).format(new Date(year, monthIndex, Math.min(day, daysIn))),
  )

  const common = { itemHeight: 38, visibleCount: 5, highlight: false, magnify: false } as const
</script>

<div class="card">
  <div class="wheels">
    <div class="band"></div>
    <div style="width: 60px"><Detent {...common} items={days} bind:value={day} label="Day" align="end" /></div>
    <div style="width: 150px"><Detent {...common} items={months} bind:value={month} label="Month" /></div>
    <div style="width: 90px"><Detent {...common} items={years} bind:value={year} label="Year" align="start" /></div>
  </div>
  <p class="out" aria-live="polite">{text}</p>
</div>

<style>
  .card { display: grid; justify-items: center; gap: 18px; padding: 22px 0; }
  .wheels { position: relative; display: flex; font-size: 19px; }
  .band { position: absolute; left: 0; right: 0; top: 76px; height: 38px; border-radius: 10px; background: rgb(128 128 128 / 0.12); pointer-events: none; }
  .out { margin: 0; font-size: 14px; font-weight: 500; }
</style>
