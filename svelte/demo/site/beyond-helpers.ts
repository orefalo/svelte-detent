/** Small helpers shared by the "Beyond pickers" examples (Stories, FM radio, Zoom ring), ported from the site's own hooks. */

/**
 * Calls `cb(true)` while `node` is on screen and the tab is visible, `cb(false)` otherwise.
 * Returns a function that stops watching.
 */
export function watchVisible(node: Element, cb: (visible: boolean) => void): () => void {
  let inView = false
  const update = () => cb(inView && !document.hidden)
  const io = new IntersectionObserver(([entry]) => {
    inView = !!entry?.isIntersecting
    update()
  })
  io.observe(node)
  document.addEventListener('visibilitychange', update)
  return () => {
    io.disconnect()
    document.removeEventListener('visibilitychange', update)
  }
}

/**
 * A lazily created AudioContext for one-shot sounds. `prime` (call it from a user gesture) creates or resumes the
 * context; `play` is silent until then, and while the tab is hidden.
 */
export function createSfx() {
  let ctx: AudioContext | null = null
  return {
    prime() {
      if (typeof AudioContext === 'undefined') return
      try {
        ctx ??= new AudioContext()
        if (ctx.state !== 'running' && ctx.state !== 'closed') ctx.resume().catch(() => {})
      } catch {
        /* no audio */
      }
    },
    play(kind: 'bell' | 'shutter') {
      const a = ctx
      if (!a || a.state !== 'running' || document.hidden) return
      const t = a.currentTime
      if (kind === 'bell') {
        for (const [freq, gain] of [[880, 0.055], [1320, 0.025], [1760, 0.012]] as const) {
          const osc = a.createOscillator()
          const g = a.createGain()
          osc.frequency.value = freq
          g.gain.setValueAtTime(0, t)
          g.gain.linearRampToValueAtTime(gain, t + 0.008)
          g.gain.exponentialRampToValueAtTime(1e-4, t + 0.65)
          osc.connect(g).connect(a.destination)
          osc.onended = () => (osc.disconnect(), g.disconnect())
          osc.start(t)
          osc.stop(t + 0.7)
        }
      } else {
        // A short burst of decaying noise: the shutter.
        const buffer = a.createBuffer(1, Math.ceil(0.09 * a.sampleRate), a.sampleRate)
        const data = buffer.getChannelData(0)
        for (let i = 0; i < data.length; i++) data[i] = (2 * Math.random() - 1) * Math.exp(-i / (0.012 * a.sampleRate))
        const src = a.createBufferSource()
        const g = a.createGain()
        src.buffer = buffer
        g.gain.value = 0.16
        src.connect(g).connect(a.destination)
        src.onended = () => (src.disconnect(), g.disconnect())
        src.start()
      }
    },
    close() {
      ctx?.close().catch(() => {})
      ctx = null
    },
  }
}
