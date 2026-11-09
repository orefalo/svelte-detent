<script lang="ts">
  // In your app: import { Detent } from '@hayderkg/detent-svelte'
  import { tick } from 'svelte'
  import { Detent } from '../../src/lib'

  const CHECK = '✓'
  const faces = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', CHECK]
  const rules = [
    { label: '8 or more characters', test: (s: string) => s.length >= 8 },
    { label: 'Includes a digit', test: (s: string) => /\d/.test(s) },
    { label: 'One capital letter', test: (s: string) => /[A-Z]/.test(s) },
    { label: 'A special character', test: (s: string) => /[^A-Za-z0-9]/.test(s) },
  ]

  let secret = $state('')
  let shown = $state(false)
  let field = $state<HTMLInputElement | null>(null)

  const met = $derived(rules.map((r) => r.test(secret)))
  const ready = $derived(met.every(Boolean))
  // Each rule turns a drum. While a rule is open the drum shows a digit that depends on what you typed (so it
  // rolls as you type); once the rule is met it lands on the check.
  const resting = [3, 7, 8, 9]
  const faceFor = (i: number) => {
    if (met[i]) return CHECK
    if (!secret) return String(resting[i])
    let h = i + 3
    for (const c of secret) h = (h * 31 + c.codePointAt(0)!) % 997
    return String(h % 10)
  }

  // The show/hide eye keeps the caret (and any selection) where it was.
  async function toggle() {
    const el = field
    const [a, b, dir] = [el?.selectionStart ?? null, el?.selectionEnd ?? null, el?.selectionDirection ?? 'none']
    shown = !shown
    await tick()
    el?.focus()
    if (el && a !== null && b !== null) el.setSelectionRange(a, b, dir)
  }
</script>

<div class="pw">
  <div class="lock" aria-hidden="true">
    <div class="window">
      {#each rules as _, i (i)}
        <div class="drum">
          <Detent
            items={faces}
            value={faceFor(i)}
            label={`Rule ${i + 1}`}
            loop
            itemHeight={28}
            visibleCount={3}
            width={19}
            height={84}
            curvature={0.5}
            fade={0.35}
            dim={0}
            highlight={false}
            magnify={false}
            mask="none"
            disabled
            style="pointer-events:none;--detent-font-size:20px"
          >
            {#snippet item(f: string)}
              {#if f === CHECK}
                <svg class="check" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2.5 7.5 3 3 6-7" /></svg>
              {:else}{f}{/if}
            {/snippet}
          </Detent>
        </div>
      {/each}
    </div>
  </div>

  <h4>Create a password</h4>

  <div class="input">
    <input bind:this={field} bind:value={secret} type={shown ? 'text' : 'password'} placeholder="Password" autocomplete="new-password" spellcheck="false" aria-describedby="rules" />
    <button type="button" class="eye" aria-label={shown ? 'Hide password' : 'Show password'} aria-pressed={shown} onmousedown={(e) => e.preventDefault()} onclick={toggle}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        {#if shown}<path d="M3 3l18 18M10.6 6.2A9.6 9.6 0 0 1 12 6c5 0 9 6 9 6a15 15 0 0 1-3.2 3.7M6.5 7.4C4 9 3 12 3 12s4 6 9 6c1.400 0 2.700-.4 3.800-1" />{:else}<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" />{/if}
      </svg>
    </button>
  </div>

  <ul id="rules">
    {#each rules as r, i (r.label)}
      <li class:met={met[i]}>
        <span class="dot">{#if met[i]}<svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2.5 7.5 3 3 6-7" /></svg>{/if}</span>
        {r.label}
      </li>
    {/each}
  </ul>

  <button type="button" class="save" disabled={!ready}>Save password</button>
  <p class="foot">You can change it anytime in Settings,<br />under Security.</p>
</div>

<style>
  .pw { width: 320px; box-sizing: border-box; padding: 8px 4px; margin: 0 auto; display: grid; gap: 16px; justify-items: center; color: #0a0a0a; font-family: system-ui, sans-serif; }
  .lock { width: 116px; height: 116px; border-radius: 27px; display: grid; place-items: center; background: linear-gradient(165deg, #4b4b4f, #232325 55%, #1a1a1c); box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.14), inset 0 -1px 0 rgb(0 0 0 / 0.6), 0 14px 24px -12px rgb(0 0 0 / 0.5); }
  .window { display: flex; gap: 3px; padding: 4px 7px; height: 92px; box-sizing: border-box; border-radius: 14px; background: #111112; box-shadow: inset 0 3px 8px rgb(0 0 0 / 0.85), inset 0 0 0 1px rgb(0 0 0 / 0.7); align-items: center; }
  .drum { width: 19px; height: 84px; color: #f2f2f2; font-family: ui-monospace, 'SF Mono', Menlo, monospace; }
  .drum :global([data-detent-ui]) { --detent-fg: #f2f2f2; --detent-dim-color: #555; cursor: default; }
  .check { color: #35c27b; }
  h4 { margin: 0; font-size: 24px; font-weight: 650; letter-spacing: -0.01em; }
  .input { position: relative; width: 312px; }
  input { width: 100%; height: 50px; box-sizing: border-box; padding: 0 44px 0 16px; border: 1px solid rgb(0 0 0 / 0.12); border-radius: 14px; font: 17px system-ui, sans-serif; background: #fff; color: inherit; outline: none; }
  input:focus { border-color: rgb(0 0 0 / 0.45); box-shadow: 0 0 0 3px rgb(0 0 0 / 0.06); }
  .eye { position: absolute; right: 8px; top: 7px; width: 36px; height: 36px; border: 0; border-radius: 10px; background: none; color: #555; cursor: pointer; display: grid; place-items: center; }
  ul { list-style: none; margin: 0; padding: 0; width: 312px; display: grid; gap: 10px; font-size: 14px; color: #666; }
  li { display: flex; align-items: center; gap: 10px; transition: color 0.2s; }
  li.met { color: #0a0a0a; }
  .dot { width: 20px; height: 20px; border-radius: 50%; box-shadow: inset 0 0 0 1.5px rgb(0 0 0 / 0.14); display: grid; place-items: center; transition: background 0.2s, box-shadow 0.2s; }
  li.met .dot { background: #35c27b; box-shadow: none; color: #fff; }
  .save { width: 312px; height: 50px; border: 0; border-radius: 14px; font: 600 16px system-ui, sans-serif; background: #0a0a0a; color: #fff; cursor: pointer; transition: background 0.2s, color 0.2s; }
  .save:disabled { background: rgb(0 0 0 / 0.06); color: #777; cursor: default; }
  .foot { margin: 0; font-size: 12.5px; line-height: 1.4; text-align: center; color: #777; }
  @media (prefers-color-scheme: dark) {
    .pw { color: #ededed; } input { background: #161616; border-color: rgb(255 255 255 / 0.16); } li.met { color: #ededed; } ul, .foot { color: #999; }
    .save { background: #ededed; color: #0a0a0a; } .save:disabled { background: rgb(255 255 255 / 0.08); color: #888; } .eye { color: #aaa; }
  }
</style>
