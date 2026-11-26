// The 100-level curriculum for both modes: single words first, then short phrases, then full sentences.
//
// Levels 1-5 (reading) and 1-6 (Spanish) are the original hand-written word lists. Higher levels are
// built from graded vocabulary and sentence patterns. Generation is deterministic (seeded by mode and
// level), so a level always contains the same items and mastered-word records stay valid.

import { WORD_BANKS, type SpanishEntry } from './wordBanks'
import { TOURIST_LEVELS } from './spanishTourist'
import { LANGUAGE_LEVELS } from './languages'
import { CONCEPTS } from './languages/concepts'
import type { Mode } from './types'
import { SPELLING_WORDS, type SpellEntry } from './spellingWords'
import { ADVANCED_FROM, advancedLevels, bandFor } from './readingAdvanced'

export const MAX_LEVEL = 100
export const ITEMS_PER_LEVEL = 10

// ---------------------------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------------------------

/** Small fast seeded random generator (mulberry32). */
function rng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

const pick = <T,>(r: () => number, list: readonly T[]): T => list[Math.floor(r() * list.length)]
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const aAn = (word: string) => (/^[aeiou]/i.test(word) ? 'an' : 'a')

/** Builds levels from..to, ten unique items each, using the generator for that range. */
function fillLevels<T>(
  out: Record<number, T[]>,
  from: number,
  to: number,
  mode: string,
  keyOf: (t: T) => string,
  used: Set<string>,
  gen: (r: () => number, level: number) => T,
) {
  for (let level = from; level <= to; level++) {
    const r = rng(hash(`${mode}:${level}`))
    const items: T[] = []
    let attempts = 0
    while (items.length < ITEMS_PER_LEVEL && attempts < 5000) {
      attempts++
      const it = gen(r, level)
      const k = keyOf(it).toLowerCase()
      if (used.has(k)) continue
      used.add(k)
      items.push(it)
    }
    out[level] = items
  }
}

export function stageName(level: number, mode: Mode): string {
  if (mode !== 'spanish' && LANGUAGE_LEVELS[mode]) return CONCEPTS[Math.min(level, CONCEPTS.length) - 1]?.stage ?? 'Sentences'
  if (mode === 'spelling') {
    // Named after where the level's words sit in the list (see levelGuide.ts).
    const n = SPELLING_WORDS.length
    const mid = Math.round(((level - 1) * (n - ITEMS_PER_LEVEL)) / (MAX_LEVEL - 1)) + ITEMS_PER_LEVEL / 2
    const bands: [string, string][] = [['cat', 'First words'], ['ship', 'Word builder'], ['because', 'Tricky words'], ['adventure', 'Classroom bee'],
      ['brilliant', 'School bee'], ['accommodate', 'District bee'], ['acquiesce', 'Regional bee'], ['abecedarian', 'National prelims'],
      ['chrysanthemum', 'National finals'], ['fibranne', 'Championship']]
    let name = bands[0][1]
    for (const [w, label] of bands) if (mid >= SPELLING_WORDS.findIndex((e) => e.word === w)) name = label
    return name
  }
  if (mode === 'reading') {
    if (level <= 15) return 'Words'
    if (level <= 40) return 'Phrases'
    if (level < ADVANCED_FROM) return 'Sentences'
    return bandFor(level)?.name ?? 'Doctorate'
  }
  if (level <= 6) return 'Travel basics'
  if (level <= 15) return 'Words'
  if (level <= 35) return 'Phrases'
  return 'Sentences'
}

// ---------------------------------------------------------------------------------------------
// Reading (English)
// ---------------------------------------------------------------------------------------------

