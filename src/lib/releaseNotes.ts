/**
 * Release notes for families, shown in Help → What's new. Plain language: what changed for the
 * people using the app. (CHANGELOG.md has the technical details for whoever runs the app.)
 * Newest first. Keep the top entry's version equal to package.json.
 */
export interface ReleaseNote {
  version: string
  date: string
  title: string
  items: string[]
}

export const RELEASE_NOTES: ReleaseNote[] = [
  {
    version: '1.8.0',
    date: '2026-11-25',
    title: 'Seven new languages',
    items: [
      'New learning paths (Beta): French, Tagalog (Filipino), Japanese, Korean, Mandarin Chinese, Farsi (Persian) and Portuguese (Portugal). Each has 30 levels, from hello and thank you up to everyday sentences.',
      'Japanese, Korean, Mandarin and Farsi are shown in English letters (konnichiwa, annyeonghaseyo, nǐ hǎo, salâm), so no new alphabet is needed. Just say it out loud.',
      'Pick a language on the learner card or when adding a learner. Each language keeps its own level.',
      'New "What\'s new" tab in Help with these release notes and the full version history.',
    ],
  },
  {
    version: '1.7.0',
    date: '2026-11-25',
    title: 'A real celebration',
    items: [
      'Finishing a round now fills the screen with confetti and a fanfare.',
      'Moving up shows "🎓 graduated!" with your new level, its stage and grade, and your graduation bonus stars. Otherwise you see how many more words until you graduate.',
      'The Sticker Shop is a button on the celebration instead of popping up by itself.',
      'Spelling Bee: while typing, you can still say "sentence", "definition", "part of speech", "origin" or "repeat" and Iris answers.',
    ],
  },
  {
    version: '1.6.0',
    date: '2026-11-25',
    title: 'Sticker wall',
    items: [
      'See all of a learner\'s stickers on one screen, outside practice: 🖼️ on the learner card, or "Arrange my stickers" in the practice menu.',
      'Drag stickers around, zoom out to fit giant ones, or tap "Tidy up" to lay them all out side by side.',
    ],
  },
  {
    version: '1.5.1',
    date: '2026-11-25',
    title: 'Faster spelling by keyboard',
    items: ['Spelling Bee: on a keyboard, just start typing as soon as the word is said. Enter checks it.'],
  },
  {
    version: '1.5.0',
    date: '2026-11-25',
    title: 'Typing, passwords and bigger stickers',
    items: [
      'Spelling Bee: say the letters or type the word.',
      'Creating a password shows every requirement and ticks each one off as you type, with Show/Hide and a Caps Lock warning.',
      'Paid accounts are never paused for being inactive. Free accounts get reminder emails before a pause.',
      'Stickers can keep growing much bigger.',
      'The old app name is gone everywhere, including authenticator apps.',
    ],
  },
  {
    version: '1.4.0',
    date: '2026-11-25',
    title: 'Levels saved per subject',
    items: [
      'Each subject\'s level is saved on its own, so switching subjects never mixes them up.',
      'The add/edit learner form has a starting level for every subject.',
    ],
  },
  {
    version: '1.3.0',
    date: '2026-11-25',
    title: 'Behind-the-scenes checks',
    items: ['Every update is now tested automatically in a real browser before it goes live: reading, Spanish, spelling, stars, settings and more.'],
  },
  {
    version: '1.2.0',
    date: '2026-11-25',
    title: 'One list of subjects',
    items: ['Reading, Spanish and Spelling Bee look and behave the same way on every screen, which makes adding new subjects easier.'],
  },
  {
    version: '1.1.0',
    date: '2026-11-25',
    title: 'Language Stars',
    items: [
      'New name: Language Stars. Your settings moved over automatically.',
      'Delete my account, in Account.',
      'Privacy, Terms and Support pages.',
      'The version number is shown in Account and Help.',
      'The microphone turns off when the app leaves the screen.',
      'Better recognition of long words and same-sounding words on iPhone.',
    ],
  },
  {
    version: '1.0.0',
    date: '',
    title: 'First release',
    items: [
      'Reading, Spanish and Spelling Bee, each to Level 100.',
      'Stars, stickers, world ranks and progress graphs.',
      'Parent accounts with Face ID or two-step sign-in, linked learner devices, and an admin dashboard.',
    ],
  },
]
