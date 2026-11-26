let ctx: AudioContext | null = null

/** Short three-note chime for a correct word or a purchase. */
export function playChime() {
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return
    ctx ??= new Ctor()
    const c = ctx
    ;[523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = c.createOscillator()
      const gain = c.createGain()
      const t = c.currentTime + i * 0.07
      osc.type = 'triangle'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.08, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18)
      osc.connect(gain)
      gain.connect(c.destination)
      osc.start(t)
      osc.stop(t + 0.19)
    })
  } catch {
    // sound is optional
  }
}

/** Longer rising fanfare for finishing a round or moving up a level. */
export function playFanfare() {
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return
    ctx ??= new Ctor()
    const c = ctx
    ;[523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5].forEach((freq, i) => {
      const osc = c.createOscillator()
      const gain = c.createGain()
      const t = c.currentTime + i * 0.12
      osc.type = 'triangle'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.09, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + (i === 5 ? 0.6 : 0.22))
      osc.connect(gain)
      gain.connect(c.destination)
      osc.start(t)
      osc.stop(t + (i === 5 ? 0.62 : 0.24))
    })
  } catch {
    // sound is optional
  }
}
