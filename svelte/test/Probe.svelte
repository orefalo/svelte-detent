<script lang="ts">
  import { createDetent, type DetentApi, type DetentOptions } from '../src/lib'

  let { options, out }: { options: () => DetentOptions<string>; out: { api?: DetentApi<string> } } = $props()
  const d = createDetent(() => options())
  // svelte-ignore state_referenced_locally
  out.api = d
</script>

<div {...d.rootAttrs} style={d.rootStyle} {@attach d.attachRoot}>
  <div {...d.trackAttrs} style={d.trackStyle} {@attach d.attachTrack}>
    {#each d.rows as r (r.key)}
      <div {...r.attrs} style={r.style}><button type="button">{r.item}</button></div>
    {/each}
  </div>
</div>
