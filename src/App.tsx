import type { Session } from '@supabase/supabase-js'
import { useCallback, useEffect, useRef, useState } from 'react'
import Account from './components/Account'
import Admin from './components/Admin'
import Auth, { NewPassword } from './components/Auth'
import LearnerPicker from './components/LearnerPicker'
import { MfaChallenge, MfaEnroll } from './components/Mfa'
import Practice, { type SaveStatus } from './components/Practice'
import { acceptTerms, checkIsAdmin, createLearner, dbMessage, listLearners, myAccountStatus, saveLearner } from './lib/learnersApi'
import { AcceptTerms } from './components/Legal'
import { TERMS_VERSION } from './lib/legal'
import { primeVoices } from './lib/speech'
import { isConfigured, supabase } from './lib/supabase'
import type { Learner, LearnerDraft } from './lib/types'

type View = 'picker' | 'account' | 'practice' | 'mfa-challenge' | 'mfa-enroll' | 'recovery' | 'admin'

/** Signed-in sessions end after this long without any taps, keys or words read (NIST 800-53 AC-11, AC-12). */
const FACE_ID_METHODS = ['passkey', 'webauthn', 'mfa/webauthn']

const IDLE_LIMIT_MS = 30 * 60 * 1000
const SAVE_DELAY_MS = 800

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [aal, setAal] = useState<{ verified: boolean; hasMfa: boolean; methods: string[] }>({ verified: false, hasMfa: false, methods: [] })
  const [enrollMode, setEnrollMode] = useState<'choose' | 'totp'>('choose')
  const [view, setView] = useState<View>('picker')
  const [learners, setLearners] = useState<Learner[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const [notice, setNotice] = useState('')
  // Readers chosen before two-step sign-in was set up; added as soon as it succeeds.
  const [pendingAdd, setPendingAdd] = useState<LearnerDraft[] | null>(null)
  // Super admin (set only in the database, and only with a two-step / Face ID session).
  const [isAdmin, setIsAdmin] = useState(false)
  // Has this account accepted the current Terms? (null = still checking)
  const [termsOk, setTermsOk] = useState<boolean | null>(null)

  const pending = useRef(new Map<string, Learner>())
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const lastActivity = useRef(0)

  // ---- auth ----------------------------------------------------------------------------------

  const checkAal = useCallback(async () => {
    const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    const methods = (data?.currentAuthenticationMethods ?? []).map((m) => (typeof m === 'string' ? m : m.method))
    // Signing in with Face ID (a passkey) is already two-step: the device plus your face.
    // The database accepts it the same way (supabase/migrations/004_face_id_counts_as_two_step.sql).
    const faceId = methods.some((m) => FACE_ID_METHODS.includes(m))
    const next = { verified: data?.currentLevel === 'aal2' || faceId, hasMfa: data?.nextLevel === 'aal2', methods }
    setAal(next)
    return next
  }, [])

  useEffect(() => {
    primeVoices()
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setAuthLoading(false)
    })
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s)
      if (event === 'PASSWORD_RECOVERY') setView('recovery')
      if (!s) {
        // Never leave one account's data on screen after sign-out.
        pending.current.clear()
        setLearners([])
        setActiveId(null)
        setIsAdmin(false)
        setView('picker')
      }
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      setLearners(await listLearners())
    } catch (err) {
      setLoadError(dbMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  // After sign-in: accounts with two-step sign-in must enter their code before anything loads.
  useEffect(() => {
    if (!session) return
    let cancelled = false
    // Asks the auth server for this session's MFA level (an external system), then routes.
    // eslint-disable-next-line react/set-state-in-effect
    checkAal().then((a) => {
      if (cancelled) return
      if (a.hasMfa && !a.verified) setView((v) => (v === 'recovery' ? v : 'mfa-challenge'))
      else refresh()
    })
    return () => {
      cancelled = true
    }
  }, [session, checkAal, refresh])

  // Archived accounts are signed out; everyone else must have accepted the current Terms of Use.
  const statusUser = session?.user.id
  const statusEmail = session?.user.email?.toLowerCase()
  useEffect(() => {
    if (!statusUser) return
    let live = true
    // eslint-disable-next-line react/set-state-in-effect
    setTermsOk(null)
    void (async () => {
      const st = await myAccountStatus()
      if (!live) return
      if (!st) return setTermsOk(true) // database update 009 not run yet: nothing to check
      if (st.archived) {
        setNotice('This account has been archived. Contact the administrator if you think this is a mistake.')
        await supabase.auth.signOut()
        return
      }
      if (st.terms_version === TERMS_VERSION) return setTermsOk(true)
      // Agreed while creating the account (before the email was confirmed): record it now.
      try {
        const pendingTerms = JSON.parse(localStorage.getItem('ras.pendingTerms') ?? 'null') as { email: string; version: string; adult: boolean; guardian: boolean } | null
        if (pendingTerms && pendingTerms.email === statusEmail && pendingTerms.version === TERMS_VERSION && pendingTerms.adult) {
          await acceptTerms(TERMS_VERSION, true, pendingTerms.guardian)
          localStorage.removeItem('ras.pendingTerms')
          if (live) setTermsOk(true)
          return
        }
      } catch { /* fall through to asking */ }
      if (live) setTermsOk(false)
    })()
    return () => { live = false }
  }, [statusUser, statusEmail])

  // ---- saving --------------------------------------------------------------------------------

  // Lets a failed save retry itself later without flush referring to its own declaration.
  const flushRef = useRef<() => Promise<void>>(async () => {})

  const flush = useCallback(async () => {
    clearTimeout(saveTimer.current)
    if (pending.current.size === 0) return
    setSaveStatus('saving')
    for (const [id, l] of [...pending.current]) {
      try {
        await saveLearner(l)
        if (pending.current.get(id) === l) pending.current.delete(id)
      } catch (err) {
        const msg = dbMessage(err)
        if (/newer/i.test(msg)) {
          // Another device saved more progress; take the database copy.
          pending.current.delete(id)
          setNotice(`${l.display_name} has newer progress from another device, so it was reloaded.`)
          await refresh()
          setSaveStatus('saved')
          continue
        }
        setSaveStatus(/connection/i.test(msg) ? 'offline' : 'error')
        saveTimer.current = setTimeout(() => void flushRef.current(), 5000)
        return
      }
    }
    setSaveStatus(pending.current.size ? 'saving' : 'saved')
  }, [refresh])

  useEffect(() => {
    flushRef.current = flush
  }, [flush])

  const updateLearner = useCallback((l: Learner) => {
    setLearners((ls) => ls.map((x) => (x.id === l.id ? l : x)))
    pending.current.set(l.id, l)
    setSaveStatus('saving')
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => void flush(), SAVE_DELAY_MS)
  }, [flush])

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') void flush()
    }
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('pagehide', onHide)
    return () => {
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('pagehide', onHide)
    }
  }, [flush])

  // ---- idle sign-out -------------------------------------------------------------------------

  const touch = useCallback(() => {
    lastActivity.current = Date.now()
  }, [])

  useEffect(() => {
    if (!session) return
    lastActivity.current = Date.now()
    const opts = { passive: true } as const
    window.addEventListener('pointerdown', touch, opts)
    window.addEventListener('keydown', touch, opts)
    const id = setInterval(async () => {
      if (Date.now() - lastActivity.current < IDLE_LIMIT_MS) return
      await flush()
      await supabase.auth.signOut()
      setNotice('Signed out after 30 minutes without activity.')
    }, 30_000)
    return () => {
      clearInterval(id)
      window.removeEventListener('pointerdown', touch)
      window.removeEventListener('keydown', touch)
    }
  }, [session, flush, touch])

  // ---- actions -------------------------------------------------------------------------------

  async function create(d: LearnerDraft) {
    try {
      const l = await createLearner(d)
      setLearners((ls) => [...ls, l])
    } catch (err) {
      throw new Error(dbMessage(err))
    }
  }

  /** Profile edits (name, practice type, age group, stickers style) save right away. */
  async function updateProfile(l: Learner) {
    try {
      pending.current.delete(l.id)
      await saveLearner(l)
      setLearners((ls) => ls.map((x) => (x.id === l.id ? l : x)))
    } catch (err) {
      throw new Error(dbMessage(err))
    }
  }

  async function importDrafts(ds: LearnerDraft[]) {
    const existing = new Set(learners.map((l) => l.display_name.toLowerCase()))
    const skipped: string[] = []
    for (const d of ds) {
      if (existing.has(d.display_name.toLowerCase())) {
        skipped.push(d.display_name)
        continue
      }
      await create(d)
    }
    if (skipped.length) setNotice(`Skipped ${skipped.join(', ')}: a learner with that name already exists.`)
  }

  async function afterVerified() {
    await checkAal()
    setView('picker')
    await refresh()
    if (pendingAdd?.length) {
      const list = pendingAdd
      setPendingAdd(null)
      try {
        await importDrafts(list)
        // Reload so the list can't be overwritten by a refresh that started before the adds.
        await refresh()
        setNotice(`Added ${list.map((d) => d.display_name).join(', ')}.`)
      } catch (err) {
        setNotice(err instanceof Error ? err.message : 'Couldn’t add the learner.')
      }
    }
  }

  async function exitPractice() {
    await flush()
    setActiveId(null)
    setView('picker')
  }

  // The database decides who is an admin; re-check whenever the sign-in strength changes.
  const userId = session?.user.id
  useEffect(() => {
    let live = true
    if (!userId || !aal.verified) {
      // eslint-disable-next-line react/set-state-in-effect
      setIsAdmin(false)
      return
    }
    void checkIsAdmin().then((v) => { if (live) setIsAdmin(v) })
    return () => { live = false }
  }, [userId, aal.verified])

  // ---- screens -------------------------------------------------------------------------------

  if (!isConfigured) {
    return (
      <div className="card mx-auto mt-16 max-w-md space-y-2">
        <h1 className="font-kids text-xl font-bold">Almost ready</h1>
        <p className="text-sm text-slate-600">This copy of the app isn’t connected to its database yet. Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> (see README, step 4).</p>
      </div>
    )
  }
  if (authLoading) return <p className="p-10 text-center text-sm text-slate-500">Loading…</p>
  if (!session) {
    return (
      <>
        {notice && <p role="status" className="mx-auto mt-4 max-w-sm rounded-xl bg-indigo-50 px-3 py-2 text-center text-sm text-indigo-900">{notice}</p>}
        <Auth />
      </>
    )
  }
  if (termsOk === false) {
    return <AcceptTerms onDecline={() => void supabase.auth.signOut()} onAccept={async (adult, guardian) => { await acceptTerms(TERMS_VERSION, adult, guardian); setTermsOk(true) }} />
  }
  if (view === 'recovery') return <NewPassword onDone={() => { setNotice('Password updated.'); void afterVerified() }} />
  if (view === 'mfa-challenge') {
    return <MfaChallenge onDone={afterVerified} onCancel={() => supabase.auth.signOut()} />
  }
  if (view === 'mfa-enroll') return <MfaEnroll mode={enrollMode} onDone={afterVerified} onCancel={() => { setPendingAdd(null); setView('picker') }} />

  const active = learners.find((l) => l.id === activeId)
  if (view === 'practice' && active) {
    return <Practice learner={active} onChange={updateLearner} onExit={exitPractice} saveStatus={saveStatus} onActivity={touch} />
  }
  if (view === 'admin' && isAdmin) return <Admin onBack={() => setView('picker')} />
  if (view === 'account') {
    return (
      <Account
        email={session.user.email ?? ''}
        learners={learners}
        verified={aal.verified}
        hasMfa={aal.hasMfa}
        onBack={() => setView('picker')}
        signedInWith={aal.methods}
        onEnrollMfa={(mode) => { setEnrollMode(mode); setView('mfa-enroll') }}
        onVerify={() => setView('mfa-challenge')}
        onChanged={() => { void checkAal(); void refresh() }}
      />
    )
  }
  return (
    <>
      {notice && (
        <button type="button" onClick={() => setNotice('')} className="mx-auto mt-4 block max-w-lg rounded-xl bg-indigo-50 px-3 py-2 text-center text-sm text-indigo-900">
          {notice} <span className="text-indigo-500">✕</span>
        </button>
      )}
      <LearnerPicker
        learners={learners}
        loading={loading}
        error={loadError}
        verified={aal.verified}
        hasMfa={aal.hasMfa}
        onPick={(l) => { setActiveId(l.id); setView('practice') }}
        onCreate={create}
        onUpdate={updateProfile}
        onImport={importDrafts}
        onUnlockKids={(pending) => { setPendingAdd(pending?.length ? pending : null); setEnrollMode('choose'); setView(aal.hasMfa ? 'mfa-challenge' : 'mfa-enroll') }}
        onAccount={() => setView('account')}
        onAdmin={isAdmin ? () => setView('admin') : undefined}
      />
    </>
  )
}
