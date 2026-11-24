/**
 * Word-based phonics: Iris helps with whole chunks of a word (beginning + rhyme part,
 * or syllables you can clap), never single letter sounds.
 */

/** Syllables to show, and (when the written chunk would be misread by the voice) how to say them. */
const SYLLABLES: Record<string, { show: string[]; say?: string[] }> = {
  rabbit: { show: ['rab', 'bit'] },
  kitten: { show: ['kit', 'ten'], say: ['kit', 'tin'] },
  basket: { show: ['bas', 'ket'], say: ['bass', 'kit'] },
  sunset: { show: ['sun', 'set'] },
  picnic: { show: ['pic', 'nic'], say: ['pick', 'nick'] },
  napkin: { show: ['nap', 'kin'] },
  muffin: { show: ['muf', 'fin'], say: ['muff', 'in'] },
  puppet: { show: ['pup', 'pet'], say: ['pup', 'pit'] },
  pencil: { show: ['pen', 'cil'], say: ['pen', 'sill'] },
  window: { show: ['win', 'dow'], say: ['win', 'dough'] },
  yellow: { show: ['yel', 'low'] },
  happy: { show: ['hap', 'py'], say: ['hap', 'pee'] },
  monkey: { show: ['mon', 'key'], say: ['mung', 'key'] },
  turtle: { show: ['tur', 'tle'], say: ['tur', 'tull'] },
  button: { show: ['but', 'ton'], say: ['butt', 'un'] },
  number: { show: ['num', 'ber'] },
  winter: { show: ['win', 'ter'] },
  summer: { show: ['sum', 'mer'] },
  doctor: { show: ['doc', 'tor'], say: ['dock', 'ter'] },
  flower: { show: ['flow', 'er'] },
  pillow: { show: ['pil', 'low'], say: ['pill', 'low'] },
  water: { show: ['wa', 'ter'], say: ['wah', 'ter'] },
  paper: { show: ['pa', 'per'], say: ['pay', 'per'] },
  zipper: { show: ['zip', 'per'] },
  banana: { show: ['ba', 'na', 'na'], say: ['buh', 'nan', 'uh'] },
  elephant: { show: ['el', 'e', 'phant'], say: ['el', 'uh', 'fant'] },
  computer: { show: ['com', 'pu', 'ter'], say: ['come', 'pew', 'ter'] },
  umbrella: { show: ['um', 'brel', 'la'], say: ['um', 'brell', 'uh'] },
  dinosaur: { show: ['di', 'no', 'saur'], say: ['die', 'no', 'sore'] },
  butterfly: { show: ['but', 'ter', 'fly'] },
  kangaroo: { show: ['kan', 'ga', 'roo'], say: ['kang', 'guh', 'roo'] },
  tomato: { show: ['to', 'ma', 'to'], say: ['tuh', 'may', 'toe'] },
  potato: { show: ['po', 'ta', 'to'], say: ['puh', 'tay', 'toe'] },
  family: { show: ['fam', 'i', 'ly'], say: ['fam', 'uh', 'lee'] },
  animal: { show: ['an', 'i', 'mal'], say: ['an', 'uh', 'mull'] },
  octopus: { show: ['oc', 'to', 'pus'], say: ['ock', 'tuh', 'puss'] },
  rocket: { show: ['rock', 'et'], say: ['rock', 'it'] },
  planet: { show: ['plan', 'et'], say: ['plan', 'it'] },
  dragon: { show: ['drag', 'on'], say: ['drag', 'un'] },
  castle: { show: ['cas', 'tle'], say: ['cass', 'ull'] },
  dolphin: { show: ['dol', 'phin'], say: ['doll', 'fin'] },
  rainbow: { show: ['rain', 'bow'], say: ['rain', 'bo'] },
  monster: { show: ['mon', 'ster'] },
  pirate: { show: ['pi', 'rate'], say: ['pie', 'rit'] },
  garden: { show: ['gar', 'den'] },
  butter: { show: ['but', 'ter'] },
  adventure: { show: ['ad', 'ven', 'ture'], say: ['add', 'ven', 'chur'] },
  treasure: { show: ['trea', 'sure'], say: ['treh', 'zhur'] },
  tiger: { show: ['ti', 'ger'], say: ['tie', 'ger'] },
  river: { show: ['riv', 'er'] },
  lion: { show: ['li', 'on'], say: ['lie', 'un'] },
}