/** Levels 6-15: phonics word lists. */
const READING_WORDS: Record<number, string[]> = {
  6: ['shop', 'shed', 'dish', 'wish', 'chin', 'chip', 'chop', 'much', 'thin', 'that', 'this', 'bath'],
  7: ['rock', 'sock', 'back', 'kick', 'ring', 'sing', 'king', 'long', 'song', 'wing', 'neck', 'lock'],
  8: ['cake', 'game', 'name', 'lake', 'gate', 'plane', 'snake', 'shape', 'wave', 'cave', 'tape', 'flame'],
  9: ['bike', 'kite', 'time', 'five', 'line', 'ride', 'home', 'bone', 'rope', 'nose', 'hole', 'smoke'],
  10: ['feet', 'week', 'green', 'sheep', 'sleep', 'read', 'team', 'beach', 'leaf', 'dream', 'clean', 'queen'],
  11: ['boat', 'coat', 'road', 'soap', 'rain', 'tail', 'mail', 'paint', 'day', 'play', 'stay', 'gray'],
  12: ['car', 'farm', 'park', 'corn', 'fork', 'storm', 'her', 'girl', 'turn', 'nurse', 'shirt', 'horn'],
  13: ['rabbit', 'kitten', 'basket', 'sunset', 'picnic', 'napkin', 'muffin', 'puppet', 'pencil', 'window', 'yellow', 'happy'],
  14: ['monkey', 'turtle', 'button', 'number', 'winter', 'summer', 'doctor', 'flower', 'pillow', 'water', 'paper', 'zipper'],
  15: ['banana', 'elephant', 'computer', 'umbrella', 'dinosaur', 'butterfly', 'kangaroo', 'tomato', 'potato', 'family', 'animal', 'octopus'],
}

export const R = {
  noun1: ['cat', 'dog', 'sun', 'hat', 'bed', 'cup', 'pig', 'fox', 'hen', 'bus', 'box', 'bug', 'map', 'pen', 'van', 'mop'],
  adj1: ['big', 'red', 'hot', 'wet', 'sad', 'tan'],
  noun2: ['ball', 'fish', 'duck', 'frog', 'tree', 'bird', 'cake', 'kite', 'boat', 'ship', 'star', 'shell', 'sock', 'rock', 'bell', 'drum', 'book', 'chair'],
  size: ['big', 'little', 'small', 'tall'],
  color: ['red', 'green', 'blue', 'pink', 'black', 'white', 'yellow', 'purple', 'brown', 'orange'],
  adj2: ['happy', 'funny', 'soft', 'fast', 'sleepy', 'shiny', 'tiny', 'silly'],
  place: ['park', 'pond', 'box', 'bed', 'tree', 'house', 'yard', 'pool', 'barn', 'shop', 'garden', 'kitchen'],
  prep: ['in', 'on', 'under', 'by', 'near'],
  person: ['mom', 'dad', 'sister', 'brother', 'friend', 'teacher', 'grandma', 'grandpa', 'cousin', 'aunt', 'uncle'],
  // animal -> verbs it can do (base form)
  animal: {
    dog: ['run', 'jump', 'dig', 'play', 'sleep', 'bark'],
    cat: ['sleep', 'jump', 'play', 'run', 'purr'],
    fish: ['swim'],
    bird: ['fly', 'sing'],
    frog: ['hop', 'jump', 'swim'],
    duck: ['swim', 'walk', 'quack'],
    pig: ['dig', 'sleep', 'eat'],
    fox: ['run', 'dig', 'hide'],
    horse: ['run', 'eat', 'jump'],
    bunny: ['hop', 'eat', 'hide'],
  } as Record<string, string[]>,
  // person activity -> objects
  act: {
    read: ['book', 'map', 'letter', 'story'],
    eat: ['cake', 'apple', 'sandwich', 'banana', 'cookie'],
    draw: ['star', 'tree', 'house', 'cat', 'rainbow', 'flower'],
    kick: ['ball'],
    ride: ['bike', 'bus', 'horse', 'train'],
    bake: ['cake', 'pie', 'cookie'],
    paint: ['picture', 'fence', 'box'],
    find: ['shell', 'rock', 'key', 'coin'],
  } as Record<string, string[]>,
  weVerb: ['play', 'run', 'sing', 'read', 'dance', 'swim', 'jump', 'walk'],
  // where each "we" activity happens
  weWhere: {
    play: ['in the park', 'in the yard', 'in the garden'],
    run: ['in the park', 'in the yard', 'by the lake'],
    sing: ['in the house', 'in the kitchen', 'in the car'],
    read: ['in the house', 'in bed', 'at the library'],
    dance: ['in the kitchen', 'in the house', 'at the party'],
    swim: ['in the pool', 'in the lake', 'at the beach'],
    jump: ['in the yard', 'on the bed', 'in the park'],
    walk: ['in the park', 'by the lake', 'to school'],
  } as Record<string, string[]>,
  // where an animal might be
  animalWhere: ['in the pond', 'under the bed', 'by the tree', 'near the house', 'in the yard', 'on the rock', 'in the garden', 'by the barn', 'near the pool', 'under the tree'],
  time: ['day', 'morning', 'night', 'week', 'weekend'],
  dayName: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  weather: ['sunny', 'rainy', 'cold', 'warm', 'windy', 'snowy'],
  // place -> things to do there
  goPlace: {
    park: ['play', 'run', 'have a picnic'],
    pool: ['swim', 'play'],
    library: ['read', 'find a book'],
    beach: ['swim', 'build a sandcastle', 'look for shells'],
    zoo: ['see the animals', 'look at the lions'],
    farm: ['feed the animals', 'see the horses'],
    lake: ['swim', 'fish'],
    museum: ['look at the art', 'see the dinosaurs'],
  } as Record<string, string[]>,
  goVerb: ['walk', 'ride', 'go'],
  with: ['our friends', 'our dog', 'our cousins', 'grandma', 'grandpa', 'the neighbors'],
  funVerb: ['play', 'read', 'swim', 'draw', 'build', 'sing'],
}

