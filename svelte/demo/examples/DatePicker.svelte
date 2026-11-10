<script lang="ts">
  // In your app: import { Detent, DetentNumber, DetentText } from 'svelte-detent'
  import { ticks } from '@hayderkg/detent/feedback'
  import { Detent, DetentNumber, DetentText } from '../../src/lib'

  const tick = ticks({ sound: true, haptics: true })
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const days = Array.from({ length: 31 }, (_, i) => i + 1)
  const years = Array.from({ length: 101 }, (_, i) => 1950 + i)
  const long = new Intl.DateTimeFormat('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  let day = $state(14)
  let month = $state(1)
  let year = $state(2026)
  /** Days in the chosen month; the day follows it down (31 Jan -> 28 Feb) but is remembered when you go back up. */
  const inMonth = $derived(new Date(year, month + 1, 0).getDate())
  const shown = $derived(Math.min(day, inMonth))
  const date = $derived(new Date(year, month, shown))
  const parts = $derived(long.formatToParts(date))
</script>

<div class="date">
  <div class="wheels">
    <div class="band" aria-hidden="true"></div>
    <Detent onTick={tick} itemHeight={38} visibleCount={5} indicator={{ shape: 'none' }} magnify={1.08} curvature={0.7}
      items={days} value={shown} onChange={(d: number) => (day = d)} isDisabled={(d: number) => d > inMonth} label="Day" align="end" style="flex:2" />
    <Detent onTick={tick} itemHeight={38} visibleCount={5} indicator={{ shape: 'none' }} magnify={1.08} curvature={0.7}
      items={months} value={months[month]} onChange={(m: string) => (month = months.indexOf(m))} label="Month" style="flex:5" />
    <Detent onTick={tick} itemHeight={38} visibleCount={5} indicator={{ shape: 'none' }} magnify={1.08} curvature={0.7}
      items={years} value={year} onChange={(y: number) => (year = y)} label="Year" align="start" style="flex:3" />
  </div>
  <output aria-label={long.format(date)}>{#each parts as p, i (`${p.type}-${i}`)}{#if p.type === 'day' || p.type === 'year'}<DetentNumber value={Number(p.value)} locales="en-US" format={{ useGrouping: false }} />{:else if p.type === 'weekday' || p.type === 'month'}<DetentText text={p.value} />{:else}{p.value}{/if}{/each}</output>
</div>

<style>
  .date { display: grid; justify-items: center; gap: 16px; width: 100%; }
  .wheels { position: relative; display: flex; width: min(300px, 100%); --detent-font-size: 19px; }
  .band { position: absolute; inset: 76px 0 auto; height: 38px; border-radius: 10px; background: rgb(128 128 128 / 0.12); }
  output { font-size: 14px; }
</style>
