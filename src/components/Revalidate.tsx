import { useState } from 'react'
import { signInWithFaceId, wasCancelled, faceIdMessage, faceIdSupported } from '../lib/faceid'
import { supabase } from '../lib/supabase'
import { avatarFor } from '../lib/avatars'
import { levelOf } from '../lib/progress'
import { stageName } from '../lib/curriculum'
import type { Learner } from '../lib/types'

/**
 * Accounts with no activity for 90 days are archived automatically. To come back, the account
 * holder proves it's still them: an emailed sign-in link, Face ID, or their authenticator code.
 */
export function Revalidate({ email, hasMfa, onVerifyCode, onDone, onSignOut }: {
  email: string; hasMfa: boolean
  onVerifyCode: () => void
  onDone: () => Promise<void>
  onSignOut: () => void
}) {
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function emailLink() {
    setBusy(true); setError('')
    const { error: err } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: window.location.origin + import.meta.env.BASE_URL } })
    setBusy(false)
    if (err) setError('Couldn’t send the email. Try again in a minute.')
    else setSent(true)
  }

  async function faceId() {
    setBusy(true); setError('')
    const { error: err } = await signInWithFaceId()
    if (err) { setBusy(false); if (!wasCancelled(err)) setError(faceIdMessage(err, 'signin')); return }
    try { await onDone() } catch { setError('That didn’t finish. Try the email link instead.') } finally { setBusy(false) }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 py-10">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-3xl shadow-md">👋</div>
      <h1 className="font-kids text-2xl font-bold">Welcome back!</h1>
      <p className="mt-1 text-sm text-slate-600">
        This account had no activity for 90 days, so it was put away to keep the family’s information safe. Nothing was deleted.
        Confirm it’s you to open it again.
      </p>
      <div className="mt-5 space-y-2.5">
        {faceIdSupported() && <button type="button" className="btn-primary w-full" disabled={busy} onClick={faceId}>Confirm with Face ID</button>}
        {hasMfa && <button type="button" className="btn-secondary w-full" disabled={busy} onClick={onVerifyCode}>Enter my authenticator code</button>}
        <button type="button" className="btn-secondary w-full" disabled={busy || sent} onClick={emailLink}>{sent ? 'Email sent ✓' : `Email a sign-in link to ${email || 'me'}`}</button>
        {sent && <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">Open the email on this device and tap the link. You’ll come straight back here, ready to go.</p>}
      </div>
      {error && <p role="alert" className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      <button type="button" className="mt-6 text-sm text-slate-600 underline" onClick={onSignOut}>Sign out</button>
    </div>
  )
}

/** Home screen on a learner's own linked device: just them, Play, and unlink. */
export function DeviceHome({ learner, onPlay, onUnlink }: { learner: Learner; onPlay: () => void; onUnlink: () => Promise<void> }) {
  const [confirm, setConfirm] = useState(false)
  const level = levelOf(learner, learner.mode)
  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center px-6 py-10 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white text-6xl shadow-lg ring-4 ring-indigo-200">{avatarFor(learner)}</div>
      <h1 className="mt-4 font-kids text-3xl font-bold">Hi {learner.display_name}!</h1>
      <p className="mt-1 text-sm text-slate-600">Level {level} • {stageName(level, learner.mode)} • {learner.lifetime_stars.toLocaleString()} ⭐</p>
      <button type="button" className="mt-6 w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4 font-kids text-2xl font-bold text-white shadow-lg active:scale-95" onClick={onPlay}>▶ Play</button>
      <p className="mt-6 text-xs text-slate-500">This device is linked to {learner.display_name}. Your parent manages your profile.</p>
      {!confirm ? (
        <button type="button" className="mt-2 text-xs text-slate-500 underline" onClick={() => setConfirm(true)}>Unlink this device</button>
      ) : (
        <div className="mt-3 rounded-2xl bg-rose-50 p-3 text-sm text-rose-900">
          Unlink? You’ll need a new code from your parent to sign in here again. Your stars and stickers stay safe.
          <div className="mt-2 flex justify-center gap-2">
            <button type="button" className="btn-secondary px-3 py-1.5 text-sm" onClick={() => setConfirm(false)}>Cancel</button>
            <button type="button" className="btn-danger px-3 py-1.5 text-sm" onClick={() => void onUnlink()}>Unlink</button>
          </div>
        </div>
      )}
    </div>
  )
}