export function third(verb: string): string {
  if (verb === 'fly') return 'flies'
  if (verb === 'go') return 'goes'
  if (/(s|sh|ch|x|z)$/.test(verb)) return verb + 'es'
  return verb + 's'
}

const animals = Object.keys(R.animal)
const acts = Object.keys(R.act)

function readingItem(r: () => number, level: number): string {
  const anim = () => pick(r, animals)
  if (level <= 20) return `${pick(r, R.adj1)} ${pick(r, R.noun1)}`
  if (level <= 25) {
    const adj = pick(r, [...R.adj1, ...R.color, ...R.size])
    const art = r() < 0.5 ? 'the' : aAn(adj)
    return `${art} ${adj} ${pick(r, [...R.noun1, ...R.noun2])}`
  }
  if (level <= 30) {
    const t = Math.floor(r() * 3)
    if (t === 0) return `${pick(r, R.noun2)} and ${pick(r, R.noun1)}`
    if (t === 1) return `a ${pick(r, R.noun1)} and a ${pick(r, R.noun2)}`
    return `${pick(r, R.prep)} the ${pick(r, R.place)}`
  }
  if (level <= 35) return `the ${pick(r, R.size)} ${pick(r, R.color)} ${pick(r, R.noun2)}`
  if (level <= 40) {
    const adj = pick(r, [...R.size, ...R.adj2])
    return `${aAn(adj)} ${adj} ${anim()} ${pick(r, R.animalWhere)}`
  }
  if (level <= 50) {
    const t = Math.floor(r() * 4)
    if (t === 0) { const a = pick(r, R.color); return `I see ${aAn(a)} ${a} ${pick(r, R.noun2)}.` }
    if (t === 1) { const a = anim(); return `The ${a} can ${pick(r, R.animal[a])}.` }
    if (t === 2) return `I like my ${pick(r, [...R.color, ...R.adj2])} ${pick(r, R.noun2)}.`
    const v = pick(r, R.weVerb)
    return `We ${v} ${pick(r, R.weWhere[v])}.`
  }
  if (level <= 60) {
    const t = Math.floor(r() * 2)
    if (t === 0) {
      const a = anim()
      return `The ${pick(r, [...R.size, ...R.adj2])} ${a} ${third(pick(r, R.animal[a]))} ${pick(r, R.animalWhere)}.`
    }
    const v = pick(r, acts)
    const o = pick(r, R.act[v])
    return `My ${pick(r, R.person)} ${third(v)} ${aAn(o)} ${o}.`
  }
  if (level <= 70) {
    const t = Math.floor(r() * 2)
    if (t === 0) {
      const v = pick(r, acts)
      const o = pick(r, R.act[v])
      const adj = pick(r, [...R.color, ...R.adj2, ...R.size])
      return `My ${pick(r, R.person)} ${third(v)} ${aAn(adj)} ${adj} ${o} every ${pick(r, R.time)}.`
    }
    const v = pick(r, R.weVerb)
    return `On ${pick(r, R.dayName)}, my ${pick(r, R.person)} and I ${v} ${pick(r, R.weWhere[v])}.`
  }
  if (level <= 80) {
    const t = Math.floor(r() * 2)
    if (t === 0) {
      const a = anim()
      let b = anim()
      if (b === a) b = animals[(animals.indexOf(a) + 1) % animals.length]
      return `The ${a} ${third(pick(r, R.animal[a]))} and the ${b} ${third(pick(r, R.animal[b]))}.`
    }
    const p1 = pick(r, R.person)
    let p2 = pick(r, R.person)
    if (p2 === p1) p2 = R.person[(R.person.indexOf(p1) + 1) % R.person.length]
    const v1 = pick(r, R.funVerb)
    let v2 = pick(r, R.funVerb)
    if (v2 === v1) v2 = R.funVerb[(R.funVerb.indexOf(v1) + 1) % R.funVerb.length]
    return `My ${p1} likes to ${v1}, but my ${p2} likes to ${v2}.`
  }
  if (level <= 90) {
    const t = Math.floor(r() * 2)
    if (t === 0) {
      const w = pick(r, R.weather)
      const v = w === 'sunny' || w === 'warm' ? pick(r, ['play', 'swim', 'run', 'walk']) : pick(r, ['read', 'sing', 'dance'])
      return `When it is ${w}, we ${v} ${pick(r, R.weWhere[v])}.`
    }
    const a = anim()
    return `My ${pick(r, R.person)} is happy because the ${pick(r, [...R.size, ...R.adj2])} ${a} can ${pick(r, R.animal[a])}.`
  }
  const opener = pick(r, ['After school', 'Every summer', 'On the weekend', 'On Saturday', 'In the morning'])
  const place = pick(r, Object.keys(R.goPlace))
  return `${opener}, my ${pick(r, R.person)} and I ${pick(r, R.goVerb)} to the ${place} to ${pick(r, R.goPlace[place])} with ${pick(r, R.with)}.`
}

