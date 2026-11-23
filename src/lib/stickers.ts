import { shuffle } from './progress'
import { STICKER_POOL, type StickerItem } from './stickerPool'
import { newId, type Learner, type PlacedSticker } from './types'

/** Growing costs 1 star, then 2, then 3, ... */
export function growCost(growCount = 0): number {
  return (Number(growCount) || 0) + 1
}

/** Selling refunds everything spent on the sticker: 1 for buying plus every grow step. */
export function sellValue(st: Pick<PlacedSticker, 'growCount'>): number {
  const g = Number(st.growCount) || 0
  let spent = 1
  for (let i = 0; i < g; i++) spent += growCost(i)
  return Math.max(1, spent)
}

export function stickerScale(st: PlacedSticker): number {
  const base = typeof st.scale === 'number' && Number.isFinite(st.scale) ? st.scale : 1
  return base + (Number(st.growCount) || 0) * 0.25
}

export interface CatalogItem extends StickerItem {
  uid: string
  rot: number
}

export function stickerPoolFor(l: Pick<Learner, 'sticker_style' | 'age_group'>): StickerItem[] {
  const tags = [l.sticker_style === 'any' ? '' : l.sticker_style, l.age_group].filter(Boolean)
  const matched = STICKER_POOL.filter((s) => s.themes.some((t) => tags.includes(t)))
  return matched.length >= 4 ? matched : STICKER_POOL
}

export function makeCatalog(l: Pick<Learner, 'sticker_style' | 'age_group'>, rand: () => number = Math.random): CatalogItem[] {
  return shuffle(stickerPoolFor(l), rand)
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
  }
  return { ...l, spendable_stars: l.spendable_stars - item.cost, stickers: [...l.stickers, placed] }
}

export function growSticker(l: Learner, id: string): Learner | null {
  const st = l.stickers.find((s) => s.id === id)
  if (!st) return null
  const cost = growCost(st.growCount)
  if (l.spendable_stars < cost) return null
  return {
    ...l,
    spendable_stars: l.spendable_stars - cost,
    stickers: l.stickers.map((s) => (s.id === id ? { ...s, growCount: (Number(s.growCount) || 0) + 1 } : s)),
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
