# Changelog

Versions follow major.minor.patch. The version shown in the app comes from `package.json`.

## 1.7.0 — 2026-11-25
- **Round celebration**: the end of a round is now a full-screen party (confetti, fanfare) instead of a
  small box. Moving up shows "🎓 {name} graduated!" with the new level, its stage and grade, and the
  graduation bonus. Otherwise it shows a progress bar and how many more words to graduate. Stars this
  round, balance and lifetime stars are shown, and the Sticker Shop is a button there (it no longer pops
  up by itself); closing the shop returns to the celebration.
- Spelling Bee: while typing the word, asking out loud for "sentence", "definition", "part of speech",
  "origin" or "repeat" now works. Spoken letters are ignored while typing.

## 1.6.0 — 2026-11-25
- **Sticker wall**: 🖼️ on each learner card (and "Arrange my stickers" in the practice menu) opens all of a
  learner's stickers on one screen, outside practice: drag them around, zoom out so giant ones fit,
  "Tidy up" lays every sticker out side by side (zooming out if needed), and a list at the bottom brings
  any sticker back to the middle. Changes save by themselves.

## 1.5.1 — 2026-11-25
- Spelling Bee: on a keyboard, just start typing after the word is said (no need to click the box first); Enter checks it.

## 1.5.0 — 2026-11-25
- **Spelling Bee typing**: a "type it here" box is always under the letters, with instructions to say
  the letters or type the word. Typing turns the microphone off until 🎤 is tapped.
- **Password help**: sign-up and new-password screens list every requirement (12+ characters,
  lowercase, uppercase, number, symbol, no spaces at the ends) and tick each off while typing; Show/Hide;
  Caps Lock warning; a second "type it again" box; clear messages for server password errors.
- **Paid plans and inactivity** (database update 016): paying accounts are never paused for inactivity;
  free accounts get reminder emails at 60 and 83 days before the 90-day pause; an Edge Function
  (`supabase/functions/inactivity-notices`) sends them. Admin → Accounts shows FREE / PAID and the last
  reminder, and can give a plan by hand.
- **Stickers** keep growing along the Fibonacci sequence (×1, 1.25, 1.5, 2, 2.75, 4, 6, 9.25, 14.5 …).
- **Old name removed**: new authenticator codes are labeled Language Stars; old labels show as Language Stars.

## 1.4.0 — 2026-11-25
- **Levels are saved per subject** (database update 015): the app writes each subject's level to
  `learner_subjects`, with the same rules as before (parent; children's profiles only with Face ID /
  two-step; the learner's linked device). Best levels can only go up. Reading, Spanish and Spelling Bee
  are still copied to the old columns, so ranks, the admin dashboard and older app versions keep working.
  Before update 015 is run, the app keeps saving to the old columns.
- **Subjects list in the database** (`subjects`): learner subjects, practice history, problem reports and
  levels must name a listed subject, so adding one is a new row, not new columns.
- The add/edit learner form keeps one starting level per subject (from the subject list).
- Browser tests: a level change survives a reload; an older database still saves levels.

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
