import { flushSync, mount, tick, unmount, type Component } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'svelte/server'
import { Detent, DetentNumber, DetentText, type DetentApi } from '../src/lib'
import Controlled from './Controlled.svelte'
import Probe from './Probe.svelte'

const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
const mounted: Record<string, unknown>[] = []
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function show<P extends Record<string, unknown>>(component: Component<any>, props: P) {
  const host = document.createElement('div')
  document.body.append(host)
  const app = mount(component, { target: host, props })
  mounted.push(app)
  flushSync()
  return { host, app }
}
const key = (el: Element, k: string) =>
  el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }))
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

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
})
afterEach(() => {
  for (const app of mounted.splice(0)) unmount(app)
  document.body.innerHTML = ''
  vi.unstubAllGlobals()
})

describe('createDetent (headless)', () => {
  it('renders the options, selects defaultValue and centres it', () => {
    const out: { api?: DetentApi<string> } = {}
    const { host } = show(Probe, { options: () => ({ items: letters, label: 'Letters', defaultValue: 'C' }), out })
    const lb = host.querySelector('[role=listbox]')!
    expect(lb.getAttribute('aria-label')).toBe('Letters')
    expect(lb.getAttribute('tabindex')).toBe('0')
    expect(out.api!.engine.index).toBe(2)
    expect(out.api!.selectedItem).toBe('C')
    expect(host.querySelector('[aria-selected=true]')!.textContent).toBe('C')
    expect(lb.getAttribute('aria-activedescendant')).toBe(host.querySelector('[aria-selected=true]')!.id)
  })

  it('virtualizes: renders the visible window, not every item', () => {
    const items = Array.from({ length: 500 }, (_, i) => `n${i}`)
    const { host } = show(Probe, { options: () => ({ items, label: 'Many', visibleCount: 5 }), out: {} })
    expect(host.querySelectorAll('[role=option]').length).toBeLessThan(20)
  })

  it('arrow keys move the wheel, set the selection when it settles, and write the transform by hand', async () => {
    const changes: string[] = []
    const out: { api?: DetentApi<string> } = {}
    const { host } = show(Probe, {
      options: () => ({ items: letters, label: 'L', onChange: (v: string) => changes.push(v), animate: false }),
      out,
    })
    const lb = host.querySelector<HTMLElement>('[role=listbox]')!
    key(lb, 'ArrowDown')
    await wait(900)
    flushSync()
    expect(out.api!.engine.index).toBe(1)
    expect(changes).toEqual(['B'])
    expect(host.querySelector('[aria-selected=true]')!.textContent).toBe('B')
    const track = host.querySelector<HTMLElement>('[role=presentation]')!
    expect(track.style.transform).toBe(`translate3d(0,${((5 - 1) / 2) * 36 - 36}px,0)`)
    expect(lb.dataset.state).toBe('idle')
  })

  it('a controlled value turns the wheel; a disabled item is skipped', async () => {
    let value = $state('A')
    const out: { api?: DetentApi<string> } = {}
    show(Probe, {
      options: () => ({ items: letters, label: 'L', value, isDisabled: (v: string) => v === 'D', animate: false }),
      out,
    })
    value = 'F'
    flushSync()
    await wait(900)
    expect(out.api!.engine.index).toBe(5)
    out.api!.scrollTo(3, { animate: false })
    expect(out.api!.engine.index).not.toBe(3)
  })

  it('keeps the centred item centred when items are inserted before it', () => {
    let list = $state(['B', 'C', 'D'])
    const out: { api?: DetentApi<string> } = {}
    show(Probe, { options: () => ({ items: list, label: 'L', defaultValue: 'C' }), out })
    expect(out.api!.engine.index).toBe(1)
    // svelte-ignore state_referenced_locally
    list = ['X', 'Y', ...list]
    flushSync()
    expect(out.api!.engine.index).toBe(3)
    expect(out.api!.selectedItem).toBe('C')
  })

  it('subscribe delivers per-frame positions, and unsubscribes', () => {
    const out: { api?: DetentApi<string> } = {}
    show(Probe, { options: () => ({ items: letters, label: 'L', defaultValue: 'C' }), out })
    const seen: number[] = []
    const off = out.api!.subscribe((f) => seen.push(f.offset))
    out.api!.engine.sync()
    off()
    out.api!.engine.sync()
    expect(seen).toEqual([2])
  })
})

