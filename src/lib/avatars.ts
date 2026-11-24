/**
 * Profile characters: people of every age, hair, look and job in six skin tones (built-in emoji),
 * plus fantasy heroes and animals. Stored as the emoji itself.
 */

export const SKIN_TONES = [
  { id: '', label: 'Classic', swatch: '#FFCC4D' },
  { id: '\u{1F3FB}', label: 'Light', swatch: '#F7DECE' },
  { id: '\u{1F3FC}', label: 'Medium-light', swatch: '#F3D2A2' },
  { id: '\u{1F3FD}', label: 'Medium', swatch: '#D5AB88' },
  { id: '\u{1F3FE}', label: 'Medium-dark', swatch: '#AF7E57' },
  { id: '\u{1F3FF}', label: 'Dark', swatch: '#7C533E' },
] as const

/** Puts a skin tone on a person emoji (after its first character, as the Unicode standard says). */
export function withTone(base: string, tone: string): string {
  if (!tone) return base
  const cps = [...base]
  const rest = cps.slice(1)
  if (rest[0] === '\u{FE0F}') rest.shift()
  return cps[0] + tone + rest.join('')
}

export interface AvatarGroup {
  id: string
  label: string
  toned: boolean
  items: string[]
}

export const AVATAR_GROUPS: AvatarGroup[] = [
  {
    id: 'kids', label: '🧒 Kids', toned: true,
    items: ['👧', '👦', '🧒', '👶', '👱‍♀️', '👱‍♂️', '🧕', '👲', '🙋‍♀️', '🙋‍♂️', '🙆‍♀️', '🙆‍♂️', '💁‍♀️', '💁‍♂️', '🤷‍♀️', '🤷‍♂️', '🧏‍♀️', '🧏‍♂️'],
  },
  {
    id: 'grownups', label: '🧑 Grown-ups', toned: true,
    items: ['👩', '👨', '🧑', '👩‍🦱', '👨‍🦱', '🧑‍🦱', '👩‍🦰', '👨‍🦰', '🧑‍🦰', '👩‍🦳', '👨‍🦳', '🧑‍🦳', '👩‍🦲', '👨‍🦲', '🧑‍🦲', '🧔', '🧔‍♀️', '🧕', '👳‍♀️', '👳‍♂️', '👵', '👴', '🧓', '🤰'],
  },
  {
    id: 'jobs', label: '🎓 Dream jobs', toned: true,
    items: ['🧑‍🎓', '👩‍🎓', '👨‍🎓', '🧑‍🏫', '👩‍🏫', '👨‍🏫', '🧑‍🔬', '👩‍🔬', '👨‍🔬', '🧑‍💻', '👩‍💻', '👨‍💻', '🧑‍🚀', '👩‍🚀', '👨‍🚀', '🧑‍⚕️', '👩‍⚕️', '👨‍⚕️', '🧑‍🍳', '👩‍🍳', '👨‍🍳', '🧑‍🎨', '👩‍🎨', '👨‍🎨', '🧑‍🎤', '👩‍🎤', '👨‍🎤', '🧑‍🚒', '👩‍🚒', '👨‍🚒', '🧑‍✈️', '👩‍✈️', '👨‍✈️', '🧑‍🌾', '👩‍🌾', '👨‍🌾', '🧑‍🔧', '👩‍🔧', '👨‍🔧', '👷‍♀️', '👷‍♂️', '👮‍♀️', '👮‍♂️', '🕵️‍♀️', '🕵️‍♂️', '🧑‍⚖️', '💂‍♀️', '💂‍♂️'],
  },
  {
    id: 'sports', label: '⚽ Sporty', toned: true,
    items: ['⛹️‍♀️', '⛹️‍♂️', '🏃‍♀️', '🏃‍♂️', '🏊‍♀️', '🏊‍♂️', '🚴‍♀️', '🚴‍♂️', '🤸‍♀️', '🤸‍♂️', '🧘‍♀️', '🧘‍♂️', '🏄‍♀️', '🏄‍♂️', '🤾‍♀️', '🤾‍♂️', '🧗‍♀️', '🧗‍♂️', '💃', '🕺'],
  },
  {
    id: 'fantasy', label: '🦸 Heroes & magic', toned: true,
    items: ['🦸‍♀️', '🦸‍♂️', '🦸', '🦹‍♀️', '🦹‍♂️', '🧙‍♀️', '🧙‍♂️', '🧚‍♀️', '🧚‍♂️', '🧜‍♀️', '🧜‍♂️', '🧝‍♀️', '🧝‍♂️', '🥷', '👸', '🤴', '🫅', '🎅', '🤶', '👼'],
  },
  {
    id: 'animals', label: '🐼 Animals', toned: false,
    items: ['🐶', '🐱', '🦊', '🐼', '🐨', '🐯', '🦁', '🐸', '🐵', '🐰', '🐻', '🐻‍❄️', '🐷', '🐮', '🐹', '🐧', '🦉', '🦄', '🐲', '🦖', '🐙', '🦋', '🐢', '🐬', '🦈', '🐝', '🦜', '🦒'],
  },
  {
    id: 'fun', label: '🤖 Fun', toned: false,
    items: ['🤖', '👽', '👾', '🎃', '👻', '⛄', '🌟', '🌈', '🚀', '⚽', '🎸', '🍕'],
  },
]

/** Every avatar that can be chosen (all tones), for checking saved values. */
export const ALL_AVATARS: Set<string> = new Set(
  AVATAR_GROUPS.flatMap((g) => (g.toned ? g.items.flatMap((b) => SKIN_TONES.map((t) => withTone(b, t.id))) : g.items)),
)

/** The character to show for a learner: their pick, or a default from their profile. */
export function avatarFor(l: { avatar?: string | null; sticker_style: string; age_group: string }): string {
  if (l.avatar && ALL_AVATARS.has(l.avatar)) return l.avatar
  if (l.age_group === 'adult') return l.sticker_style === 'girl' ? '👩' : l.sticker_style === 'boy' ? '👨' : '🧑'
  return l.sticker_style === 'girl' ? '👧' : l.sticker_style === 'boy' ? '👦' : '🧒'
}

/** The skin tone an avatar was saved with ('' for classic yellow or non-people). */
export function toneOf(avatar: string | null | undefined): string {
  if (!avatar) return ''
  return SKIN_TONES.find((t) => t.id && avatar.includes(t.id))?.id ?? ''
}
