/**
 * Password rules for new passwords (sign-up and reset), checked as the person types so they know
 * exactly what's missing. Keep these the same as Supabase → Authentication → Sign In / Providers →
 * Email → "Password requirements" (the server checks again).
 */
export const MIN_PASSWORD = 12
export const MAX_PASSWORD = 128

export interface PasswordRule {
  id: 'length' | 'lower' | 'upper' | 'digit' | 'symbol' | 'spaces'
  label: string
  ok: (pw: string) => boolean
}

export const PASSWORD_RULES: PasswordRule[] = [
  { id: 'length', label: `At least ${MIN_PASSWORD} characters`, ok: (pw) => pw.length >= MIN_PASSWORD && pw.length <= MAX_PASSWORD },
  { id: 'lower', label: 'A lowercase letter (a–z)', ok: (pw) => /[a-z]/.test(pw) },
  { id: 'upper', label: 'An uppercase letter (A–Z)', ok: (pw) => /[A-Z]/.test(pw) },
  { id: 'digit', label: 'A number (0–9)', ok: (pw) => /\d/.test(pw) },
  { id: 'symbol', label: 'A symbol, like ! ? # or -', ok: (pw) => /[^A-Za-z0-9\s]/.test(pw) },
  { id: 'spaces', label: 'No spaces at the start or end', ok: (pw) => pw.length === 0 || pw.trim() === pw },
]

export function checkPassword(pw: string) {
  const results = PASSWORD_RULES.map((r) => ({ ...r, met: r.ok(pw) }))
  return { results, ok: results.every((r) => r.met), missing: results.filter((r) => !r.met) }
}

/** One sentence naming what a password still needs (for the error message). */
export function missingSentence(pw: string): string {
  const { missing } = checkPassword(pw)
  if (missing.length === 0) return ''
  return `Your password still needs: ${missing.map((m) => m.label.charAt(0).toLowerCase() + m.label.slice(1)).join('; ')}.`
}

/** Friendly text for Supabase's password errors (weak_password, same_password, ...). */
export function passwordErrorText(err: { code?: string; message?: string; reasons?: string[] } | null | undefined): string | null {
  if (!err) return null
  const msg = err.message ?? ''
  if (err.code === 'same_password' || /different from the old/i.test(msg)) return 'Choose a password you haven’t used for this account before.'
  if (err.code === 'weak_password' || /password/i.test(msg) && /weak|characters|should contain|at least/i.test(msg)) {
    if ((err.reasons ?? []).includes('pwned') || /pwned|leaked|breach/i.test(msg)) {
      return 'That password has appeared in a data breach somewhere else. Please choose a different one.'
    }
    return `That password doesn’t meet the requirements. Use at least ${MIN_PASSWORD} characters with a lowercase and an uppercase letter, a number and a symbol.`
  }
  return null
}
