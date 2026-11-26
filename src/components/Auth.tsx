import { useState, type FormEvent } from 'react'
import { faceIdMessage, faceIdOnDevice, faceIdSupported, signInWithFaceId, wasCancelled } from '../lib/faceid'
import { supabase } from '../lib/supabase'
import InstallApp from './InstallApp'
import { AgreementChecks, LegalLinks } from './Legal'
import { StartDeviceLink } from './Devices'
import { TERMS_VERSION } from '../lib/legal'
import { KEYS, local } from '../lib/storage'
import { Notice } from './ui/Notice'
import { PasswordField } from './ui/PasswordField'
import { checkPassword, missingSentence, passwordErrorText } from '../lib/password'

type Mode = 'signin' | 'signup' | 'reset'


export default function Auth() {
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ kind: 'error' | 'info'; text: string } | null>(null)
  const [agree, setAgree] = useState({ adult: false, guardian: false, agree: false })

  const redirectTo = window.location.origin + import.meta.env.BASE_URL
  const canFaceId = faceIdSupported()
  const faceIdFirst = canFaceId && faceIdOnDevice()

  async function faceIdSignIn() {
    setBusy(true)
    setMessage(null)
    const { error } = await signInWithFaceId()
    setBusy(false)
    // Success: the app moves on by itself (auth state change).
    if (error && !wasCancelled(error)) setMessage({ kind: 'error', text: faceIdMessage(error, 'signin') })
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMessage(null)
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        // One message for every failure so the form never reveals which emails have accounts.
        if (error) throw new Error('Email or password is incorrect, or the email isn’t confirmed yet.')
      } else if (mode === 'signup') {
        if (!agree.adult || !agree.agree) throw new Error('To create an account, confirm you are 18 or older and agree to the Terms of Use and Privacy Policy.')
        if (!checkPassword(password).ok) throw new Error(missingSentence(password))
        if (password !== password2) throw new Error('The two passwords don’t match. Type the same password in both boxes.')
        const { error } = await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: redirectTo } })
        const pwText = passwordErrorText(error)
        if (pwText) throw new Error(pwText)
        if (error) throw new Error('Couldn’t create the account. New sign-ups may be turned off; ask the family admin for an invite.')
        // Recorded in the database at first sign-in (there's no session until the email is confirmed).
        local.setJson(KEYS.pendingTerms, { email: email.trim().toLowerCase(), version: TERMS_VERSION, adult: agree.adult, guardian: agree.guardian })
        setMessage({ kind: 'info', text: 'Check your email for a confirmation link, then sign in.' })
        setMode('signin')
      } else {
        await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo })
        setMessage({ kind: 'info', text: 'If that email has an account, a reset link is on its way.' })
      }
    } catch (err) {
      setMessage({ kind: 'error', text: err instanceof Error ? err.message : 'Something went wrong.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 py-10">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-3xl shadow-md">⭐</div>
      <h1 className="font-kids text-3xl font-bold">Language Stars</h1>
      <p className="mt-1 text-sm text-slate-600">
        {mode === 'signin' ? 'Sign in to practice reading, Spanish and spelling.' : mode === 'signup' ? 'Create your account.' : 'Reset your password.'}
      </p>

      {mode === 'signin' && canFaceId && (
        <>
          <button type="button" className={`${faceIdFirst ? 'btn-primary' : 'btn-secondary'} mt-6 w-full`} disabled={busy} onClick={faceIdSignIn}>
            Sign in with Face ID
          </button>
          <div className="mt-6 flex items-center gap-3 text-xs text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            or use your password
            <span className="h-px flex-1 bg-slate-200" />
          </div>
        </>
      )}

      <form onSubmit={submit} method="post" action="#" className="mt-6 space-y-4">
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" name="email" className="input" type="email" autoComplete="username" autoCapitalize="none"
            spellCheck={false} required maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        {mode !== 'reset' && (
          <div>
            <PasswordField id="password" label="Password" value={password} onChange={setPassword} isNew={mode === 'signup'}
              {...(mode === 'signup' ? { confirm: password2, onConfirmChange: setPassword2 } : {})} />
            {mode === 'signup' && <p className="mt-1 text-xs text-slate-500">Tip: three or four words with a number and a symbol are easy to remember (for example Blue-Kite-Tacos-7).</p>}
          </div>
        )}
        {mode === 'signup' && <AgreementChecks {...agree} onChange={setAgree} />}
        {message && (
          <Notice tone={message.kind === 'error' ? 'error' : 'success'}>
            {message.text}
          </Notice>
        )}
        <button className={`${mode === 'signin' && faceIdFirst ? 'btn-secondary' : 'btn-primary'} w-full`} disabled={busy}>
          {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
        </button>
      </form>

      <div className="mt-6 flex justify-between text-sm">
        {mode === 'signin' ? (
          <>
            <button type="button" className="link" onClick={() => setMode('signup')}>Create account</button>
            <button type="button" className="link" onClick={() => setMode('reset')}>Forgot password?</button>
          </>
        ) : (
          <button type="button" className="link" onClick={() => setMode('signin')}>Back to sign in</button>
        )}
      </div>

      {mode === 'signin' && <StartDeviceLink />}
      {mode === 'signin' && <InstallApp />}

      {/* System use notification (NIST 800-53 AC-8). */}
      <p className="mt-10 text-center text-[11px] leading-relaxed text-slate-500">
        Private family app for authorized users only. Activity on learner profiles is logged.
        <br /><LegalLinks />
      </p>
    </div>
  )
}

/** Shown after following a password-reset link. */
export function NewPassword({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!checkPassword(password).ok) return setError(missingSentence(password))
    if (password !== password2) return setError('The two passwords don’t match. Type the same password in both boxes.')
    setBusy(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (err) return setError(passwordErrorText(err) ?? (/reauthentication|aal2|mfa/i.test(err.message) ? 'Verify your authenticator code first, then set the new password.' : 'Couldn’t update the password. Try the reset link again.'))
    onDone()
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6">
      <h1 className="font-kids text-2xl font-bold">Set a new password</h1>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <PasswordField id="new-password" label="New password" value={password} onChange={setPassword} isNew confirm={password2} onConfirmChange={setPassword2} />
        </div>
        {error && <Notice tone="error">{error}</Notice>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Saving…' : 'Save password'}</button>
      </form>
    </div>
  )
}
