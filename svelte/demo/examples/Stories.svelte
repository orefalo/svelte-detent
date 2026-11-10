<script lang="ts">
  // In your app: import { Detent, DetentNumber } from 'svelte-detent'
  import { onMount } from 'svelte'
  import { ticks } from '@hayderkg/detent/feedback'
  import { Detent, DetentNumber } from '../../src/lib'
  import { watchVisible } from '../site/beyond-helpers'

  interface Story { id: string; who: string; text: string }
  /** Replace `base` with wherever you host the photos. */
  let { base = 'https://detent.hayder.sh', onTick = ticks({ sound: true, haptics: true }) }: { base?: string; onTick?: (index: number, velocity: number) => void } = $props()

  const stories: Story[] = [
    { id: 'mist-1', who: 'nikko', text: 'A thousand steps, one torii, no one else.' },
    { id: 'mist-2', who: 'mountain.temple', text: 'The first red leaves before the fog lifts.' },
    { id: 'mist-3', who: 'lake.house', text: 'Dusk on the water. Tea is ready.' },
    { id: 'mist-4', who: 'kawaguchiko', text: 'The lantern and its reflection.' },
    { id: 'mist-5', who: 'old.shrine', text: 'Moss on every step.' },
    { id: 'mist-6', who: 'cloud.pagoda', text: 'Above the clouds by seven.' },
  ]
  const DURATION = 4000

  let index = $state(0)
  let paused = $state(false)
  let visible = $state(false)
  let liked = $state<Record<string, boolean>>({})
  let saved = $state<Record<string, boolean>>({})
  let root = $state<HTMLElement | null>(null)
  const story = $derived(stories[index]!)

  onMount(() => {
    // Reduced motion: stories wait for you.
    const mq = matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => mq.matches && (paused = true)
    apply()
    mq.addEventListener('change', apply)
    const stop = root ? watchVisible(root, (v) => (visible = v)) : () => {}
    return () => (mq.removeEventListener('change', apply), stop())
  })

  // Auto-advance. A story that was paused (or scrolled away) resumes with the time it has left.
  let spent = { index: 0, ms: 0 }
  $effect(() => {
    const at = index
    const running = visible && !paused
    if (spent.index !== at) spent = { index: at, ms: 0 }
    if (!running) return
    const started = performance.now()
    const timer = setTimeout(() => (index = (at + 1) % stories.length), Math.max(0, DURATION - spent.ms))
    return () => {
      clearTimeout(timer)
      if (spent.index === at) spent.ms = Math.min(DURATION, spent.ms + performance.now() - started)
    }
  })

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${location.origin}/examples#stories`)
    } catch {
      /* clipboard unavailable */
    }
  }
</script>