function buildReading(): Record<number, string[]> {
  const out: Record<number, string[]> = {}
  for (let l = 1; l <= 5; l++) out[l] = WORD_BANKS[l]
  for (let l = 6; l <= 15; l++) out[l] = READING_WORDS[l]
  const used = new Set<string>()
  for (let l = 1; l <= 15; l++) out[l].forEach((w) => used.add(w.toLowerCase()))
  // Levels 41-55 squeeze the whole range of everyday sentences into 15 levels, then Levels 56-100
  // climb from Grade 5 vocabulary to doctoral academic language.
  const everyday = (r: () => number, level: number) => readingItem(r, level <= 40 ? level : 41 + Math.round(((level - 41) * 59) / 14))
  fillLevels(out, 16, ADVANCED_FROM - 1, 'reading', (s) => s, used, everyday)
  Object.assign(out, advancedLevels())
  return out
}

// ---------------------------------------------------------------------------------------------
// Spanish (English -> Spanish)
// ---------------------------------------------------------------------------------------------

type G = 'm' | 'f'
type Cat = 'obj' | 'animal' | 'place' | 'read' | 'open' | 'clean' | 'find' | 'nature'
interface Noun { en: string; enPl: string; es: string; esPl: string; g: G; cats: Cat[]; adjs?: string[] }
const N = (en: string, es: string, g: G, cats: Cat[], enPl = en + 's', esPl = es + 's', adjs?: string[]): Noun => ({ en, enPl, es, esPl, g, cats, adjs })
const ANIMAL_ADJS = ['black', 'white', 'small', 'big', 'old', 'pretty']

