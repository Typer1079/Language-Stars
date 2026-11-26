import type { Page, Route } from '@playwright/test'
import { TERMS_VERSION } from '../../src/lib/legal'

/**
 * A fake Supabase backend for browser tests: sign-in, learners, practice history and the RPCs the
 * screens call. Tests read and change `state` to set up a situation and check what was saved.
 * No real network, no real accounts.
 */
export const SUPABASE_URL = 'https://abcdefghij.supabase.co'
const USER_ID = '11111111-1111-1111-1111-111111111111'

export interface MockLearner {
  id: string
  display_name: string
  kind: 'child' | 'self'
  age_group: string
  sticker_style: string
  mode: 'reading' | 'spanish' | 'spelling'
  reading_level: number
  spanish_level: number
  spelling_level: number
  reading_best: number
  spanish_best: number
  spelling_best: number
  lifetime_stars: number
  spendable_stars: number
  mastered: Record<string, string[]>
  stickers: unknown[]
  avatar?: string | null
}

export interface MockState {
  learners: MockLearner[]
  rounds: Record<string, unknown>[]
  problems: Record<string, unknown>[]
  patches: number
  /** Level saves to learner_subjects (database update 015). Set `levelRowsTable: false` to act like an older database. */
  levelUpserts: number
  levelRowsTable: boolean
  admin: boolean
  rpcCalls: { name: string; body: unknown }[]
  terms: string
}

export function learner(over: Partial<MockLearner> & { id: string; display_name: string }): MockLearner {
  return {
    kind: 'self', age_group: '9+', sticker_style: 'any', mode: 'reading',
    reading_level: 1, spanish_level: 1, spelling_level: 1, reading_best: 1, spanish_best: 1, spelling_best: 1,
    lifetime_stars: 10, spendable_stars: 5, mastered: {}, stickers: [], ...over,
  }
}

