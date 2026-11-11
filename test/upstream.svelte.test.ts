// Behaviour brought over from upstream @hayderkg/detent 0.1.2–0.1.4 (written for the React hook there, here for createDetent).
import { flushSync, mount, unmount, type Component } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { type DetentApi, type DetentOptions } from '../src/lib'
import Probe from './Probe.svelte'
import ProbeSlots from './ProbeSlots.svelte'

const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
const mounted: Record<string, unknown>[] = []
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function show(component: Component<any>, props: Record<string, unknown>) {
  const host = document.createElement('div')
  document.body.append(host)
  mounted.push(mount(component, { target: host, props }))
  flushSync()
  return host
}

beforeEach(() => {
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }))
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
  vi.useFakeTimers({
    toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance', 'setTimeout', 'clearTimeout'],
  })
})
afterEach(() => {
  for (const app of mounted.splice(0)) unmount(app)
  document.body.innerHTML = ''
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

const run = () => {
  for (let i = 0; i < 240; i++) vi.advanceTimersByTime(1000 / 60)
  flushSync()
}
const at = (type: string, y: number, t: number) => {
  const e = new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    pointerId: 1,
    pointerType: 'touch',
    clientX: 10,
    clientY: y,
    buttons: type === 'pointerup' ? 0 : 1,
  })
  Object.defineProperty(e, 'timeStamp', { value: t })
  return e
}

describe("changeOn 'tick'", () => {
  it('reports every row a hand turns past, live', () => {
    const out: { api?: DetentApi<string> } = {}
    const seen: string[] = []
    const host = show(Probe, {
      options: () => ({
        items: letters,
        label: 'Letters',
        itemSize: 36,
        changeOn: 'tick',
        onChange: (v: string) => seen.push(v),
      }),
      out,
    })
    const root = host.querySelector<HTMLElement>('[role=listbox]')!
    root.dispatchEvent(at('pointerdown', 300, 0))
    for (let k = 1; k <= 12; k++) window.dispatchEvent(at('pointermove', 300 - k * 9, k * 16))
    flushSync()
    // Three rows up while the finger is still down: each was reported as it crossed the center.
    expect(seen).toEqual(['B', 'C', 'D'])
    window.dispatchEvent(at('pointerup', 192, 400))
    run()
  })

  it('turns from a new value, keys or scrollTo report only where they land, not the rows on the way', () => {
    const out: { api?: DetentApi<string> } = {}
    const seen: string[] = []
    let opts = $state<DetentOptions<string>>({
      items: letters,
      label: 'Letters',
      itemSize: 36,
      changeOn: 'tick',
      value: 'A',
      onChange: (v: string) => seen.push(v),
    })
    const host = show(Probe, { options: () => opts, out })
    // The parent's own value: it turns there, and nothing comes back through onChange.
    opts = { ...opts, value: 'F' }
    flushSync()
    run()
    expect(out.api!.engine.index).toBe(5)
    expect(seen).toEqual([])
    // scrollTo: only the destination.
    out.api!.scrollTo(1)
    run()
    expect(seen).toEqual(['B'])
    // Home from a key: only the destination.
    out.api!.scrollTo(6, { animate: false })
    flushSync()
    seen.length = 0
    host
      .querySelector<HTMLElement>('[role=listbox]')!
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true, cancelable: true }))
    run()
    expect(seen).toEqual(['A'])
  })
})

describe('onEndReached', () => {
  it('asks only when the wheel moves near the end: not on mount there, nor as rows come in while it rests', () => {
    const asked = vi.fn()
    const out: { api?: DetentApi<string> } = {}
    const base = { label: 'Letters', animate: false, endReachedThreshold: 2, onEndReached: asked, defaultValue: 'H' }
    let opts = $state<DetentOptions<string>>({ ...base, items: letters })
    show(Probe, { options: () => opts, out })
    // Mounted on the last letter, within the threshold.
    expect(asked).not.toHaveBeenCalled()
    // Rows inserted above the centered one: it stays near the end, and nothing is asked.
    opts = { ...base, items: ['0', '1', ...letters] }
    flushSync()
    opts = { ...base, items: ['00', '0', '1', ...letters] }
    flushSync()
    expect(asked).not.toHaveBeenCalled()
    // Moved: asked.
    out.api!.engine.goTo(out.api!.engine.index - 1, false)
    flushSync()
    expect(asked).toHaveBeenCalledTimes(1)
  })

  it('asks again after a load that brought no rows, the next time the wheel nears the end', () => {
    const asked = vi.fn()
    const out: { api?: DetentApi<string> } = {}
    const base = { items: letters, label: 'Letters', animate: false, endReachedThreshold: 2, onEndReached: asked }
    let opts = $state<DetentOptions<string>>({ ...base, loading: false })
    show(Probe, { options: () => opts, out })
    out.api!.engine.goTo(6, false)
    flushSync()
    expect(asked).toHaveBeenCalledTimes(1)
    out.api!.engine.goTo(5, false)
    flushSync()
    expect(asked).toHaveBeenCalledTimes(1) // same length: not again while nothing changed
    opts = { ...base, loading: true }
    flushSync()
    opts = { ...base, loading: false } // the load ended, with nothing new
    flushSync()
    out.api!.engine.goTo(6, false)
    flushSync()
    expect(asked).toHaveBeenCalledTimes(2)
  })
})

describe('header and footer rows', () => {
  it('are not options: resting on one, nothing is announced as selected', () => {
    const out: { api?: DetentApi<string> } = {}
    const host = show(ProbeSlots, {
      options: () => ({ items: letters, label: 'Letters', header: true, footer: true, animate: false }),
      out,
    })
    const root = host.querySelector<HTMLElement>('[role=listbox]')!
    const options = () => [...host.querySelectorAll('[role=option]')].map((o) => o.textContent)
    expect(options()).not.toContain('Search')
    expect(root.getAttribute('aria-activedescendant')).toBe(host.querySelector('[role=option][aria-selected=true]')!.id)
    out.api!.engine.goTo(-1, false) // rest on the header
    flushSync()
    const header = [...host.querySelectorAll<HTMLElement>('[data-detent-index]')].find(
      (r) => r.textContent === 'Search',
    )!
    expect(header.getAttribute('role')).toBe('presentation')
    expect(header.hasAttribute('aria-selected')).toBe(false)
    expect(root.hasAttribute('aria-activedescendant')).toBe(false)
    expect(host.querySelector('[aria-selected=true]')).toBeNull()
  })
})
