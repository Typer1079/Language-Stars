import { useRef, useState, type FormEvent } from 'react'
import { activeLevel } from '../lib/progress'
import { cleanName, parseSaveFile } from '../lib/validate'
import { newLearnerDraft, type AgeGroup, type Learner, type LearnerDraft, type LearnerKind, type StickerStyle } from '../lib/types'

interface Props {
  learners: Learner[]
  loading: boolean
  error: string
  /** Session passed two-step sign-in, so kids' profiles are available. */
  verified: boolean
  hasMfa: boolean
  onPick: (l: Learner) => void
  onCreate: (d: LearnerDraft) => Promise<void>
  onImport: (d: LearnerDraft[]) => Promise<void>
  onUnlockKids: () => void
  onAccount: () => void
}

function icon(l: Pick<Learner, 'mode' | 'sticker_style'>) {
  if (l.mode === 'spanish') return '🇪🇸'
  return l.sticker_style === 'girl' ? '👧' : l.sticker_style === 'boy' ? '👦' : '🧒'
}

export default function LearnerPicker(p: Props) {
  const [panel, setPanel] = useState<'none' | 'add' | 'import'>('none')

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
          <button
            key={l.id}
            type="button"
            onClick={() => p.onPick(l)}
            className="card flex items-center justify-between gap-3 p-4 text-left transition hover:-translate-y-0.5 hover:border-indigo-300"
          >
            <span>
              <span className="block font-kids text-xl font-bold">{icon(l)} {l.display_name}</span>
              <span className="mt-0.5 block text-xs text-slate-500">
                {l.lifetime_stars} ⭐ • {l.stickers.length} stickers • {l.mode === 'spanish' ? `Spanish L${l.spanish_level}` : `Reading L${activeLevel(l)}`}
              </span>
            </span>
            <span className="rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white">Play ▶</span>
          </button>
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
          <button type="button" className="btn-primary mt-3" onClick={p.onUnlockKids}>
            {p.hasMfa ? 'Enter code' : 'Set up two-step sign-in'}
          </button>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        <button type="button" className="btn-secondary" onClick={() => setPanel(panel === 'add' ? 'none' : 'add')}>+ Add reader</button>
        <button type="button" className="btn-secondary" onClick={() => setPanel(panel === 'import' ? 'none' : 'import')}>📂 Import backup</button>
      </div>

      {panel === 'add' && <AddReader verified={p.verified} onUnlockKids={p.onUnlockKids} onCreate={async (d) => { await p.onCreate(d); setPanel('none') }} />}
      {panel === 'import' && <ImportReaders verified={p.verified} onUnlockKids={p.onUnlockKids} onImport={async (d) => { await p.onImport(d); setPanel('none') }} />}
    </div>
  )
}

const KID_AGES: AgeGroup[] = ['3-4', '5-6', '7-8', '9+']

function Choice<T extends string>({ value, options, onChange }: { value: T; options: { v: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button key={o.v} type="button" aria-pressed={value === o.v} onClick={() => onChange(o.v)}
          className={`rounded-xl border-2 px-3 py-2 font-kids text-sm font-bold transition ${value === o.v ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-700'}`}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

function AddReader({ verified, onUnlockKids, onCreate }: { verified: boolean; onUnlockKids: () => void; onCreate: (d: LearnerDraft) => Promise<void> }) {
  const [name, setName] = useState('')
  const [kind, setKind] = useState<LearnerKind>('child')
  const [age, setAge] = useState<AgeGroup>('5-6')
  const [style, setStyle] = useState<StickerStyle>('any')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    const clean = cleanName(name)
    if (!clean) return setError('Enter a first name or nickname.')
    setBusy(true)
    setError('')
    try {
      await onCreate(newLearnerDraft(clean, kind, kind === 'self' ? 'adult' : age, style))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t add the reader.')
    } finally {
      setBusy(false)
    }
  }

  const blocked = kind === 'child' && !verified
  return (
    <form onSubmit={submit} className="card mt-4 space-y-4">
      <div>
        <span className="label">Who is this reader?</span>
        <Choice value={kind} onChange={setKind} options={[{ v: 'child', label: '🧒 My child' }, { v: 'self', label: '🙋 Me (Spanish practice)' }]} />
      </div>
      <div>
        <label className="label" htmlFor="reader-name">First name or nickname</label>
        <input id="reader-name" className="input" maxLength={40} autoComplete="off" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Ethan" />
        <p className="mt-1 text-xs text-slate-500">Just a first name is enough. No last names or birthdays are stored.</p>
      </div>
      {kind === 'child' && (
        <div>
          <span className="label">Age group</span>
          <Choice value={age} onChange={setAge} options={KID_AGES.map((a) => ({ v: a, label: `${a} yrs` }))} />
        </div>
      )}
      <div>
        <span className="label">Sticker packs</span>
        <Choice value={style} onChange={setStyle} options={[{ v: 'any', label: '🌈 Mixed' }, { v: 'boy', label: '🦖 Boy' }, { v: 'girl', label: '🦄 Girl' }]} />
      </div>
      {error && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      {blocked ? (
        <button type="button" className="btn-primary w-full" onClick={onUnlockKids}>Verify two-step sign-in to add a child</button>
      ) : (
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Adding…' : 'Add reader'}</button>
      )}
    </form>
  )
}

function ImportReaders({ verified, onUnlockKids, onImport }: { verified: boolean; onUnlockKids: () => void; onImport: (d: LearnerDraft[]) => Promise<void> }) {
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

  async function submit() {
    const picked = drafts.filter((d) => d.pick).map(({ pick: _p, ...d }) => { void _p; return d })
    if (picked.length === 0) return setError('Choose at least one reader.')
    setBusy(true)
    setError('')
    try {
      await onImport(picked)
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
                <option value="child">My child</option>
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
          <button type="button" className="btn-primary w-full" onClick={onUnlockKids}>Verify two-step sign-in to import a child</button>
        ) : (
          <button type="button" className="btn-primary w-full" disabled={busy} onClick={submit}>{busy ? 'Importing…' : 'Import selected'}</button>
        ))}
    </div>
  )
}
