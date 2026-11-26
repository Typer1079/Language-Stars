// Language Stars: nightly inactivity notices (Supabase Edge Function, Deno).
//
// Each run:
//   1. asks the database who is due a reminder today (inactivity_notices_due, migration 016),
//   2. emails each of them through Resend,
//   3. records each email that went out (mark_inactivity_notice_sent),
//   4. pauses free accounts that reached 90 days (archive_inactive_accounts; paying accounts are skipped).
//
// Secrets (Supabase → Edge Functions → Secrets): RESEND_API_KEY, NOTICE_FROM (for example
// "Language Stars <hello@yourdomain.com>", a domain verified in Resend), APP_URL (the site address),
// CRON_SECRET (any long random text; the schedule sends it so nobody else can trigger emails).
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase automatically.
//
// Deploy:  supabase functions deploy inactivity-notices --no-verify-jwt
// Test without sending:  POST with header x-cron-secret and body {"dryRun": true}

type Due = { user_id: string; email: string; kind: 'free_60' | 'free_83' | 'paid_45'; days_inactive: number; pause_on: string | null }

const env = (k: string) => Deno.env.get(k) ?? ''
const SUPABASE_URL = env('SUPABASE_URL')
const SERVICE_KEY = env('SUPABASE_SERVICE_ROLE_KEY')
const APP_URL = env('APP_URL') || 'https://typer1079.github.io/Language-Stars/'

async function rpc<T>(name: string, args: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: { apikey: SERVICE_KEY, authorization: `Bearer ${SERVICE_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify(args),
  })
  if (!res.ok) throw new Error(`${name}: ${res.status} ${await res.text()}`)
  const text = await res.text()
  return (text ? JSON.parse(text) : null) as T
}

function niceDate(d: string | null) {
  if (!d) return ''
  return new Date(`${d}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

/** Subject and plain-text body for each kind of notice. */
export function message(n: Due): { subject: string; text: string } {
  const footer = `\n\nYou're getting this because you have a Language Stars account (${n.email}). Questions? Just reply to this email.\nLanguage Stars · ${APP_URL}`
  if (n.kind === 'paid_45') {
    return {
      subject: 'We miss you at Language Stars',
      text: `Hi! It's been ${n.days_inactive} days since anyone practiced on your Language Stars account.\n\nYour subscription is still active, and your learners' levels, stars and stickers are saved and waiting. A few minutes of reading aloud a day makes a real difference.\n\nPick up where you left off: ${APP_URL}\n\nIf you'd rather not keep the subscription, you can cancel it any time from your App Store or payment settings.${footer}`,
    }
  }
  const when = niceDate(n.pause_on)
  const soon = n.kind === 'free_83'
  return {
    subject: soon ? `Your Language Stars account will be paused on ${when}` : 'Still there? Your Language Stars account',
    text: `Hi! It's been ${n.days_inactive} days since anyone used your Language Stars account.\n\nTo keep it secure, accounts with no activity for 90 days are paused. ${soon ? 'Yours will be paused' : 'If nobody signs in, yours will be paused'} on ${when}. Nothing is deleted: all progress is kept, and you can reopen the account any time by confirming it's you (a sign-in link, Face ID or your authenticator code).\n\nTo keep it active, just sign in or practice once before ${when}: ${APP_URL}${footer}`,
  }
}

async function send(n: Due) {
  const { subject, text } = message(n)
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${env('RESEND_API_KEY')}`, 'content-type': 'application/json' },
    body: JSON.stringify({ from: env('NOTICE_FROM'), to: [n.email], subject, text }),
  })
  if (!res.ok) throw new Error(`email to ${n.email.replace(/(.).+@/, '$1…@')}: ${res.status} ${await res.text()}`)
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('POST only', { status: 405 })
  const secret = env('CRON_SECRET')
  if (!secret || req.headers.get('x-cron-secret') !== secret) return new Response('Forbidden', { status: 403 })
  const { dryRun = false } = await req.json().catch(() => ({})) as { dryRun?: boolean }

  const due = await rpc<Due[]>('inactivity_notices_due')
  let sent = 0
  const failures: string[] = []
  for (const n of due ?? []) {
    try {
      if (!dryRun) {
        await send(n)
        await rpc('mark_inactivity_notice_sent', { target: n.user_id, notice: n.kind })
      }
      sent += 1
    } catch (e) {
      failures.push(String(e instanceof Error ? e.message : e))
    }
  }
  const paused = dryRun ? 0 : await rpc<number>('archive_inactive_accounts')
  return Response.json({ dryRun, due: due?.length ?? 0, sent, failed: failures.length, failures: failures.slice(0, 10), paused })
})
