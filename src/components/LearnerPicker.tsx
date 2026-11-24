import { useEffect, useRef, useState, type FormEvent } from 'react'
import type React from 'react'
import { activeLevel } from '../lib/progress'
import { FaceIdOffer } from './FaceId'
import { ProgressView } from './Progress'
import { AVATAR_GROUPS, SKIN_TONES, avatarFor, toneOf, withTone } from '../lib/avatars'
import { avatarsAvailable } from '../lib/learnersApi'
import { MAX_LEVEL, stageName } from '../lib/curriculum'
import { cleanName, parseSaveFile } from '../lib/validate'
import { newLearnerDraft, type AgeGroup, type Learner, type LearnerDraft, type LearnerKind, type Mode, type StickerStyle } from '../lib/types'

interface Props {
  learners: Learner[]
  loading: boolean
  error: string
  /** Session passed two-step sign-in, so kids' profiles are available. */
  verified: boolean
  hasMfa: boolean
  onPick: (l: Learner) => void
  onCreate: (d: LearnerDraft) => Promise<void>
  onUpdate: (l: Learner) => Promise<void>
  onImport: (d: LearnerDraft[]) => Promise<void>
  /** Opens two-step sign-in; `pending` readers are added automatically once it succeeds. */
  onUnlockKids: (pending?: LearnerDraft[]) => void
  onAccount: () => void
  /** Only for super admins. */
  onAdmin?: () => void
}

