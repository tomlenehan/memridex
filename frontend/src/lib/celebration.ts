import { Howl } from "howler"

let chime: Howl | undefined
export function soundEnabled() {
  return true
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

export function celebrateConnection() {
  if (soundEnabled()) playChime()
  void import("canvas-confetti")
    .then(({ default: confetti }) => {
      void confetti({
        particleCount: 34,
        spread: 54,
        origin: { y: 0.65 },
        colors: ["#E9B84E", "#5C9F90", "#B7A0CF"],
        disableForReducedMotion: true,
        ticks: 120,
        scalar: 0.8,
      })
    })
    .catch(() => {})
}
