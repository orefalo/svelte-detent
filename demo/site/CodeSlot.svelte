<script lang="ts">
  import { getContext } from 'svelte'
  import ExampleCode from './ExampleCode.svelte'

  /**
   * For examples whose code follows their state (the tab, the language, a switch). On the examples page the code is
   * handed up to the panel under the card, which looks like every other example's. Shown on its own (`?e=Name`), it
   * renders that panel itself.
   */
  let { code, file }: { code: string; file: string } = $props()
  const publish = getContext<((code: string | null) => void) | undefined>('example-code')

  $effect(() => {
    publish?.(code)
    return () => publish?.(null)
  })
</script>

{#if !publish}<ExampleCode {code} {file} />{/if}
