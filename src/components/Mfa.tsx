import { useEffect, useRef, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'

// Two-step sign-in with an authenticator app (NIST 800-53 IA-2(1), IA-2(2)).

function CodeInput({ value, onChange, autoFocus = true }: { value: string; onChange: (v: string) => void; autoFocus?: boolean }) {
  return (
    <input
      className="input text-center font-mono text-2xl tracking-[0.4em]"
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern="[0-9]{6}"
      maxLength={6}
      required
      autoFocus={autoFocus}
      aria-label="6-digit code"
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
    />
  )
}

/** Asks for the authenticator code after the password, raising the session to aal2. */
export function MfaChallenge({ onDone, onCancel, cancelLabel = 'Sign out' }: { onDone: () => void; onCancel: () => void; cancelLabel?: string }) {
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const { data, error: listErr } = await supabase.auth.mfa.listFactors()
      if (listErr) throw listErr
      const factor = data.totp[0]
      if (!factor) throw new Error('No authenticator is set up on this account.')
      const { error: vErr } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code })
      if (vErr) throw new Error('That code didn’t work. Check the time on your phone and try the newest code.')
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t verify the code.')
      setCode('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6">
      <h1 className="font-kids text-2xl font-bold">Enter your code</h1>
      <p className="mt-1 text-sm text-slate-600">Open your authenticator app (for example Apple Passwords) and enter the 6-digit code for Read Aloud Stars.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <CodeInput value={code} onChange={setCode} />
        {error && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        <button className="btn-primary w-full" disabled={busy || code.length !== 6}>{busy ? 'Checking…' : 'Verify'}</button>
      </form>
      <button type="button" className="mt-6 text-sm text-slate-600 underline" onClick={onCancel}>{cancelLabel}</button>
    </div>
  )
}

/** Sets up an authenticator app: shows a QR code, then confirms one code. */
export function MfaEnroll({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [factor, setFactor] = useState<{ id: string; qr: string; secret: string } | null>(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    ;(async () => {
      try {
        // Remove any half-finished setup from an earlier attempt.
        const { data: list } = await supabase.auth.mfa.listFactors()
        for (const f of list?.all ?? []) {
          if (f.status === 'unverified') await supabase.auth.mfa.unenroll({ factorId: f.id })
        }
        const { data, error: enrollErr } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: `Read Aloud Stars ${new Date().toISOString().slice(0, 10)}` })
        if (enrollErr) throw enrollErr
        setFactor({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Couldn’t start setup.')
      }
    })()
  }, [])

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!factor) return
    setBusy(true)
    setError('')
    const { error: vErr } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code })
    setBusy(false)
    if (vErr) {
      setError('That code didn’t work. Enter the newest code shown in your app.')
      setCode('')
      return
    }
    onDone()
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-8">
      <h1 className="font-kids text-2xl font-bold">Set up two-step sign-in</h1>
      <p className="mt-1 text-sm text-slate-600">
        Kids’ profiles are protected by a second step. Scan this code with an authenticator app. On iPhone or Mac, Apple Passwords works:
        open the Camera and point it at the code, or in Passwords choose the account and tap <b>Set Up Verification Code</b>.
      </p>
      <div className="card mt-5 flex flex-col items-center gap-3">
        {factor ? (
          <>
            <img src={factor.qr} alt="QR code for your authenticator app" className="h-48 w-48 rounded-xl bg-white p-2" />
            <details className="w-full text-center text-xs text-slate-500">
              <summary className="cursor-pointer">Can’t scan? Enter this key instead</summary>
              <code className="mt-2 block break-all rounded-lg bg-slate-100 px-2 py-1.5 font-mono text-sm text-slate-800 select-all">{factor.secret}</code>
            </details>
          </>
        ) : (
          !error && <p className="py-16 text-sm text-slate-500">Preparing…</p>
        )}
      </div>
      <form onSubmit={submit} className="mt-5 space-y-3">
        <label className="label" htmlFor="enroll-code">Then enter the 6-digit code it shows</label>
        <CodeInput value={code} onChange={setCode} autoFocus={false} />
        {error && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        <button className="btn-primary w-full" disabled={busy || !factor || code.length !== 6}>{busy ? 'Checking…' : 'Turn on two-step sign-in'}</button>
      </form>
      <button type="button" className="mt-5 text-sm text-slate-600 underline" onClick={onCancel}>Not now</button>
    </div>
  )
}
