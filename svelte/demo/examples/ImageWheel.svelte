<script lang="ts">
  // In your app: import { Detent } from 'svelte-detent'
  import { ticks } from '@hayderkg/detent/feedback'
  import { Detent } from '../../src/lib'
  import WheelNudge from '../site/WheelNudge.svelte'

  /** Replace `base` with wherever you host the stamps. */
  let { base = 'https://detent.hayder.sh' }: { base?: string } = $props()

  const tick = ticks({ sound: true, haptics: true })
  const stamps = [
    { id: 'yama', kanji: '山', meaning: 'Mountain' },
    { id: 'kawa', kanji: '川', meaning: 'River' },
    { id: 'tsuki', kanji: '月', meaning: 'Moon' },
    { id: 'hana', kanji: '花', meaning: 'Flower' },
    { id: 'kaze', kanji: '風', meaning: 'Wind' },
    { id: 'yuki', kanji: '雪', meaning: 'Snow' },
    { id: 'mori', kanji: '森', meaning: 'Forest' },
    { id: 'umi', kanji: '海', meaning: 'Sea' },
  ].map((s) => ({ ...s, src: `${base}/stamps/${s.id}.webp` }))
  type Stamp = (typeof stamps)[number]

  let open = $state(false)
  let value = $state<Stamp>(stamps[4]!)
</script>

