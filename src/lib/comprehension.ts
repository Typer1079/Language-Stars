import { R, third } from './curriculum'

/** A "what does it mean?" question about a phrase or sentence the reader just read. */
export interface Question {
  prompt: string
  /** What Iris reads aloud (same as the prompt, plus the choices). */
  choices: string[]
  answer: number
}

/** Questions start once phrases get descriptive (Level 31+). */
export const COMPREHENSION_FROM = 31

function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

function rng(seed: number): () => number {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** The right answer plus two different wrong ones from the same kind of word, in a fixed shuffled order. */
function build(prompt: string, right: string, pool: string[], seed: string, extraWrong: string[] = []): Question | null {
  const r = rng(hash(seed))
  const wrongs: string[] = []
  for (const w of extraWrong) if (w !== right && !wrongs.includes(w)) wrongs.push(w)
  const rest = [...new Set(pool)].filter((p) => p !== right && !wrongs.includes(p))
  while (wrongs.length < 2 && rest.length) wrongs.push(rest.splice(Math.floor(r() * rest.length), 1)[0])
  if (wrongs.length < 2) return null
  const choices = [right, ...wrongs.slice(0, 2)]
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[choices[i], choices[j]] = [choices[j], choices[i]]
  }
  return { prompt, choices, answer: choices.indexOf(right) }
}

const animals = Object.keys(R.animal)
const allAnimalVerbs = [...new Set(Object.values(R.animal).flat())]
const allWhere = [...new Set(Object.values(R.weWhere).flat())]
const actOf = (v3: string) => Object.keys(R.act).find((a) => third(a) === v3)
const words = (list: string[]) => list.join('|')

/** Builds a question for a reading item, or null when there isn't a good one. */
export function questionFor(text: string): Question | null {
  const s = text.trim().replace(/[.!?]$/, '')
  const seed = s.toLowerCase()
  let m: RegExpMatchArray | null

  // "the big red ball"
  if ((m = s.match(new RegExp(`^the (${words(R.size)}) (${words(R.color)}) (\\w+)$`)))) {
    return build(`What color is the ${m[3]}?`, m[2], R.color, seed)
  }
  // "a sleepy dog under the bed"
  if ((m = s.match(new RegExp(`^an? (\\w+) (${words(animals)}) (.+)$`))) && R.animalWhere.includes(m[3])) {
    return build(`Where is the ${m[2]}?`, m[3], R.animalWhere, seed)
  }
  // "I see a red ball"
  if ((m = s.match(new RegExp(`^I see an? (${words(R.color)}) (\\w+)$`)))) {
    return build(`What color is the ${m[2]}?`, m[1], R.color, seed)
  }
  // "The dog can run"
  if ((m = s.match(new RegExp(`^The (${words(animals)}) can (\\w+)$`)))) {
    return build(`What can the ${m[1]} do?`, m[2], allAnimalVerbs.filter((v) => !R.animal[m![1]].includes(v)), seed)
  }
  // "I like my shiny boat"
  if ((m = s.match(/^I like my (\w+) (\w+)$/))) {
    return build('What do I like?', `my ${m[2]}`, R.noun2.map((n) => `my ${n}`), seed)
  }
  // "We swim in the pool"
  if ((m = s.match(new RegExp(`^We (${words(R.weVerb)}) (.+)$`)))) {
    return build(`Where do we ${m[1]}?`, m[2], allWhere, seed)
  }
  // "The sleepy dog digs under the bed"
  if ((m = s.match(new RegExp(`^The (\\w+) (${words(animals)}) (\\w+) (.+)$`))) && R.animalWhere.includes(m[4])) {
    return build(`Where is the ${m[2]}?`, m[4], R.animalWhere, seed)
  }
  // "My mom reads a book every week" / "My mom reads a big book"
  if ((m = s.match(new RegExp(`^My (${words(R.person)}) (\\w+) an? (\\w+) (\\w+) every (\\w+)$`))) && actOf(m[2])) {
    return build(`How often does my ${m[1]} ${actOf(m[2])} it?`, `every ${m[5]}`, R.time.map((t) => `every ${t}`), seed)
  }
  if ((m = s.match(new RegExp(`^My (${words(R.person)}) (\\w+) an? (\\w+)$`))) && actOf(m[2])) {
    const v = actOf(m[2])!
    return build(`What does my ${m[1]} ${v}?`, m[3], Object.values(R.act).flat().filter((o) => !R.act[v].includes(o)), seed)
  }
  // "On Monday, my mom and I play in the park"
  if ((m = s.match(new RegExp(`^On (${words(R.dayName)}), my (${words(R.person)}) and I (\\w+) (.+)$`)))) {
    return r2(m[1], m[2], seed)
  }
  // "The dog runs and the cat sleeps"
  if ((m = s.match(new RegExp(`^The (${words(animals)}) (\\w+) and the (${words(animals)}) (\\w+)$`)))) {
    const v = R.animal[m[3]].find((x) => third(x) === m![4])
    const first = R.animal[m[1]].find((x) => third(x) === m![2])
    if (v) return build(`What does the ${m[3]} do?`, v, allAnimalVerbs, seed, first && first !== v ? [first] : [])
  }
  // "My mom likes to read, but my dad likes to swim"
  if ((m = s.match(new RegExp(`^My (${words(R.person)}) likes to (\\w+), but my (${words(R.person)}) likes to (\\w+)$`)))) {
    return build(`What does my ${m[3]} like to do?`, m[4], R.funVerb, seed, [m[2]])
  }
  // "When it is rainy, we read in the house"
  if ((m = s.match(new RegExp(`^When it is (${words(R.weather)}), we (\\w+) (.+)$`)))) {
    return build(`What is the weather like?`, m[1], R.weather, seed)
  }
  // "My mom is happy because the tiny dog can jump"
  if ((m = s.match(new RegExp(`^My (${words(R.person)}) is happy because the (\\w+) (${words(animals)}) can (\\w+)$`)))) {
    return build(`Why is my ${m[1]} happy?`, `The ${m[3]} can ${m[4]}`,
      animals.filter((a) => a !== m![3]).map((a) => `The ${a} can ${R.animal[a][0]}`), seed)
  }
  // "After school, my mom and I walk to the zoo to see the animals with our friends"
  if ((m = s.match(new RegExp(`^(.+), my (${words(R.person)}) and I (\\w+) to the (\\w+) to (.+) with (.+)$`)))) {
    const place = m[4]
    const pick = hash(seed) % 2
    return pick === 0
      ? build('Where do we go?', `to the ${place}`, Object.keys(R.goPlace).map((p) => `to the ${p}`), seed)
      : build('Who comes with us?', m[6], R.with, seed)
  }
  return null

  function r2(day: string, person: string, sd: string): Question | null {
    return hash(sd) % 2 === 0
      ? build('What day is it?', day, R.dayName, sd)
      : build(`Who do I go with?`, `my ${person}`, R.person.map((p) => `my ${p}`), sd)
  }
}
