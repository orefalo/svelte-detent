<script lang="ts">
  // In your app: import { Detent, DetentNumber } from '@hayderkg/detent-svelte'
  import { Detent, DetentNumber } from '../../src/lib'

  /** Logos are hotlinked from the Detent site; replace with your own. */
  const site = 'https://detent.hayder.sh'
  const media = `${site}/_next/static/immutable/media`
  interface Token { symbol: string; name: string; price: number; open: number; digits: number; logo: string; history: number[] }
  const seed = (symbol: string, price: number, change: number): number[] => {
    // A deterministic wiggle that ends at the token's day change.
    let h = 0
    for (const c of symbol) h = (h * 31 + c.charCodeAt(0)) >>> 0
    return Array.from({ length: 14 }, (_, i) => {
      h = (h * 1664525 + 1013904223) >>> 0
      const noise = ((h >>> 8) / 16777216 - 0.5) * 0.02
      return (price / (1 + change / 100)) * (1 + (change / 100) * (i / 13) + noise * (i < 13 ? 1 : 0))
    })
  }
  const make = (symbol: string, name: string, price: number, change: number, digits: number, logo: string): Token => {
    const history = seed(symbol, price, change)
    return { symbol, name, price, open: price / (1 + change / 100), digits, logo, history }
  }
  let tokens = $state<Token[]>([
    make('BTC', 'Bitcoin', 67412.08, 2.41, 2, `${media}/btc.26gu_d2qldrba.svg`),
    make('ETH', 'Ether', 3288.15, -0.84, 2, `${media}/eth.2hvppz6_-je5t.svg`),
    make('MON', 'Monad', 0.0412, 7.84, 4, `${site}/tokens/monad.svg`),
    make('SOL', 'Solana', 148.37, 5.12, 2, `${site}/tokens/sol.svg`),
    make('USDC', 'USD Coin', 1, 0.01, 2, `${media}/usdc.3gjnb5vjcwuny.svg`),
    make('EUR', 'Euro', 1.0842, -0.12, 4, `${media}/eur.1mrbu52_qgsxj.svg`),
    make('AVAX', 'Avalanche', 28.41, 3.67, 2, `${media}/avax.08tsewvhw0e1i.svg`),
    make('LINK', 'Chainlink', 14.06, -2.3, 2, `${media}/link.349u6lt5j-0n8.svg`),
    make('JPY', 'Yen', 0.0066, 0.4, 4, `${media}/jpy.1xjjzn38dwhuc.svg`),
  ])
  const usdc = $derived(tokens.find((t) => t.symbol === 'USDC')!)
  let selected = $state('MON')
  let open = $state(false)
  const token = $derived(tokens.find((t) => t.symbol === selected)!)
  const receive = $derived((1000 * usdc.price) / token.price)

  // Simulated prices: a small random walk every 20 s.
  $effect(() => {
    const id = setInterval(() => {
      tokens = tokens.map((t) => {
        const price = t.symbol === 'USDC' ? t.price : t.price * (1 + (Math.random() - 0.5) * 0.008)
        return { ...t, price, history: [...t.history.slice(1), price] }
      })
    }, 20000)
    return () => clearInterval(id)
  })

  const change = (t: Token) => ((t.price - t.open) / t.open) * 100
  const pct = (t: Token) => `${change(t) >= 0 ? '+' : '−'}${Math.abs(change(t)).toFixed(2)}%`
  const spark = (t: Token) => {
    const lo = Math.min(...t.history)
    const hi = Math.max(...t.history)
    return t.history.map((v, i) => `${(i / (t.history.length - 1)) * 56},${16 - ((v - lo) / (hi - lo || 1)) * 14 - 1}`).join(' ')
  }
  const fmt = (t: Token) => ({ minimumFractionDigits: t.digits, maximumFractionDigits: t.digits })
  const current = {
    get value() { return tokens.find((t) => t.symbol === selected)! },
    set value(t: Token) { selected = t.symbol },
  }
</script>

<svelte:head>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Covered+By+Your+Grace&display=swap" />
</svelte:head>