const NOUNS: Noun[] = [
  N('cat', 'gato', 'm', ['animal'], 'cats', 'gatos', ANIMAL_ADJS),
  N('dog', 'perro', 'm', ['animal'], 'dogs', 'perros', ANIMAL_ADJS),
  N('horse', 'caballo', 'm', ['animal'], 'horses', 'caballos', ANIMAL_ADJS),
  N('bird', 'pájaro', 'm', ['animal'], 'birds', 'pájaros', ['small', 'big', 'pretty', 'blue', 'yellow', 'red', 'black', 'white']),
  N('fish', 'pez', 'm', ['animal'], 'fish', 'peces', ['small', 'big', 'pretty', 'red', 'yellow', 'blue']),
  N('house', 'casa', 'f', ['obj', 'clean', 'place'], 'houses', 'casas', ['big', 'small', 'new', 'old', 'pretty', 'white', 'blue', 'yellow', 'clean', 'expensive', 'cheap']),
  N('car', 'coche', 'm', ['obj', 'clean', 'find']),
  N('book', 'libro', 'm', ['obj', 'read', 'open', 'find']),
  N('table', 'mesa', 'f', ['obj', 'clean']),
  N('chair', 'silla', 'f', ['obj', 'clean']),
  N('door', 'puerta', 'f', ['open', 'clean']),
  N('window', 'ventana', 'f', ['open', 'clean']),
  N('apple', 'manzana', 'f', ['obj'], 'apples', 'manzanas', ['red', 'green', 'yellow', 'big', 'small']),
  N('ball', 'pelota', 'f', ['obj', 'find']),
  N('shirt', 'camisa', 'f', ['obj', 'clean', 'find']),
  N('shoe', 'zapato', 'm', ['obj', 'clean', 'find']),
  N('hat', 'sombrero', 'm', ['obj', 'find']),
  N('phone', 'teléfono', 'm', ['obj', 'find']),
  N('letter', 'carta', 'f', ['obj', 'read', 'open', 'find']),
  N('key', 'llave', 'f', ['obj', 'find']),
  N('bag', 'bolsa', 'f', ['obj', 'open', 'find']),
  N('box', 'caja', 'f', ['obj', 'open', 'find'], 'boxes'),
  N('boat', 'barco', 'm', ['obj', 'clean']),
  N('cup', 'taza', 'f', ['obj', 'clean', 'find']),
  N('plate', 'plato', 'm', ['obj', 'clean']),
  N('kitchen', 'cocina', 'f', ['clean'], 'kitchens', 'cocinas', ['big', 'small', 'new', 'old', 'pretty']),
  N('room', 'cuarto', 'm', ['clean'], 'rooms', 'cuartos', ['big', 'small', 'new', 'old', 'pretty']),
  N('newspaper', 'periódico', 'm', ['obj', 'read', 'find']),
  N('map', 'mapa', 'm', ['obj', 'read', 'open', 'find']),
  N('jacket', 'chaqueta', 'f', ['obj', 'clean', 'find']),
  N('bicycle', 'bicicleta', 'f', ['obj', 'clean', 'find']),
  N('lamp', 'lámpara', 'f', ['obj', 'clean']),
  N('watch', 'reloj', 'm', ['obj', 'find'], 'watches', 'relojes'),
  N('pencil', 'lápiz', 'm', ['obj', 'find'], 'pencils', 'lápices'),
  N('flower', 'flor', 'f', ['nature'], 'flowers', 'flores', ['red', 'white', 'yellow', 'blue', 'pretty', 'small', 'big']),
  N('tree', 'árbol', 'm', ['nature'], 'trees', 'árboles', ['big', 'small', 'old', 'pretty', 'green']),
]

// Places used with "to the ..." (a la / al)
const PLACES: Noun[] = [
  N('park', 'parque', 'm', ['place']),
  N('beach', 'playa', 'f', ['place'], 'beaches'),
  N('market', 'mercado', 'm', ['place']),
  N('store', 'tienda', 'f', ['place']),
  N('school', 'escuela', 'f', ['place']),
  N('museum', 'museo', 'm', ['place']),
  N('station', 'estación', 'f', ['place'], 'stations', 'estaciones'),
  N('hotel', 'hotel', 'm', ['place'], 'hotels', 'hoteles'),
  N('restaurant', 'restaurante', 'm', ['place']),
  N('bank', 'banco', 'm', ['place']),
  N('hospital', 'hospital', 'm', ['place'], 'hospitals', 'hospitales'),
  N('library', 'biblioteca', 'f', ['place'], 'libraries'),
  N('airport', 'aeropuerto', 'm', ['place']),
  N('church', 'iglesia', 'f', ['place'], 'churches'),
]

interface Adj { en: string; ms: string; fs: string; mp: string; fp: string; for: Cat[] }
const A = (en: string, ms: string, fs: string, forCats: Cat[], mp = ms + 's', fp = fs + 's'): Adj => ({ en, ms, fs, mp, fp, for: forCats })
const ADJS: Adj[] = [
  A('red', 'rojo', 'roja', ['obj', 'clean', 'open', 'find', 'read']),
  A('white', 'blanco', 'blanca', ['obj', 'clean', 'open', 'find', 'animal', 'read']),
  A('black', 'negro', 'negra', ['obj', 'clean', 'open', 'find', 'animal']),
  A('blue', 'azul', 'azul', ['obj', 'clean', 'open', 'find'], 'azules', 'azules'),
  A('green', 'verde', 'verde', ['obj', 'clean', 'open', 'find'], 'verdes', 'verdes'),
  A('yellow', 'amarillo', 'amarilla', ['obj', 'clean', 'open', 'find']),
  A('small', 'pequeño', 'pequeña', ['obj', 'clean', 'open', 'find', 'animal', 'place', 'read']),
  A('big', 'grande', 'grande', ['obj', 'clean', 'open', 'find', 'animal', 'place', 'read'], 'grandes', 'grandes'),
  A('new', 'nuevo', 'nueva', ['obj', 'clean', 'open', 'find', 'place', 'read']),
  A('old', 'viejo', 'vieja', ['obj', 'clean', 'open', 'find', 'animal', 'place', 'read']),
  A('pretty', 'bonito', 'bonita', ['obj', 'clean', 'animal', 'place']),
  A('clean', 'limpio', 'limpia', ['place']),
  A('expensive', 'caro', 'cara', ['obj']),
  A('cheap', 'barato', 'barata', ['obj']),
]

