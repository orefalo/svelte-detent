/** The alarm's bell (the Time picker example): three sine partials with a soft attack and a long decay. */
let ctx: AudioContext | null = null

/** Browsers only let audio start from a gesture: call this from a pointer, key or wheel handler. */
export function primeBell() {
  if (typeof AudioContext === 'undefined') return
  try {
    ctx ??= new AudioContext()
    if (ctx.state !== 'running' && ctx.state !== 'closed') ctx.resume().catch(() => {})
  } catch {
    /* no audio */
  }
}

export function playBell() {
  const c = ctx
  if (!c || c.state !== 'running' || document.hidden) return
  const t = c.currentTime
  for (const [hz, gain] of [[880, 0.055], [1320, 0.025], [1760, 0.012]] as const) {
    const osc = c.createOscillator()
    const amp = c.createGain()
    osc.frequency.value = hz
    amp.gain.setValueAtTime(0, t)
    amp.gain.linearRampToValueAtTime(gain, t + 0.008)
    amp.gain.exponentialRampToValueAtTime(1e-4, t + 0.65)
    osc.connect(amp).connect(c.destination)
    osc.onended = () => (osc.disconnect(), amp.disconnect())
    osc.start(t)
    osc.stop(t + 0.7)
  }
}

export function closeBell() {
  ctx?.close().catch(() => {})
  ctx = null
}