<div class="card">
  {#if !open}
    <div class="swap">
      <section class="panel">
        <span class="label">You pay</span>
        <div class="line"><b class="amount">1,000</b><span class="pill"><img src={usdc.logo} alt="" />USDC</span></div>
      </section>
      <span class="arrow" aria-hidden="true">↓</span>
      <section class="panel">
        <span class="label">You receive</span>
        <div class="line">
          <b class="amount"><DetentNumber value={receive} locales="en-US" format={{ maximumFractionDigits: receive >= 100 ? 0 : 2 }} /></b>
          <button type="button" class="pill" aria-label="{token.symbol}: change the token you receive" onclick={() => (open = true)}>
            <img src={token.logo} alt="" />{token.symbol}<span class="chev">⌄</span>
          </button>
        </div>
      </section>
      <span class="try" aria-hidden="true">try another token</span>
    </div>
  {:else}
    <div class="sheet">
      <i class="grab"></i>
      <header><span>Select token</span><button type="button" onclick={() => (open = false)}>Done</button></header>
      <Detent
        items={tokens}
        bind:value={current.value}
        getKey={(t) => t.symbol}
        getLabel={(t) => `${t.symbol}, ${t.name}`}
        label="Asset"
        itemHeight={60}
        visibleCount={5}
        curvature={0.8}
        fade={0.2}
        dim={0.18}
        magnify={false}
        align="start"
        indicator={{ shape: 'rounded', border: '1px solid rgb(0 0 0 / .45)' }}
      >
        {#snippet item(t)}
          <div class="tok">
            <img src={t.logo} alt="" />
            <span class="name"><b>{t.symbol}</b><span>{t.name}</span></span>
            <svg viewBox="0 0 56 16" width="56" height="16" aria-hidden="true"><polyline points={spark(t)} fill="none" stroke={change(t) >= 0 ? '#16a34a' : '#dc2626'} stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
            <span class="quote">
              <DetentNumber value={t.price} locales="en-US" format={fmt(t)} />
              <em class:down={change(t) < 0}>{pct(t)}</em>
            </span>
          </div>
        {/snippet}
      </Detent>
      <p class="foot">Simulated prices · refresh every 20s</p>
    </div>
  {/if}
</div>

<style>
  .card { display: grid; place-items: center; min-height: 340px; width: 100%; }
  .swap { position: relative; display: grid; gap: 4px; width: min(360px, 100%); }
  .panel { padding: 14px 14px 12px; border-radius: 16px; background: rgb(128 128 128 / 0.1); }
  .label { font-size: 12px; opacity: 0.6; }
  .line { display: flex; align-items: center; justify-content: space-between; margin-top: 10px; }
  .amount { font-size: 24px; font-weight: 650; letter-spacing: -0.02em; }
  .pill { display: inline-flex; align-items: center; gap: 8px; padding: 4px 12px 4px 4px; border: 0; border-radius: 999px; background: Canvas; color: inherit; font: 600 14px system-ui; box-shadow: 0 0 0 1px rgb(128 128 128 / 0.2); }
  button.pill { cursor: pointer; }
  .pill img { width: 22px; height: 22px; border-radius: 99px; }
  .chev { opacity: 0.5; margin-left: -2px; }
  .arrow { position: absolute; left: 50%; top: 50%; translate: -50% -50%; display: grid; place-items: center; width: 32px; height: 32px; border-radius: 10px; background: Canvas; box-shadow: 0 0 0 4px Canvas, 0 0 0 1px rgb(128 128 128 / 0.2) inset; font-size: 14px; }
  .try { position: absolute; right: -4px; bottom: -34px; color: #e5261b; font: 19px 'Covered By Your Grace', cursive; transform: rotate(-4deg); }
  .sheet { width: min(363px, 100%); padding: 0 0 8px; border-radius: 18px; box-shadow: 0 0 0 1px rgb(128 128 128 / 0.25), 0 12px 30px -16px rgb(0 0 0 / 0.3); }
  .grab { display: block; width: 28px; height: 4px; margin: 6px auto 0; border-radius: 99px; background: rgb(128 128 128 / 0.35); }
  header { display: flex; justify-content: space-between; padding: 14px 12px 6px; font-size: 12px; }
  header button { border: 0; background: none; color: inherit; font: 600 12px system-ui; cursor: pointer; }
  .tok { display: flex; align-items: center; gap: 12px; width: 100%; padding-inline: 16px; box-sizing: border-box; font-size: 14px; }
  .tok img { width: 32px; height: 32px; border-radius: 99px; flex: none; }
  .name { display: grid; flex: 1; text-align: start; line-height: 1.2; }
  .name b { font-size: 15px; font-weight: 600; }
  .name span { font-size: 12px; opacity: 0.6; }
  .quote { display: grid; justify-items: end; min-width: 64px; font-weight: 500; }
  em { margin-top: 2px; padding: 1px 6px; border-radius: 6px; background: rgb(22 163 74 / 0.12); color: #16a34a; font: 600 11px system-ui; }
  em.down { background: rgb(220 38 38 / 0.12); color: #dc2626; }
  .foot { margin: 4px 0 0; text-align: center; font-size: 10px; opacity: 0.5; }
</style>