interface Subj { en: string; es: string; p: 0 | 1 | 2 | 3 } // 0 yo, 1 él/ella, 2 nosotros, 3 ellos
const SUBJECTS: Subj[] = [
  { en: 'I', es: '', p: 0 },
  { en: 'he', es: 'él', p: 1 },
  { en: 'she', es: 'ella', p: 1 },
  { en: 'we', es: '', p: 2 },
  { en: 'they', es: 'ellos', p: 3 },
]

interface Verb { en: string; en3: string; inf: string; forms: [string, string, string, string]; obj: Cat[] }
const V = (en: string, en3: string, inf: string, forms: [string, string, string, string], obj: Cat[]): Verb => ({ en, en3, inf, forms, obj })
const VERBS: Record<string, Verb> = {
  want: V('want', 'wants', 'querer', ['quiero', 'quiere', 'queremos', 'quieren'], ['obj']),
  need: V('need', 'needs', 'necesitar', ['necesito', 'necesita', 'necesitamos', 'necesitan'], ['obj']),
  have: V('have', 'has', 'tener', ['tengo', 'tiene', 'tenemos', 'tienen'], ['obj', 'animal']),
  buy: V('buy', 'buys', 'comprar', ['compro', 'compra', 'compramos', 'compran'], ['obj']),
  see: V('see', 'sees', 'ver', ['veo', 've', 'vemos', 'ven'], ['obj', 'animal', 'nature']),
  lookFor: V('look for', 'looks for', 'buscar', ['busco', 'busca', 'buscamos', 'buscan'], ['find']),
  read: V('read', 'reads', 'leer', ['leo', 'lee', 'leemos', 'leen'], ['read']),
  open: V('open', 'opens', 'abrir', ['abro', 'abre', 'abrimos', 'abren'], ['open']),
  clean: V('clean', 'cleans', 'limpiar', ['limpio', 'limpia', 'limpiamos', 'limpian'], ['clean']),
  go: V('go', 'goes', 'ir', ['voy', 'va', 'vamos', 'van'], ['place']),
}
const OBJECT_VERBS = ['want', 'need', 'have', 'buy', 'see', 'lookFor']
const INFINITIVE_VERBS = ['buy', 'see', 'lookFor', 'read', 'open', 'clean']

const BE_GOING: [string, string, string, string] = ['am going', 'is going', 'are going', 'are going']

const HABIT_TIMES: [string, string][] = [
  ['every day', 'todos los días'],
  ['every week', 'todas las semanas'],
  ['on Saturdays', 'los sábados'],
  ['on Sundays', 'los domingos'],
  ['in the morning', 'por la mañana'],
  ['in the afternoon', 'por la tarde'],
  ['after school', 'después de la escuela'],
]
const FUTURE_TIMES: [string, string][] = [
  ['today', 'hoy'],
  ['tomorrow', 'mañana'],
  ['tonight', 'esta noche'],
  ['this weekend', 'este fin de semana'],
  ['next week', 'la próxima semana'],
]
const NUMBERS: [string, string][] = [['two', 'dos'], ['three', 'tres'], ['four', 'cuatro'], ['five', 'cinco'], ['six', 'seis']]

const art = (n: Noun, def: boolean, plural = false) =>
  def ? (plural ? (n.g === 'm' ? 'los' : 'las') : n.g === 'm' ? 'el' : 'la') : plural ? (n.g === 'm' ? 'unos' : 'unas') : n.g === 'm' ? 'un' : 'una'
const adjEs = (a: Adj, n: Noun, plural = false) => (plural ? (n.g === 'm' ? a.mp : a.fp) : n.g === 'm' ? a.ms : a.fs)
const toPlace = (p: Noun) => (p.g === 'm' ? `al ${p.es}` : `a la ${p.es}`)
const subjEn = (s: Subj) => (s.en === 'I' ? 'I' : s.en)
const verbEn = (v: Verb, s: Subj) => (s.p === 1 ? v.en3 : v.en)
const esClause = (s: Subj, verbForm: string) => (s.es ? `${s.es} ${verbForm}` : verbForm)

