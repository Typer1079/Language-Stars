export interface ConfettiPiece {
  key: string
  left: number
  w: number
  h: number
  color: string
  dur: number
}

/** Makes a fresh burst (called from the event that earns it, not during render). */
export function makeConfetti(count: number): ConfettiPiece[] {
  const colors = ['#f59e0b', '#6366f1', '#10b981', '#ec4899', '#38bdf8']
  const stamp = Date.now().toString(36)
  return Array.from({ length: count }, (_, i) => ({
    key: `${stamp}-${i}`,
    left: Math.random() * 100,
    w: 8 + Math.random() * 8,
    h: 10 + Math.random() * 10,
    color: colors[i % colors.length],
    dur: 1.1 + Math.random() * 1.1,
  }))
}
