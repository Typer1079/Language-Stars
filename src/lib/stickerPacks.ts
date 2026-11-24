import type { StickerItem } from './stickerPool'

/** Themed packs a reader can pick for their next shop visit. All original (built-in emoji only). */
export interface StickerPack {
  id: string
  name: string
  icon: string
  items: StickerItem[]
}

const item = (pack: string, emoji: string, label: string, cost = 1): StickerItem => ({
  id: `${pack}-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
  label,
  emoji,
  cost,
  themes: [`pack:${pack}`],
})

export const STICKER_PACKS: StickerPack[] = [
  {
    id: 'treats', name: 'Cute Treats', icon: '🧁',
    items: [
      item('treats', '🧁', 'Cupcake Cutie'), item('treats', '🍓', 'Berry Sweet'), item('treats', '🍩', 'Sprinkle Donut'),
      item('treats', '🍦', 'Swirly Cone'), item('treats', '🥐', 'Croissant Pal'), item('treats', '🧃', 'Juice Buddy'),
      item('treats', '🍪', 'Cookie Crumb'), item('treats', '🍭', 'Lolli Pop', 2), item('treats', '🍉', 'Melon Smile'),
      item('treats', '🥑', 'Avo Friend'), item('treats', '🫐', 'Blueberry Babe'), item('treats', '🍒', 'Cherry Twins', 2),
      item('treats', '🎂', 'Party Cake', 3), item('treats', '🧋', 'Bubble Tea', 2),
    ],
  },
  {
    id: 'angels', name: 'Little Angels', icon: '👼',
    items: [
      item('angels', '👼', 'Little Angel', 2), item('angels', '🧚', 'Fairy Friend', 2), item('angels', '🦄', 'Unicorn', 3),
      item('angels', '🌸', 'Blossom'), item('angels', '🐰', 'Bunny Buddy'), item('angels', '🐻', 'Teddy'),
      item('angels', '🐥', 'Chickie'), item('angels', '🎀', 'Bow'), item('angels', '🌙', 'Sleepy Moon'),
      item('angels', '🐱', 'Kitty'), item('angels', '🌈', 'Rainbow', 2), item('angels', '🦋', 'Butterfly'),
    ],
  },
  {
    id: 'robots', name: 'Robo Racers', icon: '🤖',
    items: [
      item('robots', '🤖', 'Robo Pal'), item('robots', '🦾', 'Power Arm', 2), item('robots', '🚀', 'Rocket Bot'),
      item('robots', '🛸', 'Space Saucer', 2), item('robots', '🛻', 'Pickup Bot'), item('robots', '🚜', 'Tractor Bot'),
      item('robots', '🚁', 'Copter Bot'), item('robots', '⚙️', 'Gear'), item('robots', '🔋', 'Battery'),
      item('robots', '🛰️', 'Satellite', 2), item('robots', '🚒', 'Fire Rescue Bot', 3), item('robots', '⚡', 'Lightning'),
    ],
  },
  {
    id: 'cars', name: 'Super Cars', icon: '🏎️',
    items: [
      item('cars', '🏎️', 'Race Car', 2), item('cars', '🚗', 'Sports Coupe'), item('cars', '🚙', 'Off-Roader'),
      item('cars', '🚓', 'Police Cruiser'), item('cars', '🚕', 'Taxi'), item('cars', '🏁', 'Checkered Flag'),
      item('cars', '🛞', 'Racing Tire'), item('cars', '🏆', 'Winner Cup', 3), item('cars', '⛽', 'Fuel Stop'),
      item('cars', '🚦', 'Start Lights'), item('cars', '🚘', 'Supercar', 2), item('cars', '🔧', 'Pit Crew Wrench'),
    ],
  },
  {
    id: 'moto', name: 'Motorcycles', icon: '🏍️',
    items: [
      item('moto', '🏍️', 'Motorcycle', 2), item('moto', '🛵', 'Scooter'), item('moto', '🪖', 'Helmet'),
      item('moto', '🏁', 'Finish Flag'), item('moto', '🛣️', 'Open Road'), item('moto', '🔥', 'Flames'),
      item('moto', '🧤', 'Riding Gloves'), item('moto', '🏔️', 'Mountain Trail', 2), item('moto', '🚲', 'BMX Bike'),
      item('moto', '🛞', 'Knobby Tire'), item('moto', '🏆', 'Moto Trophy', 3), item('moto', '💨', 'Zoom'),
    ],
  },
  {
    id: 'sports', name: 'Sports', icon: '⚽',
    items: [
      item('sports', '⚽', 'Soccer Ball'), item('sports', '🏀', 'Basketball'), item('sports', '🏈', 'Football'),
      item('sports', '⚾', 'Baseball'), item('sports', '🎾', 'Tennis'), item('sports', '🏐', 'Volleyball'),
      item('sports', '🏉', 'Rugby'), item('sports', '🏒', 'Hockey'), item('sports', '🥇', 'Gold Medal', 2),
      item('sports', '🏆', 'Championship', 3), item('sports', '🥅', 'Goal'), item('sports', '👟', 'Cleats'),
      item('sports', '🧢', 'Team Cap'), item('sports', '📣', 'Cheer'),
    ],
  },
]

export const FOR_YOU = 'for-you'

export function packById(id: string | null | undefined): StickerPack | undefined {
  return STICKER_PACKS.find((p) => p.id === id)
}

const key = (learnerId: string) => `ras.pack.${learnerId}`

/** The pack a reader chose for their next shop visit (kept on this device only). */
export function loadPackChoice(learnerId: string): string {
  try {
    const v = localStorage.getItem(key(learnerId))
    return v && (v === FOR_YOU || packById(v)) ? v : FOR_YOU
  } catch {
    return FOR_YOU
  }
}

export function savePackChoice(learnerId: string, packId: string) {
  try {
    localStorage.setItem(key(learnerId), packId)
  } catch {
    /* private browsing: choice just isn't remembered */
  }
}
