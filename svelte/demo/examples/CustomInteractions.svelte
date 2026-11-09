<script lang="ts">
  // In your app: import { createDetent } from '@hayderkg/detent-svelte'
  import { createDetent, type DetentFrame } from '../../src/lib'

  // "Liquid", CSS flavour. Every frame, `subscribe` reports where the wheel is and how fast it moves; this
  // example turns that into stretch (cards smear along the motion) and lights the phase the wheel is in.
  // The original also has a WebGL shader mode, and Dust and Riso effects: not ported here.
  interface Card { kanji: string; romaji: string; english: string; bg: string; ink: string }
  const cards: Card[] = [
    { kanji: '光', romaji: 'Hikari', english: 'Light', bg: '#ec5a35', ink: '#151514' },
    { kanji: '海', romaji: 'Umi', english: 'Sea', bg: '#2f4cf0', ink: '#ffffff' },
    { kanji: '風', romaji: 'Kaze', english: 'Wind', bg: '#eff0f2', ink: '#1a2a4b' },
    { kanji: '夜', romaji: 'Yoru', english: 'Night', bg: '#151514', ink: '#f3e6c9' },
    { kanji: '森', romaji: 'Mori', english: 'Forest', bg: '#2e5d47', ink: '#e8eee6' },
    { kanji: '桜', romaji: 'Sakura', english: 'Blossom', bg: '#f3c8d2', ink: '#7a1f3d' },
    { kanji: '雨', romaji: 'Ame', english: 'Rain', bg: '#0e3a5d', ink: '#9fd2e7' },
    { kanji: '月', romaji: 'Tsuki', english: 'Moon', bg: '#f4b701', ink: '#151514' },
  ]
  let effect = $state<'css' | 'off'>('css')
  let phase = $state<'idle' | 'throw' | 'coast' | 'catch' | 'settle'>('idle')
  let index = $state(0)

  const d = createDetent<Card>(() => ({
    items: cards,
    loop: true,
    itemSize: 290,
    visibleCount: 2,
    label: 'Cards',
    getKey: (c) => c.romaji,
    getLabel: (c) => `${c.romaji}, ${c.english}`,
    onSettle: (_, i) => (index = i),
  }))

  let root = $state<HTMLElement>()
  $effect(() => {
    // The effect never touches the rendered rows' layout: it only writes a transform on each card.
    return d.subscribe((f: DetentFrame) => {
      const moving = f.mode !== 'idle'
      phase = !moving ? 'idle' : f.mode === 'drag' || f.mode === 'wheel' ? 'throw' : f.mode === 'coast' ? 'coast' : Math.abs(f.velocity) > 0.05 ? 'settle' : 'catch'
      if (!root) return
      const speed = effect === 'css' ? Math.min(1, Math.abs(f.velocity) / 3) : 0
      for (const row of root.querySelectorAll<HTMLElement>('[data-detent-index]')) {
        const card = row.firstElementChild as HTMLElement | null
        if (!card) continue
        const off = Math.abs(Number(row.dataset.detentIndex) - f.offset)
        // Stretch along the motion, narrower the faster it goes, a little more toward the edges.
        const sy = 1 + speed * 0.6 + speed * off * 0.12
        const sx = 1 - speed * 0.22 - speed * off * 0.04
        card.style.transform = `scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`
      }
    })
  })
  const lit = (p: typeof phase) => (phase === 'idle' || phase === p ? 1 : 0.3)
</script>

<div class="liquid">
  <span class="corner tl" style:opacity={lit('throw')}>Throw</span>
  <span class="corner tr" style:opacity={lit('coast')}>Coast</span>
  <span class="corner bl" style:opacity={lit('catch')}>Catch</span>
  <span class="corner br" style:opacity={lit('settle')}>Settle</span>

  <div {...d.rootAttrs} class="root" style={d.rootStyle + 'width:100%'} bind:this={root} {@attach d.attachRoot}>
    <div {...d.trackAttrs} style={d.trackStyle} {@attach d.attachTrack}>
      {#each d.rows as r (r.key)}
        <div {...r.attrs} class="row" style={r.style}>
          <div class="card" style:background={r.item.bg} style:color={r.item.ink}>
            <span class="kanji">{r.item.kanji}</span>
            <span class="names"><span>{r.item.romaji}</span><span>{r.item.english}</span></span>
          </div>
        </div>
      {/each}
    </div>
  </div>
  <div {...d.liveRegionAttrs} style={d.liveRegionStyle}>{d.announcement}</div>

  <div class="dots" aria-hidden="true">
    {#each cards as c, i (c.romaji)}<span class="dot" class:on={i === index}></span>{/each}
  </div>
  <div class="controls">
    {#each ['css', 'off'] as const as e (e)}
      <button type="button" class:on={effect === e} aria-pressed={effect === e} onclick={() => (effect = e)}>{e}</button>
    {/each}
  </div>
</div>

<style>
  .liquid { position: relative; display: grid; gap: 14px; justify-items: center; }
  .root { outline: none; height: 580px; }
  .row { display: flex; justify-content: center; align-items: flex-start; padding-top: 20px; box-sizing: border-box; }
  .card { position: relative; width: 186px; height: 250px; border-radius: 93px; transform-origin: 50% 0; display: grid; place-items: center; align-content: center; overflow: hidden; box-shadow: 0 10px 24px -12px rgb(0 0 0 / 0.35); }
  .kanji { font: 700 112px/1 'Hiragino Sans', 'Noto Sans JP', system-ui, sans-serif; margin-top: -8px; }
  .names { position: absolute; left: 30px; right: 30px; bottom: 54px; display: flex; justify-content: space-between; font: 600 7px ui-monospace, monospace; letter-spacing: 0.12em; text-transform: uppercase; }
  .corner { position: absolute; z-index: 1; font: 600 11px system-ui, sans-serif; letter-spacing: 0.22em; text-transform: uppercase; transition: opacity 0.2s; }
  .tl { top: 18px; left: 20px; } .tr { top: 18px; right: 20px; } .bl { bottom: 56px; left: 20px; } .br { bottom: 56px; right: 20px; }
  .dots { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); display: grid; gap: 6px; padding: 8px 5px; border-radius: 999px; background: rgb(128 128 128 / 0.1); }
  .dot { width: 5px; height: 5px; border-radius: 99px; background: #c8c8c8; transition: height 0.25s, background 0.25s; }
  .dot.on { height: 16px; background: #222; }
  .controls { display: flex; gap: 14px; font: 13px ui-monospace, monospace; }
  .controls button { border: 0; background: none; padding: 0; font: inherit; color: #888; cursor: pointer; }
  .controls button.on { color: #111; font-weight: 700; }
</style>
