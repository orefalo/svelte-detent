// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { render } from 'svelte/server'
import { Detent, DetentNumber, DetentText } from '../src/lib'

const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

describe('server rendering', () => {
  it('Detent renders its rows and the selected state without a browser', () => {
    const { body } = render(Detent, { props: { items: letters, label: 'Letters', defaultValue: 'C', name: 'l' } })
    expect(body).toContain('role="listbox"')
    expect(body).toContain('aria-selected="true"')
    expect(body).toContain('translate3d(0,')
    expect(body).toContain('name="l"')
  })
  it('DetentText and DetentNumber render native text', () => {
    expect(render(DetentText, { props: { text: '<Send & save>', as: 'strong' } }).body).toContain('&lt;Send &amp; save>')
    expect(render(DetentNumber, { props: { value: 1234.5, locales: 'en-US', format: { style: 'currency', currency: 'USD' } } }).body).toContain('$1,234.50')
  })
})

