import { useEffect, useState } from 'react'
import {
  dismissOffer,
  faceIdMessage,
  faceIdSupported,
  hasFaceIdFactor,
  listPasskeys,
  offerDismissed,
  removePasskey,
  setUpFaceId,
  wasCancelled,
  type PasskeyItem,
} from '../lib/faceid'

type Msg = { kind: 'error' | 'info'; text: string } | null

function resultMessage(r: Awaited<ReturnType<typeof setUpFaceId>>): Msg {
  if (r.signIn && r.secondStep) return { kind: 'info', text: 'Face ID is set up. Next time, tap “Sign in with Face ID”, and use Face ID again for the second step.' }
  if (r.signIn) return { kind: 'info', text: `Face ID sign-in is set up. ${r.error && !wasCancelled(r.error) ? faceIdMessage(r.error, 'setup') : 'The second step will still use your 6-digit code.'}` }
  if (r.error && !wasCancelled(r.error)) return { kind: 'error', text: faceIdMessage(r.error, 'setup') }
  return null
}

/** Reader-list card: "Sign in with Face ID next time?" Shown until set up or dismissed. */
export function FaceIdOffer() {
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<Msg>(null)

  useEffect(() => {
    if (!faceIdSupported() || offerDismissed()) return
    let live = true
    // Hidden when passkeys are off in Supabase (list fails) or the account already has one.
    void listPasskeys().then((list) => live && setShow(list !== null && list.length === 0))
    return () => {
      live = false
    }
  }, [])

  if (!show) return null

  async function setUp() {
    setBusy(true)
    setMessage(null)
    const r = await setUpFaceId()
    setBusy(false)
    setMessage(resultMessage(r))
    if (r.signIn) window.setTimeout(() => setShow(false), 4000)
  }

  return (
    <div className="card mt-4 space-y-2 border-sky-200 bg-sky-50">
      <p className="font-semibold">Sign in with Face ID next time?</p>
      <p className="text-sm text-slate-600">Saves a passkey in Apple Passwords: no password or code to type, and it works in the Home Screen app. Face ID asks twice during setup.</p>
      {message && <p className={`text-sm ${message.kind === 'error' ? 'text-rose-700' : 'text-emerald-700'}`}>{message.text}</p>}
      <div className="flex gap-2">
        <button type="button" className="btn-secondary flex-1" onClick={() => { dismissOffer(); setShow(false) }}>Not now</button>
        <button type="button" className="btn-primary flex-1" disabled={busy} onClick={setUp}>{busy ? 'Waiting for Face ID…' : 'Set up Face ID'}</button>
      </div>
    </div>
  )
}

const when = (iso?: string) => (iso ? new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '')

/** Account screen section: list, add and remove Face ID. */
export function FaceIdSettings() {
  const [items, setItems] = useState<PasskeyItem[] | null | 'loading'>('loading')
  const [secondStep, setSecondStep] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<Msg>(null)

  const refresh = () => {
    void listPasskeys().then(setItems)
    void hasFaceIdFactor().then(setSecondStep)
  }
  useEffect(() => {
    refresh()
  }, [])

  async function add() {
    setBusy(true)
    setMessage(null)
    const r = await setUpFaceId()
    setBusy(false)
    setMessage(resultMessage(r))
    refresh()
  }

  async function remove(p: PasskeyItem) {
    const { error } = await removePasskey(p.id)
    setMessage(error ? { kind: 'error', text: `Couldn’t remove it: ${error.message}` } : { kind: 'info', text: 'Removed. You can also delete it from the Passwords app.' })
    refresh()
  }

  return (
    <section className="card space-y-3">
      <h2 className="font-semibold">Face ID</h2>
      <p className="text-sm text-slate-600">
        Sign in with Face ID instead of your password, and use Face ID for the second step instead of the 6-digit code. Saved in Apple Passwords and synced to your other Apple devices. Your password and code still work as a backup.
      </p>
      {!faceIdSupported() && <p className="text-sm text-amber-700">This browser doesn’t support Face ID / passkeys.</p>}
      {message && <p role="status" className={`rounded-xl px-3 py-2 text-sm ${message.kind === 'error' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-800'}`}>{message.text}</p>}
      {items === 'loading' && <p className="text-sm text-slate-500">Loading…</p>}
      {items === null && <p className="text-sm text-amber-700">Face ID sign-in isn’t turned on yet (Supabase → Authentication → Passkeys).</p>}
      {Array.isArray(items) && items.length === 0 && <p className="text-sm text-slate-500">Not set up yet.</p>}
      {Array.isArray(items) && items.map((p) => (
        <div key={p.id} className="flex items-center justify-between gap-3 border-t border-slate-100 pt-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{p.friendly_name || 'Passkey'}</p>
            <p className="text-xs text-slate-500">Added {when(p.created_at)}{p.last_used_at ? ` · last used ${when(p.last_used_at)}` : ''}</p>
          </div>
          <button type="button" className="btn-secondary px-3 py-2 text-xs" onClick={() => remove(p)}>Remove</button>
        </div>
      ))}
      {secondStep !== null && <p className="text-xs text-slate-500">Second step with Face ID: {secondStep ? 'on' : 'off (uses the 6-digit code)'}</p>}
      {faceIdSupported() && items !== null && (
        <button type="button" className="btn-primary w-full" disabled={busy} onClick={add}>{busy ? 'Waiting for Face ID…' : '+ Set up Face ID on this device'}</button>
      )}
    </section>
  )
}
