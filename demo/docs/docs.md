# Docs

svelte-detent is a wheel picker for Svelte 5: custom physics, any content in a row, vertical or horizontal, accessible. No runtime dependencies beyond Svelte. Server-rendered, SvelteKit-ready.

This is an unofficial Svelte port of [detent](https://github.com/hayderkg/detent) by Hayder (React). These docs follow the [original docs](https://detent.hayder.sh/docs), adapted to Svelte.

**Status:** pre-release (0.x): the API may still change before 1.0.

## Install

```sh
npm i svelte-detent
```

Requires Svelte 5.29 or newer. `pnpm add svelte-detent`, `yarn add svelte-detent` and `bun add svelte-detent` work the same.

## Quickstart

`<Detent>` looks finished with no styling props: give it `items` and a `label` (its accessible name).

```svelte
<!-- Minutes.svelte -->
<script>
  import { Detent } from 'svelte-detent'

  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))
  let value = $state('30')
</script>

<Detent items={minutes} bind:value label="Minutes" />
```

`onChange` fires when the wheel settles. Pass `changeOn="tick"` to follow it live: every row a hand turns it past (drag, throw, mouse wheel, trackpad); turns from keys, a tap or a new `value` report only where they land. For complete demos (time and date pickers, carousels, stories, an odometer…), see the [Examples](../examples/).

Rows render anything. The `item` snippet receives the item and its state:

```svelte
<Detent items={tokens} getKey={(t) => t.symbol} getLabel={(t) => t.name} label="Asset">
  {#snippet item(t, { selected })}
    <TokenRow token={t} {selected} />
  {/snippet}
</Detent>
```

Live distance from the center is in CSS, not in Svelte state: every row has `--offset`, `--abs-offset`, `--progress` and `--selected`, updated every frame. `offset` in the `item` snippet is the value at the last render.

## Guides

### Styled or headless

Start with `<Detent>`: it looks finished with no props, and the visual props (drum, indicator, falloff, surface) cover most designs. Reach for `createDetent` when the markup must be yours: a design system's own components, or something that isn't a list at all (a carousel, a dial, a canvas). Both share the same engine: motion, input and accessibility are identical. [Headless example](../examples/#headless)

### When a wheel fits

A wheel is at its best for a short, ordered range you skim by feel: a time, a date, a quantity, a size, a setting, a handful of options you browse. With long lists people search rather than scroll (countries, users, products): use a combobox with search there, or a wheel only after filtering. And when every option should be visible at once (two or three choices), a segmented control is quicker.

### SvelteKit and server rendering

Nothing special is needed: the components render on the server, and the initial selection is in the HTML, with no layout shift. Direction is detected after mount: pass `dir="rtl"` to get right-to-left right in the server render too. `DetentText` and `DetentNumber` render the real text on the server, then take over on the client.

```svelte
<!-- src/routes/+page.svelte -->
<script>
  import { Detent } from 'svelte-detent'
  let value = $state('30')
</script>

<!-- the first paint already shows "30" -->
<Detent items={minutes} bind:value label="Minutes" />
```

### Forms

Give it a `name` and it submits the selected item's key, like any field. A `disabled` wheel is left out, and the form's reset turns an uncontrolled wheel back to `defaultValue`. Native validation doesn't apply to it (browsers skip hidden fields): validate the value in your form code.

```svelte
<form method="post" action="?/save">
  <Detent items={sizes} defaultValue="M" label="Size" name="size" />
  <button type="reset">Reset</button>
  <button type="submit">Save</button>
</form>
<!-- FormData: size=M (the selected item's key). Reset turns the wheel back to "M". -->
```

### Why its own physics

With CSS scroll snap, the browser owns the curve and the landing, and both vary between browsers and inputs. Detent plans each release itself: it projects the throw, picks the row it lands on, and settles on a spring, the same way on every browser and input (finger, trackpad, mouse wheel, keys). That's what makes a throw land exactly on a row, and what lets `subscribe` report where it's going before it gets there.

### Bound or uncontrolled

Use `defaultValue` and listen with `onChange` when the wheel owns the state; use `bind:value` (or `value` with `onChange`) when something else moves it too (a reset button, a linked wheel, a form). Changing `value` turns the wheel with its spring. While the user turns it, the wheel follows the user and reports through `onChange`; once it rests, it agrees with you: if you keep another `value` (you rejected the change), it turns back to yours. It never corrects itself mid-motion, so a throw is never steered.

### Carousels, pagers and cover flow

The same wheel, laid flat: horizontal, `perspective={0}`, no indicator or magnifier, and wide rows (`itemHeight` is a card's width plus its gap). Add `loop` to make it endless and `rowStyle` to pose cards every frame (cover flow). For a pager, use one row in view (`visibleCount={1}`). [Carousel](../examples/#carousel) · [Stories](../examples/#stories)

```svelte
<Detent
  items={cards}
  label="Paintings"
  orientation="horizontal"
  loop
  itemHeight={212}
  visibleCount={3}
  perspective={0}
  indicator={{ shape: 'none' }}
  magnify={false}
  style="max-width:100%"
>
  {#snippet item(c)}<Card {...c} />{/snippet}
</Detent>
```

`itemHeight` is the card's width plus its gap, and `perspective={0}` keeps it flat (no drum).

### Your own indicator

Start with `indicator` (shape, material, fit). To draw something else, pass an `indicatorContent` snippet and style it with the live variables `--indicator-w`, `--indicator-h`, `--indicator-r` and `--indicator-progress`; or turn it off (`shape: 'none'`) and draw a shared band yourself, like the [time picker](../examples/#ios-time-picker).

### Long lists

Only the visible rows (plus `overscan`) are rendered, so thousands of items are fine. To page in more, handle `onEndReached`, set `loading` while it runs and give it a `loadingRow` snippet. [Infinite list](../examples/#load-more)

### Driving it from code

Set `value` to move it (animated unless `animate={false}`). For `scrollTo` and the engine, use `createDetent`. For several turns at once, go to a virtual index a few loops ahead with `engine.goTo`. A wheel that only displays (an odometer) is `disabled`: no input, still animated. [Odometer](../examples/#odometer) · [Slot machine](../examples/#slot-machine)

```svelte
<!-- A number from outside: each digit is a wheel that turns to it, input off. -->
<Detent items={digits} value={digit} loop disabled visibleCount={1} label="Digit" />

<script>
  // Many turns at once (a slot reel): go to a virtual index a few loops ahead.
  const d = createDetent(() => ({ items: symbols, loop: true, label: 'Reel' }))
  d.engine.goTo(Math.round(d.engine.index) + 3 * symbols.length + offsetToTarget)
</script>
```

## `<Detent>` props

Everything from `createDetent` (below), plus the visual props. Each falloff is a number per row, or a function of the signed offset that returns the value. `class` and `style` go to the root.

### Layout

| Prop | Default | Description |
|---|---|---|
| itemHeight | 40 | Row size along the scroll axis: its height, or its width when horizontal (`itemSize` in `createDetent`) |
| visibleCount | 7 | Rows in view (odd) |
| gap | 0 | Space between rows |
| width / height | 100% / 64 | Cross size: width when vertical, height when horizontal |
| orientation | 'vertical' | or 'horizontal' |
| loop | false | Infinite: wraps around (header, footer and loading rows are ignored) |
| header / footer | | Snippets: rows the wheel can rest on but never selects. They are not options (`role="presentation"`), so a screen reader never hears them announced as selected |
| loadingRow, loading | | A snippet, shown after the items while `loading` is true |
| emptyState | | A snippet, shown when there are no items (and no header) |

A horizontal wheel is `visibleCount × itemHeight` wide by default. You can size it with `style`: the rows stay centered.

### Drum

| Prop | Default | Description |
|---|---|---|
| perspective | 800 | Depth in px; 0 = flat list |
| curvature | 0.5 | 0 flat … 1 half-cylinder |
| radius | derived | Drum radius in px (overrides curvature) |
| tilt | | deg, or `{ x, y }` |
| skew | 0 | Rows lean as they move away (deg per row) |
| align | 'center' | 'start' or 'end' |

### Rows by distance

| Prop | Default | Description |
|---|---|---|
| fade | 0.16 | Opacity lost per row |
| scale | 0 | Size lost per row |
| blur | 0 | px per row |
| dim | 0.22 | Color toward `--detent-dim-color`; backgrounds stay solid |
| spacing | 0 | Extra gap growing with distance |
| easing | 'linear' | 'quad', 'cubic' or a function |

### Indicator

The marker behind the selected row. By default it is the band: a rounded box the size of the row.

```svelte
<Detent items={words} label="Word" indicator={{ fit: 'content', shape: 'pill', material: 'glass' }} />
```

| Option | Default | Description |
|---|---|---|
| shape | 'rounded' | 'pill', 'lines', 'underline', 'brackets', 'dot', 'needle', 'none' |
| material | 'solid' | 'glass', 'outline', 'gradient-border'. Rounded and pill only |
| fit | 'band' | 'content': follows the centered item, morphing between items; straight to the target on a throw |
| fitHeight | false | Follow the item's height too |
| paddingX / paddingY | 14 / 6 | Around the content (fit 'content') |
| minWidth / maxWidth | | Clamp the fitted width |
| color | | A color, or `(item) => color` (cross-fades) |
| radius | 12 | Corner radius (rounded) |
| inset | 6 | Distance from the row's sides; 0 for lines, needle and underline |
| background, border | | Override the material's |
| shadow | | `true`, `'inset'` or a box-shadow. Rounded and pill, solid or glass |
| catchRows | 1.5 | On throws and multi-row moves: hold, then catch the target over the last rows |
| morph | 'smart' | 'naive' recomputes the width every frame (for comparison; jitters on fast throws) |
| overshoot | 0 | Let the size overshoot with the settle spring |

Live values are CSS variables on the root, written every frame: `--indicator-w`, `--indicator-h`, `--indicator-r`, `--indicator-progress`, `--indicator-velocity` and, when `color` is a function, `--indicator-color`. To draw your own marker, pass an `indicatorContent` snippet and style it with those variables: the `state` it receives is a snapshot from the last render, not live. The magnifier clips to the indicator box.

### Surface and motion

`motionBlur` adds velocity-driven directional blur: vertical on a vertical wheel, horizontal on a horizontal one. It is off by default; `true` caps it at 4px, or pass a maximum in px (0–24). The fixed indicator stays sharp, the magnifying lens follows the effect, and moving rows become sharp at rest. It combines with `blur` (distance from the center), respects reduced motion, and adds filtering work: test it on your target devices.

```svelte
<Detent items={items} label="Value" motionBlur={4} />
```

| Prop | Default | Description |
|---|---|---|
| magnify | true (1.1) | iOS lens: the selected row renders larger inside the indicator. `false` to turn off |
| selectedStyle / selectedClassName | | For the resting row |
| mask / maskSize | 'gradient' / '28%' | Edge fade; `'none'` or your own mask-image |
| gradientBlur | off | Progressive edge blur: `true` or `{ strength: 8, layers: 6, size }` (size defaults to just short of the center row) |
| shadow, glare, background | | Surface |
| preset | 'ios' | 'scroll', 'snappy', 'heavy', 'elastic', 'linear', or a physics object |
| rowStyle | | `(offset, index, selected) => CSSProperties`, every frame |
| theme | | Force 'light' or 'dark' (otherwise the system, or an ancestor's `data-theme`) |
| highlight, highlightStyle, highlightShadow | | Older aliases for `indicator.shape` and `indicator.shadow` (`highlight={false}` is `shape: 'none'`). `indicator` wins where both are set |

The magnifier renders the visible rows a second time inside the lens: the `item` snippet runs twice per visible row. That copy is `aria-hidden` and `inert`, but its components still mount, so with rows that run effects, carry ids or are heavy (large images, many controls), use `magnify={false}`.

### Forms and CSP

| Prop | Default | Description |
|---|---|---|
| name | | Submit the selection with a form: a hidden input with this name holds the selected item's key. A `disabled` wheel is left out, like any disabled field, and the form's reset turns an uncontrolled wheel back to `defaultValue` |
| form | | The id of the form that input belongs to, when the wheel sits outside it |
| nonce | | Nonce for the component's `<style>` element, under a strict Content Security Policy |

Native validation (`required`, `:invalid`) doesn't apply: browsers skip hidden fields, so validate the value in your form code.

Every prop can change after mount: row size and count (the selected item stays centered), direction, items and `getKey`, `interactive`.

### CSS variables

Colors: `--detent-fg`, `--detent-dim-color`, `--detent-band`, `--detent-line`, `--detent-ring` (focus), `--detent-shade`, `--detent-glare`. Text size: `--detent-font-size` (20px). Geometry and falloffs, set from props: `--detent-pitch`, `--detent-angle`, `--detent-radius`, `--detent-perspective`, `--detent-fade`, `--detent-scale`, `--detent-blur`, `--detent-dim`, `--detent-spacing`, `--detent-skew`, `--detent-dir`, `--detent-magnify` (a falloff given as a function sets its variable to 0).

## createDetent

The headless function: physics, input, virtualization and accessibility, no styles. Pass it a function that returns the options, so they stay reactive.

```svelte
<!-- MinutePicker.svelte -->
<script>
  import { createDetent } from 'svelte-detent'

  const d = createDetent(() => ({ items: minutes, defaultValue: '30', itemSize: 40, visibleCount: 5, label: 'Minutes' }))
</script>

<div {...d.rootAttrs} style={d.rootStyle} {@attach d.attachRoot}>
  <div {...d.trackAttrs} style={d.trackStyle} {@attach d.attachTrack}>
    {#each d.rows as r (r.key)}
      <div {...r.attrs} style={r.style}>{r.item}</div>
    {/each}
  </div>
</div>
<!-- Next to the listbox, not inside it -->
<div {...d.liveRegionAttrs} style={d.liveRegionStyle}>{d.announcement}</div>
```

| Option | Default | Description |
|---|---|---|
| items | | The list |
| label | | Accessible name of the listbox. Set it |
| getKey / getLabel | | Identity (selection survives inserts) and text (typeahead, announcements) |
| value, defaultValue, onChange | | The selected item (an object item is matched by `getKey`). Changing `value` moves the wheel. The wheel follows the user, reports through `onChange`, and once at rest turns back to `value` if you kept another one |
| animate | true | Animate moves made through `value` |
| changeOn | 'settle' | or 'tick': live while a hand turns it |
| disabled | false | The whole wheel: no input, out of tab order |
| isDisabled | | Per item: skipped by snapping and keys |
| itemSize, visibleCount, loop | 36, 5, false | Row size (with `gap`, the pitch), rows in view, infinite |
| orientation | 'vertical' | or 'horizontal' |
| dir | detected | 'ltr' or 'rtl'. Detected after mount; pass it to get RTL right in the server render, or to change direction later |
| header, footer, loading | false | Extra rows (booleans here): render the returned `header`, `footer` and `loadingRow` slots with `slot.attrs`. Ignored with `loop` |
| onHeaderRest / onFooterRest | | The wheel came to rest on the header or footer |
| interactive | false | Rows hold controls: only the centered row's are reachable. (Tapping an off-center row turns the wheel to it in any mode) |
| preset | ios | A physics object: `presets.snappy` etc. (string names are `<Detent>` only) |
| decay, spring, overshoot, rubberBand, maxVelocity, snapDuration, handoff, magnet | from preset | Physics, one by one |
| wheelStep | 1 | Rows per mouse notch |
| wheelMode | 'auto' | See below |
| keyAcceleration | true | Holding an arrow key speeds up: ×1.5 after 2 s and ×2.5 after 4 s; or your own `[[ms, rate], …]` stages; `false` for one row per repeat |
| dragThreshold / dragRatio | 5 / 1 | px before a drag starts; drag distance multiplier |
| overscan | 3 | Rows rendered beyond the visible ones |
| onTick, onSettle, onSpinStart, onSpinEnd, onScrollProgress | | Events |
| onEndReached, endReachedThreshold | 5 | Load more when the wheel moves within this many rows of the end: not as it mounts there or as rows come in. Once per list length, and again after `loading` ends without new rows |

**Mouse wheels.** `wheelMode: 'auto'` tells a notched mouse wheel from a trackpad by the first event of a gesture. Each notch moves exactly one row (`wheelStep`); the accelerated bursts of a fast spin (or a free-spinning wheel) become velocity, so the wheel moves continuously while they come and coasts briefly once they stop. Trackpads keep 1:1 tracking with momentum. `'step'` makes every wheel event one notch, whatever its size: never a throw, and a fast spin moves one row per event. `'smooth'` follows every delta 1:1, like native scrolling. In every mode the wheel lands on a row when the events stop.

### What it returns

| Returns | Description |
|---|---|
| rootAttrs, rootStyle, attachRoot | Spread on the listbox root, with `style={d.rootStyle}` and `{@attach d.attachRoot}` |
| trackAttrs, trackStyle, attachTrack | The same for the moving track |
| liveRegionAttrs, liveRegionStyle, announcement | The announcer, rendered next to the listbox |
| rows | The rendered rows: `key`, `item`, `index`, `selected`, `offset`, `attrs`, `style` |
| header, footer, loadingRow | Slots to render when enabled |
| selectedIndex, selectedItem | The current selection |
| `scrollTo(index, { animate })` | Move programmatically. A disabled item turns to the nearest enabled one |
| subscribe(frame => …) | Position, velocity and mode every frame, outside Svelte's reactivity |
| rtl | Resolved direction |
| engine | The underlying engine (also available alone as `createEngine`, with no Svelte) |

Rows also carry the live CSS variables, so a drum is plain CSS:

```css
[data-detent] [role='option'] {
  transform: rotateX(calc(var(--offset) * -17deg));
  opacity: calc(1 - var(--abs-offset) * 0.25);
}
```

## DetentText

`DetentText` animates short interface labels (a button's state, a counter, a status) with the same spring that settles the wheel. What sets it apart: the text stays native at rest (the server renders it, and while a change rolls the real text stays in the DOM under a visual copy, so screen readers, selection and hydration see plain text); no list of values (pass the current string or number, matched grapheme by grapheme); and a new label mid-roll continues from where each letter is, with no jump.

```svelte
<script>
  import { DetentText } from 'svelte-detent'
</script>

<DetentText text={status} />
<DetentText morph={false} text={status} />
```

Matching graphemes remain in place; changes roll on Detent's spring physics. `morph={false}` rolls the entire label. Typography is inherited, and the component returns to native text at rest. It supports `as`, `class`, `style` (a string or an object), HTML/ARIA attributes and a bindable `ref`. In `style`, `position: static` becomes `relative` and `display: inline` or `contents` becomes `inline-block`: the rolling layer needs a positioned box of its own. The label is measured when its text, `class`, `style`, `lang` or `dir` changes, when it resizes and when a font loads; if an ancestor restyles its letters without changing its size, remount it with `{#key}`. Reduced motion is always respected, and there are no gesture handlers or Svelte updates per frame.

Use `spring` for a partial spring configuration, `snapDuration` for the maximum settling time (550 ms by default), `rollDirection="down"` to reverse the roll, and `animate={false}` for immediate updates. The lifecycle callbacks are `onAnimationStart`, `onAnimationComplete` and `onAnimationCancel`. Set `aria-live="polite"` only when the label should announce updates.

This version targets short, single-line LTR text. Multiline, RTL/bidirectional and vertical text update natively without animation. Long labels roll as a whole. Numbers are converted to strings and match by character; for digits that roll by decimal place, use `DetentNumber`.

[Try the example](../examples/#detent-text), including a field for your own labels.

## DetentNumber

`DetentNumber` shows a formatted number whose digits roll through the values between, like an odometer, on the same spring. Digits are matched by decimal place, so the units stay the units from 99 to 100, through a change of sign or of locale.

```svelte
<script>
  import { DetentNumber } from 'svelte-detent'
</script>

<DetentNumber value={amount} locales="es-ES" format={{ style: 'currency', currency: 'EUR' }} />
```

`locales` and `format` go straight to `Intl.NumberFormat`: currencies, percentages, units, compact notation, signs and any numbering system. Digits roll up when the value grows and down when it shrinks; `trend="up"` or `"down"` fixes the direction. New places grow in from zero width while the rest slide over, and signs, separators and symbols enter and leave. Values that format the same do not animate.

`classNames` styles the parts (`integer`, `fraction`, `decimal`, `group`, `currency`, `sign`, `unit`): the native text becomes a span per part, still one selectable, accessible label, and the rolling copies carry the same classes. Keep the parts on the baseline: each digit rolls through a window the height of the line, so a part raised with `vertical-align` is cut off while it moves.

Like `DetentText`, it is native text at rest (server rendered, with `tabular-nums` by default), interruptible, and respects reduced motion; it takes `as`, `class`, `style`, `animate`, `spring`, `snapDuration` (700 ms by default) and the same lifecycle callbacks. Numbers formatted with right-to-left marks, or more than 160 formatted tokens, update natively without rolling. Pass an explicit `locales` value when server rendering so the server and browser use the same format.

[Try the example](../examples/#detent-number).

## Feedback

Sound and haptics are opt-in, so they cost nothing unless imported (the package is tree-shakeable).

```svelte
<script>
  import { Detent, ticks } from 'svelte-detent'

  // Create it once (module scope): a new handler per render restarts its throttle and audio.
  const onTick = ticks({ haptics: true, sound: { volume: 0.4 } })
</script>

<Detent items={items} label="Value" {onTick} />
```

| Function | Description |
|---|---|
| ticks(...handlers) | Combines `{ haptics, sound }` options, or your own `(index, velocity) => void` handlers, into one `onTick` |
| haptics(options) | Vibration API; a no-op where it doesn't exist (iOS Safari). Options: `pattern` 8 ms, `interval` 35 ms |
| tickSound(options) | A short click, louder with speed. Options: `volume` 0.5, `fullAt` 2 px/ms, `interval` 22 ms. Browsers only allow audio after a user gesture, so a first spin by trackpad may be silent |

## Accessibility

A `listbox` with `aria-activedescendant`; options carry `aria-selected`. The selection is announced when the wheel settles, not on every tick. Keys: ↑ ↓ (and ← → when horizontal, mirrored in RTL), PageUp, PageDown, Home, End, and typeahead. Holding an arrow speeds up in stages (`keyAcceleration`); it starts over when the key comes up, the direction changes or focus leaves, and the wheel settles promptly on release. The focus ring shows for keyboard only, on the indicator, or around the wheel when there is none. With `prefers-reduced-motion`, throws settle without coasting and keys jump.

## Subtle motion accents

```svelte
<Detent items={items} label="Value" velocityTilt indicator={{ impact: true }} />
```

Both effects are opt-in and respect reduced motion. `velocityTilt` leans moving rows, including the lens, by up to 2 degrees; a number sets the maximum (0–6 degrees). It follows velocity and direction and returns to zero at rest. `indicator.impact` gives rounded and pill markers a brief compression and rebound after a moving wheel settles, without deforming the row content. `true` uses a subtle intensity, or pass 0–1. A new movement interrupts the response. This is separate from `indicator.overshoot`, which controls fitted size during the approach.

## Light, depth and sound

```svelte
<script>
  // once, outside the component
  const onTick = ticks({ sound: { dynamicTimbre: true } })
</script>

<Detent items={items} label="Value" centerLight selectedDepth {onTick} />
```

`centerLight` brightens rows as they pass through the center (`true` = 0.12; intensity 0–0.5). `selectedDepth` brings the centered row forward and its neighbors back with a per-row perspective transform (`true` = 8px; range 0–24px). Both are off by default, apply to the magnifying lens too, and turn off with reduced motion. A custom `rowStyle.transform` overrides the built-in depth transform.

`dynamicTimbre` is an optional `tickSound` option (also accepted through `ticks`): `true` or intensity 0–1. Fast ticks sound brighter and less resonant; slow ticks sound more defined. The normal fixed timbre remains the default. Audio still requires browser support and a prior user gesture.

## Elastic rows

```svelte
<Detent items={items} label="Value" elasticRows={0.3} />
```

`elasticRows` adds independent spring lag to the outer rows during movement and direction changes. `true` uses intensity 0.3; pass 0–6 to adjust it. Values up to 1 are subtle; 2–6 make it more pronounced. The velocity response is sensitive to slow, sustained input as well as fast throws. Displacement is capped at 70% of a row pitch and 48px, and the center half-row stays fixed. The engine and selection are unchanged. Rows recover their exact spacing after motion, the lens and slots follow the same displacement, and reduced motion disables it. The effect is off by default. A custom `rowStyle.translate` overrides the elastic displacement; custom `rowStyle.transform` can still be used alongside it.

## Refraction and grip

```svelte
<Detent items={items} label="Value" indicator={{ refraction: 0.5 }} grip={0.5} />
```

`indicator.refraction` bends the visible rows through a stationary lens inside the selection band. `true` uses strength 0.5; the numeric range is 0–4. Values through 2 retain their previous response; above 2 the increase progressively softens to prevent pixel folding. By default the central 60% stays flat, with distortion confined to the two edge regions along the scroll axis. It works on either axis and follows fitted indicator dimensions. Set `indicator.refractionInverse: true` alongside `refraction` to restore the original center lens, which distorts the selected content too. The inverse option alone does not enable refraction. The distortion is bounded to keep the sampling curve monotonic, even at the maximum. Start around 0.5–1; high values are deliberately pronounced.

`indicator.refractionRGB` adds optional chromatic dispersion near the refracting regions. Use `true` for a subtle intensity of 0.35, or 0–1 to adjust it: `indicator={{ refraction: 2, refractionRGB: 0.35 }}`. The red and blue samples separate across the scroll axis by up to ±3px (6px total, reduced for short rows). The RGB pass replaces the original edge pixels and adds colored contour fringes for dark as well as light text. The neutral reading area is excluded. It appears as details enter or leave the edge regions; a resting item entirely within the clear center remains unchanged. RGB requires refraction, is off by default, and adds filter passes only when enabled. It follows the same reduced-motion preference and works with the inverse lens too.

Refraction reuses the existing inert magnification copy, so it does not create additional row copies when magnify is already on. With `magnify={false}`, refraction still needs that second copy at scale 1: the `item` snippet runs twice per visible row. Keep both effects off for rows with ids, effects or heavy content. The displacement map is an embedded SVG image; a strict CSP needs to allow `data:` in `img-src`. Filtering costs rendering time, so check complex rows on your target mobile devices.

`grip` adds a short visual absorption when a primary pointer catches a moving wheel. `true` uses intensity 0.5; pass 0–2 to adjust it. It finishes in 180ms, without delaying pointer control or changing the engine position, selected value or snapping. It affects the main track, slots and lens together, composes with `elasticRows`, and does nothing when grabbing a wheel at rest. Keyboard, wheel input and pointer cancellation clear the response.

Both effects are off by default and disable themselves with reduced motion, including when that preference changes while mounted.
