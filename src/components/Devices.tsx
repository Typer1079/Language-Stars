import { useEffect, useState } from 'react'
import { createPairingCode, dbMessage, linkThisDevice, listDevices, startDeviceSignIn, unlinkDevice, type LinkedDevice } from '../lib/learnersApi'
import type { Learner } from '../lib/types'
import { Notice } from './ui/Notice'
import { formatDate } from '../lib/format'

/** Parent: link a child's own phone or tablet to one learner, and see / unlink linked devices. */
export function LinkDevicePanel({ learner, verified }: { learner: Learner; verified: boolean }) {
  const [devices, setDevices] = useState<LinkedDevice[] | null>(null)
  const [code, setCode] = useState<{ code: string; expires_at: string } | null>(null)
  const [left, setLeft] = useState(0)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const load = () => listDevices(learner.id).then(setDevices).catch(() => setDevices(null))
  useEffect(() => { void load() }, [learner.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!code) return
    const tick = () => {
      const s = Math.max(0, Math.round((new Date(code.expires_at).getTime() - Date.now()) / 1000))
      setLeft(s)
      if (s === 0) setCode(null)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [code])

  async function make() {
    setBusy(true); setError('')
    try { setCode(await createPairingCode(learner.id)) } catch (e) { setError(/create_pairing_code/.test(String((e as Error)?.message)) ? 'Run database update 010 to use learner devices.' : dbMessage(e)) } finally { setBusy(false) }
  }

  return (
    <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50/60 p-3 text-sm">
      <div className="font-bold text-slate-800">📱 {learner.display_name}’s own phone or tablet</div>
      <p className="mt-0.5 text-xs text-slate-600">
        Let {learner.display_name} sign in on their own device without an email or password. That device can only practice as {learner.display_name}: it can’t see other learners, change the profile, or reach your account. Unlink it anytime.
      </p>
      {!verified ? (
        <p className="mt-2 text-xs font-semibold text-amber-800">Sign in with Face ID or your authenticator code to link a device.</p>
      ) : code ? (
        <div className="mt-3 rounded-xl bg-white p-3 text-center ring-1 ring-sky-200">
          <div className="text-xs font-semibold text-slate-500">On {learner.display_name}’s device, open this site, tap “I’m a learner: link this device”, and enter:</div>
          <div className="my-2 font-mono text-3xl font-bold tracking-[0.2em] text-slate-900">{code.code.slice(0, 5)}-{code.code.slice(5)}</div>
          <div className="text-xs text-slate-500">Works once, for {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')} more.</div>
          <button type="button" className="mt-2 text-xs font-bold text-sky-800 underline" onClick={() => { setCode(null); void load() }}>Done, refresh the list</button>
        </div>
      ) : (
        <button type="button" className="btn-secondary mt-2" disabled={busy} onClick={make}>{busy ? 'Making a code…' : '🔗 Make a link code'}</button>
      )}
      {error && <Notice tone="error" className="mt-2 text-xs">{error}</Notice>}
      {devices && devices.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {devices.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-2 rounded-xl bg-white px-3 py-2 ring-1 ring-slate-200">
              <span className="min-w-0">
                <span className="block truncate font-semibold">📱 {d.label || 'Linked device'}</span>
                <span className="block text-[11px] text-slate-500">Linked {formatDate(d.created_at)}{d.last_seen_at ? ` · last used ${formatDate(d.last_seen_at)}` : ''}</span>
              </span>
              <button type="button" className="shrink-0 pill pill-rose"
                onClick={async () => { try { await unlinkDevice(d.id); await load() } catch (e) { setError(dbMessage(e)) } }}>Unlink</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Sign-in page button: starts a no-email sign-in for this device, then the app shows the code screen. */
export function StartDeviceLink() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  return (
    <>
      <button type="button" disabled={busy} className="mt-6 w-full rounded-2xl border-2 border-dashed border-sky-300 bg-sky-50 px-4 py-3 text-sm font-bold text-sky-900 hover:bg-sky-100"
        onClick={async () => { setBusy(true); setError(''); try { await startDeviceSignIn() } catch (e) { setError(e instanceof Error ? e.message : 'Couldn’t start.') } finally { setBusy(false) } }}>
        {busy ? 'One moment…' : '🧒 I’m a learner: link this device'}
      </button>
      {error && <Notice tone="error" className="mt-2">{error}</Notice>}
    </>
  )
}

/** On the learner's device: enter the parent's code. */
export function LinkThisDevice({ onCancel, onLinked }: { onCancel: () => void; onLinked: (learnerId: string) => void }) {
  const [code, setCode] = useState('')
  const [label, setLabel] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 py-10">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-3xl shadow-md">📱</div>
      <h1 className="font-kids text-2xl font-bold">Link this device</h1>
      <p className="mt-1 text-sm text-slate-600">Ask your parent to open <b>✏️ Edit</b> on your card, tap <b>Make a link code</b>, and type the code here. No email or password needed.</p>
      <form className="mt-5 space-y-3" onSubmit={async (e) => {
        e.preventDefault(); setBusy(true); setError('')
        try { onLinked(await linkThisDevice(code, label.trim())) } catch (err) { setError(err instanceof Error ? err.message : 'That didn’t work.') } finally { setBusy(false) }
      }}>
        <div>
          <label className="label" htmlFor="link-code">Code from your parent</label>
          <input id="link-code" className="input text-center font-mono text-2xl uppercase tracking-[0.2em]" autoComplete="one-time-code" autoCapitalize="characters" spellCheck={false}
            maxLength={12} value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))} placeholder="ABCDE-23456" required />
        </div>
        <div>
          <label className="label" htmlFor="link-label">Name this device (optional)</label>
          <input id="link-label" className="input" maxLength={40} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g., iPad" />
        </div>
        {error && <Notice tone="error">{error}</Notice>}
        <button className="btn-primary w-full" disabled={busy || code.replace(/-/g, '').length < 10}>{busy ? 'Linking…' : 'Link and start'}</button>
      </form>
      <button type="button" className="link mt-4 text-sm" onClick={onCancel}>Cancel</button>
    </div>
  )
}
