<script lang="ts">
  // In your app: import { Detent } from '@hayderkg/detent-svelte'
  import { Detent } from '../../src/lib'

  /** Replace with wherever you host the images. */
  let { base = 'https://detent.hayder.sh/stamps' }: { base?: string } = $props()

  const stamps = [
    ['yama', 'Mountain'], ['kawa', 'River'], ['tsuki', 'Moon'], ['hana', 'Flower'],
    ['kaze', 'Wind'], ['yuki', 'Snow'], ['mori', 'Forest'], ['umi', 'Sea'],
  ].map(([id, name]) => ({ id: id!, name: name!, src: `${base}/${id}.webp` }))

  let open = $state(false)
  let value = $state(stamps[4]!)
  let chosen = $state<(typeof stamps)[number] | null>(null)
</script>

<svelte:head>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Covered+By+Your+Grace&family=Kalam&display=swap" />
</svelte:head>

<div class="card">
  <div class="postcard">
    <p class="hint">pick a stamp!
      <svg viewBox="0 0 60 20" width="42" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 14c14-10 34-10 54-2M48 4l9 8-10 5" /></svg>
    </p>
    <button type="button" class="slot" aria-label="Choose a stamp" aria-expanded={open} onclick={() => ((open = !open), (chosen = value))}>
      {#if chosen}<img src={chosen.src} alt={chosen.name} />{:else}<span>STAMP</span>{/if}
    </button>
    <div class="divider"></div>
    <h3>Greetings from Kyoto.</h3>
    <p class="msg">It clicks like the shrine bells. Wish you were here!</p>
    <div class="lines"><i></i><i></i><i></i></div>
  </div>

  {#if open}
    <div class="tray">
      <Detent
        items={stamps}
        bind:value
        onChange={(s) => (chosen = s)}
        getKey={(s) => s.id}
        getLabel={(s) => s.name}
        label="Stamp"
        orientation="horizontal"
        itemHeight={136}
        visibleCount={3}
        height={222}
        perspective={700}
        curvature={0.75}
        fade={0.1}
        dim={0}
        highlight={false}
        magnify={false}
        mask="none"
      >
        {#snippet item(s)}
          <figure>
            <img src={s.src} alt="" draggable="false" />
            <figcaption>{s.name}</figcaption>
          </figure>
        {/snippet}
      </Detent>
    </div>
  {/if}
</div>

<style>
  .card { display: grid; justify-items: center; gap: 14px; width: 100%; min-height: 330px; align-content: start; }
  .postcard { position: relative; width: min(340px, 100%); aspect-ratio: 340 / 215; background: #f5f2ea; border-radius: 4px; box-shadow: 0 10px 28px -10px rgb(0 0 0 / 0.35), 0 1px 3px rgb(0 0 0 / 0.15); transform: rotate(-1deg); color: #1a1a1a; }
  .divider { position: absolute; left: 52%; top: 8%; bottom: 8%; width: 1px; background: rgb(0 0 0 / 0.15); }
  .hint { position: absolute; left: 38%; top: 16%; margin: 0; display: flex; align-items: center; gap: 6px; color: #e5261b; font: 19px 'Covered By Your Grace', cursive; transform: rotate(-4deg); }
  .slot { position: absolute; right: 6%; top: 8%; width: 54px; height: 83px; display: grid; place-items: center; padding: 0; border: 1.5px dashed rgb(0 0 0 / 0.35); background: transparent; color: rgb(0 0 0 / 0.4); font: 9px ui-monospace, monospace; letter-spacing: 0.08em; cursor: pointer; }
  .slot img { width: 100%; height: 100%; object-fit: cover; }
  h3 { position: absolute; left: 5%; bottom: 36%; margin: 0; font: italic 400 16px Georgia, serif; }
  .msg { position: absolute; left: 5%; bottom: 14%; width: 44%; margin: 0; color: #2b3a8a; font: 13px/1.7 'Kalam', cursive; }
  .lines { position: absolute; left: 58%; right: 5%; bottom: 14%; display: grid; gap: 10px; }
  .lines i { height: 1px; background: rgb(0 0 0 / 0.25); }
  .tray { display: grid; justify-items: center; width: min(100%, 487px); padding: 0; border-radius: 6px; background: #f1ecdd; border: 2px dotted rgb(0 0 0 / 0.12); overflow: hidden; }
  figure { margin: 0; padding: 16px 6px; display: flex; flex-direction: column; align-items: center; }
  figure img { display: block; width: 108px; height: 166px; object-fit: cover; filter: grayscale(calc(min(1, var(--abs-offset)) * 100%)) brightness(calc(1 - min(0.35, var(--abs-offset) * 0.18))); user-select: none; }
  figcaption { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
</style>
