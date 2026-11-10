<script lang="ts">
  // In your app: import { Detent, DetentText } from 'svelte-detent'
  import { ticks } from '../../src/lib'
  import { Detent, DetentText } from '../../src/lib'

  type Kind = 'toggle' | 'button'
  interface Action { id: string; label: string; kind: Kind }
  const tick = ticks({ sound: true, haptics: true })
  const actions: Action[] = [
    { id: 'wifi', label: 'Wi-Fi', kind: 'toggle' },
    { id: 'bt', label: 'Bluetooth', kind: 'toggle' },
    { id: 'plane', label: 'Airplane mode', kind: 'toggle' },
    { id: 'dnd', label: 'Do Not Disturb', kind: 'toggle' },
    { id: 'share', label: 'Share screen', kind: 'button' },
    { id: 'lock', label: 'Lock now', kind: 'button' },
    { id: 'power', label: 'Low Power', kind: 'toggle' },
  ]
  /** What the line under the wheel says after an action: [off or run, on]. */
  const replies: Record<string, [string, string]> = {
    wifi: ['A little less connected.', 'Back on the grid.'],
    bt: ['Flying solo.', 'Better together.'],
    plane: ['Back on the ground.', 'Cleared for takeoff.'],
    dnd: ['The world can wait. Or not.', 'A little peace and quiet.'],
    power: ['Full steam ahead.', "Making every percent count."],
    share: ['Your screen, centre stage.', 'Your screen, centre stage.'],
    lock: ['Safe and sound.', 'Safe and sound.'],
  }

  let on = $state<Record<string, boolean>>({ wifi: true, bt: true })
  let message = $state('')
  /** Which glyph just responded; `n` changes so the little animation plays again. */
  let pulse = $state({ id: '', n: 0 })

  function respond(id: string, enabled: boolean) {
    message = replies[id]![Number(enabled)]!
    pulse = { id, n: pulse.n + 1 }
  }
  function toggle(id: string) {
    const next = !on[id]
    on = { ...on, [id]: next }
    respond(id, next)
  }
</script>

<div class="action-demo">
  <Detent
    onTick={tick}
    items={actions}
    getKey={(a) => a.id}
    getLabel={(a) => a.label}
    defaultValue={actions[3]}
    label="Quick actions"
    interactive
    itemHeight={52}
    visibleCount={5}
    width="min(300px, 100%)"
    preset="snappy"
    align="start"
    curvature={0.6}
    magnify={false}
  >
    {#snippet item(a: Action)}
      <div class="row">
        {#key `${a.id}-${pulse.id === a.id ? pulse.n : 0}`}
          <span class="action-glyph" data-action={a.id} data-enabled={!!on[a.id]} data-respond={pulse.id === a.id ? '' : undefined} aria-hidden="true">
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              {#if a.id === 'wifi'}
                <path d="M2.5 9a14 14 0 0 1 19 0" /><path d="M5.5 12.5a9.5 9.5 0 0 1 13 0" /><path d="M8.75 16a5 5 0 0 1 6.5 0" /><circle cx="12" cy="19.25" r="0.9" fill="currentColor" />
              {:else if a.id === 'bt'}
                <path d="M7 7.5l10 9-5 4.5V3l5 4.5-10 9" />
              {:else if a.id === 'plane'}
                <path d="M10.5 3.8c0-1 .7-1.8 1.5-1.8s1.5.8 1.5 1.8V9l7.5 4.5v2L13.5 13v4.8l2.5 1.9V21L12 20l-4 1v-1.3l2.5-1.9V13L3 15.5v-2L10.5 9z" />
              {:else if a.id === 'dnd'}
                <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
              {:else if a.id === 'share'}
                <rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8M12 17v4M12 13.5v-6M9.25 10 12 7.25 14.75 10" />
              {:else if a.id === 'lock'}
                <rect x="5" y="10.5" width="14" height="10" rx="2" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
              {:else}
                <rect x="2.5" y="7" width="17" height="10" rx="2.5" /><path d="M21.5 10.5v3" /><rect x="5" y="9.5" width="4" height="5" rx="1" fill="currentColor" stroke="none" />
              {/if}
            </svg>
          </span>
        {/key}
        <span>{a.label}</span>
        {#if a.kind === 'toggle'}
          <button type="button" role="switch" class="switch" class:on={on[a.id]} aria-checked={!!on[a.id]} aria-label={a.label} onclick={() => toggle(a.id)}><span></span></button>
        {:else}
          <button type="button" class="run" onclick={() => respond(a.id, true)}>Run</button>
        {/if}
      </div>
    {/snippet}
  </Detent>
  <output class="reply"><DetentText text={message} /></output>
</div>

<style>
  .action-demo { display: grid; justify-items: center; gap: 16px; width: 100%; }
  .row { display: flex; align-items: center; width: 100%; gap: 12px; font-size: 15px; }
  .action-glyph { display: grid; place-items: center; flex: none; width: 30px; height: 30px; border-radius: 9px; background: rgb(128 128 128 / 0.14); color: inherit; transition: color 180ms ease, background-color 180ms ease; }
  .action-glyph[data-enabled='true'] { background: color-mix(in srgb, #16a34a 12%, transparent); color: #16a34a; }
  .action-glyph[data-respond] svg { animation: action-nod 340ms cubic-bezier(0.23, 1, 0.32, 1); }
  .action-glyph[data-respond][data-action='plane'][data-enabled='true'] svg { animation-name: action-takeoff; }
  .action-glyph[data-respond][data-action='dnd'][data-enabled='true'] svg { animation-name: action-moon; }
  .action-glyph[data-respond][data-action='lock'] svg { animation-name: action-lock; }
  @keyframes action-nod { 0%, 100% { transform: scale(1); } 40% { transform: scale(1.14); } }
  @keyframes action-takeoff { 0%, 100% { transform: translate(0, 0); } 45% { transform: translate(2px, -3px) rotate(8deg); } }
  @keyframes action-moon { 0%, 100% { transform: rotate(0); } 45% { transform: rotate(-16deg); } }
  @keyframes action-lock { 0%, 100% { transform: translateX(0); } 30% { transform: translateX(-1.5px); } 65% { transform: translateX(1.5px); } }
  .switch { margin-left: auto; width: 40px; height: 24px; border-radius: 99px; border: 0; padding: 2px; cursor: pointer; background: rgb(128 128 128 / 0.35); transition: background-color 160ms cubic-bezier(0.23, 1, 0.32, 1); }
  .switch.on { background: #16a34a; }
  .switch span { display: block; width: 20px; height: 20px; border-radius: 99px; background: #fff; transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1); }
  .switch.on span { transform: translateX(16px); }
  .run { margin-left: auto; height: 28px; padding: 0 12px; border-radius: 8px; border: 1px solid rgb(128 128 128 / 0.3); background: transparent; color: inherit; font: inherit; font-size: 13px; cursor: pointer; }
  .reply { font-size: 12px; min-height: 16px; opacity: 0.6; }
  @media (prefers-reduced-motion: reduce) {
    .action-glyph[data-respond] svg { animation: none; }
    .action-glyph, .action-demo button, .action-demo button span { transition: none !important; }
  }
</style>
