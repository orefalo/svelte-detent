<script lang="ts">
  // In your app: import { Detent, DetentNumber } from 'svelte-detent'
  import { onDestroy } from 'svelte'
  import { ticks } from '../../src/lib'
  import { Detent, DetentNumber } from '../../src/lib'
  import { createSfx } from '../site/beyond-helpers'

  /** Replace `base` with wherever you host the photo. */
  let { base = 'https://detent.hayder.sh' }: { base?: string } = $props()

  const lengths = Array.from({ length: 37 }, (_, i) => 24 + i)
  const marks = new Set([24, 28, 35, 40, 50, 60])
  let value = $state(35)
  let shots = $state(0)
  const sfx = createSfx()
  onDestroy(() => sfx.close())
  const tick = ticks({ sound: { volume: 0.3, dynamicTimbre: 0.45 }, haptics: true })
</script>

<div class="zoom-demo">
  <div class="frame">
    <img
      src="{base}/photos/valley.webp"
      alt="A misty mountain valley with a small temple and wooden houses on the hillside"
      draggable="false"
      style:transform="scale({value / 24})"
    />
    <svg aria-hidden="true" viewBox="0 0 300 200" preserveAspectRatio="none" class="corners">
      <path d="M1 20V3a2 2 0 0 1 2-2h17M280 1h17a2 2 0 0 1 2 2v17M299 180v17a2 2 0 0 1-2 2h-17M20 199H3a2 2 0 0 1-2-2v-17" vector-effect="non-scaling-stroke" />
    </svg>
    {#key shots}<div class={shots ? 'camera-flash camera-flash-on' : 'camera-flash'} aria-hidden="true"></div>{/key}
    <button
      type="button"
      class="camera-shutter"
      aria-label="Take a demo photo"
      onpointerdown={sfx.prime}
      onkeydown={sfx.prime}
      onclick={() => {
        sfx.prime()
        sfx.play('shutter')
        shots++
      }}><span></span></button>
    <span class="camera-status" role="status">{shots ? `Photo ${shots} captured` : ''}</span>
    <output class="mono readout" aria-label="{value} mm"><DetentNumber {value} locales="en-US" snapDuration={220} /> mm</output>
  </div>

  <div class="wheel">
    <Detent
      items={lengths}
      getLabel={(v) => `${v} millimetres`}
      bind:value
      changeOn="tick"
      onTick={tick}
      label="Focal length"
      orientation="horizontal"
      itemHeight={24}
      visibleCount={13}
      height={62}
      curvature={0.5}
      fade={0.07}
      dim={0.06}
      magnify={false}
      centerLight={0.12}
      grip={0.4}
      indicator={{ shape: 'needle', color: 'var(--accent, #ff5a1f)' }}
    >
      {#snippet item(v: number)}
        <span class="mark">
          <span class="tick" style:width="{marks.has(v) ? 2 : 1}px" style:height="{marks.has(v) ? 20 : 11}px" style:opacity={marks.has(v) ? 1 : 0.5}></span>
          <span class="mono label" style:visibility={marks.has(v) ? 'visible' : 'hidden'}>{v}</span>
        </span>
      {/snippet}
    </Detent>
  </div>
</div>

<style>
  .zoom-demo { --accent: #ff5a1f; display: grid; grid-template-columns: minmax(0, 1fr); justify-items: center; gap: 12px; width: 100%; }
  .frame { position: relative; width: min(320px, 100%); aspect-ratio: 3 / 2; overflow: hidden; border-radius: 10px; background: #e9e4d8; }
  .frame img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transform-origin: 80% 60%; transition: transform 220ms cubic-bezier(0.23, 1, 0.32, 1); }
  .corners { position: absolute; inset: 10px; width: calc(100% - 20px); height: calc(100% - 20px); fill: none; stroke: rgb(255 255 255 / 0.85); stroke-width: 1.5; }
  .mono { font-family: 'Geist Mono', ui-monospace, 'SF Mono', Menlo, monospace; }
  .readout { position: absolute; right: 16px; bottom: 12px; font-size: 12px; color: #fff; text-shadow: 0 1px 2px rgb(0 0 0 / 0.4); }
  .wheel { width: max-content; max-width: 100%; }
  .mark { display: grid; justify-items: center; gap: 6px; align-self: start; padding-top: 8px; }
  .tick { border-radius: 1px; background: currentColor; }
  .label { font-size: 10px; }

  .camera-shutter { position: absolute; left: 50%; bottom: 14px; translate: -50% 0; display: grid; place-items: center; width: 36px; height: 36px; padding: 0; box-sizing: border-box; appearance: none; border: 1px solid #ffffff50; border-radius: 50%; background: #ffffff0d; color: #fff; cursor: pointer; backdrop-filter: blur(6px); transition: background-color 150ms ease, transform 150ms ease; }
  .camera-shutter span { display: block; width: 26px; height: 26px; border-radius: 50%; background: #ffffff70; box-shadow: 0 1px 5px #0001; }
  .camera-shutter:active { transform: scale(0.94); }
  .camera-shutter:focus-visible { outline: 2px solid white; outline-offset: 3px; }
  .camera-flash { position: absolute; inset: 0; background: #fff; opacity: 0; pointer-events: none; }
  .camera-flash-on { animation: camera-capture 260ms ease-out; }
  @keyframes camera-capture { 0% { opacity: 0.35; } 100% { opacity: 0; } }
  .camera-status { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
  @media (hover: hover) and (pointer: fine) { .camera-shutter:hover { background: #ffffff20; } }
  @media (prefers-reduced-motion: reduce) { .camera-flash-on { animation: none; } .camera-shutter, .zoom-demo img { transition: none !important; } }
</style>
