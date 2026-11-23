/**
 * After an update is published, an open app can still be running the previous version while the
 * files it would load next were replaced. When loading one fails, reload once to pick up the new version.
 */
const KEY = 'read-aloud-stars.reloaded-for-update'

export function reloadForUpdate(): boolean {
  try {
    const last = Number(sessionStorage.getItem(KEY) ?? 0)
    if (Date.now() - last < 60_000) return false
    sessionStorage.setItem(KEY, String(Date.now()))
  } catch {
    // Private mode without storage: still reload once.
  }
  window.location.reload()
  return true
}

export function isLoadError(err: unknown): boolean {
  const msg = err instanceof Error ? `${err.name} ${err.message}` : String(err)
  return /dynamically imported module|Importing a module script failed|Failed to fetch|ChunkLoadError|Loading chunk|error loading dynamically|module script/i.test(msg)
}
