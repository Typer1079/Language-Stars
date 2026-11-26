# Changelog

Versions follow major.minor.patch. The version shown in the app comes from `package.json`.

## 1.8.3 — 2026-11-26
- **Fix: levels in the newer languages weren't saved.** The app saves levels to `learner_subjects` with an
  upsert, which updates every column; update 015 only allowed updating `level` and `best`, so every
  save was refused and the app quietly fell back to the old learner columns. Reading, Spanish and Spelling
  Bee were fine (they have columns); French, Portuguese, Tagalog, Japanese, Korean, Mandarin and Farsi
  levels were lost, and after the first refused save the languages vanished from the subject list for the
  rest of the visit (the "picked Tagalog, the button didn't change" report).
  - **Database update 019**: allows that update (the guard trigger still stops a row moving to another
    learner or subject), adds a Level 1 row for learners on a subject without one, and extends
    `admin_subject_levels(days)` with practice per subject.
  - The app now sends only the subjects that changed, and on a database without 019 it adds missing
    rows and updates levels separately, so saves work either way. Languages no longer disappear when a
    save fails.
- **Learner cards**: Reading and Spelling Bee on one row, and a full-width 🌍 language bar below with the
  current language, its level, "Practicing now", the flags of the other languages and "8 languages ▾".
- **Progress for every subject**: a subject filter (All subjects or one), level charts split by scale
  (Reading/Spelling to 100, languages to 30), a "By subject" table (level of max, rounds, words, on
  their own, stars, time) and recent rounds for the chosen subject.
- **Admin**: "Practice by subject" table (learners, rounds, words, on their own, minutes, stars) for the
  chosen time range; the levels table and accounts list pick up every language once levels save.

## 1.8.2 — 2026-11-26
- **Language list**: the third subject tile is now a 🌍 Languages tile ("8 languages ▾") that opens a
  list of every language with its level and Beta tag; tap one to switch. Escape or a tap outside closes
  it. Replaces the small ▾ menu (`SubjectSwitch.tsx`).
- **Subject switch on learner cards shows at once**: it now updates the card immediately and saves in
  the background (same as practice), instead of waiting for the save before showing anything. If a
  save fails, the learner list shows "A change hasn't saved yet. Trying again…".
- **More pronunciation help when asking Iris again** (`src/lib/pronounce.ts`): in a language, the 1st ask
  says the word (as before); the 2nd says it slowly and then piece by piece (kana beats for Japanese,
  syllable blocks for Korean, characters for Mandarin, words for phrases); the 3rd and later go piece by
  piece slowly and then the whole thing twice. A "🐢 Sounds like: kon-ni-chi-wa" guide shows on the card,
  and the Ask Iris button says what comes next. Asking again while Iris is talking moves straight on to
  the next kind of help. Without a voice for the language, the pieces are the English-letter syllables.
- Iris's long Japanese, Korean and Chinese sentences are no longer cut short (talk time now counts characters).

## 1.8.1 — 2026-11-26
Bug fixes from the first Portuguese testers (problem reports: "three → três" and "here → aqui" skipped).
- **No untaught bonus items for beginners**: in a language, stretch items from higher levels only appear
  once 5 of the current level's 10 are mastered (or the learner has been higher before)
  (`LANGUAGE_STRETCH_AFTER`). Reading and Spelling Bee are unchanged.
- **Iris helps beginners**: in a language at the guided pace, Iris says the answer by herself once after
  9 s with no match (counts as help), then keeps listening. Brisk learners still ask with Ask Iris.
- **Stricter, fairer answer checking** (`src/lib/languageMatch.ts`, `answerScore` in `match.ts`): answers
  must line up with whole words; near misses only for longer words; and an answer only counts if no
  other item of the same level fits better. Fixes French "six" counting for "cinq", "la famille"
  counting for "ami", Korean "할아버지" for "아버지", "안 좋아해요" for "좋아해요", and similar (a test checks
  every item of every language). Spanish keeps its accent-forgiving check, plus the same-level rule.
- **Database update 018**: world ranks for the newer languages (they showed "Couldn't load this ranking");
  Admin → Accounts lists each learner's level in every subject; `admin_subject_levels()` for Admin.
- Admin: "Reading / Spelling / Languages" tile with learners per language; the levels table shows only
  subjects in use, so columns line up again.
- A learner's World ranks only list languages they've started.

## 1.8.0 — 2026-11-25
- **Seven new language paths (Beta)**: French, Portuguese (Portugal), Tagalog, Japanese, Korean, Mandarin
  (Simplified) and Farsi, 30 levels each (300 items), from greetings to everyday sentences. One shared
  English list (`src/lib/languages/concepts.ts`) is translated per language (`src/lib/languages/*.ts`).
- Japanese, Korean, Mandarin and Farsi are shown in English letters (romaji, Revised Romanization,
  pinyin, simple Persian romanization) but heard in their own script: answers are compared after
  folding katakana/hiragana, Arabic/Persian letter forms, joiners and digit styles, with one- and
  two-character answers matched only on their own and longer phrases forgiving ~20% (`isNativeMatch`).
- Iris speaks each language with a matching device voice; with none installed she says the English-letter
  form instead.
- Subjects now describe their language (`language` in `subjects.ts`): name, voice, number of levels,
  script. Practice, the answer card, level guide, stage names, charts and the level pickers read from it
  instead of checking for Spanish. Each subject has its own top level (`maxLevel`).
- The subject switch shows Reading, Spelling Bee and one language tile with a ▾ menu for the others.
  The add/edit form keeps the other languages' starting levels under "Starting levels for other languages".
- **Database update 017** adds the seven languages to `subjects`. The app only offers them once it has
  been run (it reads the `subjects` table).
- **Help → What's new**: release notes in plain language and the full version history
  (`src/lib/releaseNotes.ts`; a test keeps its newest entry equal to the app version).

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
