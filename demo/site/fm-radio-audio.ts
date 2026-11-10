/** The FM radio's sound: static between stations, and a little generated music that fades in as the needle nears one. */

export interface FmStation {
  /** Frequency in 0.1 MHz steps (987 = 98.7). */
  at: number
  name: string
  kind: string
  voice: 'bell' | 'keys' | 'pluck' | 'talk' | 'pulse'
  /** Root note in Hz, the scale in semitones above it, and the tempo. */
  root: number
  scale: number[]
  bpm: number
}

export function createFmAudio(stations: FmStation[]) {
  const a = new AudioContext()
  const master = a.createGain()
  master.gain.value = 0
  const high = new BiquadFilterNode(a, { type: 'highpass', frequency: 90 })
  const low = new BiquadFilterNode(a, { type: 'lowpass', frequency: 7000 })
  master.connect(high).connect(low).connect(a.destination)

  // Static: looping white noise through a band-pass, louder the further the needle is from any station.
  const noiseBuffer = a.createBuffer(1, 2 * a.sampleRate, a.sampleRate)
  const noiseData = noiseBuffer.getChannelData(0)
  for (let i = 0; i < noiseData.length; i++) noiseData[i] = 2 * Math.random() - 1
  const noise = new AudioBufferSourceNode(a, { buffer: noiseBuffer, loop: true })
  const band = new BiquadFilterNode(a, { type: 'bandpass', frequency: 2600, Q: 0.5 })
  const staticGain = new GainNode(a, { gain: 0 })
  noise.connect(band).connect(staticGain).connect(master)
  noise.start()

  // One bus per station; its level follows the signal.
  const buses = stations.map(() => {
    const g = new GainNode(a, { gain: 0 })
    g.connect(master)
    return g
  })
  let levels = stations.map(() => 0)
  const next = stations.map(() => 0)

  /** Schedules one note of a station at `when`; returns the time until the next one. */
  const note = (st: FmStation, index: number, when: number) => {
    // A talk station pauses now and then.
    if (st.voice === 'talk' && Math.random() < 0.18) return 0.35
    const out = new GainNode(a, { gain: 0 })
    out.connect(buses[index]!)
    const semitone = st.scale[Math.floor(Math.random() * st.scale.length)]!
    const freq = st.root * 2 ** (semitone / 12)
    const oscs: OscillatorNode[] = []
    const add = (type: OscillatorType, f: number, gain: number) => {
      const osc = new OscillatorNode(a, { type, frequency: f })
      const g = new GainNode(a, { gain })
      osc.connect(g).connect(out)
      oscs.push(osc)
    }
    let length = 0.5
    if (st.voice === 'talk') {
      // Babble: a sawtooth through two formant-like band-passes.
      const osc = new OscillatorNode(a, { type: 'sawtooth', frequency: st.root * (0.9 + 0.25 * Math.random()) })
      const f1 = new BiquadFilterNode(a, { type: 'bandpass', frequency: 500 + 400 * Math.random(), Q: 4 })
      const f2 = new BiquadFilterNode(a, { type: 'bandpass', frequency: 1300 + 900 * Math.random(), Q: 5 })
      osc.connect(f1).connect(out)
      osc.connect(f2).connect(out)
      oscs.push(osc)
      length = 0.12 + 0.12 * Math.random()
      out.gain.setValueAtTime(0, when)
      out.gain.linearRampToValueAtTime(0.5, when + 0.03)
      out.gain.linearRampToValueAtTime(0, when + length)
    } else {
      const peak = st.voice === 'pulse' ? 0.16 : st.voice === 'bell' ? 0.14 : 0.18
      if (st.voice === 'keys') (add('triangle', freq, 1), add('sine', 2 * freq, 0.25), (length = 1.1))
      else if (st.voice === 'bell') (add('sine', 2 * freq, 1), add('sine', 2 * freq * 2.76, 0.12), (length = 2.6))
      else if (st.voice === 'pluck') (add('triangle', freq, 1), add('square', freq, 0.05), (length = 0.45))
      else (add('sawtooth', freq, 0.5), add('square', freq / 2, 0.4), (length = 0.18))
      out.gain.setValueAtTime(0, when)
      out.gain.linearRampToValueAtTime(peak, when + 0.008)
      out.gain.exponentialRampToValueAtTime(1e-4, when + length)
    }
    for (const osc of oscs) {
      osc.start(when)
      osc.stop(when + length + 0.05)
    }
    oscs[0]!.onended = () => out.disconnect()
    const beat = 60 / st.bpm
    return st.voice === 'talk' ? length + 0.02 : st.voice === 'pulse' ? beat / 2 : beat * (Math.random() < 0.3 ? 2 : 1)
  }

  /** Keeps notes scheduled 200 ms ahead, for the stations that can be heard. */
  const schedule = () => {
    const horizon = a.currentTime + 0.2
    stations.forEach((st, n) => {
      if (levels[n]! < 0.01) {
        next[n] = 0
        return
      }
      next[n] = Math.max(next[n]!, a.currentTime + 0.02)
      while (next[n]! < horizon) {
        const when: number = next[n]!
        next[n] = when + note(st, n, when)
      }
    })
  }

  let timer: ReturnType<typeof setInterval> | undefined
  let suspendTimer: ReturnType<typeof setTimeout> | undefined
  return {
    /** `signals`: how clearly each station comes in, 0 to 1. */
    tune(signals: number[]) {
      levels = signals
      const best = Math.max(...signals)
      const now = a.currentTime
      staticGain.gain.setTargetAtTime(0.012 + 0.13 * (1 - best) ** 1.3, now, 0.02)
      signals.forEach((s, i) => buses[i]!.gain.setTargetAtTime(0.9 * s, now, 0.02))
    },
    play(on: boolean) {
      clearInterval(timer)
      clearTimeout(suspendTimer)
      if (on) {
        a.resume()
        timer = setInterval(schedule, 50)
        schedule()
      } else suspendTimer = setTimeout(() => void a.suspend().catch(() => {}), 400)
      master.gain.setTargetAtTime(on ? 0.32 : 0, a.currentTime, 0.06)
    },
    close() {
      clearInterval(timer)
      clearTimeout(suspendTimer)
      a.close().catch(() => {})
    },
  }
}
