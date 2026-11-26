import { shuffle } from './progress'
import { STICKER_POOL, type StickerItem } from './stickerPool'
import { FOR_YOU, packById } from './stickerPacks'
import { newId, type Learner, type PlacedSticker } from './types'

/** Growing follows the Fibonacci sequence: 1, 2, 3, 5, 8, 13, 21 ... stars. */
export function growCost(growCount = 0): number {
  const g = Math.max(0, Math.floor(Number(growCount) || 0))
  let a = 1
  let b = 2
  for (let i = 0; i < g; i++) [a, b] = [b, a + b]
  return a
}

/** Practically no limit: Fibonacci costs grow far faster than anyone earns stars. */
export const MAX_GROW = 60

/** Selling refunds exactly what was spent on the sticker. Older stickers (before costs were tracked) use the old 1, 2, 3 ... prices. */
export function sellValue(st: Pick<PlacedSticker, 'growCount' | 'spent'>): number {
  if (typeof st.spent === 'number' && st.spent >= 1) return Math.floor(st.spent)
  const g = Number(st.growCount) || 0
  return 1 + (g * (g + 1)) / 2
}

/** Fibonacci number n (1, 1, 2, 3, 5, 8, 13 ...). */
function fib(n: number): number {
  let a = 0
  let b = 1
  for (let i = 0; i < n; i++) [a, b] = [b, a + b]
  return a
}

/**
 * How big a sticker is. Each grow adds a quarter of the next Fibonacci number, so it keeps getting
 * bigger faster: ×1, ×1.25, ×1.5, ×2, ×2.75, ×4, ×6, ×9.25, ×14.5 … (the first two steps match the
 * old +0.25 growth, so nobody's stickers shrink). Very big stickers go behind the practice card.
 */
export function stickerScale(st: Pick<PlacedSticker, 'scale' | 'growCount'>): number {
  const base = typeof st.scale === 'number' && Number.isFinite(st.scale) ? st.scale : 1
  const g = Math.max(0, Math.min(MAX_GROW, Math.floor(Number(st.growCount) || 0)))
  return base + 0.25 * (fib(g + 2) - 1)
}

/** Largest size actually drawn (px), so a giant sticker can't slow the page down. */
export const MAX_STICKER_PX = 2400

export interface CatalogItem extends StickerItem {
  uid: string
  rot: number
}

export function stickerPoolFor(l: Pick<Learner, 'sticker_style' | 'age_group'>): StickerItem[] {
  const tags = [l.sticker_style === 'any' ? '' : l.sticker_style, l.age_group].filter(Boolean)
  const matched = STICKER_POOL.filter((s) => s.themes.some((t) => tags.includes(t)))
  return matched.length >= 4 ? matched : STICKER_POOL
}

export function makeCatalog(l: Pick<Learner, 'sticker_style' | 'age_group'>, rand: () => number = Math.random, packId: string = FOR_YOU): CatalogItem[] {
  const pool = packById(packId)?.items ?? stickerPoolFor(l)
  return shuffle(pool, rand)
    .slice(0, 8)
    .map((item) => ({ ...item, uid: newId(), rot: Math.floor(rand() * 24) - 12 }))
}

export const MAX_STICKERS = 60

export function buySticker(l: Learner, item: CatalogItem, rand: () => number = Math.random): Learner | null {
  if (l.spendable_stars < item.cost || l.stickers.length >= MAX_STICKERS) return null
  const placed: PlacedSticker = {
    id: newId(),
    emoji: item.emoji,
    label: item.label,
    x: 10 + rand() * 72,
    y: 14 + rand() * 64,
    rot: item.rot,
    growCount: 0,
    spent: item.cost,
  }
  return { ...l, spendable_stars: l.spendable_stars - item.cost, stickers: [...l.stickers, placed] }
}

export function growSticker(l: Learner, id: string): Learner | null {
  const st = l.stickers.find((s) => s.id === id)
  if (!st) return null
  const cost = growCost(st.growCount)
  if (l.spendable_stars < cost || (Number(st.growCount) || 0) >= MAX_GROW) return null
  return {
    ...l,
    spendable_stars: l.spendable_stars - cost,
    stickers: l.stickers.map((s) => (s.id === id ? { ...s, growCount: (Number(s.growCount) || 0) + 1, spent: sellValue(s) + cost } : s)),
  }
}

export function sellSticker(l: Learner, id: string): Learner | null {
  const st = l.stickers.find((s) => s.id === id)
  if (!st) return null
  // Never refund more than was earned (keeps spendable <= lifetime, which the database requires).
  const refund = Math.min(sellValue(st), l.lifetime_stars - l.spendable_stars)
  return { ...l, spendable_stars: l.spendable_stars + Math.max(0, refund), stickers: l.stickers.filter((s) => s.id !== id) }
}

export function moveSticker(l: Learner, id: string, x: number, y: number): Learner {
  const cx = Math.max(0, Math.min(92, x))
  const cy = Math.max(0, Math.min(90, y))
  return { ...l, stickers: l.stickers.map((s) => (s.id === id ? { ...s, x: cx, y: cy } : s)) }
}
