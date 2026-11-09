<script lang="ts">
  // In your app: import { Detent } from '@hayderkg/detent-svelte'
  import { Detent } from '../../src/lib'

  /** Replace `base` with wherever you host the avatar. */
  let { base = 'https://detent.hayder.sh' }: { base?: string } = $props()

  const reactions = ['😂', '😍', '🥹', '😮', '😢', '😡', '🔥', '👏', '🙌', '🎉', '🙏', '💯', '✨']
  let value = $state('🔥')
</script>

<div class="demo">
  <div class="msg">
    <img class="avatar" src="{base}/avatar.jpg" alt="" />
    <div class="bubble">Shipped the new wheel. Spin it.</div>
    <span class="chip">{value}<b>1</b></span>
  </div>

  <Detent
    items={reactions}
    bind:value
    label="Reaction"
    orientation="horizontal"
    itemHeight={60}
    visibleCount={7}
    height={84}
    curvature={0.86}
    fade={0.18}
    mask="none"
    magnify={1.75}
    indicator={{ shape: 'pill', material: 'glass' }}
    style="--detent-font-size:30px"
  />
</div>

<style>
  .demo { display: grid; justify-items: center; gap: 18px; }
  .msg { position: relative; display: flex; align-items: flex-end; gap: 8px; width: 320px; }
  .avatar { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; box-shadow: 0 0 0 0.5px rgb(0 0 0 / 0.12); }
  .bubble { padding: 10px 14px; border-radius: 18px 18px 18px 6px; background: #f0f0f0; font-size: 15px; color: #0a0a0a; }
  .chip { position: absolute; left: 248px; top: 32px; display: flex; align-items: center; gap: 4px; padding: 2px 8px 2px 6px; border-radius: 99px; background: #fff; font-size: 14px; color: #0a0a0a; box-shadow: 0 0 0 0.5px rgb(10 10 10 / 0.14), 0 2px 6px rgb(0 0 0 / 0.1); }
  .chip b { font-size: 11px; font-weight: 600; }
  @media (prefers-color-scheme: dark) {
    .bubble { background: #2a2a2a; color: #eee; }
    .chip { background: #1e1e1e; color: #eee; }
  }
</style>
