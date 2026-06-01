/**
 * Shared ambient background audio manager.
 * Keeps one looping ambient sound alive across scene transitions.
 */

let ambient: Phaser.Sound.BaseSound | null = null

function getBgVolume(): number {
  try {
    const raw = localStorage.getItem('gameSettings')
    if (raw) return JSON.parse(raw).musicVolume ?? 0.5
  } catch { /* ignore */ }
  return 0.5
}

/** Call in each scene's create() to ensure ambient is playing */
export function ensureAmbient(scene: Phaser.Scene): void {
  try {
    if (ambient && ambient.isPlaying) return

    if (ambient) {
      ambient.play()
      return
    }

    if (!scene.sound.get('ambient_rain')) {
      ambient = scene.sound.add('ambient_rain', {
        loop: true,
        volume: getBgVolume() * 0.6,
      })
      ambient.play()
    }
  } catch { /* audio asset not loaded or sound system unavailable */ }
}

/** Update volume from settings (call when settings change) */
export function updateAmbientVolume(): void {
  if (ambient) {
    const v = getBgVolume()
    if (v <= 0) {
      ambient.stop()
    } else {
      ;(ambient as any).setVolume(v * 0.6)
    }
  }
}

/** Stop ambient entirely (for cleanup) */
export function stopAmbient(): void {
  if (ambient) {
    ambient.stop()
    ambient = null
  }
}
