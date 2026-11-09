<script lang="ts">
  // In your app: import { Detent, DetentText, DetentNumber } from '@hayderkg/detent-svelte'
  import { Detent, DetentNumber, DetentText } from '../../src/lib'

  const verbs = ['climbs', 'rolls', 'snaps', 'locks', 'clicks', 'settles', 'slots', 'falls', 'counts']
  let verb = $state('clicks')
  let count = $state(10)

  // "counts" brings its own number, which rolls to a new value every time the wheel lands on it.
  function changed(v: string) {
    verb = v
    if (v === 'counts') count = 2 + Math.floor(Math.random() * 98)
  }
</script>

<div class="card">
  <p class="sentence" style="--accent:#ff5a1f">
    <DetentText text="It" />
    <Detent
      items={verbs}
      value={verb}
      onChange={changed}
      loop
      label="Verb"
      itemHeight={46}
      visibleCount={3}
      width={142}
      height={168}
      align="start"
      curvature={0.9}
      fade={0.62}
      dim={0}
      mask="none"
      magnify={false}
      indicator={{
        shape: 'pill',
        fit: 'content',
        background: 'color-mix(in oklab, var(--accent) 5%, transparent)',
        shadow: 'inset 0 0 0 1px color-mix(in oklab, var(--accent) 12%, transparent), inset 0 1px 0 rgb(255 255 255 / .4), 0 8px 24px -12px rgb(0 0 0 / .28)',
      }}
      style="--detent-font-size:1em;--detent-fg:var(--accent)"
    />
    {#if verb === 'counts'}<DetentNumber value={count} />{/if}
    <DetentText text="into place." />
  </p>
</div>

<style>
  .card { display: grid; place-items: center; min-height: 340px; width: 100%; }
  .sentence { display: flex; align-items: center; gap: 0.26em; margin: 0; font-size: 41px; font-weight: 600; letter-spacing: -0.045em; white-space: nowrap; }
</style>
