<script lang="ts">
  import { Detent } from '../src/lib'

  let { items, initial, onChange, ...rest }: { items: string[]; initial?: string; onChange?: (v: string) => void; [k: string]: unknown } = $props()
  let value = $state<string | undefined>(untrackInitial())
  function untrackInitial() { return initial }
</script>

<Detent {items} label="Letters" bind:value onChange={(v) => onChange?.(v as string)} {...rest}>
  {#snippet item(it: string, s)}
    <b data-sel={s.selected}>{it}</b>
  {/snippet}
</Detent>
<output data-testid="bound">{value ?? ''}</output>
