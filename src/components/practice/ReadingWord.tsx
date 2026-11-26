import { wordHelp } from '../../lib/phonics'
import type { PracticeItem } from '../../lib/progress'

/** Reading: a word as sound-chunk tiles (with rhymes or claps), or a phrase / sentence as word tiles. */
export function ReadingWord({ item, tileKey }: { item: PracticeItem; tileKey: string }) {
  return (
    <>
      {!item.target.includes(' ') && (
        <div key={tileKey} className="my-3 flex min-h-[120px] flex-wrap items-center justify-center gap-3 sm:min-h-[145px] sm:gap-4">
          {(() => {
            const help = wordHelp(item.target, '')
            return (
              <div className="flex flex-col items-center gap-2">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3" aria-label={item.target}>
                  {help.chunks.map((chunk, i) => (
                    <div key={i} className="animate-tile-pop flex items-center" style={{ animationDelay: `${i * 60}ms` }}>
                      {i > 0 && <span className="mr-2 text-2xl font-bold text-indigo-300 sm:mr-3" aria-hidden>·</span>}
                      <div className={`flex h-20 items-center justify-center rounded-2xl border-2 px-3 font-kids font-bold shadow-sm sm:h-24 sm:px-4 ${chunk.length > 12 ? 'text-2xl sm:text-4xl' : chunk.length > 8 ? 'text-3xl sm:text-5xl' : 'text-4xl sm:text-5xl'} ${i % 2 ? 'border-amber-200 bg-gradient-to-b from-amber-50 to-white text-amber-900' : 'border-indigo-200 bg-gradient-to-b from-indigo-50 to-white text-indigo-900'}`}>{chunk}</div>
                    </div>
                  ))}
                </div>
                {help.rhymes.length > 0 && (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">rhymes with {help.rhymes.join(' · ')}</span>
                )}
                {help.kind === 'syllables' && (
                  <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-800">👏 {help.chunks.length} claps</span>
                )}
              </div>
            )
          })()}
        </div>
      )}

      {item.target.includes(' ') && (
        <div key={tileKey} className="my-3 flex min-h-[120px] flex-wrap items-center justify-center gap-2 sm:min-h-[145px] sm:gap-3" aria-label={item.target}>
          {item.target.split(' ').map((w, i, all) => (
            <span key={i} className={`animate-tile-pop rounded-2xl border-2 border-indigo-200 bg-gradient-to-b from-indigo-50 to-white px-3 py-2 font-kids font-bold text-indigo-900 shadow-sm ${all.length <= 4 ? 'text-4xl sm:text-5xl' : all.length <= 8 ? 'text-2xl sm:text-4xl' : 'text-xl sm:text-3xl'}`}
              style={{ animationDelay: `${i * 45}ms` }}>
              {w}
            </span>
          ))}
        </div>
      )}
    </>
  )
}
