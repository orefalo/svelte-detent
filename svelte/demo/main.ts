import { mount } from 'svelte'

// http://localhost:5173/?e=Carousel mounts examples/Carousel.svelte on its own; the full page is /examples/.
const examples = import.meta.glob('./examples/*.svelte', { import: 'default' })
const name = new URLSearchParams(location.search).get('e')
const target = document.getElementById('app')!
const key = `./examples/${name}.svelte`

if (name && examples[key]) mount((await examples[key]()) as never, { target })
else location.replace('/examples/')
