<script lang="ts">
  // In your app: import { Detent, DetentNumber, DetentText } from 'svelte-detent'
  import { ticks } from '@hayderkg/detent/feedback'
  import { onMount } from 'svelte'
  import { Detent, DetentNumber, DetentText } from '../../src/lib'

  const range = (from: number, to: number, step: number) => Array.from({ length: Math.round((to - from) / step) + 1 }, (_, i) => +(from + i * step).toFixed(2))
  const axes = [
    { tag: 'wght', name: 'Weight', values: range(300, 1000, 50), label: (v: number) => String(v), start: 450 },
    { tag: 'slnt', name: 'Slant', values: range(0, -15, -1), label: (v: number) => `${Math.abs(v)}°`, start: 0 },
    { tag: 'CASL', name: 'Casual', values: range(0, 1, 0.1), label: (v: number) => v.toFixed(1), start: 0 },
    { tag: 'MONO', name: 'Mono', values: range(0, 1, 0.1), label: (v: number) => v.toFixed(1), start: 0 },
  ]
  const styles = [
    { name: 'Sans Linear', CASL: 0, MONO: 0 },
    { name: 'Sans Casual', CASL: 1, MONO: 0 },
    { name: 'Mono Linear', CASL: 0, MONO: 1 },
    { name: 'Mono Casual', CASL: 1, MONO: 1 },
  ]
  const weightNames = ['', '', '', 'Light', 'Regular', 'Medium', 'SemiBold', 'Bold', 'ExtraBold', 'Black', 'ExtraBlack']
  const tick = ticks({ sound: { volume: 0.22 }, haptics: true })

  let values = $state<Record<string, number>>(Object.fromEntries(axes.map((a) => [a.tag, a.start])))
  let root = $state<HTMLElement | null>(null)
  let specimen = $state<HTMLElement | null>(null)
  let copied = $state(false)

  // The specimen reads its axes from CSS variables: the wheels write them every frame, so it moves between steps.
  onMount(() => {
    for (const a of axes) root?.style.setProperty(`--${a.tag}`, String(a.start))
    // With a mouse, the caret starts in the specimen once it is on screen (unless focus is already somewhere).
    const el = specimen
    if (!el || !matchMedia('(hover: hover) and (pointer: fine)').matches) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        io.disconnect()
        if (document.activeElement && document.activeElement !== document.body) return
        el.focus({ preventScroll: true })
        getSelection()?.collapse(el, el.childNodes.length)
      },
      { threshold: 0.9 },
    )
    io.observe(el)
    return () => io.disconnect()
  })

  const css = $derived(`font-variation-settings: ${axes.map((a) => `"${a.tag}" ${values[a.tag]}`).join(', ')};`)
  const current = $derived(styles.findIndex((s) => s.CASL === values.CASL && s.MONO === values.MONO))
  const slant = $derived(values.slnt! <= -14 ? ' Italic' : values.slnt! < 0 ? ' Oblique' : '')
  const styleName = $derived(`${styles[current]?.name ?? 'Custom'} · ${weightNames[Math.floor(values.wght! / 100)]}${slant}`)

  function follow(tag: string, all: number[], rows: number) {
    const n = all.length
    const at = ((rows % n) + n) % n
    const a = all[Math.floor(at)]!
    const b = all[Math.ceil(at) % n]!
    root?.style.setProperty(`--${tag}`, String(+(a + (b - a) * (at - Math.floor(at))).toFixed(3)))
  }
  const copy = () =>
    navigator.clipboard?.writeText(css).then(() => {
      copied = true
      setTimeout(() => (copied = false), 1400)
    })
</script>

<svelte:head>
  {@html `<style>@font-face{font-family:"Recursive Variable";font-style:oblique 0deg 15deg;font-weight:300 1000;font-display:swap;src:url(https://cdn.jsdelivr.net/npm/@fontsource-variable/recursive/files/recursive-latin-full-normal.woff2) format("woff2-variations")}</style>`}
</svelte:head>

