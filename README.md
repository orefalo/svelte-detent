# svelte-detent

A wheel picker for Svelte 5 that clicks into place.

Custom physics (not `scroll-snap`): real inertia, a throw that lands exactly on a row with no visible correction, rubber-banded ends, and frame-rate independent motion at 60, 120 and 144 Hz. Vertical and horizontal, RTL-aware, accessible, no runtime dependencies.

**[Live examples →](https://orefalo.github.io/svelte-detent/examples/)** · **[Docs →](https://orefalo.github.io/svelte-detent/docs/)** (30 recipes: iOS pickers, odometers, carousels, radio dials, time zones…)

This is an unofficial Svelte 5 port of [detent](https://github.com/hayderkg/detent) by Hayder, which is React-only. The engine, physics and rolling-label controllers come from there, and the examples reproduce [detent.hayder.sh/examples](https://detent.hayder.sh/examples). The conversion was done with Claude Code. All credit for the design belongs to the original author. Thanks, Hayder.

> **Status:** pre-release. The API may still change.

## Install

```sh
npm i svelte-detent
```

Requires Svelte 5.29 or newer. SvelteKit and Vite work out of the box, and server rendering is supported.

## Quickstart

The styled component looks finished with no styling props (light and dark, a subtle drum, an iOS-style magnifying lens, soft edges). Give it `items` and a `label`, its accessible name:

```svelte
<script>
  import { Detent } from 'svelte-detent'

  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))
  let value = $state('30')
</script>

<Detent items={minutes} bind:value label="Minutes" />
```

Rows can be any markup: `item` is a snippet that receives the item and its state.

```svelte
<Detent items={['Jan', 'Feb', 'Mar', 'Apr']} bind:value={month} label="Month">
  {#snippet item(name, { selected })}<span class:on={selected}>{name}</span>{/snippet}
</Detent>
```

Other snippets: `indicatorContent`, `header`, `footer`, `emptyState`, `loadingRow`. Callbacks: `onChange`, `onTick`, `onSettle`, `onScrollProgress`.

## Headless

`createDetent(() => options)` brings the physics, input, keyboard, typeahead and ARIA; the markup and CSS are yours.

```svelte
<script>
  import { createDetent } from 'svelte-detent'

  const sizes = ['XS', 'S', 'M', 'L', 'XL']
  const d = createDetent(() => ({ items: sizes, defaultValue: 'M', itemSize: 44, visibleCount: 5, label: 'Size' }))
</script>

<div {...d.rootAttrs} style={d.rootStyle} {@attach d.attachRoot}>
  <div {...d.trackAttrs} style={d.trackStyle} {@attach d.attachTrack}>
    {#each d.rows as r (r.key)}
      <div {...r.attrs} style={r.style}>{r.item}</div>
    {/each}
  </div>
</div>
<div {...d.liveRegionAttrs} style={d.liveRegionStyle}>{d.announcement}</div>
```

Every row gets `--offset`, `--abs-offset`, `--progress` and `--selected` CSS variables, updated every frame outside Svelte's reactivity, so drum effects are plain CSS:

```css
.row {
  transform: rotateX(calc(var(--offset) * -17deg));
  opacity: calc(1 - var(--abs-offset) * 0.25);
}
```

## Indicator

The selection marker is a first-class part: shape, material, style, and fit.

```svelte
<Detent items={words} label="Word" indicator={{ fit: 'content', shape: 'pill', material: 'glass' }} />
```

`fit: 'content'` sizes it to the centered item and morphs it as items pass. Shapes: `rounded`, `pill`, `lines`, `underline`, `brackets`, `dot`, `needle`, `none`. Materials (rounded and pill only): `solid`, `glass`, `outline`, `gradient-border`. `color` can be a function of the item. Live values are CSS variables, written every frame: `--indicator-w`, `--indicator-h`, `--indicator-r`, `--indicator-progress`, `--indicator-velocity`.

## Mouse wheels

`wheelMode` (default `'auto'`) tells a notched mouse wheel from a trackpad by the first event of a gesture: each notch moves exactly one row, and the accelerated bursts of a fast spin become a throw. Trackpads keep 1:1 tracking with momentum. Use `'smooth'` to follow every delta 1:1, or `'step'` to always step.

## Feedback (opt-in)

```svelte
<script>
  import { Detent, ticks } from 'svelte-detent'

  // Create it once: a new handler per render restarts its throttle and audio.
  const onTick = ticks({ haptics: true, sound: { volume: 0.4 } })
</script>

<Detent items={items} label="Value" {onTick} />
```

Both are no-ops where unsupported (the Vibration API does not exist on iOS Safari). Browsers only allow audio after a user gesture. `sound: { dynamicTimbre: true }` makes fast ticks brighter and slow ones more defined.

## Effects (all opt-in)

```svelte
<Detent
  items={items}
  label="Value"
  motionBlur
  velocityTilt
  centerLight
  selectedDepth
  elasticRows={0.3}
  grip={0.5}
  indicator={{ refraction: 0.5, refractionRGB: 0.35, impact: true }}
/>
```

- `motionBlur`: a directional blur along the scroll axis, by velocity.
- `velocityTilt`: rows lean up to 2° while moving.
- `centerLight` and `selectedDepth`: rows brighten as they pass the centre, and the centred row comes forward.
- `elasticRows`: the outer rows lag behind with a spring.
- `grip`: a short absorption when you catch a moving wheel.

`indicator.refraction` bends the visible rows through a stationary lens; `refractionRGB` adds chromatic dispersion. The displacement map is an embedded SVG image, so a strict CSP needs `data:` in `img-src`. Everything turns off with reduced motion. Filtering costs rendering time, so test rich rows on your target mobile devices.

## DetentText

Animates short interface labels (a button's state, a counter, a status) with the same spring that settles the wheel.

```svelte
<script>
  import { DetentText } from 'svelte-detent'
  let status = $state('Send')
</script>

<DetentText text={status} />
<!-- Send → Sending… → Sent: matching graphemes stay, changed ones roll. -->

<DetentText morph={false} text={status} />
<!-- Roll the entire label instead. -->
```

- **Native text at rest.** Server rendering emits the real text. While a change rolls, an `aria-hidden` visual copy is drawn over it, so screen readers, selection and hydration only ever see plain text.
- **No list of values.** Pass the current string or number. Changes are matched grapheme by grapheme.
- **Interruptible.** A new label mid-roll continues from where each letter is, with no jump.

| Prop | Default | Purpose |
| --- | --- | --- |
| `text` | required | Current string or number |
| `morph` | `true` | Keep matching graphemes; `false` rolls the whole label |
| `reveal` | `false` | New letters grow in from zero width |
| `animate` | `true` | `false` for immediate updates |
| `spring` | `{ stiffness: 420, damping: 32, mass: 1 }` | Partial spring configuration |
| `snapDuration` | `550` | Maximum spring duration, in ms |
| `rollDirection` | `'up'` | `'up'` or `'down'` |
| `locale` | browser default | Grapheme segmentation locale |
| `as` | `'span'` | Element: `span`, `strong`, `output`, `code`, a heading… |
| `ref` | | Bindable root element |
| `onAnimationStart` / `onAnimationComplete` / `onAnimationCancel` | | Transition callbacks |

`class`, `style` (a string or an object) and any HTML or ARIA attribute are passed to the element. `position: static` becomes `relative` and `display: inline` becomes `inline-block`, because the rolling layer needs a box of its own. Targets short, single-line LTR text; other text updates natively without rolling. Reduced motion is always respected.

## DetentNumber

A formatted number whose digits roll on the same spring, through the values between, like an odometer. Digits are matched by decimal place, so the units stay the units from 99 to 100, through a change of sign or of locale.

```svelte
<script>
  import { DetentNumber } from 'svelte-detent'
</script>

<DetentNumber value={amount} locales="es-ES" format={{ style: 'currency', currency: 'EUR' }} />
```

| Prop | Default | Purpose |
| --- | --- | --- |
| `value` | required | A `number` or `bigint` |
| `locales` / `format` | | Passed straight to `Intl.NumberFormat` |
| `trend` | `'auto'` | `'auto'` rolls up when the value grows and down when it shrinks; `'up'` or `'down'` always |
| `classNames` | | A class per part: `integer`, `fraction`, `decimal`, `group`, `currency`, `sign`, `unit` |
| `animate`, `spring`, `snapDuration`, `as`, `ref`, callbacks | | As in `DetentText` (`spring` default is `{ stiffness: 460, damping: 38, mass: 1 }`) |

To style the parts (a quieter currency, smaller decimals), pass `classNames` and keep the parts on the baseline: each digit rolls through a window the height of the line, so a part raised with `vertical-align` would be cut off while it moves.

```svelte
<DetentNumber value={price} format={{ style: 'currency', currency: 'USD' }}
  classNames={{ currency: 'cur', fraction: 'cents', decimal: 'cents' }} />
```

Values that format the same do not animate. Pass an explicit `locales` when server rendering so server and browser agree.

## Develop

```sh
pnpm install
pnpm dev          # the examples at http://localhost:5173/examples/
pnpm test         # engine and physics, components, server rendering
pnpm check        # svelte-check
pnpm build        # the package into dist/
pnpm build:demo   # the examples site into demo-dist/
```

The framework-free engine lives in `src/lib/core`, the Svelte layer in `src/lib`, and the examples and docs site in `demo/` (the docs are `demo/docs/docs.md`). Opening `/?e=Carousel` mounts a single example on its own.

## License

[MIT](./LICENSE). Original work © Hayder; Svelte port © Olivier Refalo.
