# Language Stars

A family learning web app (installable PWA) with three subjects, all practiced by reading aloud:
**Reading** (levels 1–100, from first words to doctorate-level vocabulary), **Spanish** (English →
Spanish speaking, starting with travel phrases) and **Spelling Bee** (hear a word, spell it out loud).
Stars, a sticker shop, ranks, progress graphs, and a parent-controlled account. React + TypeScript +
Vite, Supabase (database + sign-in), GitHub Pages.

Live site: `https://typer1079.github.io/Language-Stars/` · Public pages: `#/privacy`, `#/terms`, `#/support`

Current version: see `version` in `package.json` and [CHANGELOG.md](CHANGELOG.md).

## Glossary (use these words in screens, code and the database)
| Word | Meaning |
|---|---|
| **Account** | the adult who signs in (a parent, or an adult learner) |
| **Learner** | a profile under an account: a *child* (protected by Face ID / two-step) or *self* |
| **Subject** | Reading, Spanish or Spelling Bee (called `mode` in the code and database today) |
| **Level** | 1–100 within a subject |
| **Round** | a set of about 10 items; **Item** is one word, phrase or sentence |
| **Iris** | the coach voice that helps when a learner is stuck |
| **Admin** | the site owner (set in the database only, needs a Face ID / two-step sign-in) |

## Highlights
- Sign in with **Face ID** (passkey) or email + password. Children's profiles need a strong sign-in;
  the database refuses to show or change them otherwise.
- Progress (stars, levels, mastered items, stickers) saves automatically and follows the learner to
  any device. A parent can link a child's own device without an email or password.
- Speech recognition tuned for iPhone: sound-alike words, numbers, plurals, split long words,
  background noise. The microphone turns off whenever the app leaves the screen.
- Parents and learners see graphs and ranks (codenames only); the admin sees site-wide numbers,
  every account, and a **Problems** list (errors, stuck learners, mic trouble) to copy and analyze.
- **Account** screen: Face ID / two-step, appearance (light/dark), backup download, activity log,
  delete a learner, **delete my account**, sign out everywhere.

---

## How the security works