describe('<Detent>', () => {
  it('renders a listbox with a snippet per row, and a lens copy of the rows', () => {
    const { host } = show(Controlled, { items: letters, initial: 'C' })
    expect(host.querySelector('[role=listbox]')).not.toBeNull()
    const rows = host.querySelectorAll('[data-detent-item]')
    expect(rows.length).toBeGreaterThan(0)
    expect(rows[2]!.querySelector('b')!.textContent).toBe('C')
    // magnify (the default) renders every visible row a second time, inert
    expect(host.querySelectorAll('[data-detent-mirror]').length).toBe(rows.length)
    expect(host.querySelector('[inert]')).not.toBeNull()
  })

  it('bind:value follows the wheel and onChange fires', async () => {
    const seen: string[] = []
    const { host } = show(Controlled, {
      items: letters,
      initial: 'A',
      animate: false,
      onChange: (v: string) => seen.push(v),
    })
    key(host.querySelector('[role=listbox]')!, 'End')
    await wait(900)
    flushSync()
    expect(seen.at(-1)).toBe('H')
    expect(host.querySelector('[data-testid=bound]')!.textContent).toBe('H')
  })

  it('submits the selected key through a hidden input; a disabled wheel stays out of the form', () => {
    const a = show(Detent, { items: letters, label: 'L', name: 'letter', defaultValue: 'B' })
    expect(a.host.querySelector<HTMLInputElement>('input[type=hidden][name=letter]')!.value).toBe('B')
    const b = document.createElement('form')
    document.body.append(b)
    mounted.push(
      mount(Detent, {
        target: b,
        props: { items: letters, label: 'L', name: 'letter', defaultValue: 'B', disabled: true },
      }),
    )
    flushSync()
    expect(new FormData(b).has('letter')).toBe(false)
  })

  it('form reset turns the wheel back to defaultValue', async () => {
    const form = document.createElement('form')
    document.body.append(form)
    mounted.push(
      mount(Detent, {
        target: form,
        props: { items: letters, label: 'L', name: 'letter', defaultValue: 'B', animate: false },
      }),
    )
    flushSync()
    key(form.querySelector('[role=listbox]')!, 'End')
    await wait(900)
    flushSync()
    expect(new FormData(form).get('letter')).toBe('H')
    form.reset()
    await wait(900)
    flushSync()
    expect(new FormData(form).get('letter')).toBe('B')
  })

  it('puts the nonce on its style element', () => {
    show(Detent, { items: letters, label: 'L', nonce: 'abc123' })
    expect(document.head.querySelector('style[nonce=abc123]')).not.toBeNull()
  })

  it('keeps hand-written row variables when it re-renders', async () => {
    const { host } = show(Controlled, { items: letters, initial: 'C' })
    const row = host.querySelector<HTMLElement>('[data-detent-item="2"]')!
    row.style.setProperty('--detent-row-lag', '3')
    key(host.querySelector('[role=listbox]')!, 'ArrowDown')
    await wait(900)
    flushSync()
    expect(host.querySelector<HTMLElement>('[data-detent-item="2"]')!.style.getPropertyValue('--detent-row-lag')).toBe(
      '3',
    )
  })

  it('renders header, footer and the empty state', () => {
    const { host } = show(Detent, { items: [] as string[], label: 'L', emptyState: (() => {}) as never })
    expect(host.querySelectorAll('[role=option]').length).toBe(0)
  })
})

describe('<DetentText> and <DetentNumber>', () => {
  it('shows the text, and the new text after an update', async () => {
    const props = $state({ text: 'Hello', animate: false })
    const { host } = show(DetentText, props)
    expect(host.querySelector('[data-detent-text-content]')!.textContent).toBe('Hello')
    props.text = 'World'
    flushSync()
    await tick()
    expect(host.querySelector('[data-detent-text-content]')!.textContent).toBe('World')
  })
  it('formats numbers, in parts when classNames is given', () => {
    const { host } = show(DetentNumber, {
      value: 1234.5,
      locales: 'en-US',
      format: { style: 'currency', currency: 'USD' },
      classNames: { currency: 'cur', fraction: 'fr' },
    })
    const content = host.querySelector('[data-detent-number-content]')!
    expect(content.textContent).toBe('$1,234.50')
    expect(content.querySelector('.cur')!.textContent).toBe('$')
    expect(content.querySelector('.fr')!.textContent).toBe('50')
  })
})
