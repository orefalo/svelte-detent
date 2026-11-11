/** Pulls a short, readable usage snippet out of an example's source: its main component (or createDetent call). */

const TAGS = ['Detent', 'DetentText', 'DetentNumber'] as const

/** End index of the element that starts at `i` (`<Tag …>…</Tag>` or `<Tag … />`). */
function elementEnd(s: string, i: number, tag: string): number {
  let j = i + tag.length + 1
  let depth = 0
  let quote = ''
  for (; j < s.length; j++) {
    const c = s[j]!
    if (quote) {
      if (c === quote) quote = ''
    } else if (c === '"' || c === "'") quote = c
    else if (c === '{') depth++
    else if (c === '}') depth--
    else if (c === '>' && depth === 0) break
  }
  if (s[j - 1] === '/') return j + 1
  let open = 1
  const re = new RegExp(`<(/?)${tag}(?=[\\s>/])`, 'g')
  re.lastIndex = j + 1
  for (let m = re.exec(s); m; m = re.exec(s)) {
    open += m[1] ? -1 : 1
    if (open === 0) return s.indexOf('>', m.index) + 1
  }
  return j + 1
}

/** End of the balanced `(...)` group that opens at `i`. */
function parenEnd(s: string, i: number): number {
  let depth = 0
  let quote = ''
  for (let j = i; j < s.length; j++) {
    const c = s[j]!
    if (quote) {
      if (c === '\\') j++
      else if (c === quote) quote = ''
    } else if (c === '"' || c === "'" || c === '`') quote = c
    else if (c === '(') depth++
    else if (c === ')' && --depth === 0) return j + 1
  }
  return s.length
}

function dedent(text: string): string {
  const lines = text.split('\n')
  const indent = Math.min(...lines.slice(1).filter((l) => l.trim()).map((l) => l.length - l.trimStart().length), 99)
  return [lines[0], ...lines.slice(1).map((l) => l.slice(Math.min(indent, 99) === 99 ? 0 : indent))].join('\n')
}

/** The largest top-level `<Detent…>`, `<DetentText…>` or `<DetentNumber…>` element in the markup. */
function mainElement(markup: string): { tag: string; code: string } | null {
  let best: { tag: string; code: string } | null = null
  for (const tag of TAGS) {
    const re = new RegExp(`<${tag}(?=[\\s>/])`, 'g')
    for (let m = re.exec(markup); m; m = re.exec(markup)) {
      const end = elementEnd(markup, m.index, tag)
      const code = dedent(markup.slice(m.index, end))
      if (!best || code.length > best.code.length) best = { tag, code }
      re.lastIndex = end
    }
  }
  return best
}

