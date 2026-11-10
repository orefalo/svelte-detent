<script lang="ts">
  import Header from './Header.svelte'
  import type { Component } from 'svelte'
  import { intro, sections } from './sections'

  // Each example is its own chunk, mounted only while its card is near the viewport.
  const loaders = import.meta.glob('../examples/*.svelte', { import: 'default' }) as Record<string, () => Promise<Component>>
  const load = (file: string) => loaders[`../examples/${file}.svelte`]!()

  /**
   * Tells `set` whether the element is within 600px of the viewport. An example that scrolls far away is unmounted, which
   * stops its animation loops (canvas, WebGL, timers); the card keeps its height so the page does not jump.
   */
  function near(node: HTMLElement, set: (visible: boolean) => void) {
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.at(-1)!.isIntersecting
        if (!visible) node.style.minHeight = `${node.offsetHeight}px`
        set(visible)
      },
      { rootMargin: '600px 0px' },
    )
    io.observe(node)
    return { destroy: () => io.disconnect() }
  }
  const seen = $state<Record<string, boolean>>({})
  const all = sections.flatMap((s) => s.examples)

  let active = $state('')
  $effect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && (active = e.target.id)), { rootMargin: '-40% 0px -55% 0px' })
    document.querySelectorAll('article[id]').forEach((el) => io.observe(el))
    return () => io.disconnect()
  })
</script>

<Header current="examples" />

<aside aria-label="Examples">
  {#each all as e (e.id)}<a href="#{e.id}" class:on={active === e.id} aria-label={e.title}></a>{/each}
</aside>

<main>
  <h1>Examples</h1>
  <p class="lead">{intro}</p>

  {#each sections as s (s.id)}
    <section id={s.id} class:wide={s.id === 'custom-interactions'}>
      <h2>{s.title}</h2>
      <p class="lead">{s.description}</p>
      {#each s.examples as e (e.id)}
        <article id={e.id}>
          <h3>{e.title}</h3>
          <p class="lead">{e.description}</p>
          <div class="card" use:near={(visible) => (seen[e.id] = visible)}>
            {#if seen[e.id]}
              {#await load(e.file) then Example}<Example />{:catch err}<p class="err">{String(err)}</p>{/await}
            {/if}
          </div>
        </article>
      {/each}
    </section>
  {/each}
</main>

<style>
  main { max-width: 520px; margin: 0 auto; padding: 24px 0 160px; }
  h1, h2, h3 { margin: 0; font-size: 14px; font-weight: 600; }
  h1 { font-size: 28px; letter-spacing: -0.02em; }
  .lead { margin: 10px 0 0; font: 400 16px/1.45 Newsreader, Georgia, serif; color: #666; }
  section { margin-top: 96px; }
  article { margin-top: 56px; scroll-margin-top: 80px; }
  section > h2 + .lead { margin-bottom: 40px; }
  .card { margin-top: 20px; border: 1px solid #e8e8e8; border-radius: 16px; min-height: 240px; padding: 24px; display: grid; place-items: center; overflow: hidden; box-sizing: border-box; }
  /* the canvas scenes are wider than the text column */
  .wide .card { margin-inline: -52px; }
  @media (max-width: 700px) { .wide .card { margin-inline: 0; } }
  .err { color: #c00; font-size: 12px; }
  aside { position: fixed; left: 28px; top: 230px; display: grid; gap: 14px; }
  aside a { display: block; width: 12px; height: 2px; background: #ccc; border-radius: 1px; transition: width 0.2s, background 0.2s; }
  aside a.on { width: 22px; background: #0a0a0a; }
  @media (max-width: 1000px) { aside { display: none; } main { padding-inline: 16px; box-sizing: border-box; } }
  @media (prefers-color-scheme: dark) {
    .card { border-color: #262626; }
    aside a { background: #444; } aside a.on { background: #ededed; }
  }
</style>
