<script lang="ts">
  import { setContext, type Component } from 'svelte'

  /** Mounts an example and lets it hand its live code up to the page (see CodeSlot). */
  let { Example, onCode }: { Example: Component; onCode: (code: string | null) => void } = $props()
  // The callback never changes for a given card.
  // svelte-ignore state_referenced_locally
  setContext('example-code', onCode)
</script>

<Example />
