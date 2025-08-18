// utils/confetti.ts
import confetti from 'canvas-confetti'

export function launchConfettiRealistic() {
  const duration = 2 * 1000
  const animationEnd = Date.now() + duration
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 }

  const interval: number = window.setInterval(() => {
    const timeLeft = animationEnd - Date.now()

    if (timeLeft <= 0) {
      return clearInterval(interval)
    }

    const particleCount = 50 * (timeLeft / duration)

    // Since particles fall down, start a bit higher than random
    confetti({
      ...defaults,
      particleCount,
      origin: {
        x: Math.random(),
        y: Math.random() - 0.2
      }
    })
  }, 250)
}