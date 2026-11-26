/**
 * Small settings kept on this device (browser storage). Every key starts with one prefix so the
 * app's data is easy to find and clear. Storage can be missing (private browsing, some in-app
 * browsers), so every read and write is safe to call and simply does nothing then.
 */
export const STORAGE_PREFIX = 'language-stars.'

/** Every key the app uses, in one place. */
export const KEYS = {
  theme: 'theme',
  pendingTerms: 'pending-terms',
  faceIdOnDevice: 'faceid-on-this-device',
  faceIdOfferDismissed: 'faceid-offer-dismissed',
  stickerPack: (learnerId: string) => `sticker-pack.${learnerId}`,
  reloadedForUpdate: 'reloaded-for-update',
} as const

const full = (name: string) => STORAGE_PREFIX + name

function area(kind: 'local' | 'session'): Storage | null {
  try {
    return kind === 'local' ? window.localStorage : window.sessionStorage
  } catch {
    return null
  }
}

function make(kind: 'local' | 'session') {
  return {
    get(name: string): string | null {
      try { return area(kind)?.getItem(full(name)) ?? null } catch { return null }
    },
    set(name: string, value: string) {
      try { area(kind)?.setItem(full(name), value) } catch { /* storage full or unavailable */ }
    },
    remove(name: string) {
      try { area(kind)?.removeItem(full(name)) } catch { /* unavailable */ }
    },
    getJson<T>(name: string): T | null {
      const v = this.get(name)
      if (v == null) return null
      try { return JSON.parse(v) as T } catch { return null }
    },
    setJson(name: string, value: unknown) {
      this.set(name, JSON.stringify(value))
    },
  }
}

/** Kept until cleared (theme, Face ID offer, sticker pack). */
export const local = make('local')
/** Kept for this browser tab only. */
export const session = make('session')

/** Keys from before the rename to Language Stars, and their new names. */
const LEGACY: [old: string, name: string][] = [
  ['ras.theme', KEYS.theme],
  ['ras.pendingTerms', KEYS.pendingTerms],
  ['read-aloud-stars.faceid-on-this-device', KEYS.faceIdOnDevice],
  ['read-aloud-stars.faceid-offer-dismissed', KEYS.faceIdOfferDismissed],
]

/** Moves settings saved under the old names, once, so nobody loses dark mode or the Face ID setting. */
export function migrateLegacyStorage(store: Storage | null = area('local')) {
  if (!store) return
  try {
    for (const [old, name] of LEGACY) {
      const v = store.getItem(old)
      if (v == null) continue
      if (store.getItem(full(name)) == null) store.setItem(full(name), v)
      store.removeItem(old)
    }
    const oldPacks: string[] = []
    for (let i = 0; i < store.length; i++) {
      const k = store.key(i)
      if (k?.startsWith('ras.pack.')) oldPacks.push(k)
    }
    for (const k of oldPacks) {
      const v = store.getItem(k)
      const name = full(KEYS.stickerPack(k.slice('ras.pack.'.length)))
      if (v != null && store.getItem(name) == null) store.setItem(name, v)
      store.removeItem(k)
    }
  } catch {
    /* storage unavailable */
  }
}
