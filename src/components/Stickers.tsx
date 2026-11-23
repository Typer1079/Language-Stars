import { useRef, useState } from 'react'
import { buySticker, growCost, growSticker, makeCatalog, sellSticker, sellValue, stickerScale, type CatalogItem } from '../lib/stickers'
import { playChime } from '../lib/sfx'
import type { Learner, PlacedSticker } from '../lib/types'

/** Stickers float over the page and can be dragged anywhere. Pop-up screens sit above them. */
export function StickerCanvas({ stickers, onMove }: { stickers: PlacedSticker[]; onMove: (id: string, x: number, y: number) => void }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-[35] overflow-hidden" aria-label="Your stickers">
      {stickers.map((st) => (
        <DraggableSticker key={st.id} st={st} onMove={onMove} />
      ))}
    </div>
  )
}

function DraggableSticker({ st, onMove }: { st: PlacedSticker; onMove: (id: string, x: number, y: number) => void }) {
  const el = useRef<HTMLDivElement>(null)
  const drag = useRef<{ dx: number; dy: number; x: number; y: number } | null>(null)

  const toPct = (clientX: number, clientY: number) => {
    const d = drag.current!
    const x = Math.max(0, Math.min(92, ((clientX - d.dx) / Math.max(window.innerWidth - 40, 1)) * 100))
    const y = Math.max(0, Math.min(90, ((clientY - d.dy) / Math.max(window.innerHeight - 40, 1)) * 100))
    return { x, y }
  }

  return (
    <div
      ref={el}
      className="placed-sticker"
      title={`${st.label} • drag to move`}
      style={{ left: `${st.x}%`, top: `${st.y}%`, fontSize: `${Math.round(42 * stickerScale(st))}px`, transform: `rotate(${st.rot}deg)` }}
      onPointerDown={(e) => {
        const r = e.currentTarget.getBoundingClientRect()
        drag.current = { dx: e.clientX - r.left, dy: e.clientY - r.top, x: st.x, y: st.y }
        e.currentTarget.setPointerCapture(e.pointerId)
      }}
      onPointerMove={(e) => {
        if (!drag.current || !el.current) return
        const { x, y } = toPct(e.clientX, e.clientY)
        drag.current.x = x
        drag.current.y = y
        el.current.style.left = `${x}%`
        el.current.style.top = `${y}%`
      }}
      onPointerUp={() => {
        const d = drag.current
        drag.current = null
        if (d && (d.x !== st.x || d.y !== st.y)) onMove(st.id, d.x, d.y)
      }}
      onPointerCancel={() => { drag.current = null }}
    >
      {st.emoji}
    </div>
  )
}

export function StickerShop({ learner, reason, onChange, onClose, onSignOut }: {
  learner: Learner
  reason: string
  onChange: (l: Learner) => void
  onClose: () => void
  onSignOut: () => void
}) {
  // A new random pack each time the shop opens or "New Pack" is pressed.
  const [catalog, setCatalog] = useState<CatalogItem[]>(() => makeCatalog(learner))

  const apply = (next: Learner | null) => {
    if (!next) return
    onChange(next)
    playChime()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="shop-title">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border-4 border-fuchsia-200 bg-white/95 p-6 shadow-2xl">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 id="shop-title" className="font-kids text-2xl font-bold">🏪 Sticker Shop</h2>
            <p className="text-xs font-semibold text-fuchsia-700">{reason}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 px-3 py-1.5 font-kids text-sm font-bold text-amber-800">
              Balance: {learner.spendable_stars} ⭐
            </div>
            <button type="button" className="rounded-xl bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100" onClick={() => setCatalog(makeCatalog(learner))}>
              🎲 New Pack
            </button>
          </div>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {catalog.map((item) => {
            const can = learner.spendable_stars >= item.cost
            return (
              <button key={item.uid} type="button" disabled={!can} onClick={() => apply(buySticker(learner, item))}
                className={`flex flex-col items-center justify-between gap-1.5 rounded-2xl border-2 p-3 transition ${can ? 'cursor-pointer border-fuchsia-200 bg-fuchsia-50/50 hover:-translate-y-0.5 hover:bg-fuchsia-100/70' : 'cursor-not-allowed border-slate-200 bg-slate-100 opacity-60'}`}>
                <span className="text-4xl" style={{ transform: `rotate(${item.rot}deg)` }}>{item.emoji}</span>
                <span className="font-kids text-sm font-bold">{item.label}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${can ? 'bg-amber-400 text-slate-900' : 'bg-slate-300 text-slate-600'}`}>{item.cost} ⭐</span>
              </button>
            )
          })}
        </div>

        <div className="mb-4 border-t border-slate-200 pt-3">
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-purple-700">🔍 Grow or sell your stickers (selling refunds stars)</div>
          <div className="flex flex-wrap gap-2">
            {learner.stickers.length === 0 && <span className="text-xs text-slate-500">Buy a sticker above to place it on your screen, grow it, or sell it for stars!</span>}
            {learner.stickers.map((st) => {
              const g = Number(st.growCount) || 0
              const cost = growCost(g)
              const can = learner.spendable_stars >= cost
              return (
                <div key={st.id} className="flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50/70 px-2.5 py-1.5 text-xs font-bold">
                  <button type="button" disabled={!can} onClick={() => apply(growSticker(learner, st.id))}
                    className={`flex items-center gap-1 rounded-lg px-2 py-1 transition ${can ? 'bg-purple-600 text-white hover:bg-purple-700' : 'cursor-not-allowed bg-slate-200 text-slate-400'}`}>
                    <span>{st.emoji}</span><span>{st.label} (x{g + 1})</span><span className="rounded bg-amber-300 px-1.5 text-slate-900">+{cost}⭐</span>
                  </button>
                  <button type="button" title={`Sell ${st.label} for ${sellValue(st)} stars`} onClick={() => apply(sellSticker(learner, st.id))}
                    className="rounded-lg bg-rose-100 px-2 py-1 text-rose-800 transition hover:bg-rose-200">
                    Sell +{sellValue(st)}⭐
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2">
          <button type="button" className="btn-danger" onClick={onSignOut}>🚪 Switch reader</button>
          <button type="button" className="btn bg-gradient-to-r from-emerald-500 to-teal-600 font-kids text-base text-white shadow-md hover:from-emerald-600 hover:to-teal-700" onClick={onClose}>
            Keep Reading ➡️
          </button>
        </div>
      </div>
    </div>
  )
}

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

export function Confetti({ pieces }: { pieces: ConfettiPiece[] }) {
  if (pieces.length === 0) return null
  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden" aria-hidden="true">
      {pieces.map((p) => (
        <div key={p.key} className="animate-confetti absolute -top-6 rounded-sm"
          style={{ left: `${p.left}vw`, width: p.w, height: p.h, backgroundColor: p.color, animationDuration: `${p.dur}s` }} />
      ))}
    </div>
  )
}
