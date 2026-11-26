# Changelog

Versions follow major.minor.patch. The version shown in the app comes from `package.json`.

## 1.3.0 — 2026-11-25
- **Browser tests in the repo** (`tests/e2e`, Playwright): public pages, reading a word and saving the star,
  Spanish reveal and answer, Spelling Bee letters, meaning questions, subject switch, mic off in the
  background, delete my account, and the admin Problems copy. They run on every push before deploying.
- **Practice screen split up**: SubjectTabs, ReadingWord, SpanishCard, SpellingCard, QuizCard and the
  background-microphone hook now live in `src/components/practice/`.

## 1.2.0 — 2026-11-25
- **One subject list** (`src/lib/subjects.ts`): names, icons, colors, voice language, level columns and
  the "stuck" timer for Reading, Spanish and Spelling Bee are defined once. The subject switch, learner
  cards, add/edit form, progress graphs, Help, ranks, admin and backups all read from it.
- **Per-subject levels table** (database update 014): `learner_subjects` keeps one row per learner per
  subject, filled from current progress and kept in sync automatically. The admin Levels section shows
  whether it matches.

## 1.1.0 — 2026-11-25
- Renamed everything to **Language Stars** (package, docs, backups, on-device settings). Settings saved
  under the old name move over automatically.
- One set of words: Account, Learner, Subject (Reading, Spanish, Spelling Bee), Level, Round, Item, Iris.
- **Delete my account** in Account (database update 013).
- Public **Privacy**, **Terms** and **Support** pages at `#/privacy`, `#/terms`, `#/support`.
- Version number with build number shown in Account and Help and sent with problem reports.
- Shared design pieces: buttons, links, pills, panels, notices, page header and one date format.
- Admin: **Problems** list (database update 012), section shortcut chips, pinned header.
- Microphone turns off when the app leaves the screen.
- Better iPhone recognition of long words and same-sounding words.

## 1.0.0
- Reading, Spanish and Spelling Bee to level 100, stickers, ranks, graphs, parent accounts with
  Face ID / two-step, linked learner devices, admin dashboard.
