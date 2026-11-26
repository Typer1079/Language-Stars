import { useEffect, useState, type ReactNode } from 'react'
import { LEVEL_GUIDE } from '../lib/levelGuide'
import { CHALLENGE_JUMP, CHALLENGE_PASS, CHALLENGE_SIZE, LEVEL_UP_AT, MOVE_DOWN_BELOW, ROUND_SIZE, STRETCH_STEPS } from '../lib/progress'
import type { Mode } from '../lib/types'
import { SUBJECTS, subject } from '../lib/subjects'

const TABS: { id: Mode | 'rules'; label: string }[] = [
  { id: 'rules', label: '⚙️ How it works' },
  ...SUBJECTS.map((s) => ({ id: s.id, label: `${s.icon} ${s.shortLabel} levels` })),
]

/** Plain-language help: exactly how levels, stars, ranks and the Spelling Bee work, and what every level range means. */
export function HelpGuide({ onClose, start = 'rules', highlight }: { onClose: () => void; start?: Mode | 'rules'; highlight?: { mode: Mode; level: number } }) {
  const [tab, setTab] = useState<Mode | 'rules'>(start)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const stretch = STRETCH_STEPS.map((s) => `+${s}`).join(', ')
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 p-3 backdrop-blur-[2px] sm:p-6" role="dialog" aria-modal="true" aria-labelledby="help-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="mx-auto w-full max-w-3xl rounded-3xl border-4 border-indigo-100 bg-white p-4 shadow-2xl sm:p-6">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 id="help-title" className="font-kids text-2xl font-bold">❓ How Language Stars works</h2>
          <button type="button" className="btn-secondary btn-sm" onClick={onClose}>Close</button>
        </div>
        <div className="-mx-1 mb-4 flex gap-1.5 overflow-x-auto px-1 pb-1" role="tablist">
          {TABS.map((t) => (
            <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${tab === t.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>{t.label}</button>
          ))}
        </div>

        {tab !== 'rules' && <p className="mb-2 text-xs text-slate-500">{tab === 'spanish' ? `Level (${subject(tab).scaleNote})` : 'Grade level of the words'} · stage · what you practice</p>}
        {tab === 'rules' ? (
          <div className="space-y-4 text-sm leading-relaxed text-slate-700">
            <Section title="🎯 A round">
              <li>A round is {ROUND_SIZE} items: {ROUND_SIZE - STRETCH_STEPS.length} from your level (new ones first, then review) and {STRETCH_STEPS.length} <b>bonus items</b> from higher levels ({stretch}).</li>
              <li>Saying an item <b>on your own</b> means without Ask Iris and without Next. Those count toward mastering the level.</li>
              <li>Each level has 10 items. Each subject (Reading, Spanish, Spelling) keeps its own level, so switching never loses progress.</li>
            </Section>
            <Section title="⬆️ Moving up">
              <li><b>Master {LEVEL_UP_AT} of the 10 items</b> in a level on your own and you move up a level.</li>
              <li><b>Jump ahead:</b> get 2 of the {STRETCH_STEPS.length} bonus items on your own in a round and you jump to the lower of those levels; get all {STRETCH_STEPS.length} and you jump to the highest.</li>
              <li><b>Perfect round</b> (every item on your own): up one level, then a {CHALLENGE_SIZE}-item challenge {CHALLENGE_JUMP} levels higher. Get {CHALLENGE_PASS} right to jump there.</li>
            </Section>
            <Section title="⬇️ Moving down">
              <li>If fewer than {Math.round(MOVE_DOWN_BELOW * 100)}% of a round (5 or more items) is on your own, you go back one level to practice it again.</li>
              <li>Stars and stickers are never taken away.</li>
            </Section>
            <Section title="⭐ Stars and stickers">
              <li>+1 star for each item you get, +1 for each meaning question you answer right.</li>
              <li>Reaching a new best level pays a bonus: the level number × 5 stars (moving back down and up again doesn’t pay twice).</li>
              <li>Spend stars on stickers. Making a sticker bigger costs 1, 2, 3, 5, 8, 13… stars (each step adds the two before it). Selling refunds exactly what you spent on it.</li>
            </Section>
            <Section title="🧠 Meaning questions (Reading)">
              <li>From Level 31, after every other phrase or sentence, Iris asks what it means (3 choices).</li>
              <li>From Level 56, every word and sentence gets a meaning question.</li>
            </Section>
            <Section title="🐝 Spelling Bee rules">
              <li>Iris is the pronouncer: she says the word slowly, twice. Spell it out loud, one letter at a time (letters appear as you say them), <b>or type the word</b>: on a keyboard just start typing (or tap the box under the letters), then press Enter or tap Check. While you type, Iris still listens for “definition”, “sentence”, “part of speech”, “origin” and “repeat”.</li>
              <li>Like the National Spelling Bee, you may ask, by tapping or by saying it: <b>“repeat”</b>, <b>“definition”</b>, <b>“sentence”</b>, <b>“part of speech”</b> or <b>“origin”</b>. Asking never counts against you. Say “start over” to begin the word again.</li>
              <li>A wrong spelling counts as a miss and shows the right one. If the microphone misheard you, tap “The mic misheard me” to try again.</li>
              <li>Asking Iris to spell it for you counts as help (not on your own).</li>
            </Section>
            <Section title="🏆 World ranks">
              <li>Your <b>overall</b> rank is by lifetime stars. There are also ranks for each level, stars this week, words, meanings, minutes, days practiced and stickers.</li>
              <li>Names are never shared: everyone else appears under a made-up codename (like “Brave Otter 47”). Only you see your own name.</li>
            </Section>
            <Section title="🗣️ Pace">
              <li>Young or new learners get the <b>guided</b> pace: Iris greets you and helps after a pause.</li>
              <li>Adults, and learners on a strong streak (8 of 10 on their own, or past Level 10), get the <b>brisk</b> pace: less talking and faster turns. A rough round switches back.</li>
            </Section>
            <p className="text-xs text-slate-500">Grades are a guide to how hard the words are, based on typical U.S. school word lists. Spanish uses the European CEFR scale (A1 beginner → B1 intermediate).</p>
          </div>
        ) : (
          <ol className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200">
            {LEVEL_GUIDE[tab].map((r) => {
              const here = highlight && highlight.mode === tab && highlight.level >= r.from && highlight.level <= r.to
              return (
                <li key={r.from} className={`flex gap-3 px-3 py-2.5 ${here ? 'bg-amber-50' : ''}`}>
                  <div className="w-16 shrink-0 font-kids text-base font-bold text-indigo-700">{r.from === r.to ? r.from : `${r.from}–${r.to}`}</div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-slate-900">
                      {r.grade} <span className="font-semibold text-slate-500">· {r.stage}</span>
                      {here && <span className="ml-1.5 rounded-full bg-amber-300 px-2 py-0.5 text-[11px] text-amber-950">⭐ you are here</span>}
                    </div>
                    <div className="text-xs text-slate-600">{r.what}</div>
                  </div>
                </li>
              )
            })}
          </ol>
        )}
        <p className="mt-6 border-t border-slate-100 pt-3 text-center text-[11px] text-slate-400">
          Version {__APP_VERSION__} · <a className="underline" href="#/support">Support</a> · <a className="underline" href="#/privacy">Privacy</a> · <a className="underline" href="#/terms">Terms</a>
        </p>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-1 font-kids text-lg font-bold text-slate-900">{title}</h3>
      <ul className="list-disc space-y-1 pl-5">{children}</ul>
    </section>
  )
}
