<script lang="ts">
  import { createDetent, type DetentApi, type DetentOptions } from '../src/lib'

  let { options, out }: { options: () => DetentOptions<string>; out: { api?: DetentApi<string> } } = $props()
  const d = createDetent(() => options())
  // svelte-ignore state_referenced_locally
  out.api = d
</script>

<div {...d.rootAttrs} style={d.rootStyle} {@attach d.attachRoot}>
  <div {...d.trackAttrs} style={d.trackStyle} {@attach d.attachTrack}>
    {#if d.header}<div {...d.header.attrs} style={d.header.style}><button type="button">Search</button></div>{/if}
    {#each d.rows as r (r.key)}
      <div {...r.attrs} style={r.style}>{r.item}</div>
    {/each}
    {#if d.footer}<div {...d.footer.attrs} style={d.footer.style}>More</div>{/if}
  </div>
</div>
