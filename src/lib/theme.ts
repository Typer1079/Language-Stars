/** Light / dark appearance. 'system' follows the device setting. Saved per device. */
export type ThemeChoice = 'system' | 'light' | 'dark'
import { KEYS, local } from './storage'

const KEY = KEYS.theme

export function getThemeChoice(): ThemeChoice {
  const v = local.get(KEY)
  return v === 'light' || v === 'dark' ? v : 'system'
}

const media = () => window.matchMedia?.('(prefers-color-scheme: dark)')

export function applyTheme(choice: ThemeChoice = getThemeChoice()) {
  const dark = choice === 'dark' || (choice === 'system' && Boolean(media()?.matches))
  document.documentElement.classList.toggle('dark', dark)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0f172a' : '#4f46e5')
}

export function setThemeChoice(choice: ThemeChoice) {
  local.set(KEY, choice) // private mode: applies for this visit only
  applyTheme(choice)
}

/** Apply now and follow the device setting when it changes (only matters for 'system'). */
export function initTheme() {
  applyTheme()
  media()?.addEventListener?.('change', () => applyTheme())
}