function nounFor(r: () => number, cats: Cat[]): Noun {
  const pool = NOUNS.filter((n) => n.cats.some((c) => cats.includes(c)))
  return pick(r, pool)
}
function adjFor(r: () => number, n: Noun): Adj {
  const pool = n.adjs ? ADJS.filter((a) => n.adjs!.includes(a.en)) : ADJS.filter((a) => a.for.some((c) => n.cats.includes(c)))
  return pick(r, pool.length ? pool : ADJS)
}

function sentence(en: string, es: string, question = false): { en: string; es: string } {
  const e = cap(en) + (question ? '?' : '.')
  const s = question ? `¿${cap(es)}?` : cap(es) + '.'
  return { en: e, es: s }
}

function entry(en: string, es: string): SpanishEntry {
  return { en, es, phonetic: '', phraseEs: '', phraseEn: '', variants: [] }
}

function spanishItem(r: () => number, level: number): SpanishEntry {
  // 7-15: articles with nouns ("the cat" / "a cat")
  if (level <= 15) {
    const n = pick(r, [...NOUNS, ...PLACES])
    const def = r() < 0.5
    return entry(def ? `the ${n.en}` : `${aAn(n.en)} ${n.en}`, `${art(n, def)} ${n.es}`)
  }
  // 16-25: article + noun + adjective (agreement)
  if (level <= 25) {
    const n = pick(r, NOUNS)
    const a = adjFor(r, n)
    const def = r() < 0.5
    return entry(def ? `the ${a.en} ${n.en}` : `${aAn(a.en)} ${a.en} ${n.en}`, `${art(n, def)} ${n.es} ${adjEs(a, n)}`)
  }
  // 26-35: plurals and numbers
  if (level <= 35) {
    const n = pick(r, NOUNS)
    const a = adjFor(r, n)
    if (r() < 0.5) return entry(`the ${a.en} ${n.enPl}`, `${art(n, true, true)} ${n.esPl} ${adjEs(a, n, true)}`)
    const [ne, ns] = pick(r, NUMBERS)
    return entry(`${ne} ${a.en} ${n.enPl}`, `${ns} ${n.esPl} ${adjEs(a, n, true)}`)
  }
  // 36-50: subject + verb + a/the + adjective + noun
  if (level <= 50) {
    const s = pick(r, SUBJECTS)
    const v = VERBS[pick(r, OBJECT_VERBS)]
    const n = nounFor(r, v.obj)
    const a = adjFor(r, n)
    const def = level > 43 && r() < 0.5
    const en = `${subjEn(s)} ${verbEn(v, s)} ${def ? 'the' : aAn(a.en)} ${a.en} ${n.en}`
    const es = `${esClause(s, v.forms[s.p])} ${art(n, def)} ${n.es} ${adjEs(a, n)}`
    const out = sentence(en, es)
    return entry(out.en, out.es)
  }
  // 51-65: going places, habits, and questions
  if (level <= 65) {
    const t = Math.floor(r() * 3)
    if (t === 0) {
      const s = pick(r, SUBJECTS)
      const p = pick(r, PLACES)
      const [te, ts] = pick(r, HABIT_TIMES)
      const out = sentence(`${subjEn(s)} ${verbEn(VERBS.go, s)} to the ${p.en} ${te}`, `${esClause(s, VERBS.go.forms[s.p])} ${toPlace(p)} ${ts}`)
      return entry(out.en, out.es)
    }
    if (t === 1) {
      const p = pick(r, [...PLACES, ...NOUNS.filter((n) => n.cats.includes('find'))])
      const out = sentence(`where is the ${p.en}`, `dónde está ${art(p, true)} ${p.es}`, true)
      return entry(out.en, out.es)
    }
    const n = nounFor(r, ['obj'])
    const a = adjFor(r, n)
    const plural = r() < 0.4
    const out = plural
      ? sentence(`how much are the ${a.en} ${n.enPl}`, `cuánto cuestan ${art(n, true, true)} ${n.esPl} ${adjEs(a, n, true)}`, true)
      : sentence(`how much is the ${a.en} ${n.en}`, `cuánto cuesta ${art(n, true)} ${n.es} ${adjEs(a, n)}`, true)
    return entry(out.en, out.es)
  }
  // 66-80: want/need to + infinitive, and "going to" future
  if (level <= 80) {
    const s = pick(r, SUBJECTS)
    const inf = VERBS[pick(r, INFINITIVE_VERBS)]
    const n = nounFor(r, inf.obj)
    const a = adjFor(r, n)
    const [te, ts] = pick(r, FUTURE_TIMES)
    if (r() < 0.5) {
      const main = VERBS[pick(r, ['want', 'need'])]
      const out = sentence(
        `${subjEn(s)} ${verbEn(main, s)} to ${inf.en} the ${a.en} ${n.en} ${te}`,
        `${esClause(s, main.forms[s.p])} ${inf.inf} ${art(n, true)} ${n.es} ${adjEs(a, n)} ${ts}`,
      )
      return entry(out.en, out.es)
    }
    const out = sentence(
      `${subjEn(s)} ${BE_GOING[s.p]} to ${inf.en} ${aAn(a.en)} ${a.en} ${n.en} ${te}`,
      `${esClause(s, VERBS.go.forms[s.p])} a ${inf.inf} ${art(n, false)} ${n.es} ${adjEs(a, n)} ${ts}`,
    )
    return entry(out.en, out.es)
  }
  // 81-100: two-part sentences
  const s = pick(r, SUBJECTS)
  const p = pick(r, PLACES.filter((x) => x.en === 'store' || x.en === 'market'))
  const n = nounFor(r, ['obj'])
  const a = adjFor(r, n)
  const t = Math.floor(r() * (level <= 90 ? 2 : 3))
  if (t === 0) {
    const [te, ts] = pick(r, HABIT_TIMES)
    const out = sentence(
      `${subjEn(s)} ${verbEn(VERBS.go, s)} to the ${p.en} ${te} to buy ${aAn(a.en)} ${a.en} ${n.en}`,
      `${esClause(s, VERBS.go.forms[s.p])} ${toPlace(p)} ${ts} para comprar ${art(n, false)} ${n.es} ${adjEs(a, n)}`,
    )
    return entry(out.en, out.es)
  }
  if (t === 1) {
    const want = VERBS.want
    const need = VERBS.need
    const s2en = s.en === 'I' ? 'I' : s.en
    const out = sentence(
      `${subjEn(s)} ${verbEn(want, s)} to go to the ${p.en} because ${s2en} ${verbEn(need, s)} ${aAn(a.en)} ${a.en} ${n.en}`,
      `${esClause(s, want.forms[s.p])} ir ${toPlace(p)} porque ${need.forms[s.p]} ${art(n, false)} ${n.es} ${adjEs(a, n)}`,
    )
    return entry(out.en, out.es)
  }
  const buy = VERBS.buy
  const out = sentence(
    `when ${subjEn(s)} ${verbEn(VERBS.go, s)} to the ${p.en}, ${subjEn(s)} always ${verbEn(buy, s)} ${aAn(a.en)} ${a.en} ${n.en}`,
    `cuando ${esClause(s, VERBS.go.forms[s.p])} ${toPlace(p)}, siempre ${buy.forms[s.p]} ${art(n, false)} ${n.es} ${adjEs(a, n)}`,
  )
  return entry(out.en, out.es)
}