<div class="scene postcard-scene">
  <div class="postcard">
    <div class="postcard-msg">
      <p>Greetings from Kyoto.</p>
      <p class="postcard-hand">
        It clicks like the shrine bells. Wish you were here!
        <svg class="postcard-scribble" viewBox="0 0 120 18" aria-hidden="true"><path d="M3 11c12-6 22-7 30-2s14 6 22 1 15-7 24-3 16 5 23 0c4-3 8-4 13-2" /><path d="M96 4c3 1 5 3 5 6" /></svg>
      </p>
    </div>
    <div class="postcard-side">
      <button type="button" class="postcard-slot" aria-expanded={open} aria-label={open ? 'Hide stamps' : 'Choose a stamp'} onclick={() => (open = !open)}>
        {#if open}
          {#key value.id}<img src={value.src} alt="{value.meaning} stamp" width="54" height="83" class="postcard-stamp" />{/key}
          <span class="postmark" aria-hidden="true"></span>
        {:else}
          <span class="postcard-empty">stamp</span>
        {/if}
      </button>
      <div class="postcard-lines" aria-hidden="true"><span></span><span></span><span></span></div>
    </div>
    {#if !open}<WheelNudge arrow="right" style="top:34px;right:74px">pick a stamp!</WheelNudge>{/if}
  </div>

  <div class="reveal" data-open={open || undefined}>
    <div class="reveal-inner" inert={!open}>
      <div class="stamp-strip">
        <div class="wheel">
          <Detent
            onTick={tick}
            items={stamps}
            getKey={(s) => s.id}
            getLabel={(s) => `${s.meaning} (${s.kanji})`}
            bind:value
            label="Stamp"
            orientation="horizontal"
            itemHeight={136}
            visibleCount={3}
            loop
            height={222}
            style="max-width:100%"
            perspective={700}
            curvature={0.75}
            fade={0.1}
            dim={0}
            indicator={{ shape: 'none' }}
            magnify={false}
            selectedDepth={10}
            elasticRows={0.6}
            velocityTilt={0.6}
            grip={0.7}
          >
            {#snippet item(s: Stamp)}
              <figure>
                <img src={s.src} alt="{s.meaning} stamp, {s.kanji}" width="124" height="191" loading="lazy" decoding="async" draggable="false" />
              </figure>
            {/snippet}
          </Detent>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .scene { --bg: #fff; --fg: #111; --muted: #888; --ease-out: cubic-bezier(0.23, 1, 0.32, 1); justify-items: center; gap: 18px; width: 100%; display: grid; }
  .postcard-scene { gap: 0; }
  .scene > .reveal { justify-items: stretch; }

  .postcard { aspect-ratio: 3/2; color: #2a2620; box-sizing: border-box; background: #f8f4ec; border-radius: 5px; grid-template-columns: 1.15fr 1fr; gap: 14px; width: min(340px, 100%); padding: 14px; display: grid; transform: rotate(-1.2deg);
    box-shadow: 0 0 0 0.5px #46321e1f, 0 1px 1px #46321e0d, 0 6px 14px -8px #46321e29, 0 20px 34px -24px #46321e38; z-index: 2; position: relative; }
  .postcard-msg { border-right: 1px solid #0000001a; align-content: end; gap: 4px; padding-right: 12px; display: grid; }
  .postcard-msg p { font-family: 'Newsreader', Georgia, serif; white-space: nowrap; margin: 0; font-size: 13px; font-style: italic; line-height: 1.2; color: #2a2620; }
  .postcard-msg .postcard-hand { font-family: 'Covered By Your Grace', 'Bradley Hand', cursive; font-style: normal; white-space: normal; text-wrap: balance; color: #2f3a6b; font-size: 17px; line-height: 1.15; position: relative; }
  .postcard-scribble { fill: none; stroke: #2f3a6b; stroke-width: 1.4px; stroke-linecap: round; stroke-linejoin: round; opacity: 0.8; width: 92px; height: 14px; margin-top: 2px; display: block; }
  .postcard-side { grid-template-rows: auto 1fr; gap: 12px; display: grid; }
  .postcard-stamp { width: 54px; height: 83px; animation: stamp-land 0.42s cubic-bezier(0.32, 0.72, 0, 1); display: block; z-index: 1; position: relative; }
  @keyframes stamp-land { 0% { opacity: 0; transform: translate(10px, -14px) rotate(8deg) scale(1.12); } }
  .postmark { mix-blend-mode: multiply; pointer-events: none; background: repeating-linear-gradient(0deg, #0000 0 5px, #2a26202e 5px 6px); border: 1.5px solid #2a262059; border-radius: 50%; width: 44px; height: 44px; position: absolute; top: 22px; left: -26px; }
  .postcard-lines { align-content: end; gap: 14px; display: grid; }
  .postcard-lines span { background: #00000029; height: 1px; }
  button.postcard-slot { justify-self: end; width: 54px; height: 83px; position: relative; cursor: pointer; transition: transform 0.15s var(--ease-out); -webkit-tap-highlight-color: transparent; background: none; border: 0; padding: 0; display: block; }
  button.postcard-slot:active { transform: scale(0.97); }
  button.postcard-slot:focus-visible { outline-offset: 3px; border-radius: 3px; outline: 1.5px solid #2a262073; }
  .postcard-empty { box-sizing: border-box; width: 54px; height: 83px; font-family: 'Geist Mono', monospace; letter-spacing: 0.08em; text-transform: uppercase; color: #2a262073; border: 1.5px dashed #2a262059; border-radius: 3px; place-items: center; font-size: 9px; display: grid; }

  .reveal { opacity: 0; grid-template-rows: 0fr; width: 100%; transition: grid-template-rows 0.42s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.3s; display: grid; }
  .reveal[data-open] { opacity: 1; grid-template-rows: 1fr; margin-top: -26px; transition: grid-template-rows 0.42s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.3s, margin-top 0.42s cubic-bezier(0.32, 0.72, 0, 1); }
  .reveal-inner { justify-items: stretch; min-height: 0; display: grid; overflow: hidden; }

  /* The stamps sit on a perforated strip of paper. */
  .stamp-strip { box-sizing: border-box; background: #f4efe4; border-radius: 6px; justify-self: stretch; width: 100%; padding: 40px 0 4px; position: relative; box-shadow: inset 0 0 0 0.5px #46321e1f;
    -webkit-mask: radial-gradient(3px at 6px 0, #0000 98%, #000) 0 0/12px 51% repeat-x, radial-gradient(3px at 6px 100%, #0000 98%, #000) 0 100%/12px 51% repeat-x;
    mask: radial-gradient(3px at 6px 0, #0000 98%, #000) 0 0/12px 51% repeat-x, radial-gradient(3px at 6px 100%, #0000 98%, #000) 0 100%/12px 51% repeat-x; }
  .wheel { display: grid; width: 100%; justify-items: center; }
  .stamp-strip :global([data-detent-ui]) { color: #2a2620; height: 222px !important; }
  figure { position: relative; margin: 0; display: flex; flex-direction: column; align-items: center; gap: 8px; }
  /* Off center, a stamp goes grey and dim. */
  figure img { scale: 0.86; filter: grayscale(calc(min(1, var(--abs-offset)) * 100%)) brightness(calc(1 - min(0.35, var(--abs-offset) * 0.18))); }

  @media (prefers-reduced-motion: reduce) { .postcard-stamp { animation: none; } .reveal { transition: opacity 0.15s; } }
  @media (prefers-color-scheme: dark) { .stamp-strip { background: #cfc6b3; box-shadow: inset 0 0 0 0.5px #0003, inset 0 10px 24px -12px #00000040; } }
</style>
