<script lang="ts">
  // In your app: import { Detent } from 'svelte-detent'
  import { ticks } from '@hayderkg/detent/feedback'
  import { Detent } from '../../src/lib'

  /** Replace `base` with wherever you host the avatar. */
  let { base = 'https://detent.hayder.sh' }: { base?: string } = $props()

  const emojis = ['👍', '❤️', '😂', '😍', '🥹', '😮', '😢', '😡', '🔥', '👏', '🙌', '🎉', '🙏', '💯', '✨', '👀', '🤔', '🫡', '🤝', '💪', '🚀', '⚡️', '🍿', '☕️']
  let emoji = $state('🔥')
  const tick = ticks({ sound: { volume: 0.3, dynamicTimbre: 0.5 }, haptics: true })
</script>

<div class="scene chat">
  <div class="chat-msg">
    <img class="chat-avatar" src="{base}/avatar.jpg" alt="" width="28" height="28" />
    <div class="chat-bubble">
      Shipped the new wheel. Spin it.
      <!-- Keyed by the emoji: each new reaction pops in. -->
      {#key emoji}<span class="chat-reaction" aria-label="Reaction: {emoji}">{emoji} <b>1</b></span>{/key}
    </div>
  </div>
  <div class="wheel">
    <Detent
      onTick={tick}
      items={emojis}
      defaultValue="🔥"
      bind:value={emoji}
      loop
      label="Reaction"
      orientation="horizontal"
      itemHeight={60}
      visibleCount={7}
      height={84}
      curvature={0.75}
      magnify={1.75}
      indicator={{ shape: 'pill', material: 'glass', refraction: 2, refractionRGB: 0.35, impact: 0.4 }}
      elasticRows={1.1}
      grip={0.8}
      dim={0}
      fade={0.18}
      style="--detent-font-size:30px;width:100%;max-width:420px"
    />
  </div>
</div>

<style>
  .scene { --bg: #fff; --fg: #0a0a0a; --muted: #6b6b6b; justify-items: center; gap: 18px; width: 100%; display: grid; font-family: system-ui, sans-serif; }
  .wheel { justify-items: center; width: 100%; display: grid; }
  .chat-msg { align-items: flex-end; gap: 8px; width: min(320px, 100%); display: flex; }
  .chat-avatar { object-fit: cover; border-radius: 50%; flex: none; width: 28px; height: 28px; box-shadow: 0 0 0 0.5px #0000001f; }
  .chat-bubble { background: color-mix(in srgb, var(--fg) 6%, var(--bg)); border-radius: 18px 18px 18px 6px; margin-bottom: 12px; padding: 10px 14px; font-size: 15px; position: relative; }
  .chat-reaction { background: var(--bg); box-shadow: 0 0 0 0.5px color-mix(in srgb, var(--fg) 14%, transparent), 0 2px 6px #0000001a; border-radius: 99px; align-items: center; gap: 4px; padding: 2px 8px 2px 6px; font-size: 14px; animation: 0.36s cubic-bezier(0.34, 1.56, 0.64, 1) react-pop; display: inline-flex; position: absolute; bottom: -14px; right: -6px; }
  .chat-reaction b { color: var(--muted); font-size: 11px; font-weight: 600; }
  @keyframes react-pop { 0% { opacity: 0; transform: scale(0.6) translateY(4px); } }
  @media (prefers-color-scheme: dark) { .scene { --bg: #0a0a0a; --fg: #ededed; --muted: #8f8f8f; } .chat-avatar { box-shadow: 0 0 0 0.5px #ffffff1f; } }
</style>
