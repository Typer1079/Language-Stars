import { useEffect, useMemo, useState } from 'react'
import { dbMessage } from '../lib/learnersApi'
import { fetchProblems, kindLabel, problemsToText, resolveProblems, type ProblemKind, type ProblemReport } from '../lib/problems'
import { Notice } from './ui/Notice'
import { formatDateTime } from '../lib/format'
import { subject } from '../lib/subjects'

const PERIODS = [
  { days: 1, label: 'Last 24 hours' },
  { days: 7, label: 'Last 7 days' },
  { days: 30, label: 'Last 30 days' },
  { days: 90, label: 'Last 90 days' },
]
const KINDS: { kind: ProblemKind; icon: string; short: string; tone: string }[] = [
  { kind: 'error', icon: '💥', short: 'App errors', tone: 'bg-rose-100 text-rose-800' },
  { kind: 'stuck', icon: '⏳', short: 'Stuck', tone: 'bg-amber-100 text-amber-800' },
  { kind: 'skipped', icon: '⏭️', short: 'Skipped', tone: 'bg-sky-100 text-sky-800' },
  { kind: 'gave_up', icon: '🙋', short: 'Coach gave up', tone: 'bg-violet-100 text-violet-800' },
  { kind: 'mic', icon: '🎤', short: 'Microphone', tone: 'bg-slate-200 text-slate-800' },
]
const kindInfo = (k: string) => KINDS.find((x) => x.kind === k) ?? KINDS[0]
const modeIcon = (m: string | null) => (m ? subject(m).icon : '')
const when = (d: string) => formatDateTime(d)

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Older browsers / no permission: select a hidden text box and copy that.
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    let ok = false
    try { ok = document.execCommand('copy') } catch { ok = false }
    ta.remove()
    return ok
  }
}

/** Counts per kind and the items that come up most, at the top of a copied list. */
function summary(list: ProblemReport[]): string {
  if (list.length < 3) return ''
  const byKind = KINDS.map((k) => [k.short, list.filter((p) => p.kind === k.kind).length] as const).filter(([, n]) => n > 0)
  const items = new Map<string, number>()
  for (const p of list) if (p.item && p.kind !== 'error') items.set(`${p.mode ?? ''} L${p.level ?? '?'} · ${p.item}`, (items.get(`${p.mode ?? ''} L${p.level ?? '?'} · ${p.item}`) ?? 0) + 1)
  const top = [...items.entries()].filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1]).slice(0, 10)
  return [
    'Summary: ' + byKind.map(([k, n]) => `${k} ${n}`).join(' · '),
    ...(top.length ? ['Repeated items:', ...top.map(([k, n]) => `  ${n}× ${k}`)] : []),
  ].join('\n')
}

