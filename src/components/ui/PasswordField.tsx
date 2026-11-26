import { useId, useState, type KeyboardEvent } from 'react'
import { checkPassword, MAX_PASSWORD } from '../../lib/password'

/**
 * Password box with Show/Hide and a Caps Lock warning. For a new password (`isNew`) it lists every
 * requirement and ticks each one off as it's met, and can ask for the password a second time.
 */
export function PasswordField({ id, label, value, onChange, isNew = false, confirm, onConfirmChange, autoComplete }: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  isNew?: boolean
  /** With isNew: the "type it again" value. Leave out to skip the second box. */
  confirm?: string
  onConfirmChange?: (v: string) => void
  autoComplete?: string
}) {
  const [shown, setShown] = useState(false)
  const [caps, setCaps] = useState(false)
  const [touched, setTouched] = useState(false)
  const rulesId = useId()
  const { results } = checkPassword(value)
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => setCaps(e.getModifierState?.('CapsLock') ?? false)
  const mismatch = isNew && confirm !== undefined && confirm.length > 0 && confirm !== value

  return (
    <div>
      <label className="label" htmlFor={id}>{label}</label>
      <div className="relative">
        <input id={id} name="password" className="input pr-16" type={shown ? 'text' : 'password'}
          autoComplete={autoComplete ?? (isNew ? 'new-password' : 'current-password')} maxLength={MAX_PASSWORD} required
          aria-describedby={isNew ? rulesId : undefined} value={value}
          onChange={(e) => { onChange(e.target.value); if (e.target.value) setTouched(true) }}
          onKeyDown={onKey} onKeyUp={onKey} />
        <button type="button" onClick={() => setShown((s) => !s)} aria-pressed={shown} aria-controls={id}
          className="absolute inset-y-0 right-2 my-auto h-8 rounded-lg px-2 text-xs font-bold text-indigo-700 hover:bg-indigo-50">
          {shown ? 'Hide' : 'Show'}
        </button>
      </div>
      {caps && <p className="mt-1 text-xs font-semibold text-amber-700">⇪ Caps Lock is on.</p>}
      {isNew && (
        <ul id={rulesId} className="mt-2 grid gap-0.5 text-xs" aria-label="Password requirements">
          {results.map((r) => (
            <li key={r.id} className={r.met ? 'text-emerald-700' : touched ? 'text-rose-700' : 'text-slate-500'}>
              <span aria-hidden="true" className="inline-block w-4">{r.met ? '✓' : touched ? '✗' : '○'}</span>
              {r.label}<span className="sr-only">{r.met ? ' (done)' : ' (still needed)'}</span>
            </li>
          ))}
        </ul>
      )}
      {isNew && confirm !== undefined && onConfirmChange && (
        <div className="mt-3">
          <label className="label" htmlFor={`${id}-again`}>Type the password again</label>
          <input id={`${id}-again`} className="input" type={shown ? 'text' : 'password'} autoComplete="new-password" maxLength={MAX_PASSWORD}
            aria-invalid={mismatch} value={confirm} onChange={(e) => onConfirmChange(e.target.value)} onKeyDown={onKey} onKeyUp={onKey} />
          {mismatch && <p className="mt-1 text-xs font-semibold text-rose-700">The two passwords don’t match yet.</p>}
        </div>
      )}
    </div>
  )
}
