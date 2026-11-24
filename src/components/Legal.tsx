import { useEffect, useState } from 'react'
import { PRIVACY, TERMS, TERMS_VERSION, type LegalDoc } from '../lib/legal'

/** Full text of the Terms of Use or Privacy Policy. */
export function LegalModal({ doc, onClose }: { doc: 'terms' | 'privacy'; onClose: () => void }) {
  const d: LegalDoc = doc === 'terms' ? TERMS : PRIVACY
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-slate-900/50 p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="legal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <article className="mx-auto w-full max-w-2xl rounded-3xl bg-white p-5 shadow-2xl sm:p-7">
        <div className="mb-2 flex items-start justify-between gap-3">
          <h2 id="legal-title" className="font-kids text-2xl font-bold">{d.title}</h2>
          <button type="button" className="btn-secondary shrink-0 px-3 py-1.5 text-sm" onClick={onClose}>Close</button>
        </div>
        <p className="text-xs text-slate-500">Last updated {d.updated}</p>
        <p className="mt-3 text-sm leading-relaxed text-slate-700">{d.intro}</p>
        {d.sections.map((s) => (
          <section key={s.heading} className="mt-4">
            <h3 className="font-bold text-slate-900">{s.heading}</h3>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm leading-relaxed text-slate-700">
              {s.body.map((b) => <li key={b}>{b}</li>)}
            </ul>
          </section>
        ))}
      </article>
    </div>
  )
}

/** "Terms · Privacy" links that open the full text. */
export function LegalLinks({ className = '' }: { className?: string }) {
  const [open, setOpen] = useState<'terms' | 'privacy' | null>(null)
  return (
    <span className={className}>
      <button type="button" className="underline" onClick={() => setOpen('terms')}>Terms of Use</button>
      {' · '}
      <button type="button" className="underline" onClick={() => setOpen('privacy')}>Privacy Policy</button>
      {open && <LegalModal doc={open} onClose={() => setOpen(null)} />}
    </span>
  )
}

/** The account holder confirms they're an adult (and a parent/guardian for any child) and accepts the current Terms. */
export function AgreementChecks({ adult, guardian, agree, onChange }: {
  adult: boolean; guardian: boolean; agree: boolean
  onChange: (v: { adult: boolean; guardian: boolean; agree: boolean }) => void
}) {
  const box = 'mt-0.5 h-5 w-5 shrink-0 accent-indigo-600'
  return (
    <div className="space-y-2.5 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
      <label className="flex gap-2.5">
        <input type="checkbox" className={box} checked={adult} onChange={(e) => onChange({ adult: e.target.checked, guardian, agree })} />
        <span>I am <b>18 or older</b>.</span>
      </label>
      <label className="flex gap-2.5">
        <input type="checkbox" className={box} checked={guardian} onChange={(e) => onChange({ adult, guardian: e.target.checked, agree })} />
        <span>I am the <b>parent or legal guardian</b> of any child I add, and I consent to collecting their first name and learning progress as described in the Privacy Policy. <span className="text-slate-500">(Leave unchecked if the account is only for you.)</span></span>
      </label>
      <label className="flex gap-2.5">
        <input type="checkbox" className={box} checked={agree} onChange={(e) => onChange({ adult, guardian, agree: e.target.checked })} />
        <span>I have read and agree to the <LegalLinks className="font-semibold text-indigo-700" />.</span>
      </label>
    </div>
  )
}

/** Shown after sign-in when this account hasn't accepted the current Terms yet. */
export function AcceptTerms({ onAccept, onDecline }: { onAccept: (adult: boolean, guardian: boolean) => Promise<void>; onDecline: () => void }) {
  const [v, setV] = useState({ adult: false, guardian: false, agree: false })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-10">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-3xl shadow-md">📜</div>
      <h1 className="font-kids text-2xl font-bold">Before you continue</h1>
      <p className="mt-1 text-sm text-slate-600">Please review and accept our Terms of Use and Privacy Policy (version {TERMS_VERSION}). They explain how Language Stars protects children’s information: no ads, no tracking, and names are never shown to other families.</p>
      <div className="mt-5"><AgreementChecks {...v} onChange={setV} /></div>
      {error && <p role="alert" className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      <button type="button" className="btn-primary mt-5 w-full" disabled={busy || !v.adult || !v.agree}
        onClick={async () => {
          setBusy(true); setError('')
          try { await onAccept(v.adult, v.guardian) } catch (e) { setError(e instanceof Error ? e.message : 'Couldn’t save. Try again.') } finally { setBusy(false) }
        }}>
        {busy ? 'Saving…' : 'I agree, continue'}
      </button>
      <button type="button" className="mt-3 text-sm text-slate-600 underline" onClick={onDecline}>I don’t agree (sign out)</button>
    </div>
  )
}
