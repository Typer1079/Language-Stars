import { SUBJECTS } from '../lib/subjects'
import { useEffect, useMemo, useState } from 'react'
import { adminAccountAction, adminSetPlan, adminUsers, dbMessage, type AdminUser } from '../lib/learnersApi'
import { TERMS_VERSION } from '../lib/legal'
import { Notice } from './ui/Notice'
import { formatDate } from '../lib/format'
import { subject } from '../lib/subjects'

const when = (d: string | null) => (d ? formatDate(d) : '—')
const modeIcon = (m: string | null) => (m ? subject(m).icon : '')

/** Super admin: every account with its email and learners, and sign-out / archive / restore. */
export function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[] | null>(null)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [showArchived, setShowArchived] = useState(true)
  const [confirm, setConfirm] = useState<{ user: AdminUser; action: 'sign_out' | 'archive' | 'restore' } | null>(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')

  const load = () => adminUsers().then((u) => { setUsers(u); setError('') }).catch((e) => setError(/authoriz/i.test(String(e?.message)) ? 'Not allowed: admin with a two-step / Face ID sign-in only.' : /admin_users/.test(String(e?.message)) ? 'Run database update 009 to see accounts here.' : dbMessage(e)))
  useEffect(() => { void load() }, [])

  const list = useMemo(() => {
    const t = q.trim().toLowerCase()
    return (users ?? []).filter((u) => (showArchived || !u.archived_at) &&
      (!t || (u.email ?? '').toLowerCase().includes(t) || u.learners.some((l) => l.name.toLowerCase().includes(t))))
  }, [users, q, showArchived])

  async function changePlan(u: AdminUser, status: 'active' | 'none') {
    setBusy(true)
    try {
      await adminSetPlan(u.id, status)
      setNote(status === 'none' ? `Plan removed for ${u.email}.` : `${u.email} now has a plan (given by hand). It won't be paused for inactivity.`)
      await load()
    } catch (e) {
      setNote(/admin_set_plan/.test(String((e as Error)?.message)) ? 'Run database update 016 to manage plans.' : dbMessage(e))
    } finally {
      setBusy(false)
    }
  }

  async function run() {
    if (!confirm) return
    setBusy(true)
    try {
      const notes = await adminAccountAction(confirm.user.id, confirm.action, reason.trim() || undefined)
      const label = confirm.action === 'sign_out' ? 'Signed out' : confirm.action === 'archive' ? 'Archived' : 'Restored'
      setNote(`${label} ${confirm.user.email ?? 'account'}.${notes.length ? ` Note: ${notes.join('; ')}` : ''}`)
      setConfirm(null)
      setReason('')
      await load()
    } catch (e) {
      setNote(dbMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-4 panel">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs font-bold text-slate-700">👥 Accounts ({users?.length ?? "…"}) <span className="font-normal text-slate-500">· every view and action is logged</span></div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1 text-xs text-slate-600"><input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} /> show archived</label>
          <input className="input w-48 py-1.5 text-sm" placeholder="Search email or name" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search users" />
        </div>
      </div>
      {error && <Notice tone="error">{error}</Notice>}
      {note && <Notice tone="info" className="mb-2">{note}</Notice>}
      {!users && !error && <p className="py-4 text-center text-sm text-slate-500">Loading…</p>}

      <ul className="divide-y divide-slate-100">
        {list.map((u) => (
          <li key={u.id} className={`py-3 ${u.archived_at ? 'opacity-70' : ''}`}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="truncate font-bold text-slate-900">{u.email ?? '(no email)'}</span>
                  {u.is_admin && <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-800">ADMIN</span>}
                  {u.archived_at && <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">{u.archive_kind === 'inactive' ? 'INACTIVE 90 DAYS' : 'ARCHIVED'} {when(u.archived_at)}</span>}
                  {u.paying !== undefined && (u.paying
                    ? <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800" title="Paying accounts are never paused for inactivity">💳 {u.plan_status === 'trialing' ? 'TRIAL' : u.plan_status === 'past_due' ? 'PAYMENT DUE' : 'PAID'}</span>
                    : <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">FREE{u.plan_status ? ` (${u.plan_status})` : ''}</span>)}
                  {u.last_notice && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900" title="Last inactivity email sent">✉️ {u.last_notice === 'paid_45' ? '45-day check-in sent' : u.last_notice === 'free_83' ? 'pause warning sent' : '60-day reminder sent'}</span>}
                  {(u.devices ?? 0) > 0 && <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-800">📱 {u.devices} learner device{u.devices === 1 ? '' : 's'}</span>}
                  {u.terms_version !== TERMS_VERSION && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">{u.terms_version ? 'OLD TERMS' : 'TERMS NOT ACCEPTED'}</span>}
                </div>
                <div className="text-[11px] text-slate-500">Joined {when(u.created_at)} · last sign-in {when(u.last_sign_in_at)} · last active {when(u.last_active)}</div>
                {u.archive_reason && <div className="text-[11px] text-rose-700">Reason: {u.archive_reason}</div>}
              </div>
              {!u.is_admin && (
                <div className="flex shrink-0 gap-1.5 text-xs font-bold">
                  {!u.archived_at && <button type="button" className="pill pill-slate" onClick={() => setConfirm({ user: u, action: 'sign_out' })}>🚪 Sign out</button>}
                  {!u.archived_at && <button type="button" className="pill pill-rose" onClick={() => setConfirm({ user: u, action: 'archive' })}>🗄️ Archive</button>}
                  {u.archived_at && <button type="button" className="pill pill-emerald" onClick={() => setConfirm({ user: u, action: 'restore' })}>↩️ Restore</button>}
                  {u.paying !== undefined && (u.paying
                    ? (u.plan_status && <button type="button" className="pill pill-slate" title="Remove the hand-given plan" onClick={() => void changePlan(u, 'none')}>Remove plan</button>)
                    : <button type="button" className="pill pill-emerald" title="Give this account a plan by hand (gift or test)" onClick={() => void changePlan(u, 'active')}>🎁 Give plan</button>)}
                </div>
              )}
            </div>
            {u.learners.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {u.learners.map((l, i) => (
                  <span key={i} className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200">
                    {l.avatar ?? (l.kind === 'child' ? '🧒' : '🧑')} {l.name}{l.kind === 'child' ? ' (child)' : ''} · {modeIcon(l.mode)} {learnerLevels(l)} · ⭐{l.stars.toLocaleString()}
                  </span>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>

      {confirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl">
            <h3 className="font-kids text-xl font-bold">
              {confirm.action === 'sign_out' ? 'Sign this account out?' : confirm.action === 'archive' ? 'Archive this account?' : 'Restore this account?'}
            </h3>
            <p className="mt-1 text-sm font-semibold text-slate-800">{confirm.user.email}</p>
            <p className="mt-2 text-sm text-slate-600">
              {confirm.action === 'sign_out' && 'Ends every session on every device. They can sign in again.'}
              {confirm.action === 'archive' && 'Signs them out everywhere, blocks sign-in, and hides all their data (learners, history, rankings). Nothing is deleted; you can restore it later.'}
              {confirm.action === 'restore' && 'Lets them sign in and see their learners again.'}
            </p>
            {confirm.action !== 'restore' && (
              <label className="mt-3 block text-sm">
                <span className="label">Reason (saved in the audit log)</span>
                <input className="input" maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g., requested by parent" />
              </label>
            )}
            <div className="mt-4 flex gap-2">
              <button type="button" className="btn-secondary flex-1" onClick={() => { setConfirm(null); setReason('') }}>Cancel</button>
              <button type="button" className={`flex-1 ${confirm.action === 'archive' ? 'btn-danger' : 'btn-primary'}`} disabled={busy} onClick={run}>
                {busy ? 'Working…' : confirm.action === 'sign_out' ? 'Sign out' : confirm.action === 'archive' ? 'Archive' : 'Restore'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/** "📖88 🇪🇸11 🐝38 🇵🇹4": the subjects a learner has started (all levels from update 018, else the first three). */
function learnerLevels(l: { mode: string; reading: number; spanish: number; spelling: number | null; levels?: Record<string, number> }): string {
  const lv = l.levels ?? { reading: l.reading, spanish: l.spanish, ...(l.spelling ? { spelling: l.spelling } : {}) }
  return SUBJECTS.filter((s) => lv[s.id] !== undefined && (lv[s.id] > 1 || s.id === l.mode || ['reading', 'spanish'].includes(s.id)))
    .map((s) => `${s.icon}${lv[s.id]}`).join(' ')
}
