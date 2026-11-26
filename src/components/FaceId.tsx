import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Notice } from './ui/Notice'
import {
  dismissOffer,
  faceIdMessage,
  faceIdSupported,
  listPasskeys,
  offerDismissed,
  removePasskey,
  setUpFaceId,
  wasCancelled,
  type PasskeyItem,
} from '../lib/faceid'
import { formatDate } from '../lib/format'

type Msg = { kind: 'error' | 'info'; text: string } | null

function resultMessage(r: Awaited<ReturnType<typeof setUpFaceId>>): Msg {
  if (r.signIn && r.secondStep) return { kind: 'info', text: 'Face ID is set up. Next time, tap “Sign in with Face ID”, and use Face ID again for the second step.' }
  if (r.signIn) return { kind: 'info', text: 'Face ID sign-in is set up. Next time, tap “Sign in with Face ID”: one tap opens everything, kids’ profiles included.' }
  if (r.error && !wasCancelled(r.error)) return { kind: 'error', text: faceIdMessage(r.error, 'setup') }
  return null
}

/** Learner-list card: "Sign in with Face ID next time?" Shown until set up or dismissed. */
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
      <p className="text-sm text-slate-600">Saves a passkey in Apple Passwords: no password or code to type, and it works in the Home Screen app.</p>
      {message && <p className={`text-sm ${message.kind === 'error' ? 'text-rose-700' : 'text-emerald-700'}`}>{message.text}</p>}
      <div className="flex gap-2">
        <button type="button" className="btn-secondary flex-1" onClick={() => { dismissOffer(); setShow(false) }}>Not now</button>
        <button type="button" className="btn-primary flex-1" disabled={busy} onClick={setUp}>{busy ? 'Waiting for Face ID…' : 'Set up Face ID'}</button>
      </div>
    </div>
  )
}

const when = (iso?: string) => (iso ? formatDate(iso) : '')

interface FactorRow {
  id: string
  type: 'totp' | 'webauthn'
  name: string
  created: string
}

function describeSignIn(methods: string[]): string {
  if (methods.some((m) => m === 'passkey' || m === 'webauthn')) return 'Face ID'
  const parts = [methods.includes('password') ? 'password' : '', methods.includes('mfa/webauthn') ? 'Face ID' : '', methods.includes('totp') || methods.includes('mfa/totp') ? 'authenticator code' : '']
  return parts.filter(Boolean).join(' + ') || methods.join(' + ') || 'password'
}

/**
 * Account screen: how you sign in and how kids' profiles are protected.
 * Face ID is the default; an authenticator app is optional (a backup, or removed entirely).
 */
