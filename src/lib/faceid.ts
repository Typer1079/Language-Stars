/**
 * Face ID / Touch ID through Supabase Auth, two ways:
 *  1. A passkey to sign in (instead of typing email and password).
 *  2. A WebAuthn two-step factor, so the second step (needed for kids' profiles) is also Face ID
 *     instead of typing a 6-digit code.
 * The private keys never leave the device (Apple Passwords / iCloud Keychain); Supabase stores only
 * public keys. Requires Passkeys and WebAuthn MFA to be turned on in the Supabase dashboard.
 */
import { KEYS, local } from './storage'
import { supabase } from './supabase'

const USED_KEY = KEYS.faceIdOnDevice
const DISMISS_KEY = KEYS.faceIdOfferDismissed

export function faceIdSupported(): boolean {
  return typeof window !== 'undefined' && 'PublicKeyCredential' in window && Boolean(navigator.credentials)
}

function store(key: string, on: boolean) {
  if (on) local.set(key, '1')
  else local.remove(key)
}
function read(key: string): boolean {
  return local.get(key) === '1'
}
export const faceIdOnDevice = () => read(USED_KEY)
export const markFaceIdOnDevice = (on: boolean) => store(USED_KEY, on)
export const offerDismissed = () => read(DISMISS_KEY)
export const dismissOffer = () => store(DISMISS_KEY, true)

type AnyError = { code?: string; name?: string; message?: string; cause?: unknown } | null | undefined

/** The person closed the Face ID sheet: not worth an error message. */
export function wasCancelled(err: AnyError): boolean {
  if (!err) return false
  const name = (err.cause as { name?: string } | undefined)?.name ?? err.name
  return err.code === 'ERROR_CEREMONY_ABORTED' || name === 'NotAllowedError' || name === 'AbortError'
}

export function faceIdMessage(err: AnyError, during: 'signin' | 'setup' | 'verify'): string {
  const code = err?.code ?? ''
  const msg = err?.message ?? ''
  if (code === 'passkey_disabled') return 'Face ID sign-in isn’t turned on yet (Supabase → Authentication → Passkeys).'
  if (/webauthn.*(not enabled|disabled)|mfa_webauthn/i.test(code + ' ' + msg))
    return 'Face ID for the second step isn’t turned on yet (Supabase → Authentication → Multi-Factor → WebAuthn). The 6-digit code still works.'
  if (code === 'webauthn_credential_not_found')
    return 'That passkey isn’t for Language Stars. If Apple Passwords offers two, pick the one for Language Stars, or sign in with your password.'
  if (code === 'webauthn_credential_exists' || code === 'ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED') return 'This device already has Face ID set up for your account.'
  if (code === 'webauthn_challenge_expired') return 'That took a little too long. Please try again.'
  if (code === 'ERROR_INVALID_DOMAIN' || code === 'ERROR_INVALID_RP_ID')
    return 'Face ID settings in Supabase don’t match this site’s address (check the Relying Party ID and Origins).'
  if (during === 'signin') return 'Face ID sign-in didn’t work. You can sign in with your password instead.'
  if (during === 'verify') return 'Face ID didn’t work. You can enter the 6-digit code instead.'
  return `Couldn’t set up Face ID${msg ? `: ${msg}` : '.'}`
}

function deviceName(): string {
  const ua = navigator.userAgent
  return /iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) ? 'iPad' : /Mac/.test(ua) ? 'Mac' : /Android/.test(ua) ? 'Android' : 'This device'
}

export async function signInWithFaceId() {
  const { data, error } = await supabase.auth.signInWithPasskey()
  if (!error) markFaceIdOnDevice(true)
  return { data, error }
}

/** Face ID as the second step (WebAuthn factor). */
export async function verifyWithFaceId() {
  const { data } = await supabase.auth.mfa.listFactors()
  const factor = data?.webauthn?.[0]
  if (!factor) return { error: { code: 'no_webauthn_factor', message: 'No Face ID set up for the second step.' } }
  return supabase.auth.mfa.webauthn.authenticate({ factorId: factor.id, webauthn: {} })
}

export async function hasFaceIdFactor(): Promise<boolean> {
  const { data } = await supabase.auth.mfa.listFactors()
  return Boolean(data?.webauthn?.length)
}

/**
 * One-tap setup: a passkey for signing in, then a WebAuthn factor for the second step
 * (Face ID asks twice, once for each). Returns what worked.
 */
export async function setUpFaceId(): Promise<{ signIn: boolean; secondStep: boolean; error: AnyError }> {
  let signIn = false
  let secondStep = false
  const reg = await supabase.auth.registerPasskey()
  if (reg.error && !/exists|PREVIOUSLY_REGISTERED/.test(reg.error.code ?? '')) {
    return { signIn, secondStep, error: reg.error as AnyError }
  }
  signIn = true
  markFaceIdOnDevice(true)
  if (reg.data && !reg.data.friendly_name) await supabase.auth.passkey.update({ passkeyId: reg.data.id, friendlyName: `Language Stars – ${deviceName()}` })

  // Remove a half-finished WebAuthn factor from an earlier attempt, then add one for this device.
  const { data: list } = await supabase.auth.mfa.listFactors()
  for (const f of list?.all ?? []) if (f.factor_type === 'webauthn' && f.status === 'unverified') await supabase.auth.mfa.unenroll({ factorId: f.id })
  // Face ID as a separate second step needs WebAuthn MFA in Supabase, which not every project
  // offers. It's optional: signing in with the passkey already unlocks kids' profiles.
  const mfa = await supabase.auth.mfa.webauthn.register({ friendlyName: `Face ID – ${deviceName()}`, webauthn: {} })
  if (mfa.error) {
    if (wasCancelled(mfa.error as AnyError)) return { signIn, secondStep, error: mfa.error as AnyError }
    return { signIn, secondStep, error: null }
  }
  secondStep = true
  return { signIn, secondStep, error: null }
}

export interface PasskeyItem {
  id: string
  friendly_name?: string
  created_at: string
  last_used_at?: string
}

export async function listPasskeys(): Promise<PasskeyItem[] | null> {
  const { data, error } = await supabase.auth.passkey.list()
  return error ? null : ((data as PasskeyItem[] | null) ?? [])
}

export async function removePasskey(id: string) {
  const res = await supabase.auth.passkey.delete({ passkeyId: id })
  if (!res.error) markFaceIdOnDevice(false)
  return res
}
