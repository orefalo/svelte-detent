<script lang="ts">
  // In your app: import { Detent } from '@hayderkg/detent-svelte'
  import { Detent } from '../../src/lib'

  const weights = Array.from({ length: 15 }, (_, i) => 300 + i * 50)
  const slants = Array.from({ length: 16 }, (_, i) => i) // degrees, drawn as slnt = -degrees
  const tenths = Array.from({ length: 11 }, (_, i) => i / 10)

  let wght = $state(450)
  let slant = $state(0)
  let casl = $state(0)
  let mono = $state(0)

  const settings = (o: Partial<Record<'wght' | 'slnt' | 'CASL' | 'MONO', number>> = {}) =>
    `"wght" ${o.wght ?? wght}, "slnt" ${o.slnt ?? -slant}, "CASL" ${o.CASL ?? casl}, "MONO" ${o.MONO ?? mono}`

  const weightName = (w: number) => (w < 400 ? 'Light' : w < 500 ? 'Regular' : w < 600 ? 'Medium' : w < 700 ? 'SemiBold' : w < 800 ? 'Bold' : w < 900 ? 'ExtraBold' : w < 1000 ? 'Black' : 'ExtraBlack')
  const family = $derived(`${mono ? 'Mono' : 'Sans'} ${casl ? 'Casual' : 'Linear'}`)
  const css = $derived(settings())

  const presets = [
    { name: 'Sans Linear', casl: 0, mono: 0 },
    { name: 'Sans Casual', casl: 1, mono: 0 },
    { name: 'Mono Linear', casl: 0, mono: 1 },
    { name: 'Mono Casual', casl: 1, mono: 1 },
  ]
  const pick = (p: (typeof presets)[number]) => ((casl = p.casl), (mono = p.mono))

  let copied = $state(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(`font-variation-settings: ${css};`)
      copied = true
      setTimeout(() => (copied = false), 1200)
    } catch {}
  }

  const wheel = { orientation: 'vertical', loop: true, itemHeight: 32, visibleCount: 5, height: 160, highlight: false, magnify: 1.12, fade: 0.34 } as const
</script>

<svelte:head>
  {@html `<style>@font-face{font-family:"Recursive Variable";font-style:oblique 0deg 15deg;font-weight:300 1000;font-display:swap;src:url(https://cdn.jsdelivr.net/npm/@fontsource-variable/recursive/files/recursive-latin-full-normal.woff2) format("woff2-variations")}</style>`}
</svelte:head>

<div class="card">
  <div class="preview">
    <div class="meta"><span class="brand">RECURSIVE</span><span>{family} · {weightName(wght)}</span></div>
    <p class="sample" style:font-variation-settings={css}>Quiet gears click into place</p>
    <div class="code">
      <code><span class="k">"wght"</span> {wght}, <span class="k">"slnt"</span> {-slant}, <span class="k">"CASL"</span> {casl}, <span class="k">"MONO"</span> {mono}</code>
      <button type="button" class="copy" onclick={copy} aria-label="Copy font-variation-settings">{copied ? '✓' : '⧉'}</button>
    </div>
  </div>

  <div class="heads"><span>Weight</span><span>Slant</span><span>Casual</span><span>Mono</span></div>
  <div class="wheels">
    <div class="band"></div>
    <div class="col">
      <Detent {...wheel} items={weights} bind:value={wght} label="Weight">
        {#snippet item(w: number)}<span style:font-variation-settings={settings({ wght: w, MONO: 1 })}>{w}</span>{/snippet}
      </Detent>
    </div>
    <div class="col">
      <Detent {...wheel} items={slants} bind:value={slant} label="Slant" getLabel={(d) => `${d}°`}>
        {#snippet item(d: number)}<span style:font-variation-settings={settings({ slnt: -d, MONO: 1 })}>{d}°</span>{/snippet}
      </Detent>
    </div>
    <div class="col">
      <Detent {...wheel} items={tenths} bind:value={casl} label="Casual" getLabel={(v) => v.toFixed(1)}>
        {#snippet item(v: number)}<span style:font-variation-settings={settings({ CASL: v, MONO: 1 })}>{v.toFixed(1)}</span>{/snippet}
      </Detent>
    </div>
    <div class="col">
      <Detent {...wheel} items={tenths} bind:value={mono} label="Mono" getLabel={(v) => v.toFixed(1)}>
        {#snippet item(v: number)}<span style:font-variation-settings={settings({ MONO: v })}>{v.toFixed(1)}</span>{/snippet}
      </Detent>
    </div>
  </div>

  <div class="chips" role="group" aria-label="Family">
    {#each presets as p (p.name)}
      <button type="button" class:on={casl === p.casl && mono === p.mono} style:font-variation-settings={settings({ wght: 500, slnt: 0, CASL: p.casl, MONO: p.mono })} onclick={() => pick(p)}>{p.name}</button>
    {/each}
  </div>
</div>

<style>
  .card { width: 380px; max-width: 100%; margin: 0 auto; font-size: 11px; }
  .preview { padding: 18px; border-radius: 16px; background: rgb(0 0 0 / 0.04); }
  .meta { display: flex; justify-content: space-between; align-items: baseline; color: #6b6b6b; }
  .brand { font: 500 9.5px ui-monospace, monospace; letter-spacing: 0.08em; }
  .sample { margin: 18px 0 16px; font: 400 28.88px/1.15 'Recursive Variable', system-ui, sans-serif; min-height: 66px; }
  .code { display: flex; justify-content: space-between; align-items: center; padding: 0 10px; height: 36px; border-radius: 10px; background: #fff; box-shadow: 0 0 0 1px rgb(0 0 0 / 0.08); }
  .code code { font: 11px ui-monospace, monospace; color: #0a0a0a; }
  .code .k { color: #6b6b6b; }
  .copy { border: 0; background: none; cursor: pointer; color: #6b6b6b; font-size: 14px; }
  .heads { display: grid; grid-template-columns: repeat(4, 1fr); margin-top: 18px; text-align: center; font-size: 10px; font-weight: 550; letter-spacing: 0.08em; text-transform: uppercase; color: #6b6b6b; }
  .wheels { position: relative; display: grid; grid-template-columns: repeat(4, 1fr); margin-top: 6px; }
  .band { position: absolute; left: 0; right: 0; top: 64px; height: 32px; border-radius: 10px; background: rgb(0 0 0 / 0.04); box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.08); pointer-events: none; }
  .col { font: 13px 'Recursive Variable', ui-monospace, monospace; font-variation-settings: 'MONO' 1; }
  .col :global(span) { font-family: 'Recursive Variable', ui-monospace, monospace; }
  .chips { display: flex; gap: 2px; margin-top: 16px; padding: 2px; height: 36px; box-sizing: border-box; border-radius: 12px; background: rgb(0 0 0 / 0.04); }
  .chips button { flex: 1; border: 0; border-radius: 10px; background: none; font: 11.5px 'Recursive Variable', system-ui, sans-serif; color: #6b6b6b; cursor: pointer; }
  .chips button.on { background: #fff; color: #0a0a0a; box-shadow: 0 1px 2px rgb(0 0 0 / 0.1); }
  @media (prefers-color-scheme: dark) {
    .preview, .band, .chips { background: rgb(255 255 255 / 0.06); } .code { background: #222; box-shadow: 0 0 0 1px rgb(255 255 255 / 0.1); }
    .code code, .chips button.on { color: #fff; } .chips button.on { background: #333; } .meta, .heads, .code .k, .copy, .chips button { color: #999; }
  }
</style>
