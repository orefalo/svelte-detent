<script lang="ts">
  // In your app: import { Detent, DetentNumber } from '@hayderkg/detent-svelte'
  import { Detent, DetentNumber } from '../../src/lib'

  const BILL = 128.4
  const tips = [0, 5, 10, 12, 15, 18, 20, 22, 25, 30]
  const people = Array.from({ length: 12 }, (_, i) => i + 1)
  const colors = ['#e8a35a', '#5fb7a0', '#6c7ee6', '#d96c8a', '#a07be0']

  let tip = $state(18)
  let count = $state(3)
  let roundUp = $state(false)

  const tipAmount = $derived(Math.round(BILL * tip) / 100)
  const total = $derived(BILL + tipAmount)
  const share = $derived(roundUp ? Math.ceil(total / count) : Math.round((total / count) * 100) / 100)
  const dollars = $derived(Math.floor(share))
  const cents = $derived(Math.round((share - dollars) * 100))

  const money = { style: 'currency', currency: 'USD' } as const
  // Both pickers: a small glass pill that magnifies the chosen value.
  const picker = { highlightStyle: 'pill', magnify: 1.22, perspective: 800, visibleCount: 5, fade: 0.3, indicator: { shape: 'pill', material: 'glass' } } as const
</script>

<div class="card">
  <header>
    <div><b>Dinner at Ostra</b><small>Table 12 · 4 Nov</small></div>
    <b class="bill">${BILL.toFixed(2)}</b>
  </header>

  <section>
    <span class="cap">Tip</span>
    <div class="wheel" style="font-size: 14px">
      <Detent {...picker} items={tips} bind:value={tip} label="Tip" orientation="horizontal" itemHeight={54} height={38} width="100%" getLabel={(t) => `${t}%`}>
        {#snippet item(t: number)}<span>{t}%</span>{/snippet}
      </Detent>
    </div>
  </section>

  <section>
    <span class="cap">Split between
      <span class="faces" aria-hidden="true">{#each colors.slice(0, Math.min(count, 5)) as c, i (i)}<i style:background={c}></i>{/each}</span>
    </span>
    <div class="wheel" style="font-size: 14px">
      <Detent {...picker} items={people} bind:value={count} label="People" orientation="horizontal" itemHeight={46} height={38} width="100%" />
    </div>
  </section>

  <div class="pays">
    <div class="left">
      <b>Each pays</b>
      <small>tip <DetentNumber value={tipAmount} locales="en-US" format={money} /> · total <DetentNumber value={total} locales="en-US" format={money} /></small>
    </div>
    <div class="share" aria-label={`$${share.toFixed(2)} each`}>
      <span class="cur">$</span><DetentNumber class="big" value={dollars} locales="en-US" /><span class="dot">.</span><DetentNumber
        class="small"
        value={cents}
        locales="en-US"
        format={{ minimumIntegerDigits: 2 }}
      />
    </div>
  </div>

  <label class="round">
    <span>Round up each share</span>
    <input type="checkbox" role="switch" bind:checked={roundUp} />
  </label>
</div>

<style>
  .card { box-sizing: border-box; width: 330px; max-width: 100%; margin: 0 auto; padding: 16px; border-radius: 22px; background: var(--card, #fff); box-shadow: 0 1px 2px rgb(0 0 0 / 0.06), 0 10px 30px -10px rgb(0 0 0 / 0.2); font-size: 13px; }
  header { display: flex; justify-content: space-between; align-items: flex-start; padding: 0 2px 14px; }
  header div { display: grid; gap: 1px; }
  header b { font-size: 14px; font-weight: 600; }
  small { color: #6b6b6b; font-size: 12px; }
  .bill { font-size: 15px; margin-top: 8px; }
  section { margin-bottom: 12px; padding: 10px; border-radius: 14px; background: rgb(0 0 0 / 0.04); }
  .cap { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; padding: 0 0 0 0; color: #6b6b6b; font-size: 12.5px; font-weight: 500; }
  .faces { display: inline-flex; }
  .faces i { width: 12px; height: 12px; margin-left: -4px; border-radius: 50%; border: 1.5px solid #fff; }
  .wheel { overflow: hidden; }
  .pays { display: flex; justify-content: space-between; align-items: center; padding: 6px 2px 8px; border-bottom: 1px solid rgb(0 0 0 / 0.08); }
  .left { display: grid; gap: 2px; }
  .left b { font-size: 13px; font-weight: 600; }
  .share { display: inline-flex; align-items: baseline; color: #6b6b6b; }
  .cur { font-size: 15.4px; font-weight: 500; }
  .share :global(.big) { font-size: 28px; font-weight: 600; color: #0a0a0a; line-height: 1.2; }
  .dot, .share :global(.small) { font-size: 15.4px; font-weight: 600; }
  .dot { margin: 0 -2px 0 -3px; }
  .round { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; padding: 0 2px; font-size: 12.5px; }
  .round input { appearance: none; position: relative; width: 34px; height: 20px; margin: 0; border-radius: 99px; background: rgb(10 10 10 / 0.16); cursor: pointer; transition: background 0.2s; }
  .round input::after { content: ''; position: absolute; left: 2px; top: 2px; width: 16px; height: 16px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgb(0 0 0 / 0.25); transition: translate 0.2s; }
  .round input:checked { background: #0a0a0a; }
  .round input:checked::after { translate: 14px 0; }
  @media (prefers-color-scheme: dark) {
    .card { --card: #1a1a1a; } section { background: rgb(255 255 255 / 0.06); } small, .cap, .share { color: #999; }
    .share :global(.big) { color: #fff; } .faces i { border-color: #1a1a1a; } .round input { background: rgb(255 255 255 / 0.2); } .round input:checked { background: #eee; }
  }
</style>
