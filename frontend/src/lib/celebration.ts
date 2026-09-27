import { Howl } from "howler"

const soundKey = "memriplace.reward-sound"
let chime: Howl | undefined
let sessionPreference: boolean | undefined
export function soundEnabled() {
  if (sessionPreference !== undefined) return sessionPreference
  try {
    return localStorage.getItem(soundKey) === "on"
  } catch {
    return false
  }
}
export function setSoundEnabled(enabled: boolean) {
  sessionPreference = enabled
  try {
    localStorage.setItem(soundKey, enabled ? "on" : "off")
  } catch {
    /* Session-only when storage is blocked. */
  }
  if (enabled) playChime()
  else chime?.stop()
}
function playChime() {
  try {
    chime ??= new Howl({
      src: [`${import.meta.env.BASE_URL}sounds/memory-sparkle.wav`],
      volume: 0.25,
    })
    chime.play()
  } catch {
    // Audio availability must never interrupt a successful save.
  }
}
export function celebrateMemory() {
  if (soundEnabled()) playChime()
  // Decorative feedback must never block saving or navigation.
  void import("canvas-confetti")
    .then(({ default: confetti }) => {
      void confetti({
        particleCount: 48,
        spread: 65,
        origin: { y: 0.7 },
        colors: ["#E9B84E", "#5C9F90", "#B7A0CF", "#E99D81"],
        disableForReducedMotion: true,
        ticks: 150,
        scalar: 0.85,
      })
    })
    .catch(() => {})
}
