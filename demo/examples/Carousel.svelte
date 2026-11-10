<script lang="ts">
  // In your app: import { Detent } from 'svelte-detent'
  import { ticks } from '../../src/lib'
  import { Detent } from '../../src/lib'

  interface Painting { id: string; title: string; note: string }
  /** Replace `base` with wherever you host the images. */
  let { base = 'https://detent.hayder.sh' }: { base?: string } = $props()

  const paintings: Painting[] = [
    { id: 'crane', title: 'Crane', note: 'Flight over still water' },
    { id: 'koi', title: 'Koi', note: 'Two fish, one circle' },
    { id: 'bonsai', title: 'Bonsai', note: 'A pine in a shallow pot' },
    { id: 'lantern', title: 'Lantern', note: 'Paper and a warm light' },
    { id: 'torii', title: 'Torii', note: 'A gate standing in the sea' },
    { id: 'zen', title: 'Zen garden', note: 'Stone and raked sand' },
    { id: 'bamboo', title: 'Bamboo', note: 'Wind in the stalks' },
    { id: 'maple', title: 'Maple', note: 'Autumn on a branch' },
  ]
  const tick = ticks({ sound: true, haptics: true })

  // The card's shadow fades as it leaves the center.
  const shadow =
    '0 1px 2px rgb(0 0 0 / calc(.06 * (1 - min(1, var(--abs-offset))))), 0 12px 24px -14px rgb(0 0 0 / calc(.2 * (1 - min(1, var(--abs-offset)))))'

  let mode = $state<'flat' | 'cover'>('flat')
  let rtl = $state(false)
  let current = $state<Painting>(paintings[0]!)
  const flat = $derived(mode === 'flat')
  const g = $derived(rtl ? -1 : 1)

  /** Cover flow: each card turns toward the center and sits back in depth; nearer cards stack on top. */
  const coverRow = (e: number) => {
    const t = Math.max(-1, Math.min(1, e))
    const i = Math.sign(e) * Math.max(0, Math.abs(e) - 1) * 112 * 0.55
    return {
      transform: `perspective(700px) translateX(${-i * g}px) translateZ(${-(110 * Math.abs(t))}px) rotateY(${-(58 * t) * g}deg)`,
      zIndex: 100 - Math.round(10 * Math.abs(e)),
    }
  }
</script>

<div class="carousel" dir={rtl ? 'rtl' : 'ltr'}>
  {#key `${mode}-${rtl}`}
    <Detent
      onTick={tick}
      items={paintings}
      getKey={(p) => p.id}
      getLabel={(p) => p.title}
      defaultValue={current}
      onChange={(p) => (current = p)}
      changeOn="tick"
      label="Paintings"
      orientation="horizontal"
      dir={rtl ? 'rtl' : 'ltr'}
      loop
      itemHeight={flat ? 212 : 112}
      visibleCount={flat ? 3 : 7}
      height={flat ? 300 : 214}
      perspective={0}
      indicator={{ shape: 'none' }}
      magnify={false}
      fade={flat ? 0.35 : 0.08}
      maskSize="14%"
      scale={flat ? 0.08 : 0}
      dim={0}
      selectedDepth={flat && 12}
      centerLight={flat && 0.06}
      elasticRows={flat && 0.45}
      grip={0.8}
      rowStyle={flat ? undefined : coverRow}
      style="max-width:100%"
    >
      {#snippet item(p: Painting)}
        {#if flat}
          <figure class="card">
            <img src="{base}/ink/{p.id}.webp" alt="" width="196" height="196" draggable="false" style:box-shadow={shadow} />
            <figcaption><b>{p.title}</b><span>{p.note}</span></figcaption>
          </figure>
        {:else}
          <img class="cover" src="{base}/ink/{p.id}.webp" alt="" width="150" height="150" draggable="false" style:box-shadow={shadow} />
        {/if}
      {/snippet}
    </Detent>
  {/key}

  {#if flat}
    <div class="dots" aria-hidden="true">
      {#each paintings as p (p.id)}
        <span style:width="{p.id === current.id ? 16 : 6}px" style:opacity={p.id === current.id ? 0.8 : 0.2}></span>
      {/each}
    </div>
  {:else}
    <span class="title">{current.title}</span>
  {/if}

  <div class="controls" dir="ltr">
    <span class="look" role="group" aria-label="Look">
      {#each ['flat', 'cover flow'] as label, i (label)}
        {@const on = (i === 0) === flat}
        <button type="button" aria-pressed={on} style:font-weight={on ? 600 : 400} style:opacity={on ? 1 : 0.45} onclick={() => (mode = i === 0 ? 'flat' : 'cover')}>{label}</button>
      {/each}
    </span>
    <label class="rtl">
      <span class="box">
        <input type="checkbox" bind:checked={rtl} style:background={rtl ? 'currentColor' : 'transparent'} style:box-shadow={rtl ? 'none' : 'inset 0 0 0 1.5px rgb(128 128 128 / .5)'} />
        <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" style:opacity={rtl ? 1 : 0}><path d="M4.5 8.4l2.3 2.3 4.7-5" /></svg>
      </span>
      RTL
    </label>
  </div>
</div>

<style>
  .carousel { display: grid; grid-template-columns: minmax(0, 1fr); justify-items: center; gap: 14px; width: 100%; font-family: system-ui, sans-serif; --bg: #fff; }
  figure.card { margin: 0; width: 196px; display: grid; gap: 8px; }
  figure.card img { display: block; border-radius: 16px; }
  figcaption { display: grid; gap: 2px; padding-inline: 4px; }
  figcaption b { font-size: 14px; font-weight: 600; }
  figcaption span { font-size: 12px; opacity: 0.6; }
  img.cover { display: block; flex: none; border-radius: 8px; }
  .dots { display: flex; gap: 6px; }
  .dots span { height: 6px; border-radius: 3px; background: currentColor; transition: width 220ms cubic-bezier(0.23, 1, 0.32, 1), opacity 220ms ease; }
  .title { font-size: 14px; font-weight: 600; }
  .controls { display: flex; align-items: center; gap: 14px; font-size: 13px; }
  .look { display: flex; gap: 14px; }
  .look button { border: 0; padding: 0; background: none; font-family: 'Geist Mono', ui-monospace, 'SF Mono', Menlo, monospace; font-size: 12.5px; cursor: pointer; color: inherit; transition: opacity 150ms ease; }
  .rtl { display: inline-flex; align-items: center; gap: 8px; cursor: pointer; }
  .box { position: relative; display: inline-grid; width: 16px; height: 16px; }
  .box input { appearance: none; margin: 0; width: 16px; height: 16px; border-radius: 5px; cursor: pointer; transition: background-color 150ms ease, box-shadow 150ms ease; }
  .box svg { position: absolute; inset: 0; pointer-events: none; transition: opacity 150ms ease; fill: none; stroke: var(--bg, #fff); stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
  @media (prefers-color-scheme: dark) { .carousel { --bg: #0a0a0a; } }
</style>
