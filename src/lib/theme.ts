/** Light / dark appearance. 'system' follows the device setting. Saved per device. */
export type ThemeChoice = 'system' | 'light' | 'dark'
const KEY = 'ras.theme'

export function getThemeChoice(): ThemeChoice {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'light' || v === 'dark' ? v : 'system'
  } catch {
    return 'system'
  }
}

const media = () => window.matchMedia?.('(prefers-color-scheme: dark)')

export function applyTheme(choice: ThemeChoice = getThemeChoice()) {
  const dark = choice === 'dark' || (choice === 'system' && Boolean(media()?.matches))
  document.documentElement.classList.toggle('dark', dark)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0f172a' : '#4f46e5')
}

export function setThemeChoice(choice: ThemeChoice) {
  try { localStorage.setItem(KEY, choice) } catch { /* private mode: applies for this visit only */ }
  applyTheme(choice)
}

/** Apply now and follow the device setting when it changes (only matters for 'system'). */
export function initTheme() {
  applyTheme()
  media()?.addEventListener?.('change', () => applyTheme())
}
