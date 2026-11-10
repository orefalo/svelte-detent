<script lang="ts">
  // In your app: import { Detent, DetentNumber, DetentText } from 'svelte-detent'
  import { ticks } from '../../src/lib'
  import { Detent, DetentNumber, DetentText } from '../../src/lib'

  const tick = ticks({ sound: { volume: 0.3, dynamicTimbre: 0.35 }, haptics: true })
  const endings: Record<string, string> = {
    snaps: 'into focus.',
    locks: 'into gear.',
    clicks: 'into place.',
    settles: 'into a 🎵.',
    slots: 'into place.',
    falls: 'into line.',
    counts: 'to ',
    climbs: 'to ',
    rolls: 'to ',
  }
  const verbs = ['snaps', 'locks', 'clicks', 'settles', 'slots', 'falls', 'counts', 'climbs', 'rolls']
  /** The verbs that end in a number, and the number they count to. */
  const numbers: Record<string, number> = { counts: 10, climbs: 99, rolls: 100 }

  let verb = $state('clicks')
  let count = $state(10)
  const counting = $derived(verb in numbers)
</script>

<div class="hero-word">
  <div class="hero-sentence">
    <span class="hero-rest">It</span>
    <span class="hero-word-wheel">
      <Detent
        onTick={tick}
        items={verbs}
        defaultValue="clicks"
        onChange={(v: string) => {
          verb = v
          if (v in numbers) count = numbers[v]!
        }}
        loop
        label="Verb"
        visibleCount={3}
        itemHeight={46}
        width="4.6em"
        align="start"
        curvature={0.9}
        fade={0.62}
        dim={0}
        magnify={false}
        motionBlur={1.1}
        elasticRows={0.7}
        grip={0.75}
        indicator={{ fit: 'content', material: 'glass', shape: 'pill', paddingX: 12, paddingY: 4, refraction: 1.3, refractionRGB: 0.16, impact: 0.22 }}
        maskSize="34%"
        style="--detent-font-size:1em;--detent-fg:var(--accent, #ff5a1f);margin-right:calc(var(--indicator-w, 4.6em) + 8px - 4.6em)"
      />
    </span>
    <span class="hero-ending hero-rest">
      <DetentText text={endings[verb]!} />
      <span class="hero-number-slot" data-visible={counting} aria-hidden={!counting}>
        <span class="hero-number-clip"><DetentNumber value={count} locales="en-US" />.</span>
      </span>
    </span>
  </div>
</div>

<style>
  .hero-word { --accent: #ff5a1f; display: grid; place-items: center; width: 100%; min-height: 138px; --hero-size: clamp(26px, 7vw, 38px); }
  /* The hero: one word turning inside a sentence. */
  .hero-sentence { position: relative; display: flex; align-items: center; gap: 0 0.24em; font-size: var(--hero-size); font-weight: 600; letter-spacing: -0.04em; line-height: 1; }
  .hero-rest { white-space: nowrap; }
  .hero-word-wheel { position: relative; display: flex; align-items: center; flex: none; }
  .hero-ending { display: inline-flex; align-items: baseline; }
  .hero-number-slot { display: inline-grid; grid-template-columns: 0fr; opacity: 0; transition: grid-template-columns 450ms cubic-bezier(0.23, 1, 0.32, 1), opacity 200ms ease-out; }
  .hero-number-slot[data-visible='true'] { grid-template-columns: 1fr; opacity: 1; }
  /* Reveal the width without cutting off the number's vertical roll and its soft edges. */
  .hero-number-clip { min-width: 0; clip-path: inset(-0.25em 0); }
  @media (prefers-reduced-motion: reduce) { .hero-number-slot { transition: none; } }
</style>