/** The `const d = createDetent(...)` statement of a headless example. */
function headless(script: string): string | null {
  const m = /^[ \t]*(?:const|let)\s+\w+\s*=\s*createDetent\b[^(]*\(/m.exec(script)
  if (!m) return null
  const open = m.index + m[0].length - 1
  const end = parenEnd(script, open)
  return dedent(script.slice(m.index, end).replace(/^[ \t]+/, ''))
}

export function snippet(source: string): string | null {
  const script = /<script[^>]*>([\s\S]*?)<\/script>/.exec(source)?.[1] ?? ''
  const markup = source.replace(/<script[\s\S]*?<\/script>/, '').replace(/<style[\s\S]*?<\/style>/, '')
  const main = mainElement(markup)
  const hook = headless(script)
  if (!main && !hook) return null
  const names = [...new Set([...(hook ? ['createDetent'] : []), ...(main ? [main.tag] : [])])]
  const body = [hook, main?.code].filter(Boolean).join('\n\n')
  const used = ['Detent', 'DetentText', 'DetentNumber', 'createDetent'].filter((n) => new RegExp(`\\b${n}\\b`).test(body))
  return `import { ${[...new Set([...names, ...used])].join(', ')} } from 'svelte-detent'\n\n${body}`
}

const imp = (names: string) => `import { ${names} } from 'svelte-detent'\n\n`

/** Hand-written snippets for examples whose source does not boil down to one component. Keyed by example file. */
export const overrides: Record<string, string> = {
  IosTimePicker:
    imp('Detent') +
    `// Three looping wheels, no indicator of their own:
// the page draws one shared band behind them.
const common = { itemHeight: 40, visibleCount: 5, indicator: { shape: 'none' }, magnify: 1.12, curvature: 0.7 }

<div class="wheels">
  <div class="band"></div>
  <Detent {...common} items={hours} bind:value={hour} loop label="Hour" align="end" style="flex:1" />
  <Detent {...common} items={minutes} bind:value={minute} loop label="Minute" style="flex:1" />
  <Detent {...common} items={['AM', 'PM']} bind:value={half} label="AM or PM" align="start" style="flex:1" />
</div>`,
  DatePicker:
    imp('Detent') +
    `// Day, month and year share one band.
// Days that do not exist in the month are disabled.
<Detent {...common} items={days} value={shown} onChange={(d) => (day = d)}
  isDisabled={(d) => d > daysInMonth} label="Day" align="end" style="flex:2" />
<Detent {...common} items={months} value={months[month]} onChange={(m) => (month = months.indexOf(m))}
  label="Month" style="flex:5" />
<Detent {...common} items={years} value={year} onChange={(y) => (year = y)}
  label="Year" align="start" style="flex:3" />`,
  DeparturesBoard:
    imp('DetentText') +
    `// The text rolls to its new value, character by character.
<DetentText text={clock(now)} />`,
  SlotMachine:
    imp('createDetent') +
    `// One reel: a looping headless wheel. Spin it from code with the engine.
const d = createDetent(() => ({
  items: symbols,
  loop: true,
  itemSize: 64,
  visibleCount: 3,
  label: 'Reel',
}))

function spin(laps, target) {
  const i = Math.round(d.engine.index)
  const at = ((i % symbols.length) + symbols.length) % symbols.length
  d.engine.goTo(i + laps * symbols.length + ((target - at + symbols.length) % symbols.length))
}

<div {...d.rootAttrs} style={d.rootStyle} {@attach d.attachRoot}>
  <div {...d.trackAttrs} style={d.trackStyle} {@attach d.attachTrack}>
    {#each d.rows as r (r.key)}<div {...r.attrs} style={r.style}>{r.item}</div>{/each}
  </div>
</div>`,
  Headless:
    imp('createDetent') +
    `// Your own markup and CSS: the hook brings the physics,
// input, keyboard, typeahead and ARIA.
const d = createDetent(() => ({
  items: sizes,
  defaultValue: 'M',
  itemSize: 44,
  visibleCount: 5,
  label: 'Size',
}))

<div {...d.rootAttrs} style={d.rootStyle} {@attach d.attachRoot}>
  <div {...d.trackAttrs} style={d.trackStyle} {@attach d.attachTrack}>
    {#each d.rows as r (r.key)}
      <div {...r.attrs} class="row" style={r.style}>{r.item}</div>
    {/each}
  </div>
</div>
<div {...d.liveRegionAttrs} style={d.liveRegionStyle}>{d.announcement}</div>

/* every row has --offset, --abs-offset, --progress
   and --selected, updated each frame */
.row { transform: rotateX(calc(var(--offset) * -20deg)); opacity: calc(1 - var(--abs-offset) * 0.3); }`,
  Liquid:
    imp('createDetent') +
    `// The wheel reports its position and velocity every frame.
// A WebGL shader draws the cards from them.
const d = createDetent(() => ({
  items: cards,
  loop: true,
  itemSize: PITCH,
  visibleCount: 2,
  label: 'Cards',
}))

$effect(() => {
  return d.subscribe((frame) => {
    shader.draw({ offset: frame.offset, velocity: frame.velocity })
  })
})`,
  Dust:
    imp('createDetent') +
    `// A horizontal wheel drives a particle canvas:
// swipe and each word flies apart into the next.
const d = createDetent(() => ({
  items: words,
  orientation: 'horizontal',
  loop: true,
  itemSize: PITCH,
  visibleCount: 5,
  label: 'Words',
}))

$effect(() => {
  return d.subscribe((frame) => {
    particles.render({ progress: frame.offset, speed: Math.abs(frame.velocity) })
  })
})`,
  Riso:
    imp('createDetent') +
    `// Two ink layers, a halftone, and plates that slip
// out of register with speed.
const d = createDetent(() => ({
  items: prints,
  loop: true,
  itemSize: PITCH,
  visibleCount: 5,
  label: 'Prints',
}))

$effect(() => {
  return d.subscribe((frame) => {
    plates.render({ offset: frame.offset, misregister: Math.abs(frame.velocity) })
  })
})`,
  Tuner:
    imp('Detent') +
    `// Physics are props: a preset, or decay and spring one by one.
<Detent
  items={items}
  label="Tuner"
  decay={0.995}
  spring={{ stiffness: 460, damping: 38, mass: 1 }}
  wheelMode="auto"
  onSpinStart={() => (recording = true)}
  onScrollProgress={(offset) => record(offset)}
/>

// Or start from a preset and override what you need:
<Detent items={items} label="Value" preset="snappy" />`,
}
