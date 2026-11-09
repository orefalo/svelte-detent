import { mount } from 'svelte'

// http://localhost:5173/?e=Carousel mounts examples/Carousel.svelte; no query lists them all.
const examples = import.meta.glob('./examples/*.svelte', { import: 'default' })
const name = new URLSearchParams(location.search).get('e')
const target = document.getElementById('app')!
const key = `./examples/${name}.svelte`

if (name && examples[key]) mount((await examples[key]()) as never, { target })
else
  target.innerHTML =
    '<h2>Examples</h2><ul>' +
    Object.keys(examples)
      .map((k) => k.replace(/^.*\/|\.svelte$/g, ''))
      .sort()
      .map((n) => `<li><a href="?e=${n}">${n}</a></li>`)
      .join('') +
    '</ul>'