function buildSpanish(): Record<number, SpanishEntry[]> {
  const out: Record<number, SpanishEntry[]> = {}
  // Levels 1-6: traveler's essentials first (greetings, help, numbers, food, directions, emergencies).
  for (let l = 1; l <= 6; l++) out[l] = TOURIST_LEVELS[l]
  const used = new Set<string>()
  for (let l = 1; l <= 6; l++) out[l].forEach((e) => used.add(e.en.toLowerCase()))
  fillLevels(out, 7, MAX_LEVEL, 'spanish', (e) => e.en, used, spanishItem)
  return out
}

export const READING_LEVELS: Record<number, string[]> = buildReading()
export const SPANISH_LEVELS: Record<number, SpanishEntry[]> = buildSpanish()

/**
 * Spelling Bee: 100 levels of 10 words, easiest to championship. Each level overlaps the one
 * before it by about half, so every word comes up twice for review.
 */
function buildSpelling(): Record<number, SpellEntry[]> {
  const out: Record<number, SpellEntry[]> = {}
  const n = SPELLING_WORDS.length
  for (let level = 1; level <= MAX_LEVEL; level++) {
    const start = Math.round(((level - 1) * (n - ITEMS_PER_LEVEL)) / (MAX_LEVEL - 1))
    out[level] = SPELLING_WORDS.slice(start, start + ITEMS_PER_LEVEL)
  }
  return out
}
export const SPELLING_LEVELS: Record<number, SpellEntry[]> = buildSpelling()