| Concern | What this app does |
|---|---|
| Who can see data | Postgres **row-level security**: each account can only read and change its own learners, enforced by the database. |
| Kids' profiles | Children's rows also require a **two-step (aal2) session**. A stolen password alone can't open them. |
| Keys in the browser | Only Supabase's *publishable/anon* key is in the app. It's designed to be public; row-level security protects the data. The `service_role` key is never used. |
| Data kept | First name / nickname, age group, sticker style, progress. No last names, birthdays, photos, email addresses of kids, or voice recordings. |
| Voice | Speech is recognized by the browser's own speech service (Google in Chrome, Apple in Safari). This app never records, stores or uploads audio. |
| Integrity | The database rejects bad values (limits on names, levels, star counts, sticker lists), lifetime stars can only go up, and a spendable balance can never exceed lifetime stars. |
| Audit trail | Every create/delete and every star, level or sticker change is logged by a database trigger with who, when and whether the session used two-step sign-in. Users can read their own log but nobody using the app can edit or delete it. |
| Idle sessions | Signed out automatically after 30 minutes without activity. |
| Cross-site scripting | Strict Content Security Policy (only this site's own scripts, styles and fonts; connections only to Supabase), React escaping, input cleaning on import. No CDNs. |
| Passwords | 12-character minimum; sign-in errors don't reveal which emails have accounts. |
| Dependencies | Dependabot weekly; every push runs `npm audit`, lint, tests and the type-checked build. |

The control-by-control mapping to NIST SP 800-53 Rev. 5 is in [`SECURITY.md`](SECURITY.md).

---

## Setup from scratch (about 30 minutes)

### 1. Tools (already installed for Contact Capture)
Node.js 22 LTS, Git, GitHub Desktop, VS Code.

### 2. Create a new Supabase project (separate from Contact Capture)
1. At https://supabase.com → **New project**. Name it `language-stars`, region *East US*, a strong
   database password saved in your password manager.
2. **SQL Editor → New query** → paste all of `supabase/migrations/001_learners.sql` → **Run**.
   You should see "Success. No rows returned."
3. **Project Settings → API** (or **Connect**): copy the **Project URL** and the **publishable / anon**
   key (NOT the `service_role` / secret key).
4. **Authentication → URL Configuration**
   - **Site URL**: `https://typer1079.github.io/Language-Stars/`
   - **Redirect URLs**: add that same URL and `http://localhost:5173/`
5. **Authentication → Sign In / Providers → Email**: **Confirm email** on. Set **Minimum password
   length** to 12 and require lowercase, uppercase, digits (and turn on **leaked password protection**
   if your plan offers it).
6. **Authentication → Multi-Factor**: make sure **TOTP (App Authenticator)** is enabled. For Face ID as
   the second step, also enable **WebAuthn**.
7. **Face ID sign-in: Authentication → Passkeys**: turn it on. Relying Party ID `typer1079.github.io`,
   origin `https://typer1079.github.io`. (Use the same values for WebAuthn MFA if it asks.) Contact
   Capture lives on the same address, so Apple Passwords may list a passkey for each app; each
   one only works in its own app.

### 3. Put it on GitHub (the `Language-Stars` repo)
1. Copy the project files into `Documents/GitHub/Language-Stars` (the update list says which).
2. GitHub → repo → **Settings → Secrets and variables → Actions → Variables tab → New repository
   variable**:
   - `VITE_SUPABASE_URL` = Project URL
   - `VITE_SUPABASE_ANON_KEY` = publishable/anon key
3. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
4. In GitHub Desktop: Commit to main → Push origin. The **Actions** tab shows "Test and deploy to
   GitHub Pages"; about 2 minutes later the site is live.
5. Recommended: **Settings → Code security** → Dependabot alerts, Dependabot security updates,
   Secret scanning + push protection. **Settings → Branches** → rule for `main` requiring the
   workflow to pass.

### 4. Create the accounts, then close sign-ups
1. On the live site: **Create account** with your email, confirm the email, sign in.
2. **+ Add learner** or **📂 Import backup** → choose your backup `.json` file (in
   `Documents/GitHub`, outside the repo) and import **Ethan** as *My child*. You'll be asked to set
   up two-step sign-in first: scan the QR code with Apple Passwords (or any authenticator app) and
   enter the code.
3. Olivia: on her device, **Create account** with her email, confirm, sign in, **Import backup** →
   the same file → import only **Olivia** (as *Me*).
4. Supabase → **Authentication → Sign In / Providers** → turn **off** "Allow new users to sign up".
   Add anyone later from **Authentication → Users → Invite** (they then use *Forgot password?* to
   set a password).
5. Delete the backup file once both are imported (it contains the kids' names).

### 5. Install on phones and tablets
- iPhone/iPad (Safari): Share → *Add to Home Screen*
- Android (Chrome): menu → *Install app*

Allow the microphone the first time. Speech recognition works in Chrome, Edge and Safari.

---

## Updating the app
1. **If the update includes a new `supabase/migrations/00X_….sql` file, run it first** (SQL Editor →
   New query → paste → Run).
2. Copy the updated files into `Documents/GitHub/Language-Stars`.
3. GitHub Desktop: check the Changes list (never `.env.local` or a save/backup `.json`), Commit to
   main, Push origin.
4. Wait about 2 minutes, then fully close and reopen the app.

## Run locally
```bash
cd ~/Documents/GitHub/Language-Stars
cp .env.example .env.local      # paste your URL and anon key
npm install
npm run dev                     # http://localhost:5173
```

| Command | What it does |
|---|---|
| `npm run dev` | local dev server |
| `npm test` | unit tests (word matching, progress, stickers, backup import) |
| `npm run lint` | lint |
| `npm run build` | type-check and production build to `dist/` |

## Project layout
```
src/
  main.tsx, Root.tsx      start-up; public pages (#/privacy, #/terms, #/support) vs. the app
  App.tsx                 sign-in flow, two-step check, terms, saving, idle sign-out, screens
  components/             screens: Auth, LearnerPicker, Practice, Progress, Ranks, Stickers,
                          Account, Admin (+ AdminUsers, AdminProblems), HelpGuide, Legal, PublicPage
  lib/
    practiceEngine.ts     listening + Iris turn logic
    speech.ts, mic.ts     speech recognition, voices, microphone
    match.ts, spelling.ts "did they say it?" (sound-alikes, numbers, slips), spelling letters
    curriculum.ts, readingAdvanced.ts, spellingWords.ts, wordBanks.ts   what's practiced at each level
    progress.ts, stats.ts, ranks.ts, stickers.ts                       stars, levels, graphs, ranks
    learnersApi.ts, problems.ts                                        database reads/writes
    storage.ts            every on-device setting (one key prefix: `language-stars.`)
    legal.ts              Terms, Privacy Policy, Support text and TERMS_VERSION
    validate.ts           cleans everything read from files (SI-10)
supabase/migrations/      numbered database updates; run each new one once, in order
.github/workflows/        audit + lint + test + build + deploy
```

## Database updates
Run each file once, in order, in Supabase → SQL Editor. All are safe to run again.

| # | What it adds |
|---|---|
| 001–004 | learners, row-level security, audit log, levels to 100, Face ID counts as two-step |
| 005 | practice history, admin role and dashboard |
| 006 | profile characters (avatars) |
| 007 | ranks and leaderboards (codenames) |
| 008 | Spelling Bee |
| 009 | account archive, Terms acceptance, admin user list |
| 010 | linked learner devices, 90-day inactivity archive |
| 011 | guard for linked (anonymous) device sign-ins |
| 012 | problem reports for the admin |
| 013 | delete my account |

## Versions
Bump `version` in `package.json` for each release (major.minor.patch) and add a line to
CHANGELOG.md. The app shows `version (build N · commit · date)` in Account and Help, and sends it
with problem reports. The build number is the GitHub Actions run number.

## Known limits
- GitHub Pages can't send HTTP security headers, so the Content Security Policy is a `<meta>` tag
  (no `frame-ancestors` clickjacking protection, no HSTS preload control). Cloudflare Pages or
  Cloudflare in front of the site adds them; same build, about 5 minutes to switch.
- Supabase's free plan doesn't offer session time-boxing or leaked-password checks; the app's
  30-minute idle sign-out covers the first.
- The AI Coach uses the browser's built-in voices. A higher-quality voice would need a small server
  function (Supabase Edge Function) holding a speech API key; never put such a key in this app.

## Progress graphs and the admin dashboard

Migration `005_activity_and_admin.sql` stores one row per finished round (counts and times only: no audio,
no answers) so learners and parents can see graphs (📈 Progress on the learner list, or ⋯ → My progress
while practicing). Kids' history follows the same two-step / Face ID rule as their profiles.

To make an account the super admin, run this in the SQL Editor (use the email you sign in with):

```sql
insert into public.app_admins (user_id)
select id from auth.users where lower(email) = lower('you@example.com')
on conflict do nothing;
```

Sign in with Face ID or your authenticator code and a **📊 Admin** button appears on the learner list.
The dashboard only receives site-wide totals (no names or emails), and each visit is written to the audit log.
To remove an admin: `delete from public.app_admins where user_id = '…';`

## World ranks

Migration `007_leaderboards.sql` adds worldwide rankings (🏆 World ranks on the progress page, and in the
admin dashboard): lifetime stars, stars this week, Reading and Spanish level, words said, meanings right,
minutes this week, days practiced, biggest sticker and sticker count. Names are never shared: everyone else
appears under a fixed made-up codename (like "Brave Otter 47"), and only your own row shows your name, on
your own device. The admin sees codenames too.

## Spelling Bee

Migration `008_spelling_bee.sql` adds the 🐝 Spelling path (Levels 1-100, from first words to Scripps
championship words). Iris acts as the pronouncer: she says the word, and the speller spells it out loud
letter by letter (letters appear as they're said). As National Spelling Bee rules allow, the speller can
ask to hear the word again, the definition, a sentence, the part of speech, and the language of origin.
A wrong spelling shows the right one; "The mic misheard me" retries the word, and "Type it instead" is a
backup when the microphone struggles. Spelling shows up in progress graphs, world ranks and the admin dashboard.
Run 005, 006 and 007 first.

## Accounts, Terms and archiving

Migration `009_accounts_and_terms.sql` adds:
- **Terms of Use and Privacy Policy** (`src/lib/legal.ts`): account holders must be 18+, confirm they are the parent or
  guardian of any child they add, and accept the current version (asked at sign-up and again whenever `TERMS_VERSION`
  changes). Each acceptance is stored with its version and time. Written for COPPA, Apple's minimum EULA terms and the
  App Store Kids Category rules (no ads, no third-party analytics). Have it reviewed by a lawyer before publishing to
  the App Store, and set `CONTACT_EMAIL` in `src/lib/legal.ts` to the address parents should use.
- **Admin user list** (📊 Admin → Users): every account's email, learners and last activity.
- **Sign out / Archive / Restore**: archive signs the account out everywhere, blocks sign-in and hides all its data
  (learners, history, rankings) without deleting anything; restore undoes it. Every action is audited with a reason.

## Learner devices and 90-day inactivity

Migration `010_devices_and_inactivity.sql`, plus one setting: **Authentication → Sign In / Providers → Allow
anonymous sign-ins: ON** (needed for learner devices).

- **Learner devices:** on ✏️ Edit for a learner, a parent (signed in with Face ID or an authenticator code) taps
  **Make a link code**. On the child's phone, open the site, tap **I'm a learner: link this device** and type the
  code (one use, 10 minutes). The child gives no email, phone or password. That device can only practice as that
  learner: no other learners, no profile changes, no parent screens. Parents see linked devices and can unlink them.
- **Inactivity:** an account with no sign-in or practice for 90 days is archived the next time it signs in. It can
  reopen itself by confirming with an emailed sign-in link, Face ID, or its authenticator code. Optional nightly job:
  enable `pg_cron` and run `select cron.schedule('archive-inactive', '20 4 * * *', $$select public.archive_inactive_accounts()$$);`