export function SignInMethods({ verified, signedInWith, onAddApp, onSetUp, onVerify, onChanged }: {
  verified: boolean
  signedInWith: string[]
  onAddApp: () => void
  onSetUp: () => void
  onVerify: () => void
  onChanged: () => void
}) {
  const [passkeys, setPasskeys] = useState<PasskeyItem[] | null | 'loading'>('loading')
  const [factors, setFactors] = useState<FactorRow[]>([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<Msg>(null)

  const refresh = () => {
    void listPasskeys().then(setPasskeys)
    void supabase.auth.mfa.listFactors().then(({ data }) =>
      setFactors(
        (data?.all ?? [])
          .filter((f) => f.status === 'verified' && (f.factor_type === 'totp' || f.factor_type === 'webauthn'))
          .map((f) => ({ id: f.id, type: f.factor_type as 'totp' | 'webauthn', name: (f.friendly_name ?? '').replace(/Read Aloud Stars/gi, 'Language Stars'), created: f.created_at })),
      ),
    )
  }
  useEffect(() => {
    refresh()
  }, [])

  const faceIdFactors = factors.filter((f) => f.type === 'webauthn')
  const appFactors = factors.filter((f) => f.type === 'totp')
  const hasFaceId = faceIdFactors.length > 0 || (Array.isArray(passkeys) && passkeys.length > 0)

  async function addFaceId() {
    setBusy(true)
    setMessage(null)
    const r = await setUpFaceId()
    setBusy(false)
    setMessage(resultMessage(r))
    refresh()
    onChanged()
  }

  async function removeFactor(f: FactorRow) {
    const others = factors.filter((x) => x.id !== f.id)
    if (others.length === 0 && !window.confirm('This is your only second step. Kids’ profiles will be locked until you set one up again. Remove it?')) return
    setBusy(true)
    const { error } = await supabase.auth.mfa.unenroll({ factorId: f.id })
    if (!error) await supabase.auth.refreshSession()
    setBusy(false)
    setMessage(error ? { kind: 'error', text: `Couldn’t remove it: ${error.message}` } : { kind: 'info', text: f.type === 'totp' ? 'Authenticator app removed. You won’t be asked for codes anymore.' : 'Face ID second step removed.' })
    refresh()
    onChanged()
  }

  async function removeKey(p: PasskeyItem) {
    const { error } = await removePasskey(p.id)
    setMessage(error ? { kind: 'error', text: `Couldn’t remove it: ${error.message}` } : { kind: 'info', text: 'Removed. You can also delete it from the Passwords app.' })
    refresh()
  }

  return (
    <section className="card space-y-4">
      <div>
        <h2 className="font-semibold">Sign-in &amp; kids’ profile protection</h2>
        <p className="text-xs text-slate-500">This time you signed in with: {describeSignIn(signedInWith)}{verified ? ' ✓' : ''}</p>
      </div>
      {message && <Notice tone={message.kind === 'error' ? 'error' : 'success'}>{message.text}</Notice>}

      <div className="space-y-2 rounded-2xl border border-slate-200 p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold">🙂 Face ID <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">Recommended</span></p>
          <span className={`text-xs font-bold ${hasFaceId ? 'text-emerald-700' : 'text-slate-500'}`}>{hasFaceId ? 'On' : 'Off'}</span>
        </div>
        <p className="text-xs text-slate-500">One tap to sign in, and it unlocks kids’ profiles by itself. Saved in Apple Passwords.</p>
        {passkeys === null && <p className="text-xs text-amber-700">Face ID sign-in isn’t turned on yet (Supabase → Authentication → Passkeys).</p>}
        {Array.isArray(passkeys) && passkeys.map((p) => (
          <div key={p.id} className="flex items-center justify-between gap-3 border-t border-slate-100 pt-2 text-sm">
            <span className="min-w-0 truncate">{p.friendly_name || 'Passkey'} <span className="text-xs text-slate-500">· sign-in · added {when(p.created_at)}</span></span>
            <button type="button" className="btn-secondary px-3 py-1.5 text-xs" onClick={() => removeKey(p)}>Remove</button>
          </div>
        ))}
        {faceIdFactors.map((f) => (
          <div key={f.id} className="flex items-center justify-between gap-3 border-t border-slate-100 pt-2 text-sm">
            <span className="min-w-0 truncate">{f.name || 'Face ID'} <span className="text-xs text-slate-500">· second step · added {when(f.created)}</span></span>
            <button type="button" className="btn-secondary px-3 py-1.5 text-xs" disabled={busy || !verified} onClick={() => removeFactor(f)}>Remove</button>
          </div>
        ))}
        {faceIdSupported() && passkeys !== null && (
          <button type="button" className="btn-primary w-full" disabled={busy} onClick={verified || factors.length === 0 ? (factors.length === 0 ? onSetUp : addFaceId) : onVerify}>
            {busy ? 'Waiting for Face ID…' : hasFaceId ? '+ Add Face ID on this device' : 'Set up Face ID'}
          </button>
        )}
      </div>

      <div className="space-y-2 rounded-2xl border border-slate-200 p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold">🔢 Authenticator app <span className="ml-1 text-xs font-normal text-slate-500">(optional backup)</span></p>
          <span className={`text-xs font-bold ${appFactors.length ? 'text-emerald-700' : 'text-slate-500'}`}>{appFactors.length ? 'On' : 'Off'}</span>
        </div>
        <p className="text-xs text-slate-500">6-digit codes. Only asked for if Face ID isn’t available. Keep it as a backup in case you replace your phone, or remove it.</p>
        {appFactors.map((f) => (
          <div key={f.id} className="flex items-center justify-between gap-3 border-t border-slate-100 pt-2 text-sm">
            <span className="min-w-0 truncate">{f.name || 'Authenticator'} <span className="text-xs text-slate-500">· added {when(f.created)}</span></span>
            <button type="button" className="btn-danger px-3 py-1.5 text-xs" disabled={busy || !verified} onClick={() => removeFactor(f)}>Remove</button>
          </div>
        ))}
        {appFactors.length === 0 && <button type="button" className="btn-secondary w-full" disabled={!verified && factors.length > 0} onClick={onAddApp}>Add as backup</button>}
        {!verified && factors.length > 0 && <p className="text-xs text-amber-700">Verify first to change these. <button type="button" className="link" onClick={onVerify}>Verify now</button></p>}
      </div>
    </section>
  )
}
