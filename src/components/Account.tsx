import { useEffect, useState } from 'react'
import { downloadText } from '../lib/download'
import { dbMessage, deleteLearner, listAudit, type AuditEntry } from '../lib/learnersApi'
import { irisVoiceName } from '../lib/speech'
import { supabase } from '../lib/supabase'
import { SignInMethods } from './FaceId'
import type { Learner } from '../lib/types'
import { LegalLinks } from './Legal'

interface Props {
  email: string
  learners: Learner[]
  verified: boolean
  hasMfa: boolean
  onBack: () => void
  onEnrollMfa: (mode: 'choose' | 'totp') => void
  signedInWith: string[]
  onVerify: () => void
  onChanged: () => void
}

function describe(e: AuditEntry, names: Map<string, string>): string {
  const who = (e.learner_id && names.get(e.learner_id)) || 'a learner'
  if (e.action === 'learner.create') return `Added ${who}`
  if (e.action === 'learner.delete') return `Deleted a learner`
  const parts: string[] = []
  const d = e.detail as Record<string, [number | string, number | string] | boolean>
  const pair = (k: string, label: string) => {
    const v = d[k]
    if (Array.isArray(v)) parts.push(`${label} ${v[0]} → ${v[1]}`)
  }
  pair('lifetime_stars', 'stars')
  pair('spendable_stars', 'balance')
  pair('reading_level', 'reading level')
  pair('spanish_level', 'Spanish level')
  pair('stickers', 'stickers')
  pair('mode', 'practice')
  if (d.profile_edited) parts.push('profile edited')
  return `${who}: ${parts.join(', ') || 'updated'}`
}

export default function Account(p: Props) {
  const [audit, setAudit] = useState<AuditEntry[] | null>(null)
  const [auditErr, setAuditErr] = useState('')
  const [message, setMessage] = useState('')
  const [deleteId, setDeleteId] = useState('')
  const [confirmName, setConfirmName] = useState('')
  const [busy, setBusy] = useState(false)

  const names = new Map(p.learners.map((l) => [l.id, l.display_name]))
  const toDelete = p.learners.find((l) => l.id === deleteId)

  useEffect(() => {
    listAudit(100).then(setAudit, (err) => setAuditErr(dbMessage(err)))
  }, [])

  function exportBackup() {
    const learners = p.learners.map(({ id: _id, updated_at: _u, ...rest }) => { void _id; void _u; return rest })
    const payload = { app: 'read-aloud-stars', version: 3, exportedAt: new Date().toISOString(), learners }
    downloadText(JSON.stringify(payload, null, 2), `read-aloud-stars-backup-${new Date().toISOString().slice(0, 10)}.json`)
  }

  async function doDelete() {
    if (!toDelete || confirmName.trim().toLowerCase() !== toDelete.display_name.toLowerCase()) return
    setBusy(true)
    try {
      await deleteLearner(toDelete.id)
      setDeleteId('')
      setConfirmName('')
      setMessage(`${toDelete.display_name} was deleted.`)
      p.onChanged()
    } catch (err) {
      setMessage(dbMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function signOutEverywhere() {
    await supabase.auth.signOut({ scope: 'global' })
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-kids text-2xl font-bold">Account</h1>
        <button type="button" className="chip" onClick={p.onBack}>← Learners</button>
      </div>
      <p className="text-sm text-slate-600">Signed in as <b>{p.email}</b></p>
      {message && <p role="status" className="rounded-xl bg-indigo-50 px-3 py-2 text-sm text-indigo-900">{message}</p>}

      <SignInMethods verified={p.verified} signedInWith={p.signedInWith} onAddApp={() => p.onEnrollMfa('totp')} onSetUp={() => p.onEnrollMfa('choose')} onVerify={p.onVerify} onChanged={p.onChanged} />

      <section className="card space-y-2">
        <h2 className="font-semibold">💬 Iris’s voice</h2>
        <p className="text-sm text-slate-600">On this device Iris uses: <b>{irisVoiceName()}</b></p>
        <p className="text-xs text-slate-500">
          For the most natural voice on iPhone or iPad: <b>Settings → Accessibility → Spoken Content → Voices → English</b>, download <b>Ava (Premium)</b> or <b>Zoe (Premium)</b>, and under Spanish, <b>Paulina (Premium)</b>. Iris picks them up automatically. On a Mac it’s System Settings → Accessibility → Spoken Content → System Voice → Manage Voices.
        </p>
      </section>

      <section className="card space-y-2">
        <h2 className="font-semibold">Backup</h2>
        <p className="text-sm text-slate-600">Download every learner’s progress as a file. Keep it somewhere private; it includes first names.</p>
        <button type="button" className="btn-secondary" onClick={exportBackup} disabled={p.learners.length === 0}>⬇️ Download backup</button>
      </section>

      <section className="card space-y-2">
        <h2 className="font-semibold">Activity</h2>
        <p className="text-xs text-slate-500">Star, level and sticker changes on this account’s learners. Kept for one year.</p>
        {auditErr && <p className="text-sm text-rose-700">{auditErr}</p>}
        {!audit && !auditErr && <p className="text-sm text-slate-500">Loading…</p>}
        {audit && audit.length === 0 && <p className="text-sm text-slate-500">No activity yet.</p>}
        {audit && audit.length > 0 && (
          <ul className="max-h-72 divide-y divide-slate-100 overflow-y-auto text-sm">
            {audit.map((e) => (
              <li key={e.id} className="flex justify-between gap-3 py-1.5">
                <span>{describe(e, names)}</span>
                <span className="shrink-0 text-xs text-slate-500">{new Date(e.at).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card space-y-2">
        <h2 className="font-semibold">Delete a learner</h2>
        <select className="input" value={deleteId} onChange={(e) => { setDeleteId(e.target.value); setConfirmName('') }} aria-label="Reader to delete">
          <option value="">Choose a learner…</option>
          {p.learners.map((l) => <option key={l.id} value={l.id}>{l.display_name}</option>)}
        </select>
        {toDelete && (
          <>
            <label className="label" htmlFor="confirm-name">Type “{toDelete.display_name}” to permanently delete their progress</label>
            <input id="confirm-name" className="input" value={confirmName} onChange={(e) => setConfirmName(e.target.value)} autoComplete="off" />
            <button type="button" className="btn-danger" disabled={busy || confirmName.trim().toLowerCase() !== toDelete.display_name.toLowerCase()} onClick={doDelete}>
              Delete {toDelete.display_name}
            </button>
          </>
        )}
      </section>

      <section className="card flex flex-wrap gap-2">
        <button type="button" className="btn-secondary" onClick={() => supabase.auth.signOut()}>🚪 Sign out</button>
        <button type="button" className="btn-secondary" onClick={signOutEverywhere}>Sign out on all devices</button>
      </section>
      <p className="text-center text-[11px] text-slate-400">Version {__APP_VERSION__} · <LegalLinks /></p>
    </div>
  )
}
