<script lang="ts">
  // In your app: import { Detent } from '@hayderkg/detent-svelte'
  import { Detent } from '../../src/lib'

  interface Commit { id: string; title: string; hash: string; author: string; when: string }
  const titles = [
    'fix: settle on the nearest enabled row',
    'style: softer default band',
    'test: replay real wheel recordings',
    'refactor: release planner',
    'feat: horizontal centering',
    'docs: wheelMode and feedback',
    'perf: one style write per frame',
    'feat: catch window for the indicator',
  ]
  const authors = ['Hayder', 'Lea', 'Kenji', 'Ana']
  const avatars: Record<string, string> = {
    Hayder: 'https://detent.hayder.sh/avatar.jpg',
    Kenji: 'https://detent.hayder.sh/avatars/kenji.webp',
    Ana: 'https://detent.hayder.sh/avatars/ana.webp',
  }
  const PAGE = 30
  /** Commit `i`, newest first. Hashes are a stable pseudo-random hex string. */
  const commit = (i: number): Commit => ({
    id: String(i),
    title: titles[i % titles.length]!,
    hash: (Math.imul(i + 1, 2654435761) >>> 0).toString(16).padStart(8, '0').slice(0, 7),
    author: authors[i % authors.length]!,
    when: i + 1 < 60 ? `${i + 1}m` : `${Math.floor((i + 1) / 60)}h`,
  })

  let commits = $state<Commit[]>(Array.from({ length: PAGE }, (_, i) => commit(i)))
  let loading = $state(false)
  let selected = $state<Commit | undefined>()

  function more() {
    if (loading) return
    loading = true
    // Pretend the network takes a moment.
    setTimeout(() => {
      const start = commits.length
      commits = [...commits, ...Array.from({ length: PAGE }, (_, i) => commit(start + i))]
      loading = false
    }, 600)
  }
</script>

<div class="load">
  <Detent
    items={commits}
    bind:value={selected}
    getKey={(c) => c.id}
    getLabel={(c) => c.title}
    label="History"
    itemHeight={54}
    visibleCount={7}
    curvature={0.6}
    width="min(320px, 100%)"
    {loading}
    onEndReached={more}
  >
    {#snippet item(c: Commit)}
      <span class="commit">
        <span class="avatar">
          {#if avatars[c.author]}<img src={avatars[c.author]} alt="" draggable="false" />{:else}{c.author[0]}{/if}
        </span>
        <span class="text">
          <span class="title">{c.title}</span>
          <span class="meta">
            <svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true"><circle cx="8" cy="8" r="3" fill="none" stroke="currentColor" stroke-width="1.5" /><path d="M1 8h4M11 8h4" stroke="currentColor" stroke-width="1.5" /></svg>
            <span class="hash">{c.hash}</span>
            <span>· {c.author} · {c.when}</span>
          </span>
        </span>
      </span>
    {/snippet}
  </Detent>
  <span class="count">{commits.length} rows · throw it to the end</span>
</div>

<style>
  .load { display: grid; justify-items: center; gap: 10px; }
  .commit { display: flex; align-items: center; gap: 10px; width: 288px; height: 44px; padding: 0 14px; box-sizing: border-box; text-align: start; }
  .avatar { display: grid; place-items: center; flex: none; width: 26px; height: 26px; border-radius: 50%; background: rgb(128 128 128 / 0.16); font: 600 11px system-ui, sans-serif; overflow: hidden; }
  .avatar img { width: 26px; height: 26px; border-radius: 50%; object-fit: cover; }
  .text { display: grid; gap: 2px; min-width: 0; }
  .title { overflow: hidden; text-overflow: ellipsis; font: 13.5px system-ui, sans-serif; }
  .meta { display: flex; align-items: center; gap: 5px; font: 11.5px system-ui, sans-serif; opacity: 0.6; }
  .hash { font: 12.5px ui-monospace, 'SF Mono', Menlo, monospace; }
  .count { font: 12px ui-monospace, 'SF Mono', Menlo, monospace; color: #6b6b6b; }
</style>
