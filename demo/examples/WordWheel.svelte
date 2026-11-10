<script lang="ts">
  // In your app: import { Detent } from 'svelte-detent'
  import { ticks } from '../../src/lib'
  import { Detent } from '../../src/lib'

  const tick = ticks({ sound: true, haptics: true })
  const verbs = ['build', 'design', 'ship', 'break', 'tune', 'feel']
</script>

<div class="line">
  <span class="rest">I want to</span>
  <Detent
    onTick={tick}
    items={verbs}
    defaultValue="ship"
    loop
    label="Verb"
    visibleCount={3}
    itemHeight={56}
    width="4.1em"
    align="start"
    curvature={0.9}
    fade={0.6}
    dim={0}
    magnify={false}
    indicator={{ fit: 'content', material: 'glass', shape: 'pill', paddingX: 12, paddingY: 4 }}
    maskSize="40%"
    style="--detent-font-size:1em;--detent-fg:var(--accent, #ff5a1f);margin-right:calc(var(--indicator-w, 4.1em) + 8px - 4.1em)"
  />
  <span class="rest">things.</span>
</div>

<style>
  .line { --accent: #ff5a1f; display: flex; align-items: center; gap: 0 0.26em; margin: 0; font-size: clamp(24px, 5.4vw, 41px); font-weight: 600; letter-spacing: -0.045em; line-height: 1; }
  .rest { white-space: nowrap; }
</style>
