import { useRef, useState, type FormEvent } from 'react'
import type React from 'react'
import { activeLevel } from '../lib/progress'
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
}

function icon(l: Pick<Learner, 'mode' | 'sticker_style'>) {
  if (l.mode === 'spanish') return '🇪🇸'
  return l.sticker_style === 'girl' ? '👧' : l.sticker_style === 'boy' ? '👦' : '🧒'
}

export default function LearnerPicker(p: Props) {
  const [panel, setPanel] = useState<'none' | 'add' | 'import'>('none')
  const [editing, setEditing] = useState<Learner | null>(null)

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-4 py-8">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-2xl shadow-md">⭐</div>
          <div>
            <h1 className="font-kids text-2xl font-bold leading-tight">Who’s reading?</h1>
            <p className="text-xs text-slate-500">Tap a reader to start</p>
          </div>
        </div>
        <button type="button" className="chip" onClick={p.onAccount}>⚙️ Account</button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {p.learners.map((l) => (
          <div key={l.id} className="card flex items-center justify-between gap-2 p-0 transition hover:-translate-y-0.5 hover:border-indigo-300">
            <button type="button" onClick={() => p.onPick(l)} className="flex flex-1 items-center justify-between gap-3 p-4 text-left" aria-label={`Play as ${l.display_name}`}>
              <span>
                <span className="block font-kids text-xl font-bold">{icon(l)} {l.display_name}</span>
                <span className="mt-0.5 block text-xs text-slate-500">
                  {l.lifetime_stars} ⭐ • {l.stickers.length} stickers • {l.mode === 'spanish' ? `Spanish L${l.spanish_level}` : `Reading L${activeLevel(l)}`}
                </span>
              </span>
              <span className="rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white">Play ▶</span>
            </button>
            <button type="button" className="mr-3 rounded-xl px-2 py-2 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              aria-label={`Edit ${l.display_name}`} title={`Edit ${l.display_name}`}
              onClick={() => { setPanel('none'); setEditing(l) }}>
              ✏️
            </button>
          </div>
        ))}
        {!p.loading && p.learners.length === 0 && (
          <p className="card text-sm text-slate-600 sm:col-span-2">No readers yet. Add one below, or import a backup from the old app.</p>
        )}
        {p.loading && <p className="text-sm text-slate-500">Loading readers…</p>}
      </div>
      {p.error && <p role="alert" className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{p.error}</p>}

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

      {editing && <EditReader key={editing.id} learner={editing} onCancel={() => setEditing(null)} onSave={async (l) => { await p.onUpdate(l); setEditing(null) }} />}
      {panel === 'add' && <AddReader verified={p.verified} onUnlockKids={p.onUnlockKids} onCancel={() => setPanel('none')} onCreate={async (d) => { await p.onCreate(d); setPanel('none') }} />}
      {panel === 'import' && <ImportReaders verified={p.verified} onUnlockKids={p.onUnlockKids} onImport={async (d) => { await p.onImport(d); setPanel('none') }} />}
    </div>
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

export interface ReaderFields {
  name: string
  kind: LearnerKind
  mode: Mode
  age: AgeGroup
  style: StickerStyle
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
          {f.mode === 'reading' ? 'Letter tiles with phonics sounds; read the word out loud.' : 'See an English word and say it in Spanish, with example phrases.'}
          {!isNew && ' Progress in the other one is kept if you switch back.'}
        </p>
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
    const draft: LearnerDraft = { ...newLearnerDraft(f.name, f.kind, f.age, f.style), mode: f.mode }
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
      initial={{ name: '', kind: 'child', mode: 'reading', age: '5-6', style: 'any' }} />
  )
}

/** Edit an existing reader's name, practice type, age group and sticker packs. */
function EditReader({ learner, onSave, onCancel }: { learner: Learner; onSave: (l: Learner) => Promise<void>; onCancel: () => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(f: ReaderFields) {
    if (!f.name) return setError('Enter a first name or nickname.')
    setBusy(true)
    setError('')
    try {
      await onSave({ ...learner, display_name: f.name, mode: f.mode, age_group: f.age, sticker_style: f.style })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t save the changes.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <h2 className="mt-6 font-kids text-xl font-bold">Edit {learner.display_name}</h2>
      <ReaderForm isNew={false} busy={busy} error={error} onSubmit={submit} onCancel={onCancel} submitLabel="Save changes"
        initial={{ name: learner.display_name, kind: learner.kind, mode: learner.mode, age: learner.age_group, style: learner.sticker_style }}
        footer={<p className="text-xs text-slate-500">Stars, stickers and levels aren’t changed. To delete a reader, use ⚙️ Account.</p>} />
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
