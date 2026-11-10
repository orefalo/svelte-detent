<script lang="ts">
  // In your app: import { Detent, DetentNumber, DetentText } from 'svelte-detent'
  import { ticks } from '../../src/lib'
  import { onMount } from 'svelte'
  import { Detent, DetentNumber, DetentText } from '../../src/lib'
  import { closeBell, playBell, primeBell } from '../site/iosAlarmBell'

  const hours = Array.from({ length: 12 }, (_, i) => String(i + 1))
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))
  const halves = ['AM', 'PM']
  const tick = ticks({ sound: true, haptics: true })

  let hour = $state('9')
  let minute = $state('41')
  let half = $state('AM')
  const label = $derived(`${hour}:${minute} ${half}`)

  // The alarm: the next time the wheels read, counted down while the scene is on screen.
  let target = $state<number | null>(null)
  let remaining = $state<number | null>(null)
  let ringing = $state(false)
  let rang = false
  let scene = $state<HTMLElement | null>(null)
  let visible = $state(false)

  onMount(() => {
    let inView = false
    const update = () => (visible = inView && !document.hidden)
    const io = new IntersectionObserver(([e]) => ((inView = !!e?.isIntersecting), update()))
    if (scene) io.observe(scene)
    document.addEventListener('visibilitychange', update)
    return () => (io.disconnect(), document.removeEventListener('visibilitychange', update), closeBell())
  })

  $effect(() => {
    const m = /^(\d+):(\d+)\s*(AM|PM)/.exec(label)
    if (!m) return
    const now = new Date()
    const at = new Date(now)
    at.setHours(Number(m[1]) % 12 + 12 * Number(m[3] === 'PM'), Number(m[2]), 0, 0)
    if (at.getTime() <= now.getTime()) at.setDate(at.getDate() + 1)
    target = at.getTime()
    rang = false
    ringing = false
  })
  $effect(() => {
    const at = target
    if (!visible || at === null) return
    const tickDown = () => {
      const left = Math.max(0, Math.ceil((at - Date.now()) / 1000))
      remaining = left
      if (!left && !rang) {
        rang = true
        if (Date.now() - at < 1500) {
          ringing = true
          playBell()
        }
      }
      return left
    }
    if (tickDown() === 0) return
    const id = setInterval(() => tickDown() === 0 && clearInterval(id), 1000)
    return () => clearInterval(id)
  })

  const left = $derived(remaining)
  const spoken = $derived(left === null ? undefined : left === 0 ? 'Alarm reached' : `Rings in ${Math.floor(left / 3600)} hours ${Math.floor(left / 60) % 60} minutes ${left % 60} seconds`)
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="scene alarm" bind:this={scene} onpointerdowncapture={primeBell} onkeydowncapture={primeBell} onwheelcapture={primeBell}>
  <div class="alarm-head">
    <span class="alarm-title" data-ringing={ringing || undefined} onanimationend={() => (ringing = false)}>
      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" /><path d="M10 20.5a2 2 0 0 0 4 0" /></svg>
      Wake up
    </span>
    <span class="alarm-in" aria-label={spoken}>
      {#if left !== null}
        {#if left === 0}<span role="status">Time to wake up.</span>{:else}Rings in <DetentNumber value={Math.floor(left / 3600)} locales="en-US" /> h <DetentNumber value={Math.floor(left / 60) % 60} locales="en-US" /> m <DetentNumber value={left % 60} locales="en-US" format={{ minimumIntegerDigits: 2 }} /> s{/if}
      {/if}
    </span>
  </div>
  <div>
    <div class="picker">
      <div class="wheels">
        <div class="band" aria-hidden="true"></div>
        <Detent onTick={tick} itemHeight={40} visibleCount={5} indicator={{ shape: 'none' }} magnify={1.12} curvature={0.7} items={hours} loop bind:value={hour} label="Hour" align="end" style="flex:1" />
        <Detent onTick={tick} itemHeight={40} visibleCount={5} indicator={{ shape: 'none' }} magnify={1.12} curvature={0.7} items={minutes} loop bind:value={minute} label="Minute" style="flex:1" />
        <Detent onTick={tick} itemHeight={40} visibleCount={5} indicator={{ shape: 'none' }} magnify={1.12} curvature={0.7} items={halves} bind:value={half} label="AM or PM" align="start" style="flex:1" />
      </div>
      <output class="mono" aria-label={label}><DetentNumber value={Number(hour)} locales="en-US" />:<DetentNumber value={Number(minute)} locales="en-US" format={{ minimumIntegerDigits: 2 }} /> <DetentText text={half} /></output>
    </div>
  </div>
</div>

<style>
  .scene { --fg: #111; --muted: #888; justify-items: center; gap: 18px; width: 100%; display: grid; }
  .scene > div:last-child { justify-items: center; width: 100%; display: grid; }
  .alarm-head { width: min(280px, 100%); color: var(--muted); justify-content: space-between; align-items: center; font-size: 13px; display: flex; flex-wrap: wrap; gap: 8px; }
  .alarm-title { color: var(--fg); align-items: center; gap: 6px; font-weight: 500; display: inline-flex; }
  .alarm-title svg { transform-origin: 50% 15%; }
  .alarm-title[data-ringing] svg { animation: 0.75s ease-in-out alarm-ring; }
  .alarm-in { font-variant-numeric: tabular-nums; transition: opacity 0.2s; }
  @keyframes alarm-ring { 0%, 100% { transform: rotate(0); } 15%, 45%, 75% { transform: rotate(15deg); } 30%, 60%, 90% { transform: rotate(-12deg); } }
  @media (prefers-reduced-motion: reduce) { .alarm-title[data-ringing] svg { animation: none; } }

  .picker { display: grid; justify-items: center; gap: 20px; }
  .wheels { position: relative; display: flex; width: 236px; --detent-font-size: 22px; }
  .band { position: absolute; inset: 80px 0 auto; height: 40px; border-radius: 10px; background: rgb(128 128 128 / 0.12); }
  .mono { font: 13px 'Geist Mono', ui-monospace, 'SF Mono', Menlo, monospace; font-variant-numeric: tabular-nums; }
  @media (prefers-color-scheme: dark) { .scene { --fg: #ededed; } }
</style>
