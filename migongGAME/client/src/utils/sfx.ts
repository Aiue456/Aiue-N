/**
 * Synthesized sound effects using Web Audio API.
 * No external audio files needed — everything is generated at runtime.
 */

let ctx: AudioContext | null = null

/** Call once on first user interaction to unlock AudioContext */
export function initAudio() {
  if (!ctx) {
    ctx = new AudioContext()
  }
  if (ctx.state === 'suspended') {
    ctx.resume()
  }
}

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext()
  }
  return ctx
}

function getVol(): number {
  try {
    const raw = localStorage.getItem('gameSettings')
    if (raw) {
      const s = JSON.parse(raw)
      return s.sfxVolume ?? 0.7
    }
  } catch { /* ignore */ }
  return 0.7
}

/** Short noise burst */
function noise(duration: number, vol = 1, freq = 440, type: OscillatorType = 'sine'): void {
  try {
    const c = getCtx()
    const v = getVol() * vol
    if (v <= 0) return

    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, c.currentTime)
    gain.gain.setValueAtTime(v * 0.3, c.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration)
    osc.connect(gain)
    gain.connect(c.destination)
    osc.start(c.currentTime)
    osc.stop(c.currentTime + duration)
  } catch { /* audio not available */ }
}

// ─── Footsteps ────────────────────────────────────
let lastStep = 0
export function sfxFootstep() {
  const now = performance.now()
  if (now - lastStep < 180) return // throttle
  lastStep = now
  noise(0.06, 0.35, 120 + Math.random() * 60, 'square')
}

// ─── Hazard collision ─────────────────────────────
export function sfxHurt() {
  noise(0.25, 0.6, 80, 'sawtooth')
}

// ─── Checkpoint activated ─────────────────────────
export function sfxCheckpoint() {
  const c = getCtx()
  const v = getVol()
  if (v <= 0) return
  const t = c.currentTime
  const notes = [523, 659, 784] // C5 E5 G5
  notes.forEach((freq, i) => {
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = 'triangle'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0, t + i * 0.1)
    gain.gain.linearRampToValueAtTime(v * 0.25, t + i * 0.1 + 0.05)
    gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.35)
    osc.connect(gain)
    gain.connect(c.destination)
    osc.start(t + i * 0.1)
    osc.stop(t + i * 0.1 + 0.35)
  })
}

// ─── Level complete ───────────────────────────────
export function sfxVictory() {
  const c = getCtx()
  const v = getVol()
  if (v <= 0) return
  const t = c.currentTime
  const melody = [523, 659, 784, 1047] // C5 E5 G5 C6
  melody.forEach((freq, i) => {
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    const start = t + i * 0.12
    gain.gain.setValueAtTime(0, start)
    gain.gain.linearRampToValueAtTime(v * 0.25, start + 0.04)
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.45)
    osc.connect(gain)
    gain.connect(c.destination)
    osc.start(start)
    osc.stop(start + 0.45)
  })
}

// ─── NPC dialog open ──────────────────────────────
export function sfxDialogOpen() {
  const c = getCtx()
  const v = getVol()
  if (v <= 0) return
  const t = c.currentTime
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(880, t)
  osc.frequency.exponentialRampToValueAtTime(660, t + 0.15)
  gain.gain.setValueAtTime(0, t)
  gain.gain.linearRampToValueAtTime(v * 0.2, t + 0.03)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2)
  osc.connect(gain)
  gain.connect(c.destination)
  osc.start(t)
  osc.stop(t + 0.2)
}

// ─── Button click ─────────────────────────────────
export function sfxClick() {
  noise(0.04, 0.3, 800, 'sine')
}

// ─── Choice selected ──────────────────────────────
export function sfxChoice() {
  const c = getCtx()
  const v = getVol()
  if (v <= 0) return
  const t = c.currentTime
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(600, t)
  osc.frequency.exponentialRampToValueAtTime(900, t + 0.12)
  gain.gain.setValueAtTime(v * 0.2, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25)
  osc.connect(gain)
  gain.connect(c.destination)
  osc.start(t)
  osc.stop(t + 0.25)
}

// ─── Note writing scribble ────────────────────────
export function sfxScribble() {
  const c = getCtx()
  const v = getVol()
  if (v <= 0) return
  for (let i = 0; i < 5; i++) {
    const t = c.currentTime + i * 0.06
    noise(0.03, 0.15 * (5 - i) / 5, 200 + Math.random() * 300, 'sawtooth')
  }
}

// ─── Star appear (used 3 times) ───────────────────
export function sfxStar() {
  noise(0.1, 0.4, 1200, 'triangle')
}

// ─── Teleport / respawn ───────────────────────────
export function sfxTeleport() {
  const c = getCtx()
  const v = getVol()
  if (v <= 0) return
  const t = c.currentTime
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(300, t)
  osc.frequency.exponentialRampToValueAtTime(900, t + 0.25)
  gain.gain.setValueAtTime(v * 0.2, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3)
  osc.connect(gain)
  gain.connect(c.destination)
  osc.start(t)
  osc.stop(t + 0.3)
}

// ─── Restart level ────────────────────────────────
export function sfxRestart() {
  noise(0.15, 0.35, 200, 'triangle')
}