/** Rhyme families, keyed by the part of the word from its first vowel on. */
const FAMILIES: Record<string, string[]> = {
  at: ['cat', 'hat', 'bat', 'mat', 'sat'], an: ['can', 'fan', 'man', 'pan', 'van'], ap: ['cap', 'map', 'nap', 'tap'],
  ag: ['bag', 'tag', 'flag'], ad: ['dad', 'sad', 'bad'], am: ['jam', 'ham', 'ram'], ack: ['back', 'pack', 'black'],
  ab: ['crab', 'cab'], amp: ['lamp', 'camp'], ath: ['bath', 'path'],
  ed: ['bed', 'red', 'fed'], en: ['hen', 'pen', 'ten', 'men'], et: ['jet', 'net', 'pet', 'wet'], ell: ['bell', 'well', 'tell'],
  eck: ['neck', 'deck', 'check'], est: ['nest', 'best', 'rest'],
  ig: ['pig', 'big', 'dig', 'wig'], in: ['pin', 'win', 'fin', 'chin'], it: ['sit', 'hit', 'bit', 'fit'],
  ip: ['ship', 'dip', 'lip', 'chip', 'zip'], ill: ['hill', 'fill', 'will'], ick: ['kick', 'pick', 'sick', 'stick'],
  ish: ['fish', 'dish', 'wish'], ing: ['ring', 'sing', 'king', 'wing'], im: ['swim', 'him'], ilk: ['milk', 'silk'],
  og: ['dog', 'log', 'frog', 'fog'], op: ['top', 'hop', 'mop', 'shop', 'chop'], ot: ['hot', 'pot', 'dot'],
  ock: ['rock', 'sock', 'lock', 'clock'], ox: ['box', 'fox'], ong: ['long', 'song'],
  ug: ['bug', 'hug', 'mug', 'rug'], un: ['sun', 'fun', 'run', 'bun'], ut: ['nut', 'cut', 'hut'], up: ['cup', 'pup'],
  uck: ['duck', 'luck', 'truck'], uch: ['much', 'such'], um: ['drum', 'gum', 'hum'], us: ['bus', 'plus'],
  ake: ['cake', 'lake', 'make', 'snake'], ate: ['gate', 'late', 'plate'], ame: ['game', 'name', 'same', 'flame'],
  ane: ['plane', 'cane'], ape: ['tape', 'shape', 'grape'], ave: ['wave', 'cave', 'save'],
  ike: ['bike', 'like', 'hike'], ite: ['kite', 'bite', 'white'], ime: ['time', 'lime'], ive: ['five', 'dive', 'hive'],
  ine: ['line', 'nine', 'fine'], ide: ['ride', 'hide', 'side'], ile: ['smile', 'mile', 'pile'],
  ome: ['home', 'dome'], one: ['bone', 'cone', 'stone'], ope: ['rope', 'hope'], ose: ['nose', 'rose', 'hose'],
  ole: ['hole', 'pole', 'mole'], oke: ['smoke', 'joke', 'poke'],
  eet: ['feet', 'sweet', 'meet'], eek: ['week', 'peek'], een: ['green', 'queen', 'seen'], eep: ['sheep', 'sleep', 'deep'],
  eed: ['seed', 'need', 'feed'], ee: ['tree', 'bee', 'see'], eam: ['team', 'dream', 'cream'], each: ['beach', 'peach', 'reach'],
  ean: ['clean', 'bean', 'mean'], oat: ['boat', 'coat', 'goat'], oad: ['road', 'toad', 'load'],
  ain: ['rain', 'train', 'chain'], ail: ['tail', 'mail', 'snail'], aint: ['paint', 'faint'],
  ay: ['day', 'play', 'stay', 'gray', 'say'], ar: ['car', 'star', 'jar', 'far'], arm: ['farm', 'arm'],
  ark: ['park', 'shark', 'dark', 'bark'], orn: ['corn', 'horn', 'born'], ork: ['fork', 'pork'], orm: ['storm', 'form'],
  irl: ['girl', 'swirl'], urn: ['turn', 'burn'], urse: ['nurse', 'purse'], irt: ['shirt', 'dirt', 'skirt'],
  ight: ['light', 'night', 'right'], ird: ['bird', 'third'], oud: ['cloud', 'loud', 'proud'], ouse: ['house', 'mouse'],
  ow: ['snow', 'grow', 'show'], ant: ['plant', 'ant', 'pant'], air: ['chair', 'hair', 'pair'],
}

