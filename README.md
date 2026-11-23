# Read Aloud Stars

A family web app (installable PWA) for **kids' reading practice** (Levels 1–5, phonics tiles) and
**English → Spanish speaking practice** (Levels ES1–ES6), with stars, a sticker shop and a sticker
canvas. Same stack as Contact Capture: React + TypeScript + Vite, Supabase (database + sign-in),
GitHub Pages.

Live site: `https://typer1079.github.io/Language-Stars/`

**What's in this version (v1.0)**
- Sign in with email + password (Supabase Auth). New accounts need a confirmed email.
- **Two-step sign-in** (authenticator app, e.g. Apple Passwords) is required for any account with
  kids' profiles. The database itself refuses to show or change a child's profile unless the
  session passed the second step.
- **Readers** under each account: a parent adds their kids; an adult (e.g. Olivia) has her own
  account with her own Spanish-practice profile. Only a first name or nickname and an age group are
  stored.
- Progress (stars, levels, mastered words, stickers and their positions) saves to the database
  automatically and follows the reader to any device.
- **100 levels in each mode**, growing from single words (Levels 1–15) to phrases and then full
  sentences. A reader moves up by mastering every item in their level (bonus `level × 5` stars the
  first time they reach a new level) and moves down one level after a rough round (fewer than 4 of
  10 said without help). Stars are never taken away.
- Reading mode: letter tiles with phonics hints for words, word tiles for phrases and sentences,
  speech recognition with sound-alike tolerance, AI Coach (sound it out / read it together).
- Spanish mode: English prompt, Spanish answer hidden until **Shift** (or the coach); listens until
  the phrase is said correctly or **Skip** is pressed; the coach speaks only when asked.
- Sticker shop: packs by age group and style, drag stickers anywhere, grow (+1⭐, +2⭐, +3⭐ …),
  sell back for everything spent.
- Keyboard: **Return/Enter** = listen, **Space** = AI Coach, **Shift** = reveal Spanish word.
- **Account** screen: two-step sign-in on/off, download a backup file, activity log (star, level and
  sticker changes), delete a reader, sign out everywhere.
- Import a backup from the old single-page app (its ⬇️ Save file) or from this app.

---

## How the security works

| Concern | What this app does |
|---|---|
| Who can see data | Postgres **row-level security**: each account can only read and change its own readers, enforced by the database. |
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
1. At https://supabase.com → **New project**. Name it `read-aloud-stars`, region *East US*, a strong
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
6. **Authentication → Multi-Factor**: make sure **TOTP (App Authenticator)** is enabled.

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
2. **+ Add reader** or **📂 Import backup** → choose `read-aloud-stars-import.json` (in
   `Documents/GitHub`, outside the repo) and import **Ethan** as *My child*. You'll be asked to set
   up two-step sign-in first: scan the QR code with Apple Passwords (or any authenticator app) and
   enter the code.
3. Olivia: on her device, **Create account** with her email, confirm, sign in, **Import backup** →
   the same file → import only **Olivia** (as *Me*).
4. Supabase → **Authentication → Sign In / Providers** → turn **off** "Allow new users to sign up".
   Add anyone later from **Authentication → Users → Invite** (they then use *Forgot password?* to
   set a password).
5. Delete `read-aloud-stars-import.json` once both are imported (it contains the kids' names).

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
  App.tsx                 sign-in flow, two-step check, saving, idle sign-out, screens
  components/
    Auth.tsx              sign in / create account / reset / new password
    Mfa.tsx               authenticator setup (QR) and code check
    LearnerPicker.tsx     "Who's reading?", add reader, import backup
    Practice.tsx          the reading / Spanish practice screen
    Stickers.tsx          sticker canvas (drag), shop (buy/grow/sell), confetti
    Account.tsx           two-step settings, backup, activity log, delete reader, sign out
  lib/
    practiceEngine.ts     listening + AI Coach turn logic
    speech.ts             browser speech recognition and voices
    match.ts              "did they say the word?" (sound-alikes, accents, small slips)
    progress.ts           stars, mastery, level-ups, rounds
    stickers.ts           costs, refunds, packs
    validate.ts           cleans everything read from files (SI-10)
    learnersApi.ts        database reads/writes
    wordBanks.ts          reading and Spanish word lists
supabase/migrations/      database schema, row-level security, audit log
.github/workflows/        audit + lint + test + build + deploy
```

## Known limits
- GitHub Pages can't send HTTP security headers, so the Content Security Policy is a `<meta>` tag
  (no `frame-ancestors` clickjacking protection, no HSTS preload control). Cloudflare Pages or
  Cloudflare in front of the site adds them; same build, about 5 minutes to switch.
- Supabase's free plan doesn't offer session time-boxing or leaked-password checks; the app's
  30-minute idle sign-out covers the first.
- The AI Coach uses the browser's built-in voices. A higher-quality voice would need a small server
  function (Supabase Edge Function) holding a speech API key; never put such a key in this app.
