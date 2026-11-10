<script lang="ts">
  // In your app: import { Detent, DetentNumber, DetentText } from 'svelte-detent'
  import { onMount } from 'svelte'
  import { ticks } from '../../src/lib'
  import { Detent, DetentNumber, DetentText } from '../../src/lib'
  import WheelNudge from '../site/WheelNudge.svelte'

  /** Replace `base` with wherever you host the token logos. */
  let { base = 'https://detent.hayder.sh' }: { base?: string } = $props()

  interface Token { symbol: string; name: string; price: string; change: number; icon: string; plate?: string }
  // svelte-ignore state_referenced_locally
  const media = `${base}/_next/static/immutable/media`
  // svelte-ignore state_referenced_locally
  const catalog: Token[] = [
    { symbol: 'BTC', name: 'Bitcoin', price: '67,412.08', change: 2.41, icon: `${media}/btc.26gu_d2qldrba.svg` },
    { symbol: 'ETH', name: 'Ether', price: '3,288.15', change: -0.84, icon: `${media}/eth.2hvppz6_-je5t.svg` },
    { symbol: 'MON', name: 'Monad', price: '0.0412', change: 7.84, icon: `${base}/tokens/monad.svg` },
    { symbol: 'SOL', name: 'Solana', price: '148.37', change: 5.12, icon: `${base}/tokens/sol.svg`, plate: '#000' },
    { symbol: 'USDC', name: 'USD Coin', price: '1.00', change: 0.01, icon: `${media}/usdc.3gjnb5vjcwuny.svg` },
    { symbol: 'EUR', name: 'Euro', price: '1.0842', change: -0.12, icon: `${media}/eur.1mrbu52_qgsxj.svg` },
    { symbol: 'AVAX', name: 'Avalanche', price: '28.41', change: 3.67, icon: `${media}/avax.08tsewvhw0e1i.svg` },
    { symbol: 'LINK', name: 'Chainlink', price: '14.06', change: -2.3, icon: `${media}/link.349u6lt5j-0n8.svg` },
    { symbol: 'JPY', name: 'Yen', price: '0.0066', change: 0.4, icon: `${media}/jpy.1xjjzn38dwhuc.svg` },
  ]
  const UP = '#16a34a'
  const DOWN = '#dc2626'
  const tick = ticks({ sound: true, haptics: true })

  // Prices drift a little every 20 s, while the list is on screen.
  let round = $state(0)
  let active = $state(false)
  const tokens = $derived(
    catalog.map((t, i) => {
      const quote = Number(t.price.replaceAll(',', ''))
      const drift = round ? 0.0025 * Math.sin(1.7 * round + 2.3 * i) : 0
      return { ...t, value: quote * (1 + drift), change: t.change + 100 * drift }
    }),
  )
  type Priced = (typeof tokens)[number]

  /** A little invented price history: seeded by the symbol, leaning up or down with the day's change. */
  function spark(symbol: string, change: number, w = 56, h = 20) {
    let seed = [...symbol].reduce((n, c) => 31 * n + c.charCodeAt(0), 7)
    const ys = Array.from({ length: 16 }, (_, i) => (i / 15) * Math.sign(change) * 0.6 + 0.5 * ((seed = (16807 * seed) % 0x7fffffff) / 0x7fffffff - 0.5))
    const lo = Math.min(...ys)
    const hi = Math.max(...ys)
    return ys.map((y, i) => `${((i / 15) * w).toFixed(1)},${(h - 2 - ((y - lo) / (hi - lo || 1)) * (h - 4)).toFixed(1)}`).join(' ')
  }
  const decimals = (t: Token) => t.price.split('.')[1]?.length ?? 2

  // --- the swap card -------------------------------------------------------------------
  let selected = $state('MON')
  let open = $state(false)
  let opened = false
  let chip = $state<HTMLButtonElement | null>(null)
  let sheet = $state<HTMLElement | null>(null)
  const receiving = $derived(tokens.find((t) => t.symbol === selected) ?? tokens[2]!)
  const paying = $derived(tokens.find((t) => t.symbol === 'USDC')!)
  /** 1,000 of the paying token, in the one picked. */
  const amount = $derived.by(() => {
    const got = 1000 / (receiving.value || Number(receiving.price.replace(/,/g, '')))
    return got >= 1000 ? got.toLocaleString('en', { maximumFractionDigits: 0 }) : got.toLocaleString('en', { maximumSignificantDigits: 4 })
  })

  // Opening moves focus into the wheel; closing returns it to the chip.
  $effect(() => {
    if (open) {
      opened = true
      const timer = setTimeout(() => sheet?.querySelector<HTMLElement>('[role=listbox]')?.focus({ preventScroll: true }), 60)
      return () => clearTimeout(timer)
    }
    if (opened) chip?.focus({ preventScroll: true })
  })

  // The clock runs only while the list is on screen and the tab is visible.
  let list = $state<HTMLElement | null>(null)
  onMount(() => {
    let inView = false
    const update = () => (active = inView && !document.hidden)
    const io = new IntersectionObserver(([e]) => ((inView = !!e?.isIntersecting), update()))
    if (list) io.observe(list)
    document.addEventListener('visibilitychange', update)
    return () => (io.disconnect(), document.removeEventListener('visibilitychange', update))
  })
  $effect(() => {
    if (!active) return
    const id = setInterval(() => round++, 2e4)
    return () => clearInterval(id)
  })