export default function LearnerPicker(p: Props) {
  const [panel, setPanel] = useState<'none' | 'add' | 'import'>('none')
  const [editing, setEditing] = useState<Learner | null>(null)
  const [viewing, setViewing] = useState<Learner | null>(null)

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col px-4 py-8">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-2xl shadow-md">⭐</div>
          <div>
            <h1 className="font-kids text-2xl font-bold leading-tight">Who’s learning?</h1>
            <p className="text-xs text-slate-500">Tap a learner to start</p>
          </div>
        </div>
        <div className="flex gap-2">
          {p.onAdmin && <button type="button" className="chip" onClick={p.onAdmin}>📊 Admin</button>}
          <button type="button" className="chip" onClick={p.onAccount}>⚙️ Account</button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {p.learners.map((l) => (
          <LearnerCard key={l.id} learner={l} onPlay={() => p.onPick(l)} onProgress={() => setViewing(l)} onEdit={() => { setPanel('none'); setEditing(l) }} />
        ))}
        {!p.loading && p.learners.length === 0 && (
          <p className="card text-sm text-slate-600 sm:col-span-2">No readers yet. Add one below, or import a backup from the old app.</p>
        )}
        {p.loading && <p className="text-sm text-slate-500">Loading readers…</p>}
      </div>
      {p.error && <p role="alert" className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{p.error}</p>}

      <FaceIdOffer />

      {!p.verified && p.hasMfa && (
        <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Kids’ profiles are locked</p>
          <p className="mt-0.5">{p.hasMfa ? 'Enter your authenticator code to see and play kids’ profiles.' : 'Turn on two-step sign-in to add kids or see their profiles.'}</p>
          <button type="button" className="btn-primary mt-3" onClick={() => p.onUnlockKids()}>
            {p.hasMfa ? 'Enter code' : 'Set up two-step sign-in'}
          </button>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        <button type="button" className="btn-secondary" onClick={() => { setEditing(null); setPanel(panel === 'add' ? 'none' : 'add') }}>+ Add reader</button>
        <button type="button" className="btn-secondary" onClick={() => { setEditing(null); setPanel(panel === 'import' ? 'none' : 'import') }}>📂 Import backup</button>
      </div>

      {viewing && <ProgressView learner={viewing} parentView onClose={() => setViewing(null)} />}
      {editing && <EditReader key={editing.id} learner={editing} onCancel={() => setEditing(null)} onSave={async (l) => { await p.onUpdate(l); setEditing(null) }} />}
      {panel === 'add' && <AddReader verified={p.verified} onUnlockKids={p.onUnlockKids} onCancel={() => setPanel('none')} onCreate={async (d) => { await p.onCreate(d); setPanel('none') }} />}
      {panel === 'import' && <ImportReaders verified={p.verified} onUnlockKids={p.onUnlockKids} onImport={async (d) => { await p.onImport(d); setPanel('none') }} />}
    </div>
  )
}

/** Color themes for the cards, so each learner's card looks different at a glance. */
const THEMES = {
  reading: [
    { band: 'from-indigo-500 via-violet-500 to-fuchsia-500', bar: 'from-indigo-500 to-fuchsia-500', ring: 'ring-indigo-200', play: 'from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700', soft: 'bg-indigo-50 text-indigo-800' },
    { band: 'from-sky-500 via-cyan-500 to-emerald-400', bar: 'from-sky-500 to-emerald-400', ring: 'ring-sky-200', play: 'from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700', soft: 'bg-sky-50 text-sky-800' },
  ],
  spanish: [
    { band: 'from-amber-400 via-orange-500 to-rose-500', bar: 'from-amber-400 to-rose-500', ring: 'ring-amber-200', play: 'from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600', soft: 'bg-amber-50 text-amber-900' },
    { band: 'from-rose-400 via-pink-500 to-purple-500', bar: 'from-rose-400 to-purple-500', ring: 'ring-rose-200', play: 'from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700', soft: 'bg-rose-50 text-rose-800' },
  ],
}

function LearnerCard({ learner: l, onPlay, onProgress, onEdit }: { learner: Learner; onPlay: () => void; onProgress: () => void; onEdit: () => void }) {
  // Each learner keeps the same colors (picked from their name), so cards are easy to tell apart.
  const t = THEMES[l.mode][[...l.display_name].reduce((n, c) => n + c.charCodeAt(0), 0) % 2]
  const level = activeLevel(l)
  const other = l.mode === 'spanish' ? { label: '📖 Reading', level: l.reading_level } : { label: '🇪🇸 Spanish', level: l.spanish_level }
  const shown = l.stickers.slice(-6).reverse()
  return (
    <article className="group relative overflow-hidden rounded-3xl border border-white/70 bg-white shadow-lg ring-1 ring-slate-200/60 transition duration-200 hover:-translate-y-1 hover:shadow-xl">
      {/* Colored header with the learner's avatar and their newest stickers */}
      <button type="button" onClick={onPlay} tabIndex={-1} aria-hidden="true"
        className={`relative block h-20 w-full overflow-hidden bg-gradient-to-br sm:h-24 ${t.band}`}>
        <span className="absolute inset-0 opacity-25" style={{ backgroundImage: 'radial-gradient(white 1.5px, transparent 1.5px)', backgroundSize: '16px 16px' }} />
        <span className="absolute right-3 top-2.5 flex -space-x-1.5">
          {shown.map((st, i) => (
            <span key={st.id} className="text-2xl drop-shadow transition-transform duration-300 group-hover:-translate-y-0.5" style={{ transform: `rotate(${(i % 2 ? 1 : -1) * (6 + i * 3)}deg)` }}>{st.emoji}</span>
          ))}
        </span>
        <span className="absolute left-3 top-2.5 rounded-full bg-white/25 px-2.5 py-0.5 text-[11px] font-bold text-white backdrop-blur-sm">
          {l.mode === 'spanish' ? '🇪🇸 Spanish' : '📖 Reading'}
        </span>
      </button>

      <div className="relative px-4 pb-4">
        <div className={`-mt-9 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-3xl bg-white text-4xl shadow-md ring-4 ${t.ring}`}>{avatarFor(l)}</div>

        <div className="mt-2 flex items-end justify-between gap-2">
          <div className="min-w-0">
            <h2 className="truncate font-kids text-2xl font-bold leading-tight text-slate-900">{l.display_name}</h2>
            <p className="text-xs font-semibold text-slate-500">{stageName(level, l.mode)}{l.kind === 'self' ? ' • me' : ''}</p>
          </div>
          <div className="text-right">
            <div className="font-kids text-3xl font-bold leading-none text-slate-900">{level}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">of {MAX_LEVEL}</div>
          </div>
        </div>

        <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-100" aria-label={`Level ${level} of ${MAX_LEVEL}`}>
          <div className={`h-full rounded-full bg-gradient-to-r ${t.bar}`} style={{ width: `${Math.max(3, level)}%` }} />
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5 text-xs font-bold">
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-900">⭐ {l.lifetime_stars.toLocaleString()}</span>
          <span className="rounded-full bg-fuchsia-50 px-2.5 py-1 text-fuchsia-800">🎨 {l.stickers.length} sticker{l.stickers.length === 1 ? '' : 's'}</span>
          {other.level > 1 && <span className={`rounded-full px-2.5 py-1 ${t.soft}`}>{other.label} L{other.level}</span>}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button type="button" onClick={onPlay} aria-label={`Play as ${l.display_name}`}
            className={`flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r px-4 py-3 font-kids text-lg font-bold text-white shadow-md transition active:scale-95 ${t.play}`}>
            ▶ Play
          </button>
          <button type="button" onClick={onProgress} aria-label={`${l.display_name}'s progress`} title="Progress"
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-xl shadow-sm transition hover:bg-slate-50 active:scale-95">📈</button>
          <button type="button" onClick={onEdit} aria-label={`Edit ${l.display_name}`} title="Edit"
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-xl shadow-sm transition hover:bg-slate-50 active:scale-95">✏️</button>
        </div>
      </div>
    </article>
  )
}

const ALL_AGES: AgeGroup[] = ['3-4', '5-6', '7-8', '9+', 'adult']
const ageLabel = (a: AgeGroup) => (a === 'adult' ? 'Adult' : `${a} yrs`)

function Choice<T extends string>({ value, options, onChange, label }: { value: T; options: { v: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button key={o.v} type="button" aria-pressed={value === o.v} onClick={() => onChange(o.v)}
          className={`rounded-xl border-2 px-3 py-2 font-kids text-sm font-bold transition ${value === o.v ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-700'}`}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

function LevelPicker({ id, label, mode, value, onChange }: { id: string; label: string; mode: Mode; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="label" htmlFor={id}>{label}: <span className="text-indigo-700">{value}</span> <span className="font-normal text-slate-500">({stageName(value, mode)})</span></label>
      <div className="flex items-center gap-2">
        <button type="button" className="h-9 w-9 shrink-0 rounded-xl border border-slate-200 bg-white font-bold" aria-label={`${label} down`} onClick={() => onChange(Math.max(1, value - 1))}>−</button>
        <input id={id} type="range" min={1} max={MAX_LEVEL} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-indigo-600" />
        <button type="button" className="h-9 w-9 shrink-0 rounded-xl border border-slate-200 bg-white font-bold" aria-label={`${label} up`} onClick={() => onChange(Math.min(MAX_LEVEL, value + 1))}>+</button>
      </div>
    </div>
  )
}

/** Pick a profile character: people of every look in six skin tones, heroes, animals and more. */
function AvatarPicker({ value, fallback, onChange }: { value: string | null; fallback: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const [tone, setTone] = useState(() => toneOf(value))
  const [group, setGroup] = useState(AVATAR_GROUPS[0].id)
  const g = AVATAR_GROUPS.find((x) => x.id === group) ?? AVATAR_GROUPS[0]
  const shown = value ?? fallback

  const changeTone = (next: string) => {
    // Re-tone the current pick, if it's a person.
    if (value) {
      for (const grp of AVATAR_GROUPS) {
        if (!grp.toned) continue
        const base = grp.items.find((b) => withTone(b, tone) === value)
        if (base) { onChange(withTone(base, next)); break }
      }
    }
    setTone(next)
  }

  return (
    <div>
      <span className="label">Avatar</span>
      <div className="flex items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-fuchsia-50 text-4xl ring-2 ring-indigo-200">{shown}</div>
        <button type="button" className="btn-secondary" aria-expanded={open} onClick={() => setOpen((o) => !o)}>{open ? 'Done' : '🎨 Choose an avatar'}</button>
      </div>
      {!avatarsAvailable() && (
        <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
          Avatars can’t be saved yet: the database needs one update. In Supabase → SQL Editor, run <code>supabase/migrations/006_avatar.sql</code>, then reload this page.
        </p>
      )}
      {open && (
        <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <div className="mb-2 flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Skin tone">
            <span className="text-xs font-bold text-slate-600">Skin tone</span>
            {SKIN_TONES.map((t) => (
              <button key={t.label} type="button" role="radio" aria-checked={tone === t.id} aria-label={t.label} title={t.label} onClick={() => changeTone(t.id)}
                className={`h-8 w-8 rounded-full border-2 transition ${tone === t.id ? 'scale-110 border-indigo-600 ring-2 ring-indigo-200' : 'border-white shadow'}`}
                style={{ backgroundColor: t.swatch }} />
            ))}
          </div>
          <div className="-mx-1 mb-2 flex gap-1.5 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Avatar types">
            {AVATAR_GROUPS.map((x) => (
              <button key={x.id} type="button" role="tab" aria-selected={group === x.id} onClick={() => setGroup(x.id)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition ${group === x.id ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100'}`}>{x.label}</button>
            ))}
          </div>
          <div className="grid max-h-64 grid-cols-6 gap-1.5 overflow-y-auto sm:grid-cols-8" role="radiogroup" aria-label="Avatars">
            {g.items.map((b) => {
              const e = g.toned ? withTone(b, tone) : b
              return (
                <button key={b} type="button" role="radio" aria-checked={value === e} aria-label={`Avatar ${e}`} onClick={() => onChange(e)}
                  className={`flex aspect-square items-center justify-center rounded-xl text-3xl transition hover:scale-110 ${value === e ? 'bg-indigo-100 ring-2 ring-indigo-500' : 'bg-white'}`}>{e}</button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export interface ReaderFields {
  name: string
  kind: LearnerKind
  mode: Mode
  age: AgeGroup
  style: StickerStyle
  readingLevel: number
  spanishLevel: number
  avatar: string | null
}

/** The add / edit form for a reader profile. */
export function ReaderForm({ initial, isNew, busy, error, submitLabel, onSubmit, onCancel, footer }: {
  initial: ReaderFields
  isNew: boolean
  busy: boolean
  error: string
  submitLabel: string
  onSubmit: (f: ReaderFields) => void
  onCancel?: () => void
  footer?: React.ReactNode
}) {
  const [f, setF] = useState<ReaderFields>(initial)
  const set = <K extends keyof ReaderFields>(k: K, v: ReaderFields[K]) => setF((x) => ({ ...x, [k]: v }))

  function submit(e: FormEvent) {
    e.preventDefault()
    onSubmit({ ...f, name: cleanName(f.name) })
  }

  return (
    <form onSubmit={submit} className="card mt-4 space-y-4">
      {isNew && (
        <div>
          <span className="label">Who is this reader?</span>
          <Choice label="Who is this reader" value={f.kind} onChange={(v) => setF((x) => ({ ...x, kind: v, ...(v === 'self' ? { mode: 'spanish' as Mode, age: 'adult' as AgeGroup } : {}) }))}
            options={[{ v: 'child', label: '🧒 Someone I manage' }, { v: 'self', label: '🙋 Me' }]} />
        </div>
      )}
      <AvatarPicker value={f.avatar} fallback={avatarFor({ avatar: null, sticker_style: f.style, age_group: f.age })} onChange={(v) => set('avatar', v)} />
      <div>
        <label className="label" htmlFor="reader-name">First name or nickname</label>
        <input id="reader-name" className="input" maxLength={40} autoComplete="off" value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g., Ethan" />
        <p className="mt-1 text-xs text-slate-500">Just a first name is enough. No last names or birthdays are stored.</p>
      </div>
      <div>
        <span className="label">What do they practice?</span>
        <Choice label="Practice" value={f.mode} onChange={(v) => set('mode', v)}
          options={[{ v: 'reading', label: '📖 Reading (English)' }, { v: 'spanish', label: '🇪🇸 Spanish (English → Spanish)' }]} />
        <p className="mt-1 text-xs text-slate-500">
          {f.mode === 'reading' ? 'Read words, phrases and sentences out loud, then answer what they mean.' : 'See an English word and say it in Spanish, with example phrases.'}
          {!isNew && ' Progress in the other one is kept if you switch back.'}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <LevelPicker id="reading-level" label="📖 Reading level" mode="reading" value={f.readingLevel} onChange={(v) => set('readingLevel', v)} />
        <LevelPicker id="spanish-level" label="🇪🇸 Spanish level" mode="spanish" value={f.spanishLevel} onChange={(v) => set('spanishLevel', v)} />
        <p className="text-xs text-slate-500 sm:col-span-2">Start anywhere from 1 to {MAX_LEVEL}. The app still moves up or down from there based on how practice goes.</p>
      </div>
      <div>
        <span className="label">Age group</span>
        <Choice label="Age group" value={f.age} onChange={(v) => set('age', v)} options={ALL_AGES.map((a) => ({ v: a, label: ageLabel(a) }))} />
      </div>
      <div>
        <span className="label">Sticker packs</span>
        <Choice label="Sticker packs" value={f.style} onChange={(v) => set('style', v)} options={[{ v: 'any', label: '🌈 Mixed' }, { v: 'boy', label: '🦖 Boy' }, { v: 'girl', label: '🦄 Girl' }]} />
      </div>
      {error && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      <div className="flex gap-2">
        {onCancel && <button type="button" className="btn-secondary flex-1" onClick={onCancel}>Cancel</button>}
        <button className="btn-primary flex-1" disabled={busy}>{busy ? 'Saving…' : submitLabel}</button>
      </div>
      {footer}
    </form>
  )
}

function AddReader({ verified, onUnlockKids, onCreate, onCancel }: { verified: boolean; onUnlockKids: (pending?: LearnerDraft[]) => void; onCreate: (d: LearnerDraft) => Promise<void>; onCancel: () => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(f: ReaderFields) {
    if (!f.name) return setError('Enter a first name or nickname.')
    const base = newLearnerDraft(f.name, f.kind, f.age, f.style)
    const draft: LearnerDraft = { ...base, mode: f.mode, reading_level: f.readingLevel, spanish_level: f.spanishLevel, reading_best: f.readingLevel, spanish_best: f.spanishLevel, ...(f.avatar ? { avatar: f.avatar } : {}) }
    // Managed profiles are protected by two-step sign-in; set it up first, then add automatically.
    if (f.kind === 'child' && !verified) return onUnlockKids([draft])
    setBusy(true)
    setError('')
    try {
      await onCreate(draft)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t add the reader.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <ReaderForm isNew busy={busy} error={error} onSubmit={submit} onCancel={onCancel}
      submitLabel={verified ? 'Add reader' : 'Add reader (sets up two-step sign-in)'}
      initial={{ name: '', kind: 'child', mode: 'reading', age: '5-6', style: 'any', readingLevel: 1, spanishLevel: 1, avatar: null }} />
  )
}

/** Edit an existing reader's name, practice type, age group and sticker packs. */
function EditReader({ learner, onSave, onCancel }: { learner: Learner; onSave: (l: Learner) => Promise<void>; onCancel: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(f: ReaderFields) {
    if (!f.name) return setError('Enter a first name or nickname.')
    // Without the database update the avatar would silently snap back, so say so instead.
    if (f.avatar && f.avatar !== learner.avatar && !avatarsAvailable()) {
      return setError('The avatar can’t be saved yet. In Supabase → SQL Editor, run 006_avatar.sql, reload this page, then save again.')
    }
    setBusy(true)
    setError('')
    try {
      let next: Learner = { ...learner, display_name: f.name, mode: f.mode, age_group: f.age, sticker_style: f.style, ...(f.avatar ? { avatar: f.avatar } : {}) }
      // A new starting level: the best level only ever goes up (the database requires it).
      if (f.readingLevel !== learner.reading_level) next = { ...next, reading_level: f.readingLevel, reading_best: Math.max(learner.reading_best ?? 1, f.readingLevel) }
      if (f.spanishLevel !== learner.spanish_level) next = { ...next, spanish_level: f.spanishLevel, spanish_best: Math.max(learner.spanish_best ?? 1, f.spanishLevel) }
      await onSave(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t save the changes.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div ref={ref}>
      <h2 className="mt-6 font-kids text-xl font-bold">Edit {learner.display_name}</h2>
      <ReaderForm isNew={false} busy={busy} error={error} onSubmit={submit} onCancel={onCancel} submitLabel="Save changes"
        initial={{ name: learner.display_name, kind: learner.kind, mode: learner.mode, age: learner.age_group, style: learner.sticker_style, readingLevel: learner.reading_level, spanishLevel: learner.spanish_level, avatar: learner.avatar ?? null }}
        footer={<p className="text-xs text-slate-500">Stars and stickers aren’t changed. To delete a reader, use ⚙️ Account.</p>} />
    </div>
  )
}

function ImportReaders({ verified, onUnlockKids, onImport }: { verified: boolean; onUnlockKids: (pending?: LearnerDraft[]) => void; onImport: (d: LearnerDraft[]) => Promise<void> }) {
  const input = useRef<HTMLInputElement>(null)
  const [drafts, setDrafts] = useState<(LearnerDraft & { pick: boolean })[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function read(file: File | undefined) {
    if (!file) return
    setError('')
    try {
      const list = parseSaveFile(await file.text())
      setDrafts(list.map((d) => ({ ...d, pick: true })))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t read that file.')
    }
  }

  const picked = () => drafts.filter((d) => d.pick).map(({ pick: _p, ...d }) => { void _p; return d })

  async function submit() {
    const chosen = picked()
    if (chosen.length === 0) return setError('Choose at least one reader.')
    setBusy(true)
    setError('')
    try {
      await onImport(chosen)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed.')
    } finally {
      setBusy(false)
    }
  }

  const needsVerify = drafts.some((d) => d.pick && d.kind === 'child') && !verified
  return (
    <div className="card mt-4 space-y-4">
      <p className="text-sm text-slate-600">Choose a backup file: a save from the old Read Aloud Stars page, or a backup downloaded from this app.</p>
      <input ref={input} type="file" accept="application/json,.json" className="hidden" onChange={(e) => { read(e.target.files?.[0]); e.target.value = '' }} />
      <button type="button" className="btn-secondary w-full" onClick={() => input.current?.click()}>Choose file…</button>
      {drafts.length > 0 && (
        <ul className="space-y-2">
          {drafts.map((d, i) => (
            <li key={i} className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" className="h-5 w-5" checked={d.pick} onChange={(e) => setDrafts(drafts.map((x, j) => (j === i ? { ...x, pick: e.target.checked } : x)))} />
                {d.display_name} <span className="font-normal text-slate-500">• {d.lifetime_stars} ⭐ • {d.stickers.length} stickers</span>
              </label>
              <select className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs" value={d.kind} aria-label={`${d.display_name} is`}
                onChange={(e) => setDrafts(drafts.map((x, j) => (j === i ? { ...x, kind: e.target.value as LearnerKind } : x)))}>
                <option value="child">Managed by me</option>
                <option value="self">Me</option>
              </select>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-slate-500">Import only the readers that belong on this account. For example, Olivia imports her own profile after signing in to her account.</p>
      {error && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      {drafts.length > 0 &&
        (needsVerify ? (
          <button type="button" className="btn-primary w-full" onClick={() => onUnlockKids(picked())}>Verify two-step sign-in and import</button>
        ) : (
          <button type="button" className="btn-primary w-full" disabled={busy} onClick={submit}>{busy ? 'Importing…' : 'Import selected'}</button>
        ))}
    </div>
  )
}
