# Security and NIST SP 800-53 Rev. 5 mapping

**What this document is.** NIST SP 800-53 is a catalog of controls that an *organization* selects,
documents (in a System Security Plan) and has assessed. Software alone can't be "800-53 compliant."
This file shows how Read Aloud Stars implements the controls that apply to a small web application,
using the **Moderate baseline** as the reference, and is honest about what is inherited from service
providers, what the account owner has to do, and what isn't covered.

**Hosting caveat.** GitHub Pages and Supabase's standard plans are not FedRAMP-authorized. Controls
marked *Inherited* rely on those providers' own security programs (both publish SOC 2 reports), not
on a FedRAMP authorization. If formal authorization were ever required, the hosting would have to
move to FedRAMP-authorized services.

Legend: **Implemented** = built into this app or its database · **Inherited** = provided by Supabase
or GitHub · **Owner** = a setting or practice the account owner must keep up · **Partial** /
**Not addressed** = gaps, stated plainly.

## Access control (AC)
| Control | Status | How |
|---|---|---|
| AC-2 Account management | Implemented + Owner | Supabase Auth accounts with confirmed email. Owner closes public sign-up after family accounts exist and invites anyone new (README step 4). Deleting a user in Supabase deletes their readers and practice history (`on delete cascade`). Super admins are listed in `app_admins`, which the app can neither read nor change; admins are added only by the owner in the SQL editor. |
| AC-3 Access enforcement | Implemented | Postgres row-level security on `learners` and `audit_log` (`force row level security`); policies tested for cross-account reads, writes and owner changes. |
| AC-6 Least privilege | Implemented | `anon` role has no table access; `authenticated` gets only select/insert/update/delete on its own rows and read-only access to its own audit entries. Trigger functions run with an empty `search_path` and are not callable by users. The `service_role` key is never used by the app. Practice history is insert/select only on your own readers (no edits or deletes). World rankings come from functions that return ranks, values and made-up codenames only (never names, avatars or ids), and only for readers you own. The admin dashboard is a single function that returns aggregated counts only and requires an admin account plus a two-step / Face ID session. |
| AC-7 Unsuccessful logon attempts | Inherited + Owner | Supabase Auth rate-limits sign-in and verification attempts (Authentication → Rate Limits). Error messages don't reveal whether an email exists. |
| AC-8 System use notification | Implemented | Sign-in screen notice: private family app, authorized users only, activity logged. |
| AC-11 / AC-12 Session lock and termination | Implemented | Automatic sign-out after 30 minutes without taps, keys or words read; "Sign out on all devices" revokes every session. |
| AC-14 Actions without identification | Implemented | Nothing is readable or writable without signing in. |
| AC-17 / AC-18 Remote / wireless access | Inherited | All access is over HTTPS/WSS (TLS) to GitHub Pages and Supabase. |

## Audit and accountability (AU)
| Control | Status | How |
|---|---|---|
| AU-2 / AU-12 Event logging | Implemented + Inherited | Database trigger logs reader create/delete and every change to stars, balance, levels, sticker count and profile fields. Supabase Auth logs sign-ins, MFA events and password changes (Dashboard → Logs). Every admin-dashboard view is logged as `admin.view_kpis` (and `admin.view_leaderboard`). |
| AU-3 Content of records | Implemented | Time, account ID, reader ID, action, MFA level of the session (`aal1`/`aal2`) and before → after values. No personal content is copied into the log. |
| AU-6 Review | Implemented + Owner | Account → Activity shows the account's own log. Owner reviews periodically. |
| AU-9 Protection of audit information | Implemented | Users can read only their own entries and cannot insert, update or delete any; only the trigger writes. |
| AU-11 Retention | Owner | One-year retention; purge query (or `pg_cron` schedule) is at the end of the migration. |

## Configuration management (CM)
| Control | Status | How |
|---|---|---|
| CM-2 / CM-3 Baseline and change control | Implemented | Everything (code, database schema, CI) is in Git; schema changes are numbered migrations; `main` is deployed only by the workflow after tests pass (branch rule recommended in README). |
| CM-6 / CM-7 Configuration settings, least functionality | Implemented | No third-party scripts, fonts or CDNs; fonts are self-hosted; the app has no server of its own. |
| CM-8 Component inventory | Implemented | `package-lock.json` pins every dependency; `npm ci` installs exactly those. |