<div class="ts" bind:this={root}>
  <div class="ts-card">
    <div class="ts-meta">
      <span>Recursive</span>
      <DetentText class="ts-style" text={styleName} />
    </div>
    <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_to_interactive_role -->
    <p
      bind:this={specimen}
      class="ts-text"
      contenteditable="plaintext-only"
      spellcheck="false"
      role="textbox"
      tabindex="0"
      aria-label="Specimen text, editable"
      onkeydown={(e) => e.key === 'Enter' && e.preventDefault()}
    >Quiet gears click into place</p>
    <div class="ts-code">
      <code aria-label={css}>{#each axes as a, i (a.tag)}<span aria-hidden="true"><span class="ts-tag">"{a.tag}"</span> <DetentNumber value={values[a.tag]!} locales="en-US" format={{ useGrouping: false, maximumFractionDigits: 1 }} />{#if i < axes.length - 1}, {/if}</span>{/each}</code>
      <button type="button" class="ts-copy" onclick={copy} aria-label={copied ? 'Copied' : 'Copy font-variation-settings'} data-copied={copied || undefined}>
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
          <g class="ts-copy-icon"><rect x="5.5" y="5.5" width="8" height="8" rx="2" /><path d="M10.5 3.5v-.5a1.5 1.5 0 0 0-1.5-1.5H4A1.5 1.5 0 0 0 2.5 3v5A1.5 1.5 0 0 0 4 9.5h.5" /></g>
          <path class="ts-check" d="M3.5 8.5l3 3 6-7" pathLength="1" />
        </svg>
      </button>
    </div>
  </div>

  <div class="ts-axes">
    {#each axes as a (a.tag)}<span class="ts-name">{a.name}</span>{/each}
    <div class="ts-wheels">
      <div class="ts-band" aria-hidden="true"></div>
      {#each axes as a (a.tag)}
        <Detent
          items={a.values}
          value={values[a.tag]}
          onChange={(v: number) => values[a.tag] !== v && (values[a.tag] = v)}
          changeOn="tick"
          loop
          onTick={tick}
          onScrollProgress={(rows) => follow(a.tag, a.values, rows)}
          getLabel={a.label}
          label={a.name}
          itemHeight={32}
          visibleCount={5}
          width="100%"
          fade={0.34}
          magnify={1.12}
          curvature={0.6}
          indicator={{ shape: 'none' }}
        >
          {#snippet item(v: number)}{a.label(v)}{/snippet}
        </Detent>
      {/each}
    </div>
  </div>

  <div class="ts-styles" role="group" aria-label="Styles" style:--i={Math.max(0, current)} data-custom={current < 0 || undefined}>
    <span class="ts-thumb" aria-hidden="true"></span>
    {#each styles as s (s.name)}
      <button
        type="button"
        aria-pressed={s.CASL === values.CASL && s.MONO === values.MONO}
        style:font-variation-settings={`"wght" 500, "slnt" 0, "CASL" ${s.CASL}, "MONO" ${s.MONO}`}
        onclick={() => ((values.CASL = s.CASL), (values.MONO = s.MONO))}
      >{#each s.name.split(' ') as w (w)}<span>{w}</span>{/each}</button>
    {/each}
  </div>
</div>

<style>
  .ts { --ts-ease: cubic-bezier(0.23, 1, 0.32, 1); --ts-font: 'Recursive Variable', system-ui, sans-serif; --fg: #111; --bg: #fff; --muted: #888; --band: rgb(0 0 0 / 0.04); --line: rgb(0 0 0 / 0.06);
    width: 100%; max-width: 380px; display: grid; grid-template-columns: minmax(0, 1fr); gap: 18px; container-type: inline-size; font: 14px/1.4 system-ui, sans-serif; color: var(--fg); }
  /* The specimen card: every axis comes from the variables the wheels set, so it moves between their steps. */
  .ts-card { display: grid; grid-template-columns: minmax(0, 1fr); gap: 14px; padding: 16px 18px 14px; border-radius: 16px; background: var(--band); }
  .ts-meta { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; white-space: nowrap; }
  .ts-meta > span:first-child { font: 500 9.5px/1 'Geist Mono', ui-monospace, monospace; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); }
  .ts-meta :global(.ts-style) { font-size: 11px; color: var(--muted); }
  .ts p.ts-text, p.ts-text { margin: 6px 0 8px; min-height: 1.15em; font-family: var(--ts-font); font-size: clamp(24px, 7.6cqi, 29px); line-height: 1.15; letter-spacing: -0.005em; color: var(--fg);
    font-variation-settings: 'wght' var(--wght), 'slnt' var(--slnt), 'CASL' var(--CASL), 'MONO' var(--MONO);
    outline: none; border-radius: 6px; overflow-wrap: anywhere; cursor: text; caret-color: #ff4f2a; }
  p.ts-text:empty::before { content: 'Type something'; color: var(--muted); }
  /* The caret is the focus: no ring around the text, here or from the page. */
  p.ts-text:focus, p.ts-text:focus-visible { outline: none !important; box-shadow: none !important; }
  .ts :global(::selection) { background: #ff4f2a; color: #fff; }
  /* The CSS, on one line, with a copy button. Its type shrinks a little on narrow cards to keep to that line. */
  .ts-code { display: flex; align-items: center; gap: 4px; padding: 4px 4px 4px 10px; border-radius: 10px; background: var(--bg); box-shadow: 0 0 0 1px var(--line); }
  .ts-code code { flex: 1; min-width: 0; overflow-x: auto; scrollbar-width: none; white-space: nowrap; background: none; padding: 0;
    font: clamp(9px, calc((100cqi - 78px) / 26.8), 11px) / 1.5 'Geist Mono', ui-monospace, monospace; color: var(--fg); font-variant-numeric: tabular-nums; }
  .ts-code code::-webkit-scrollbar { display: none; }
  .ts-copy { flex: none; display: grid; place-items: center; width: 28px; height: 28px; padding: 0; border: 0; border-radius: 7px; background: none; color: var(--muted); cursor: pointer;
    -webkit-tap-highlight-color: transparent; transition: color 150ms var(--ts-ease), background-color 150ms var(--ts-ease), transform 150ms var(--ts-ease); }
  .ts-copy:active { transform: scale(0.92); }
  .ts-copy:focus-visible { outline: 2px solid var(--fg); outline-offset: -2px; }
  .ts-copy svg { fill: none; stroke: currentColor; stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; overflow: visible; }
  .ts-copy-icon { transition: opacity 150ms var(--ts-ease), transform 200ms var(--ts-ease); transform-origin: center; }
  .ts-check { stroke-dasharray: 1; stroke-dashoffset: 1; stroke-width: 1.7; transition: stroke-dashoffset 200ms var(--ts-ease); }
  .ts-copy[data-copied] { color: #1f9d55; }
  .ts-copy[data-copied] .ts-copy-icon { opacity: 0; transform: scale(0.7); }
  .ts-copy[data-copied] .ts-check { stroke-dashoffset: 0; transition-delay: 60ms; }
  @media (hover: hover) and (pointer: fine) { .ts-copy:hover { color: var(--fg); background: var(--band); } }
  .ts-tag { color: var(--muted); }
  /* The dials: names above, four wheels of values on one shared band. */
  .ts-axes { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); row-gap: 6px; }
  .ts-name { text-align: center; font-size: 10px; font-weight: 550; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); }
  .ts-wheels { grid-column: 1 / -1; position: relative; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr));
    font: 500 15px/1 'Geist Mono', ui-monospace, monospace; font-variant-numeric: tabular-nums; --detent-font-size: 15px; }
  .ts-band { position: absolute; left: 0; right: 0; top: 64px; height: 32px; border-radius: 10px; background: rgb(0 0 0 / 0.05); box-shadow: inset 0 0 0 1px var(--line); }
  /* Styles: a segmented control whose thumb slides to the chosen one, and steps aside for custom mixes. */
  .ts-styles { position: relative; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); padding: 3px; border-radius: 12px; background: rgb(0 0 0 / 0.05); }
  .ts-thumb { position: absolute; top: 3px; bottom: 3px; left: 3px; width: calc((100% - 6px) / 4); border-radius: 9px; background: var(--bg);
    box-shadow: 0 1px 2px rgb(0 0 0 / 0.08), 0 0 0 0.5px rgb(0 0 0 / 0.06); transform: translateX(calc(var(--i) * 100%));
    transition: transform 250ms var(--ts-ease), opacity 150ms var(--ts-ease); }
  .ts-styles[data-custom] .ts-thumb { opacity: 0; }
  .ts-styles button { position: relative; height: 30px; padding: 0 2px; border: 0; border-radius: 9px; background: none; color: var(--muted); white-space: nowrap;
    font-family: var(--ts-font); font-size: 11.5px; letter-spacing: -0.01em; cursor: pointer; -webkit-tap-highlight-color: transparent; transition: color 150ms var(--ts-ease); }
  .ts-styles button span + span::before { content: ' '; }
  .ts-styles button[aria-pressed='true'] { color: var(--fg); }
  .ts-styles button:focus-visible { outline: 2px solid var(--fg); outline-offset: -1px; }
  @media (hover: hover) and (pointer: fine) { .ts-styles button:hover { color: var(--fg); } }
  /* Narrow: each name on two lines. */
  @container (max-width: 360px) {
    .ts-card { padding: 14px 14px 12px; }
    .ts-code { padding-left: 8px; }
    .ts-styles button { display: grid; align-content: center; height: 40px; line-height: 1.15; }
    .ts-styles button span + span::before { content: none; }
  }
  @media (prefers-reduced-motion: reduce) { .ts * { transition: none !important; } }
  @media (prefers-color-scheme: dark) {
    .ts { --fg: #ededed; --bg: #1a1a1a; --band: rgb(255 255 255 / 0.06); --line: rgb(255 255 255 / 0.1); }
    .ts-band, .ts-styles { background: rgb(255 255 255 / 0.07); }
  }
</style>
