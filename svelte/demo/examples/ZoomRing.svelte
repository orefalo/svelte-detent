<script lang="ts">
  // In your app: import { Detent, DetentNumber } from '@hayderkg/detent-svelte'
  import { Detent, DetentNumber } from '../../src/lib'

  /** Replace `base` with wherever you host the photo. */
  let { base = 'https://detent.hayder.sh' }: { base?: string } = $props()

  const MIN = 24
  const lengths = Array.from({ length: 70 - MIN + 1 }, (_, i) => MIN + i)
  const marks = new Set([24, 28, 35, 40, 50, 70])
  let value = $state(35)
  let flash = $state(0)
</script>

<div class="demo">
  <div class="frame">
    <img src="{base}/photos/valley.webp" alt="" style:transform="scale({value / MIN})" />
    {#key flash}<div class="flash" class:go={flash > 0}></div>{/key}
    <i class="corner tl"></i><i class="corner tr"></i><i class="corner bl"></i><i class="corner br"></i>
    <button type="button" class="shutter" aria-label="Take photo" onclick={() => flash++}><span></span></button>
    <output class="mono readout"><DetentNumber {value} /> mm</output>
  </div>

  <Detent
    items={lengths}
    bind:value
    label="Focal length"
    orientation="horizontal"
    itemHeight={24}
    visibleCount={13}
    height={62}
    curvature={0.5}
    fade={0.07}
    dim={0.06}
    mask="none"
    magnify={false}
    indicator={{ shape: 'needle', color: '#ff5a1f' }}
    changeOn="tick"
    style="width:312px"
  >
    {#snippet item(v: number)}
      <span class="mark">
        <span class="tick" class:major={marks.has(v)}></span>
        <span class="mono label">{marks.has(v) ? v : ''}</span>
      </span>
    {/snippet}
  </Detent>
</div>

<style>
  .demo { display: grid; justify-items: center; gap: 12px; }
  .frame { position: relative; width: 320px; height: 213px; overflow: hidden; border-radius: 10px; background: #e9e4d8; color: #fff; }
  .frame img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transform-origin: center; transition: transform 0.22s cubic-bezier(0.23, 1, 0.32, 1); }
  .flash { position: absolute; inset: 0; background: #fff; opacity: 0; pointer-events: none; }
  .flash.go { animation: flash 0.18s ease-out; }
  @keyframes flash { from { opacity: 0.85; } to { opacity: 0; } }
  .corner { position: absolute; width: 18px; height: 18px; border: 0 solid rgb(255 255 255 / 0.85); }
  .tl { top: 12px; left: 12px; border-top-width: 1.5px; border-left-width: 1.5px; }
  .tr { top: 12px; right: 12px; border-top-width: 1.5px; border-right-width: 1.5px; }
  .bl { bottom: 12px; left: 12px; border-bottom-width: 1.5px; border-left-width: 1.5px; }
  .br { bottom: 12px; right: 12px; border-bottom-width: 1.5px; border-right-width: 1.5px; }
  .shutter { position: absolute; left: 50%; bottom: 14px; width: 36px; height: 36px; margin-left: -18px; border-radius: 50%; background: rgb(255 255 255 / 0.05); box-shadow: 0 0 0 1px rgb(255 255 255 / 0.5); border: 0; padding: 0; cursor: pointer; display: grid; place-items: center; }
  .shutter span { width: 26px; height: 26px; border-radius: 50%; background: rgb(255 255 255 / 0.44); }
  .mono { font-family: ui-monospace, 'SF Mono', Menlo, monospace; }
  .readout { position: absolute; right: 28px; bottom: 24px; font-size: 12px; }
  .mark { display: grid; justify-items: center; gap: 4px; }
  .tick { width: 1px; height: 10px; background: currentColor; opacity: 0.6; }
  .tick.major { height: 19px; opacity: 1; }
  .label { font-size: 10px; height: 16px; }
</style>