## Identification and authentication (IA)
| Control | Status | How |
|---|---|---|
| IA-2 Identification and authentication | Implemented | Unique account per adult (parent; Olivia separately). Children never get credentials; they are profiles under a parent's account. |
| IA-2(1) / IA-2(2) Multi-factor | Implemented | Default: Face ID. A passkey sign-in (device + biometric, AAL2 under NIST SP 800-63B) or a WebAuthn second step; an authenticator app (TOTP) is optional as a backup. Enforced by the **database**: children's rows require `public.is_strong_session()` (an `aal2` session or a passkey/WebAuthn sign-in). Password-only sessions never see children's data. |
| IA-2(8) Replay-resistant authentication | Implemented | Face ID sign-in uses passkeys and the Face ID second step uses a WebAuthn factor: challenge-response, phishing-resistant, private keys never leave the device. TOTP codes remain as a backup. |
| IA-5(1) Password-based authentication | Implemented + Owner | 12-character minimum in the app; owner sets the same minimum and complexity in Supabase and enables leaked-password protection where the plan allows. Passwords are hashed by Supabase (bcrypt). |
| IA-6 Authentication feedback | Implemented | Password fields are masked; one generic sign-in error. |
| IA-11 Re-authentication | Implemented | Expired or idle sessions require signing in again, including the MFA code. |

## System and communications protection (SC)
| Control | Status | How |
|---|---|---|
| SC-8 Transmission confidentiality | Inherited | HTTPS everywhere (GitHub Pages, Supabase). |
| SC-12 / SC-13 Cryptography | Inherited | TLS, signed JWT sessions and bcrypt hashing by Supabase. |
| SC-18 Mobile code | Implemented | Content Security Policy: scripts, styles and fonts only from this site; network connections only to `*.supabase.co`; no `eval`, no plugins, `base-uri`/`form-action` locked. |
| SC-23 Session authenticity | Implemented + Inherited | PKCE sign-in flow, short-lived access tokens with automatic refresh. |
| SC-28 Protection of information at rest | Inherited | Supabase encrypts database storage (AES-256). |
| SC-7 Boundary protection (frame-ancestors, HSTS) | Partial | GitHub Pages can't send HTTP headers; README explains the Cloudflare option. |

## System and information integrity (SI)
| Control | Status | How |
|---|---|---|
| SI-2 Flaw remediation | Implemented + Owner | Dependabot weekly updates; owner merges them. |
| SI-10 Information input validation | Implemented | Backup files are size-limited, parsed safely and every field cleaned and clamped (`src/lib/validate.ts`, unit-tested with hostile input). The database enforces the same limits plus business rules (stars only go up; balance ≤ lifetime stars; 12 readers per account). |
| SI-11 Error handling | Implemented | Users see plain messages; database details aren't shown. An error screen replaces a blank page. |

## Risk assessment, acquisition, supply chain (RA, SA, SR)
| Control | Status | How |
|---|---|---|
| RA-5 Vulnerability monitoring | Implemented + Owner | `npm audit --omit=dev --audit-level=high` blocks deploys with serious runtime vulnerabilities; Dependabot alerts and GitHub secret scanning (owner turns on). |
| SA-11 Developer testing | Implemented | Unit tests, type-checking and lint on every push; database policies were tested against a local Postgres before release. |
| SR-3 / SR-11 Supply chain | Implemented | Lockfile installs, no runtime CDNs, GitHub Actions pinned to major versions and updated by Dependabot. |

## Privacy (PT) — children's data
| Control | Status | How |
|---|---|---|
| PT-2 / PT-3 Purpose and processing | Implemented | Data is used only to track practice progress. |
| Data minimization | Implemented | Only a first name or nickname, age group and sticker style; no birthdays, last names, photos, kids' emails or audio. |
| Parental control | Implemented | Kids' profiles are created and controlled by the parent's MFA-protected account; the parent can export or permanently delete a child's data at any time. |
| Voice processing | Disclosed | Speech recognition is performed by the browser vendor's service (Google or Apple); the app never receives or stores audio. |

## Not addressed (organizational controls)
Contingency planning (CP: the free Supabase plan has **no automatic backups**, so use Account →
Download backup, or upgrade for daily backups), incident response (IR), security planning and a
formal System Security Plan (PL), awareness training (AT), physical security (PE) and personnel
security (PS) are organizational responsibilities outside the app.

## Reporting a problem
Open a private security advisory on the GitHub repository (Security → Advisories → New draft).

### Account management and rules of behavior (migration 009)

| Control | How it's met |
|---|---|
| AC-2(3) Disable accounts | Admin can archive an account: sessions and refresh tokens are deleted, sign-in is blocked (`banned_until`), and every row-level policy checks `account_active()`, so the account can't reach any data even with a still-valid token. Restore reverses it. Audited as `admin.account_archive` / `_restore` / `_sign_out` with a reason. |
| AC-2(4) Automated audit of account actions | Admin views (`admin.view_users`) and actions are written to `audit_log`. |
| PL-4 Rules of behavior / PT-5 Privacy notice | Terms of Use and Privacy Policy shown at sign-up and at sign-in whenever the version changes; acceptance (adult, guardian, version, time) stored in `terms_acceptance`. |
| PT-2 / COPPA parental consent | Only an adult account holder can add a child's profile, and only with two-step sign-in; the holder attests to being the parent/guardian and consents. |

