import type { Session } from '@supabase/supabase-js'
import { useCallback, useEffect, useRef, useState } from 'react'
import Account from './components/Account'
import Auth, { NewPassword } from './components/Auth'
import LearnerPicker from './components/LearnerPicker'
import { MfaChallenge, MfaEnroll } from './components/Mfa'
import Practice, { type SaveStatus } from './components/Practice'
import { createLearner, dbMessage, listLearners, saveLearner } from './lib/learnersApi'
import { primeVoices } from './lib/speech'
import { isConfigured, supabase } from './lib/supabase'
import type { Learner, LearnerDraft } from './lib/types'

type View = 'picker' | 'account' | 'practice' | 'mfa-challenge' | 'mfa-enroll' | 'recovery'

/** Signed-in sessions end after this long without any taps, keys or words read (NIST 800-53 AC-11, AC-12). */
const IDLE_LIMIT_MS = 30 * 60 * 1000
const SAVE_DELAY_MS = 800

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [aal, setAal] = useState<{ verified: boolean; hasMfa: boolean }>({ verified: false, hasMfa: false })
  const [view, setView] = useState<View>('picker')
  const [learners, setLearners] = useState<Learner[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const [notice, setNotice] = useState('')

  const pending = useRef(new Map<string, Learner>())
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const lastActivity = useRef(0)

  // ---- auth ----------------------------------------------------------------------------------

  const checkAal = useCallback(async () => {
    const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    const next = { verified: data?.currentLevel === 'aal2', hasMfa: data?.nextLevel === 'aal2' }
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
    if (skipped.length) setNotice(`Skipped ${skipped.join(', ')}: a reader with that name already exists.`)
  }

  async function afterVerified() {
    await checkAal()
    setView('picker')
    await refresh()
  }

  async function exitPractice() {
    await flush()
    setActiveId(null)
    setView('picker')
  }

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
  if (view === 'recovery') return <NewPassword onDone={() => { setNotice('Password updated.'); void afterVerified() }} />
  if (view === 'mfa-challenge') {
    return <MfaChallenge onDone={afterVerified} onCancel={() => supabase.auth.signOut()} />
  }
  if (view === 'mfa-enroll') return <MfaEnroll onDone={afterVerified} onCancel={() => setView('picker')} />

  const active = learners.find((l) => l.id === activeId)
  if (view === 'practice' && active) {
    return <Practice learner={active} onChange={updateLearner} onExit={exitPractice} saveStatus={saveStatus} onActivity={touch} />
  }
  if (view === 'account') {
    return (
      <Account
        email={session.user.email ?? ''}
        learners={learners}
        verified={aal.verified}
        hasMfa={aal.hasMfa}
        onBack={() => setView('picker')}
        onEnrollMfa={() => setView('mfa-enroll')}
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
        onImport={importDrafts}
        onUnlockKids={() => setView(aal.hasMfa ? 'mfa-challenge' : 'mfa-enroll')}
        onAccount={() => setView('account')}
      />
    </>
  )
}