const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url')
function jwt(methods: string[]) {
  const now = Math.floor(Date.now() / 1000)
  const amr = methods.map((method) => ({ method, timestamp: now }))
  const aal = methods.includes('totp') ? 'aal2' : 'aal1'
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: USER_ID, aal, amr, exp: now + 3600, iat: now, role: 'authenticated', email: 'parent@example.com', session_id: 's1' })}.sig`
}
const user = () => ({ id: USER_ID, aud: 'authenticated', role: 'authenticated', email: 'parent@example.com', email_confirmed_at: '2026-01-01T00:00:00Z', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z', factors: [] })
const session = (methods: string[]) => ({ access_token: jwt(methods), refresh_token: 'r', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, token_type: 'bearer', user: user() })

/** Strong sign-in (Face ID / passkey), as the database's is_strong_session() sees it. */
const strong = (route: Route) => {
  const tok = (route.request().headers()['authorization'] ?? '').split(' ').pop() ?? ''
  try {
    const c = JSON.parse(Buffer.from(tok.split('.')[1], 'base64url').toString()) as { aal?: string; amr?: { method: string }[] }
    return c.aal === 'aal2' || (c.amr ?? []).some((m) => ['passkey', 'webauthn'].includes(m.method))
  } catch {
    return false
  }
}

export async function mockSupabase(page: Page, init: Partial<MockState> = {}): Promise<MockState> {
  const state: MockState = { learners: [], rounds: [], problems: [], patches: 0, levelUpserts: 0, levelRowsTable: true, admin: false, rpcCalls: [], terms: TERMS_VERSION, ...init }
  await page.route(`${SUPABASE_URL}/**`, async (route) => {
    const req = route.request()
    const url = new URL(req.url())
    const path = url.pathname
    const method = req.method()
    const body = req.postData() ? JSON.parse(req.postData() as string) : null
    const json = (data: unknown, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data), headers: { 'access-control-allow-origin': '*' } })
    if (method === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } })

    if (path === '/auth/v1/token') return json(session(body?.email === 'admin@example.com' || state.admin ? ['passkey'] : ['password']))
    if (path === '/auth/v1/user') return json(user())
    if (path === '/auth/v1/logout') return route.fulfill({ status: 204 })
    if (path.startsWith('/auth/v1/')) return json({}, 404)

    if (path === '/rest/v1/learners') {
      const visible = (l: MockLearner) => l.kind === 'self' || strong(route)
      if (method === 'GET') {
        const embed = state.levelRowsTable && (url.searchParams.get('select') ?? '').includes('learner_subjects')
        if (!state.levelRowsTable && (url.searchParams.get('select') ?? '').includes('learner_subjects')) {
          return json({ code: 'PGRST200', message: "Could not find a relationship between 'learners' and 'learner_subjects' in the schema cache" }, 400)
        }
        return json(state.learners.filter(visible).map((l) => embed
          ? { ...l, learner_subjects: (['reading', 'spanish', 'spelling'] as const).map((s) => ({ subject: s, level: l[`${s}_level`], best: l[`${s}_best`] })) }
          : l))
      }
      if (method === 'PATCH') {
        const id = (url.searchParams.get('id') ?? '').replace('eq.', '')
        const l = state.learners.find((x) => x.id === id && visible(x))
        if (l) { Object.assign(l, body); state.patches += 1 }
        return route.fulfill({ status: 204 })
      }
      if (method === 'POST') {
        const row = { ...(Array.isArray(body) ? body[0] : body), id: `new-${state.learners.length}` }
        state.learners.push(row)
        return json(row, 201)
      }
    }
    if (path === '/rest/v1/learner_subjects') {
      if (!state.levelRowsTable) return json({ code: '42501', message: 'permission denied for table learner_subjects' }, 403)
      for (const r of (Array.isArray(body) ? body : [body]) as { learner_id: string; subject: 'reading' | 'spanish' | 'spelling'; level: number; best: number }[]) {
        const l = state.learners.find((x) => x.id === r.learner_id)
        if (!l) return json({ message: 'new row violates row-level security policy' }, 403)
        l[`${r.subject}_level`] = r.level
        l[`${r.subject}_best`] = Math.max(l[`${r.subject}_best`], r.best, r.level)
      }
      state.levelUpserts += 1
      return route.fulfill({ status: 201 })
    }
    if (path === '/rest/v1/practice_rounds') {
      if (method === 'POST') { state.rounds.push({ ...(Array.isArray(body) ? body[0] : body), created_at: new Date().toISOString() }); return route.fulfill({ status: 201 }) }
      const id = (url.searchParams.get('learner_id') ?? '').replace('eq.', '')
      return json(state.rounds.filter((r) => r.learner_id === id))
    }
    if (path === '/rest/v1/audit_log') return json([])

    const rpc = path.match(/^\/rest\/v1\/rpc\/(\w+)$/)?.[1]
    if (rpc) {
      state.rpcCalls.push({ name: rpc, body })
      switch (rpc) {
        case 'my_account_status': return json({ archived: false, terms_version: state.terms })
        case 'is_admin': return json(state.admin)
        case 'my_ranks': return json({})
        case 'leaderboard': return json({ metric: body?.metric, total: 0, me: null, top: [] })
        case 'list_devices': return json([])
        case 'delete_my_account': return json(null)
        case 'report_problem': {
          const r = body?.r ?? {}
          state.problems.unshift({ ...r, id: `p${state.problems.length + 1}`, created_at: new Date().toISOString(), resolved_at: null, learner: r.learner_id ? String(r.learner_id).slice(0, 6) : null, learner_kind: 'self', reporter: 'abc123', heard: r.heard ?? [] })
          return json(null)
        }
        case 'admin_problems': return json(state.problems.filter((p) => body?.include_resolved || !p.resolved_at))
        case 'admin_resolve_problems': {
          let n = 0
          for (const p of state.problems) if ((body?.ids ?? []).includes(p.id)) { p.resolved_at = body?.resolved === false ? null : new Date().toISOString(); n++ }
          return json(n)
        }
        case 'admin_users': return json([])
        case 'subjects_in_sync': return json({ rows: state.learners.length * 3, mismatched: 0 })
        case 'admin_kpis': {
          const day = (i: number) => new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)
          return json({
            generated_at: new Date().toISOString(), days: 7, accounts: 2, accounts_new: 1, learners: 3, learners_kids: 1, learners_reading: 2, learners_spanish: 1, learners_spelling: 0,
            active_accounts_1d: 1, active_accounts_7d: 2, active_accounts_30d: 2, active_learners_7d: 2,
            totals: { rounds: 4, items: 40, clean: 30, stars: 35, minutes: 20, questions: 0, questions_right: 0 },
            daily: [6, 5, 4, 3, 2, 1, 0].map((i) => ({ day: day(i), rounds: 1, items: 10, clean: 8, stars: 9, minutes: 5, learners: 1, accounts: 1 })),
            levels: [0, 1, 2].map((band) => ({ band, reading: 1, spanish: 0, spelling: 0 })),
          })
        }
        default: return json({}, 404)
      }
    }
    return json({}, 404)
  })
  return state
}

/** Replaces the browser's speech recognition with one the test controls: window.__say('red'). */
export const FAKE_SPEECH = `
window.__rec = null;
window.__aborts = 0;
window.__recs = 0;
class FakeRec { constructor(){ this.lang='en-US'; window.__rec=this; window.__recs++; this.running=false; this.results=[] }
  start(){ if(this.running) throw new DOMException('already started', 'InvalidStateError'); this.running=true; this.results=[]; setTimeout(()=>this.onstart&&this.onstart(),10) }
  stop(){ if(!this.running) return; this.running=false; setTimeout(()=>this.onend&&this.onend(),10) }
  abort(){ window.__aborts++; this.stop() } }
window.SpeechRecognition = FakeRec;
window.__say = (t) => { const r = window.__rec; if (!(r && r.running && r.onresult)) return false; const res = [{ transcript: t }]; res.isFinal = true; r.results.push(res); r.onresult({ resultIndex: r.results.length - 1, results: r.results }); return true };
`

export async function signIn(page: Page, email = 'parent@example.com') {
  await page.goto('./')
  await page.fill('#email', email)
  await page.fill('#password', 'correct horse battery')
  await page.click('form button:has-text("Sign in")')
}
