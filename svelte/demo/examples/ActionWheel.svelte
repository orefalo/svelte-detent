<script lang="ts">
  // In your app: import { Detent } from '@hayderkg/detent-svelte'
  import { Detent } from '../../src/lib'

  interface Action { id: string; label: string; kind: 'switch' | 'run'; icon: string }
  // Tiny stroke icons (24×24 grid).
  const actions: Action[] = [
    { id: 'wifi', label: 'Wi-Fi', kind: 'switch', icon: 'M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 19.5h.01' },
    { id: 'bt', label: 'Bluetooth', kind: 'switch', icon: 'm7 7 10 10-5 4V3l5 4L7 17' },
    { id: 'air', label: 'Airplane mode', kind: 'switch', icon: 'M2 13l8-2 4-8h2l-2 8 6 1v2l-6 1 2 7h-2l-4-6-8-1z' },
    { id: 'dnd', label: 'Do Not Disturb', kind: 'switch', icon: 'M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z' },
    { id: 'share', label: 'Share screen', kind: 'run', icon: 'M3 5h18v11H3zM8 21h8M12 16v5' },
    { id: 'lock', label: 'Lock now', kind: 'run', icon: 'M6 11h12v9H6zM8 11V8a4 4 0 0 1 8 0v3' },
    { id: 'power', label: 'Low Power', kind: 'switch', icon: 'M4 8h14v8H4zM20 11v2M8 10.5v3' },
  ]
  let on = $state<Record<string, boolean>>({ bt: true })
  let ran = $state('')
  let value = $state(actions[3]!)
</script>

<div class="card">
  <Detent
    items={actions}
    bind:value
    getKey={(a) => a.id}
    getLabel={(a) => a.label}
    label="Quick actions"
    interactive
    width={300}
    itemHeight={52}
    visibleCount={5}
    curvature={0.6}
    fade={0.16}
    dim={0.22}
    magnify={false}
  >
    {#snippet item(a)}
      <div class="row">
        <span class="tile"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d={a.icon} /></svg></span>
        <span class="label">{a.label}</span>
        {#if a.kind === 'switch'}
          <button type="button" role="switch" aria-checked={!!on[a.id]} aria-label={a.label} class="switch" class:on={on[a.id]} onclick={() => (on[a.id] = !on[a.id])}><span></span></button>
        {:else}
          <button type="button" class="run" onclick={() => (ran = a.label)}>Run</button>
        {/if}
      </div>
    {/snippet}
  </Detent>
  <p class="note" aria-live="polite">{ran ? `Ran “${ran}”` : ''}</p>
</div>

<style>
  .card { display: grid; place-items: center; gap: 8px; min-height: 340px; width: 100%; align-content: center; }
  .row { display: flex; align-items: center; gap: 12px; width: 100%; padding-inline: 16px; font-size: 15px; box-sizing: border-box; }
  .tile { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 9px; background: rgb(128 128 128 / 0.14); flex: none; }
  .label { flex: 1; text-align: start; }
  .switch { position: relative; width: 40px; height: 24px; padding: 0; border: 0; border-radius: 999px; background: rgb(128 128 128 / 0.35); cursor: pointer; transition: background 0.2s; flex: none; }
  .switch span { position: absolute; top: 2px; left: 2px; width: 20px; height: 20px; border-radius: 999px; background: #fff; box-shadow: 0 1px 3px rgb(0 0 0 / 0.3); transition: transform 0.2s; }
  .switch.on { background: #34c759; }
  .switch.on span { transform: translateX(16px); }
  .run { padding: 3px 10px; border: 1px solid rgb(128 128 128 / 0.45); border-radius: 6px; background: transparent; color: inherit; font: 12px system-ui; cursor: pointer; flex: none; }
  .note { margin: 0; min-height: 1.2em; font-size: 12px; opacity: 0.6; }
</style>