/** Super admin: problem reports (app errors, stuck learners, microphone trouble) to copy and analyze. */
export function AdminProblems() {
  const [days, setDays] = useState(7)
  const [showFixed, setShowFixed] = useState(false)
  const [list, setList] = useState<ProblemReport[] | null>(null)
  const [error, setError] = useState('')
  const [kind, setKind] = useState<ProblemKind | 'all'>('all')
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [open, setOpen] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  const load = () => {
    return fetchProblems(days, showFixed)
      .then((l) => { setError(''); setList(l); setPicked((s) => new Set([...s].filter((id) => l.some((p) => p.id === id)))) })
      .catch((e) => setError(/authoriz/i.test(String(e?.message)) ? 'Not allowed: admin with a two-step / Face ID sign-in only.' : /admin_problems/.test(String(e?.message)) ? 'Run database update 012 to see problem reports here.' : dbMessage(e)))
  }
  // Loads from the database (an external system) whenever the period or filter changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void load() }, [days, showFixed])

  const shown = useMemo(() => (list ?? []).filter((p) => kind === 'all' || p.kind === kind), [list, kind])
  const counts = useMemo(() => Object.fromEntries(KINDS.map((k) => [k.kind, (list ?? []).filter((p) => p.kind === k.kind).length])), [list])
  const pickedList = shown.filter((p) => picked.has(p.id))
  const allPicked = shown.length > 0 && pickedList.length === shown.length
  const period = PERIODS.find((p) => p.days === days)?.label.toLowerCase() ?? `${days} days`

  async function copy(items: ProblemReport[], what: string) {
    const head = `${period}${kind === 'all' ? '' : ` · ${kindLabel(kind)}`}`
    const sum = summary(items)
    const text = problemsToText(items, head).replace('\n', sum ? `\n${sum}\n` : '\n')
    const ok = await copyText(text)
    setNote(ok ? `Copied ${what} ✓ Paste it into the chat with Claude to analyze.` : 'Couldn’t copy here. Try again in Safari or Chrome.')
  }

  async function markFixed(ids: string[], fixed: boolean) {
    if (!ids.length) return
    setBusy(true)
    try {
      const n = await resolveProblems(ids, fixed)
      setNote(`${fixed ? 'Marked fixed' : 'Reopened'}: ${n} report${n === 1 ? '' : 's'}.`)
      setPicked(new Set())
      await load()
    } catch (e) {
      setNote(dbMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const toggle = (id: string) => setPicked((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })

  return (
    <div className="mt-4 panel" id="problems">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs font-bold text-slate-700">🛠️ Problems ({list ? `${list.filter((p) => !p.resolved_at).length} open` : '…'}) <span className="font-normal text-slate-500">· errors, stuck learners, mic trouble · kept 90 days</span></div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1 text-xs text-slate-600"><input type="checkbox" checked={showFixed} onChange={(e) => setShowFixed(e.target.checked)} /> show fixed</label>
          <select className="input w-auto py-1.5 text-sm" value={days} onChange={(e) => setDays(Number(e.target.value))} aria-label="Period">
            {PERIODS.map((p) => <option key={p.days} value={p.days}>{p.label}</option>)}
          </select>
          <button type="button" className="chip" onClick={() => void load()}>↻ Refresh</button>
        </div>
      </div>

      <div className="mb-2 flex flex-wrap gap-1.5" role="group" aria-label="Filter by kind">
        <button type="button" onClick={() => setKind('all')} className={`rounded-full px-3 py-1 text-xs font-bold ${kind === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}>All {list?.length ?? ''}</button>
        {KINDS.map((k) => (
          <button key={k.kind} type="button" onClick={() => setKind(k.kind)} disabled={!counts[k.kind]}
            className={`rounded-full px-3 py-1 text-xs font-bold disabled:opacity-40 ${kind === k.kind ? 'bg-indigo-600 text-white' : k.tone}`}>
            {k.icon} {k.short} {counts[k.kind] || ''}
          </button>
        ))}
      </div>

      {error && <Notice tone="error">{error}</Notice>}
      {note && <Notice tone="info" className="mb-2">{note}</Notice>}
      {!list && !error && <p className="py-4 text-center text-sm text-slate-500">Loading…</p>}
      {list && shown.length === 0 && <p className="py-4 text-center text-sm text-slate-500">No problems in this period 🎉</p>}

      {shown.length > 0 && (
        <div className="sticky top-0 z-10 mb-1 flex flex-wrap items-center gap-2 border-b border-slate-100 bg-white py-2">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <input type="checkbox" checked={allPicked} onChange={() => setPicked(allPicked ? new Set() : new Set(shown.map((p) => p.id)))} aria-label="Select all shown" />
            Select all
          </label>
          <button type="button" className="btn-primary px-3 py-1.5 text-xs" disabled={!pickedList.length} onClick={() => void copy(pickedList, `${pickedList.length} selected`)}>📋 Copy selected ({pickedList.length})</button>
          <button type="button" className="btn-secondary px-3 py-1.5 text-xs" onClick={() => void copy(shown, `all ${shown.length} for ${period}`)}>📋 Copy all ({shown.length})</button>
          <button type="button" className="btn-secondary px-3 py-1.5 text-xs" disabled={busy || !pickedList.some((p) => !p.resolved_at)} onClick={() => void markFixed(pickedList.filter((p) => !p.resolved_at).map((p) => p.id), true)}>✅ Mark selected fixed</button>
        </div>
      )}

      <ul className="max-h-[32rem] divide-y divide-slate-100 overflow-y-auto">
        {shown.map((p) => {
          const k = kindInfo(p.kind)
          return (
            <li key={p.id} className={`py-2 ${p.resolved_at ? 'opacity-60' : ''}`}>
              <div className="flex items-start gap-2">
                <input type="checkbox" className="mt-1" checked={picked.has(p.id)} onChange={() => toggle(p.id)} aria-label={`Select ${kindLabel(p.kind)} at ${when(p.created_at)}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className={`rounded-full px-2 py-0.5 font-bold ${k.tone}`}>{k.icon} {k.short}</span>
                    <span className="text-slate-500">{when(p.created_at)}</span>
                    {p.mode && <span className="font-semibold text-slate-700">{modeIcon(p.mode)} L{p.level ?? '?'}</span>}
                    {p.seconds != null && p.kind !== 'error' && <span className="text-slate-500">· {p.seconds}s</span>}
                    {p.learner && <span className="font-mono text-[11px] text-slate-400">· {p.learner}</span>}
                    {p.resolved_at && <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-bold text-emerald-800">fixed</span>}
                  </div>
                  {p.item && <p className="mt-0.5 truncate text-sm font-semibold text-slate-800" title={p.item}>{p.item}</p>}
                  {p.heard.length > 0 && <p className="truncate text-xs text-slate-600" title={p.heard.join(' | ')}>Heard: {p.heard.map((h) => `“${h}”`).join(' · ')}</p>}
                  {p.detail && <p className="line-clamp-2 break-words font-mono text-[11px] text-rose-700">{p.detail}</p>}
                  <p className="text-[11px] text-slate-400">{p.device ?? ''}{p.app_version ? ` · ${p.app_version}` : ''}</p>
                  {open === p.id && p.log && <pre className="mt-1 max-h-56 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-900 p-2 font-mono text-[11px] text-emerald-300">{p.log}</pre>}
                </div>
                <div className="flex shrink-0 flex-col gap-1">
                  <button type="button" className="chip px-2 py-1 text-xs" onClick={() => void copy([p], 'this report')}>📋 Copy</button>
                  {p.log && <button type="button" className="chip px-2 py-1 text-xs" onClick={() => setOpen(open === p.id ? null : p.id)}>{open === p.id ? 'Hide log' : 'Log'}</button>}
                  <button type="button" className="chip px-2 py-1 text-xs" disabled={busy} onClick={() => void markFixed([p.id], !p.resolved_at)}>{p.resolved_at ? 'Reopen' : '✅ Fixed'}</button>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
