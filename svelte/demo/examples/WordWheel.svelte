<script lang="ts">
  // In your app: import { Detent } from '@hayderkg/detent-svelte'
  import { Detent } from '../../src/lib'

  const verbs = ['build', 'design', 'ship', 'break', 'tune', 'feel']
  let verb = $state('ship')
</script>

<!-- A word that turns inside a sentence; the indicator hugs each word and the rest of the sentence follows its width. -->
<p class="sentence">
  <span>I want to</span>
  <span class="wheel">
    <Detent
      items={verbs}
      bind:value={verb}
      label="Verb"
      loop
      itemHeight={56}
      visibleCount={3}
      curvature={0.9}
      perspective={800}
      fade={0.6}
      dim={0}
      magnify={false}
      mask="none"
      width="4.1em"
      align="start"
      indicator={{ fit: 'content', shape: 'pill', material: 'glass' }}
      style="--detent-font-size:1em;--detent-fg:var(--accent, #ff5a1f);margin-right:calc(var(--indicator-w, 100px) - 4.1em - 4px)"
    />
  </span>
  <span>things.</span>
</p>

<style>
  .sentence {
    --accent: #ff5a1f;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.3em;
    margin: 0;
    padding: 48px 0;
    font-size: 41px;
    font-weight: 600;
    letter-spacing: -0.045em;
    white-space: nowrap;
  }
  .wheel { display: inline-block; }
</style>