<div bind:this={root} class="stories-demo">
  <div class="screen">
    <Detent
      {onTick}
      items={stories}
      getKey={(s) => s.id}
      getLabel={(s) => `${s.who}: ${s.text}`}
      value={story}
      onChange={(s) => (index = stories.indexOf(s))}
      label="Stories"
      loop
      itemHeight={420}
      visibleCount={1}
      perspective={0}
      indicator={{ shape: 'none' }}
      magnify={false}
      mask="none"
      motionBlur={1.2}
      fade={0}
      dim={0}
    >
      {#snippet item(s: Story)}
        <div class="slide">
          <img src="{base}/photos/{s.id}.webp" alt="" width="473" height="840" draggable="false" />
          <div class="caption">
            <b>{s.who}</b>
            <span>{s.text}</span>
          </div>
        </div>
      {/snippet}
    </Detent>

    <span aria-hidden="true" class="notch"></span>
    <div aria-hidden="true" class="bars">
      {#each stories as s, n (s.id)}
        <span class="bar">
          {#key n === index ? `on-${index}` : 'off'}
            <span class="fill" style:transform="scaleX({n < index ? 1 : 0})" style:animation={n === index ? `story-fill ${DURATION}ms linear forwards` : undefined} style:animation-play-state={visible && !paused ? 'running' : 'paused'}></span>
          {/key}
        </span>
      {/each}
    </div>

    <button type="button" class="story-pause" aria-label={paused ? 'Play stories' : 'Pause stories'} onclick={() => (paused = !paused)}>
      <svg aria-hidden="true" width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
        {#if paused}<path d="m6 3 10 7-10 7z" />{:else}<path d="M5 4h3v12H5zm7 0h3v12h-3z" />{/if}
      </svg>
    </button>

    <div class="story-actions" role="group" aria-label="Story actions">
      <button type="button" aria-label="Like story" aria-pressed={!!liked[story.id]} onclick={() => (liked[story.id] = !liked[story.id])}>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill={liked[story.id] ? '#ff5579' : 'none'} style:stroke={liked[story.id] ? 'none' : 'currentColor'}>
          <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0l-1 1-1-1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
        </svg>
        <span class="story-count"><DetentNumber value={128 + 37 * index + Number(!!liked[story.id])} /></span>
      </button>
      <button type="button" aria-label="Save story" aria-pressed={!!saved[story.id]} onclick={() => (saved[story.id] = !saved[story.id])}>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill={saved[story.id] ? 'currentColor' : 'none'}><path d="M6 3h12v18l-6-4-6 4z" /></svg>
      </button>
      <button type="button" aria-label="Copy story demo link" onclick={copyLink}>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="m21 3-7 18-4-7-7-4 18-7ZM10 14 21 3" /></svg>
      </button>
    </div>
  </div>
</div>

<style>
  .stories-demo { padding: 6px; border-radius: 40px; background: #0d0d0d; box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.08), 0 1px 2px rgb(0 0 0 / 0.12), 0 28px 44px -26px rgb(0 0 0 / 0.55); }
  .screen { position: relative; width: 194px; border-radius: 34px; overflow: hidden; transform: translateZ(0); }
  .slide { position: relative; width: 194px; height: 420px; background: #efe8db; }
  .slide img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .caption { position: absolute; inset: auto 0 0; padding: 44px 58px 18px 18px; background: linear-gradient(transparent, rgb(0 0 0 / 0.55)); color: #fff; text-align: start; white-space: normal; font-size: 13px; line-height: 1.35; font-family: system-ui, sans-serif; }
  .caption b { display: block; margin-bottom: 2px; }
  .caption span { opacity: 0.9; font-size: 12.5px; }
  .notch { position: absolute; top: 9px; left: 50%; width: 62px; height: 18px; margin-left: -31px; border-radius: 10px; background: #0d0d0d; pointer-events: none; }
  .bars { position: absolute; inset: 34px 14px auto; display: flex; gap: 4px; pointer-events: none; }
  .bar { flex: 1; height: 2.5px; border-radius: 2px; background: rgb(255 255 255 / 0.4); overflow: hidden; }
  .fill { display: block; height: 100%; background: #fff; width: 100%; transform-origin: left; }
  @keyframes -global-story-fill { to { transform: scaleX(1); } }
  .story-actions { position: absolute; right: 0; bottom: 82px; display: grid; gap: 6px; color: #fff; }
  .story-actions button, .story-pause { display: grid; justify-items: center; align-content: center; gap: 3px; width: 44px; min-height: 44px; padding: 5px 0; border: 0; background: transparent; color: inherit; cursor: pointer; border-radius: 99px; text-shadow: 0 1px 4px #0008; transition: transform 150ms ease; }
  .story-actions svg { width: 20px; height: 20px; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; filter: drop-shadow(0 1px 3px #0005); }
  .story-count { display: block; min-height: 14px; font: 10px/14px 'Geist', system-ui, sans-serif; font-variant-numeric: tabular-nums; text-align: left; }
  .story-actions button:active, .story-pause:active { transform: scale(0.92); }
  .story-actions button:focus-visible, .story-pause:focus-visible { outline: 2px solid #fff; outline-offset: 1px; }
  .story-pause { position: absolute; right: 9px; top: 44px; width: 28px; min-height: 28px; background: #0003; color: #fff; }
  @media (prefers-reduced-motion: reduce) { .story-actions button, .story-pause { transition: none; } }
</style>
