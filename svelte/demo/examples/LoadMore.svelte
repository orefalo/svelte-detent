<script lang="ts">
  // In your app: import { Detent } from 'svelte-detent'
  import { ticks } from '@hayderkg/detent/feedback'
  import { onDestroy } from 'svelte'
  import { Detent } from '../../src/lib'

  /** Replace `base` with wherever you host the avatars. */
  let { base = 'https://detent.hayder.sh' }: { base?: string } = $props()

  interface Commit { id: number; title: string; hash: string; author: { name: string; avatar: string | null }; when: string }
  const titles = [
    'fix: settle on the nearest enabled row',
    'feat: catch window for the indicator',
    'perf: one style write per frame',
    'docs: wheelMode and feedback',
    'feat: horizontal centering',
    'refactor: release planner',
    'test: replay real wheel recordings',
    'style: softer default band',
  ]
  const authors = [
    { name: 'Hayder', avatar: '/avatar.jpg' },
    { name: 'Ana', avatar: '/avatars/ana.webp' },
    { name: 'Kenji', avatar: '/avatars/kenji.webp' },
    { name: 'Lea', avatar: null },
  ]
  /** A page of 30 commits starting at `from`. */
  const page = (from: number): Commit[] =>
    Array.from({ length: 30 }, (_, k) => {
      const i = from + k
      return {
        id: i,
        title: titles[(7 * i) % titles.length]!,
        hash: (((i + 1) * 0x9e3779b1) >>> 0).toString(16).padStart(8, '0').slice(0, 7),
        author: authors[(3 * i) % authors.length]!,
        when: i < 60 ? `${i + 1}m` : `${Math.floor(i / 60)}h`,
      }
    })

  const tick = ticks({ sound: true, haptics: true })
  let commits = $state<Commit[]>(page(0))
  let loading = $state(false)
  let timer: ReturnType<typeof setTimeout> | undefined
  onDestroy(() => clearTimeout(timer))
  // svelte-ignore state_referenced_locally
  const first = commits[3]

  function more() {
    if (timer) return
    loading = true
    timer = setTimeout(() => {
      commits = [...commits, ...page(commits.length)]
      loading = false
      timer = undefined
    }, 700)
  }
</script>

<div class="load">
  <Detent
    onTick={tick}
    items={commits}
    getKey={(c) => c.id}
    getLabel={(c) => c.title}
    defaultValue={first}
    label="History"
    itemHeight={54}
    visibleCount={7}
    width="min(320px, 100%)"
    align="start"
    curvature={0.6}
    magnify={false}
    {loading}
    onEndReached={more}
  >
    {#snippet loadingRow()}<span class="loading">Loading…</span>{/snippet}
    {#snippet item(c: Commit)}
      <span class="commit">
        <span class="avatar" aria-hidden="true">
          {#if c.author.avatar}<img src="{base}{c.author.avatar}" alt="" width="26" height="26" loading="lazy" decoding="async" />{:else}{c.author.name[0]}{/if}
        </span>
        <span class="text">
          <span class="title">{c.title}</span>
          <span class="meta">
            <svg aria-hidden="true" viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="8" cy="8" r="2.6" /><path d="M1 8h4.4M10.6 8H15" /></svg>
            <span class="mono">{c.hash}</span>· {c.author.name} · {c.when}
          </span>
        </span>
      </span>
    {/snippet}
  </Detent>
  <span class="mono count">{commits.length} rows · throw it to the end</span>
</div>

<style>
  .load { display: grid; grid-template-columns: minmax(0, 1fr); justify-items: center; gap: 12px; width: 100%; }
  .mono { font-family: 'Geist Mono', ui-monospace, monospace; }
  .count { font-size: 12px; opacity: 0.6; }
  .loading { font-size: 13px; opacity: 0.5; padding-left: 16px; }
  .commit { display: flex; align-items: center; gap: 10px; width: 100%; padding-inline: 14px; min-width: 0; box-sizing: border-box; }
  .avatar { display: grid; place-items: center; flex: none; width: 26px; height: 26px; border-radius: 13px; background: rgb(128 128 128 / 0.16); color: inherit; font-size: 11px; font-weight: 600; }
  .avatar img { width: 26px; height: 26px; object-fit: cover; border-radius: 50%; }
  .text { display: grid; gap: 2px; min-width: 0; }
  .title { font-size: 13.5px; overflow: hidden; text-overflow: ellipsis; }
  .meta { display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; opacity: 0.55; }
</style>