/** Words whose spelling family would give the wrong rhyme (or none). */
const RHYME_OVERRIDES: Record<string, string[]> = {
  bread: ['head', 'spread'], read: ['seed', 'need'], bear: ['pear', 'wear'], heart: ['part', 'start'],
  horse: ['course'], her: ['fur', 'stir'], go: ['no', 'so'], no: ['go', 'so'], so: ['go', 'no'],
  he: ['me', 'we'], me: ['he', 'we'], we: ['he', 'me'], my: ['by', 'fly'], by: ['my', 'fly'], hi: ['my', 'by'],
  to: ['do', 'two'], is: ['his'], or: ['for'], of: [], on: [], wind: ['pinned', 'grinned'], leaf: ['thief', 'chief'], soap: ['hope', 'rope'], this: ['kiss'], that: ['cat', 'hat'],
}

const VOWEL = /[aeiou]/

/** Beginning sound(s) and the rhyming part: "ship" → ["sh", "ip"], "queen" → ["qu", "een"]. */
export function onsetRime(word: string): [string, string] {
  const w = word.toLowerCase()
  let i = w.startsWith('qu') ? 2 : 0
  while (i < w.length && !VOWEL.test(w[i]) && !(w[i] === 'y' && i > 0)) i++
  if (i >= w.length) return ['', w]
  return [w.slice(0, i), w.slice(i)]
}

/** Simple syllable split for words not in the list: break between vowel groups (VC·CV, V·CV). */
function autoSyllables(w: string): string[] {
  const isV = (c: string, i: number) => VOWEL.test(c) || (c === 'y' && i > 0)
  const groups: number[] = []
  for (let i = 0; i < w.length; i++) if (isV(w[i], i) && (i === 0 || !isV(w[i - 1], i - 1))) groups.push(i)
  // Silent e at the end doesn't make a syllable (but "-le" after a consonant does).
  if (groups.length > 1 && w.endsWith('e') && groups[groups.length - 1] === w.length - 1 && !/[^aeiou]le$/.test(w)) groups.pop()
  if (groups.length < 2) return [w]
  const out: string[] = []
  let start = 0
  for (let g = 1; g < groups.length; g++) {
    let vEnd = groups[g - 1]
    while (vEnd < w.length && isV(w[vEnd], vEnd)) vEnd++
    const cons = groups[g] - vEnd
    const cut = cons <= 1 ? vEnd : vEnd + 1
    out.push(w.slice(start, cut))
    start = cut
  }
  out.push(w.slice(start))
  return out.filter(Boolean)
}

/** The clap-able syllables of a word. */
export function syllables(word: string): string[] {
  const w = word.toLowerCase()
  return SYLLABLES[w]?.show ?? autoSyllables(w)
}

/** Up to two everyday words that rhyme with this one. */
export function rhymesFor(word: string): string[] {
  const w = word.toLowerCase()
  const list = RHYME_OVERRIDES[w] ?? FAMILIES[onsetRime(w)[1]] ?? []
  return list.filter((r) => r !== w).slice(0, 2)
}

export interface WordHelp {
  /** Chunks shown as tiles: onset + rime for one-syllable words, syllables otherwise. */
  chunks: string[]
  kind: 'rhyme' | 'syllables' | 'whole'
  rhymes: string[]
  /** What Iris says, word-based (never single letters). */
  speech: string
}

/** Everything Iris needs to help with a word, and what the screen shows. */
export function wordHelp(word: string, callout: string): WordHelp {
  const w = word.toLowerCase()
  // Long academic words: show and say the whole word (automatic syllable splits get these wrong).
  if (w.length > 9 && !SYLLABLES[w]) {
    return { chunks: [word], kind: 'whole', rhymes: [], speech: `This word is ${word}. Listen: ${word}. Now you say it, ${callout}.` }
  }
  const parts = syllables(w)
  if (parts.length > 1) {
    const said = SYLLABLES[w]?.say ?? parts
    return {
      chunks: parts.map((p, i) => (i === 0 && word[0] !== w[0] ? word[0] + p.slice(1) : p)),
      kind: 'syllables',
      rhymes: [],
      speech: `Let's clap it out. ${said.join('... ')}... ${word}! Now you say it, ${callout}.`,
    }
  }
  const rhymes = rhymesFor(w)
  const [onset, rime] = onsetRime(w)
  const chunks = onset && rime.length > 1 ? [word.slice(0, onset.length), word.slice(onset.length)] : [word]
  if (rhymes.length) {
    const list = rhymes.length === 2 ? `${rhymes[0]} and ${rhymes[1]}` : rhymes[0]
    return { chunks, kind: 'rhyme', rhymes, speech: `${word}. It rhymes with ${list}. ${word}! Now you say it, ${callout}.` }
  }
  return { chunks, kind: 'whole', rhymes, speech: `This word is ${word}. Listen: ${word}. Now you say it, ${callout}.` }
}