</script>

{#snippet logo(t: Token)}
  <span class="swap-chip">
    <img src={t.icon} alt="" width="20" height="20" style={t.plate ? `background:${t.plate};padding:3px;box-sizing:border-box;border-radius:99px` : 'border-radius:99px'} />
    <DetentText text={t.symbol} />
  </span>
{/snippet}

<div class="scene swap">
  <div class="swap-modal" data-open={open || undefined}>
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
    <div class="swap-behind" inert={open} onclick={() => open && (open = false)}>
      <div class="swap-card">
        <div class="swap-panel">
          <span class="swap-k">You pay</span>
          <span class="swap-row"><span class="swap-amount">1,000</span>{@render logo(paying)}</span>
        </div>
        <span class="swap-arrow" aria-hidden="true">
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v10M4 9l4 4 4-4" /></svg>
        </span>
        <div class="swap-panel">
          <span class="swap-k">You receive</span>
          <span class="swap-row" aria-live="polite">
            <DetentText class="swap-amount" text={amount} />
            <button bind:this={chip} type="button" class="swap-chip-btn" aria-expanded={open} aria-label="{receiving.symbol}: change the token you receive" onclick={(e) => (e.stopPropagation(), (open = true))}>
              {@render logo(receiving)}
              <svg class="swap-caret" viewBox="0 0 12 12" width="10" height="10" aria-hidden="true"><path d="M3 4.5l3 3 3-3" /></svg>
            </button>
          </span>
        </div>
      </div>
    </div>
    {#if !open}<WheelNudge arrow="up" style="top:192px;right:10px">try another token</WheelNudge>{/if}
    <div class="swap-sheet" inert={!open} role="dialog" aria-label="Select token">
      <button type="button" class="sheet-grabber" aria-label="Close" onclick={() => (open = false)}><span aria-hidden="true"></span></button>
      <div class="sheet-head">
        <span class="swap-k">Select token</span>
        <button type="button" class="sheet-done" onclick={() => (open = false)}>Done</button>
      </div>
      <div bind:this={sheet}>
        <div class="token-demo" data-active={active} bind:this={list} style="width:min(360px, 100%)">
          <Detent
            onTick={tick}
            items={tokens}
            getKey={(t) => t.symbol}
            getLabel={(t) => t.name}
            defaultValue={tokens[2]}
            onChange={(t) => (selected = t.symbol)}
            label="Asset"
            itemHeight={60}
            visibleCount={5}
            loop
            width="100%"
            align="start"
            curvature={0.8}
            dim={0.18}
            fade={0.2}
            magnify={false}
            selectedDepth={6}
            centerLight={0.08}
            grip={0.5}
          >
            {#snippet item(t: Priced)}
              <div class="token" data-token-price={t.value}>
                <img class="logo" src={t.icon} alt="" width="32" height="32" decoding="async" draggable="false" style={t.plate ? `background:${t.plate};padding:6px;box-sizing:border-box` : ''} />
                <span class="who"><b>{t.symbol}</b><span>{t.name}</span></span>
                <svg class="spark" width="56" height="20" viewBox="0 0 56 20" aria-hidden="true">
                  <polyline pathLength="1" points={spark(t.symbol, t.change)} fill="none" stroke={t.change >= 0 ? UP : DOWN} stroke-width="1.4" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round" opacity="0.85" />
                </svg>
                <span class="quote">
                  <span class="price"><DetentNumber value={t.value} locales="en-US" format={{ minimumFractionDigits: decimals(t), maximumFractionDigits: decimals(t) }} /></span>
                  <span class="change" style="color:{t.change >= 0 ? UP : DOWN};background:color-mix(in oklab, {t.change >= 0 ? UP : DOWN} 12%, transparent)">{t.change >= 0 ? '+' : '−'}{Math.abs(t.change).toFixed(2)}%</span>
                </span>
              </div>
            {/snippet}
          </Detent>
          <p class="note">Simulated prices · refresh every 20s</p>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .scene { --bg: #fff; --fg: #111; --muted: #888; --band: rgb(0 0 0 / 0.04); --ring: #111; --ease-out: cubic-bezier(0.23, 1, 0.32, 1); justify-items: center; gap: 18px; width: 100%; display: grid; }

  /* The swap card. */
  .swap-card { gap: 4px; width: min(360px, 100%); display: grid; position: relative; }
  .swap-panel { background: color-mix(in srgb, var(--fg) 4%, var(--bg)); border-radius: 14px; gap: 6px; padding: 12px 14px; display: grid; }
  .swap-k { color: var(--muted); font-size: 12.5px; }
  .swap-row { justify-content: space-between; align-items: center; gap: 12px; min-height: 30px; display: flex; }
  .swap-amount, .swap-row :global(.swap-amount) { letter-spacing: -0.02em; font-variant-numeric: tabular-nums; font-size: 24px; font-weight: 600; }
  .swap-chip { background: var(--bg); box-shadow: 0 0 0 0.5px color-mix(in srgb, var(--fg) 12%, transparent), 0 1px 2px #0000000f; border-radius: 99px; align-items: center; gap: 6px; padding: 4px 10px 4px 5px; font-size: 13px; font-weight: 600; display: inline-flex; }
  .swap-arrow { background: color-mix(in srgb, var(--fg) 4%, var(--bg)); width: 30px; height: 30px; box-shadow: 0 0 0 4px var(--bg); color: var(--muted); border-radius: 10px; place-items: center; display: grid; position: absolute; top: 50%; left: 50%; translate: -50% calc(-50% - 13px); }
  .swap-chip-btn { font: inherit; color: inherit; cursor: pointer; transition: transform 0.15s var(--ease-out); -webkit-tap-highlight-color: transparent; background: none; border: 0; border-radius: 99px; align-items: center; gap: 4px; padding: 0; display: inline-flex; }
  .swap-chip-btn:active { transform: scale(0.97); }
  .swap-chip-btn:focus-visible { outline: 1.5px solid var(--ring); outline-offset: 2px; }
  .swap-caret { fill: none; stroke: var(--muted); stroke-width: 1.6px; stroke-linecap: round; stroke-linejoin: round; transition: rotate 0.2s; }
  .swap-chip-btn[aria-expanded='true'] .swap-caret { rotate: 180deg; }

  /* The modal: the card steps back, the sheet comes up. */
  .scene.swap > .swap-modal { align-content: start; justify-items: center; width: min(360px, 100%); height: 260px; transition: height 0.46s cubic-bezier(0.32, 0.72, 0, 1); display: grid; position: relative; overflow: visible clip; }
  .scene.swap > .swap-modal[data-open] { height: 400px; }
  .swap-behind { transform-origin: 50% 0; width: 100%; padding-top: 20px; transition: transform 0.46s cubic-bezier(0.32, 0.72, 0, 1), filter 0.46s cubic-bezier(0.32, 0.72, 0, 1); }
  .swap-behind .swap-card { justify-items: stretch; width: 100%; }
  .swap-behind .swap-arrow { top: 82px; translate: -50% -50%; }
  .swap-modal[data-open] .swap-behind { filter: brightness(0.9); cursor: pointer; transform: translateY(-4px) scale(0.9); }
  .swap-sheet { z-index: 2; background: var(--bg); box-shadow: inset 0 0 0 0.5px color-mix(in srgb, var(--fg) 14%, transparent); visibility: hidden; border-radius: 20px 20px 0 0; gap: 4px; padding: 6px 0 4px; transition: transform 0.46s cubic-bezier(0.32, 0.72, 0, 1), visibility 0s 0.46s; display: grid; position: absolute; inset: auto 0 0; transform: translateY(105%); }
  .swap-modal[data-open] .swap-sheet { visibility: visible; transition: transform 0.46s cubic-bezier(0.32, 0.72, 0, 1), visibility; transform: none; }
  .sheet-head { justify-content: space-between; align-items: center; padding: 2px 8px 0 14px; display: flex; }
  .sheet-done { font: inherit; color: var(--fg); cursor: pointer; transition: background-color 0.15s ease, transform 0.15s var(--ease-out); background: none; border: 0; border-radius: 8px; padding: 6px 8px; font-size: 13px; font-weight: 600; }
  .sheet-done:active { transform: scale(0.96); }
  @media (hover: hover) and (pointer: fine) { .sheet-done:hover { background: var(--band); } }
  .sheet-done:focus-visible { outline: 1.5px solid var(--ring); outline-offset: 1px; }
  .sheet-grabber { cursor: pointer; -webkit-tap-highlight-color: transparent; background: none; border: 0; border-radius: 8px; justify-self: center; place-items: center; width: 72px; height: 16px; margin-top: -4px; padding: 0; display: grid; }
  .sheet-grabber span { background: color-mix(in srgb, var(--fg) 18%, transparent); width: 36px; height: 4px; transition: background-color 0.15s ease, width 0.2s var(--ease-out); border-radius: 99px; }
  @media (hover: hover) and (pointer: fine) { .sheet-grabber:hover span { background: color-mix(in srgb, var(--fg) 30%, transparent); width: 42px; } }
  .sheet-grabber:focus-visible { outline: 1.5px solid var(--ring); outline-offset: 0; }
  .swap-sheet :global([data-detent-ui][data-detent-ui]) { --detent-band: color-mix(in srgb, var(--fg) 5%, transparent); }
  .swap-sheet :global([data-detent-ui] [data-detent-band][data-detent-band]) { box-shadow: none; }

  /* The list. */
  .token-demo polyline { stroke-dasharray: 1; }
  .token-demo[data-active='true'] polyline { animation: token-draw 900ms cubic-bezier(0.22, 0.55, 0.35, 1) both; }
  @keyframes token-draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
  .token { display: flex; align-items: center; gap: 12px; width: 100%; }
  .logo { border-radius: 99px; box-shadow: 0 0 0 1px rgb(0 0 0 / 0.08); }
  .who { display: grid; gap: 2px; line-height: 1.1; min-width: 74px; }
  .who b { font-size: 15px; font-weight: 600; letter-spacing: -0.01em; }
  .who span { font-size: 12px; opacity: 0.55; }
  .spark { margin-left: auto; overflow: visible; flex: 1 1 56px; min-width: 0; max-width: 56px; }
  .quote { display: grid; justify-items: end; gap: 1px; min-width: 78px; line-height: 1.15; font-variant-numeric: tabular-nums; }
  .price { font-size: 14px; font-weight: 500; }
  .change { font-size: 11px; font-weight: 600; padding: 0 5px; line-height: 16px; border-radius: 6px; }
  .note { margin: 6px 0 0; text-align: center; font-family: system-ui, sans-serif; font-size: 10px; opacity: 0.45; }

  @media (prefers-reduced-motion: reduce) {
    .swap-modal, .swap-behind, .swap-sheet { transition: none; }
    .swap-modal[data-open] .swap-behind { transform: none; }
    .token-demo[data-active='true'] polyline { animation: none; }
  }
  @media (prefers-color-scheme: dark) {
    .scene { --bg: #0a0a0a; --fg: #ededed; --band: rgb(255 255 255 / 0.06); --ring: #ededed; }
    .swap-modal[data-open] .swap-behind { filter: brightness(0.66); }
    .swap-panel, .swap-arrow, .swap-sheet { background: color-mix(in srgb, var(--fg) 5.5%, var(--bg)); }
    .swap-sheet :global([data-detent-ui][data-detent-ui]) { --detent-band: color-mix(in srgb, var(--fg) 9%, transparent); }
  }
</style>
