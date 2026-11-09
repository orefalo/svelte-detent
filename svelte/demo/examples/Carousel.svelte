<script lang="ts">
  // In your app: import { Detent } from '@hayderkg/detent-svelte'
  import { Detent } from '../../src/lib'

  interface Painting { id: string; title: string; subtitle: string; src: string }
  /** Replace `base` with wherever you host the images. */
  let { base = 'https://detent.hayder.sh/ink' }: { base?: string } = $props()

  const paintings: Painting[] = [
    ['crane', 'Crane', 'Flight over still water'],
    ['koi', 'Koi', 'Two fish, one circle'],
    ['bonsai', 'Bonsai', 'A pine in a shallow pot'],
    ['lantern', 'Lantern', 'Paper and a warm light'],
    ['torii', 'Torii', 'A gate standing in the sea'],
    ['zen', 'Zen garden', 'Stone and raked sand'],
    ['bamboo', 'Bamboo', 'Wind in the stalks'],
    ['maple', 'Maple', 'Autumn on a branch'],
  ].map(([id, title, subtitle]) => ({ id: id!, title: title!, subtitle: subtitle!, src: `${base}/${id}.webp` }))

  let mode = $state<'flat' | 'cover'>('flat')
  let rtl = $state(false)
  let value = $state<Painting>(paintings[0]!)
  const cover = $derived(mode === 'cover')
  const index = $derived(paintings.findIndex((p) => p.id === value.id))

  /** Cover flow: side cards turn toward the center and pack close behind it; nearer cards stack on top. */
  const coverRow = (offset: number) => {
    const o = Math.abs(offset)
    const s = Math.sign(offset)
    const pull = o >= 1 ? 54 * o - 22 : 32 * o // from the row's own slot toward the center, px
    return {
      transform: `perspective(520px) translateX(${-s * pull}px) rotateY(${-s * Math.min(1, o) * 58}deg) scale(${1 - 0.15 * Math.min(1, o)})`,
      zIndex: Math.round(100 - o * 10),
    }
  }
</script>

<div class="carousel" dir={rtl ? 'rtl' : 'ltr'}>
  <Detent
    items={paintings}
    bind:value
    getKey={(p) => p.id}
    getLabel={(p) => p.title}
    label="Paintings"
    loop
    orientation="horizontal"
    dir={rtl ? 'rtl' : 'ltr'}
    itemHeight={cover ? 112 : 196}
    gap={cover ? 0 : 16}
    visibleCount={cover ? 7 : 3}
    height={cover ? 214 : 300}
    width={cover ? 784 : 636}
    style="max-width:100%"
    highlight={false}
    magnify={false}
    perspective={0}
    fade={cover ? 0.08 : 0.35}
    scale={cover ? 0 : 0.08}
    dim={0}
    mask={cover ? 'gradient' : 'none'}
    maskSize="12%"
    centerLight={cover ? false : 0.06}
    selectedDepth={cover ? false : 12}
    elasticRows={!cover}
    rowStyle={cover ? coverRow : undefined}
  >
    {#snippet item(p: Painting)}
      <figure class:cover>
        <img src={p.src} alt="" draggable="false" />
        {#if !cover}
          <figcaption><b>{p.title}</b><span>{p.subtitle}</span></figcaption>
        {/if}
      </figure>
    {/snippet}
  </Detent>

  {#if cover}<p class="title">{value.title}</p>{/if}

  <div class="dots" role="group" aria-label="Choose a painting">
    {#each paintings as p, i (p.id)}
      <button type="button" class="dot" class:on={i === index} aria-label={p.title} aria-current={i === index} onclick={() => (value = p)}></button>
    {/each}
  </div>

  <div class="controls">
    <button type="button" class:on={!cover} onclick={() => (mode = 'flat')}>flat</button>
    <button type="button" class:on={cover} onclick={() => (mode = 'cover')}>cover flow</button>
    <label><input type="checkbox" bind:checked={rtl} /> RTL</label>
  </div>
</div>

<style>
  .carousel { display: grid; grid-template-columns: minmax(0, 1fr); justify-items: center; gap: 14px; width: 100%; }
  figure { margin: 0; padding: 0 8px; width: 100%; box-sizing: border-box; }
  img { display: block; width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 16px; box-shadow: 0 1px 2px rgb(0 0 0 / 0.06), 0 8px 20px -8px rgb(0 0 0 / 0.2); user-select: none; }
  figure.cover { padding: 0; width: 148px; }
  figcaption { display: grid; padding: 8px 4px 0; text-align: start; }
  figcaption b { font-size: 14px; font-weight: 600; }
  figcaption span { font-size: 12px; opacity: 0.6; }
  .title { margin: 0; font-size: 14px; font-weight: 600; }
  .dots { display: flex; gap: 8px; align-items: center; }
  .dot { width: 8px; height: 8px; padding: 0; border: 0; border-radius: 999px; background: #c8c8c8; cursor: pointer; transition: width 0.25s, background 0.25s; }
  .dot.on { width: 16px; background: #222; }
  .controls { display: flex; gap: 16px; align-items: center; font: 13px ui-monospace, monospace; }
  .controls button { border: 0; background: none; padding: 0; font: inherit; color: #888; cursor: pointer; }
  .controls button.on { color: #111; font-weight: 700; }
  label { display: flex; gap: 6px; align-items: center; font-family: system-ui, sans-serif; }
  @media (prefers-color-scheme: dark) {
    .dot { background: #555; } .dot.on { background: #eee; }
    .controls button { color: #888; } .controls button.on { color: #eee; }
  }
</style>
