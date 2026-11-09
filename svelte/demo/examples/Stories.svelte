<script lang="ts">
  // In your app: import { Detent } from '@hayderkg/detent-svelte'
  import { Detent } from '../../src/lib'

  /** Replace `base` with wherever you host the photos. */
  let { base = 'https://detent.hayder.sh', duration = 5000 }: { base?: string; duration?: number } = $props()

  interface Story { id: string; user: string; caption: string; src: string; likes: number }
  const stories: Story[] = [
    ['nikko', 'A thousand steps, one torii, no one else.', 96],
    ['mountain.temple', 'The first red leaves before the fog lifts.', 128],
    ['lake.house', 'Dusk on the water. Tea is ready.', 202],
    ['kawaguchiko', 'The lantern and its reflection.', 164],
    ['old.shrine', 'Moss on every step.', 88],
    ['cloud.pagoda', 'Above the clouds by seven.', 141],
  ].map(([user, caption, likes], i) => ({ id: user as string, user: user as string, caption: caption as string, likes: likes as number, src: `${base}/photos/mist-${i + 1}.webp` }))

  let value = $state<Story>(stories[0]!)
  let playing = $state(true)
  let progress = $state(0) // 0–1 within the current story
  let dragging = $state(false)
  let liked = $state<Record<string, boolean>>({})
  let saved = $state<Record<string, boolean>>({})
  const index = $derived(stories.findIndex((s) => s.id === value.id))

  // Auto-advance: a clock that fills the current segment, then turns the wheel to the next story.
  $effect(() => {
    void value // a new story (swiped or advanced) starts from empty
    progress = 0
    if (!playing) return
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      if (!dragging) progress += (now - last) / duration
      last = now
      if (progress >= 1) value = stories[(index + 1) % stories.length]!
      else raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  })
</script>

<div class="phone">
  <div class="screen" onpointerdown={() => (dragging = true)} onpointerup={() => (dragging = false)} onpointercancel={() => (dragging = false)}>
    <Detent
      items={stories}
      bind:value
      getKey={(s) => s.id}
      getLabel={(s) => s.user}
      label="Stories"
      loop
      itemHeight={420}
      visibleCount={1}
      width={194}
      height={420}
      perspective={0}
      fade={0}
      dim={0}
      highlight={false}
      magnify={false}
      mask="none"
    >
      {#snippet item(s: Story)}
        <div class="story">
          <img src={s.src} alt="" draggable="false" />
          <div class="shade"></div>
          <div class="caption"><b>{s.user}</b><span>{s.caption}</span></div>
        </div>
      {/snippet}
    </Detent>

    <span class="island"></span>
    <div class="bars" aria-hidden="true">
      {#each stories as s, i (s.id)}
        <span><i style:width="{i < index ? 100 : i === index ? progress * 100 : 0}%"></i></span>
      {/each}
    </div>
    <button type="button" class="pause" aria-label={playing ? 'Pause' : 'Play'} aria-pressed={!playing} onclick={() => (playing = !playing)}>
      <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">{#if playing}<path d="M3 2h2v8H3zM7 2h2v8H7z" />{:else}<path d="M3 2l7 4-7 4z" />{/if}</svg>
    </button>
    <div class="actions">
      <button type="button" aria-label="Like" aria-pressed={!!liked[value.id]} onclick={() => (liked[value.id] = !liked[value.id])}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill={liked[value.id] ? '#ff3b5c' : 'none'} stroke={liked[value.id] ? '#ff3b5c' : 'currentColor'} stroke-width="2" stroke-linejoin="round"><path d="M12 21s-8-5.2-8-11a4.6 4.6 0 0 1 8-3 4.6 4.6 0 0 1 8 3c0 5.800-8 11-8 11z" /></svg>
        <span class="count">{value.likes + (liked[value.id] ? 1 : 0)}</span>
      </button>
      <button type="button" aria-label="Save" aria-pressed={!!saved[value.id]} onclick={() => (saved[value.id] = !saved[value.id])}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill={saved[value.id] ? 'currentColor' : 'none'} stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M6 3h12v18l-6-4-6 4z" /></svg>
      </button>
      <button type="button" aria-label="Share">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="M21 3 3 10l7 3 3 7z" /><path d="m10 13 11-10" /></svg>
      </button>
    </div>
  </div>
</div>

<style>
  .phone { width: 206px; margin: 0 auto; padding: 6px; box-sizing: border-box; border-radius: 40px; background: #0b0b0b; box-shadow: 0 0 0 1px rgb(255 255 255 / 0.08), 0 30px 50px -20px rgb(0 0 0 / 0.45); }
  .screen { position: relative; width: 194px; height: 420px; border-radius: 34px; overflow: hidden; background: #efe8db; color: #fff; isolation: isolate; touch-action: none; }
  .story { position: relative; width: 194px; height: 420px; color: #fff; }
  .story img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; user-select: none; }
  .shade { position: absolute; left: 0; right: 0; bottom: 0; height: 134px; background: linear-gradient(rgb(0 0 0 / 0), rgb(0 0 0 / 0.55)); }
  .caption { position: absolute; left: 18px; bottom: 28px; width: 102px; display: grid; gap: 2px; text-align: start; white-space: normal; }
  .caption b { font-size: 13px; font-weight: 700; }
  .caption span { font-size: 12.5px; line-height: 1.3; }
  .island { position: absolute; left: 66px; top: 9px; width: 62px; height: 18px; border-radius: 10px; background: #0d0d0d; z-index: 2; }
  .bars { position: absolute; left: 14px; right: 14px; top: 34px; display: flex; gap: 4.4px; z-index: 2; pointer-events: none; }
  .bars span { flex: 1; height: 3px; border-radius: 2px; background: rgb(255 255 255 / 0.4); overflow: hidden; }
  .bars i { display: block; height: 100%; background: #fff; }
  button { border: 0; background: none; color: inherit; font: inherit; cursor: pointer; }
  .pause { position: absolute; right: 7px; top: 44px; width: 28px; height: 28px; border-radius: 99px; background: rgb(0 0 0 / 0.2); display: grid; place-items: center; z-index: 2; }
  .actions { position: absolute; right: 0; top: 191px; width: 44px; display: grid; z-index: 2; }
  .actions button { height: 47px; display: grid; place-items: center; align-content: center; gap: 2px; filter: drop-shadow(0 1px 2px rgb(0 0 0 / 0.4)); }
  .actions button:not(:first-child) { height: 50px; }
  .count { font-size: 10px; }
</style>
