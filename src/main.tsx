import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/inter/latin-700.css'
import '@fontsource/fredoka/latin-500.css'
import '@fontsource/fredoka/latin-600.css'
import '@fontsource/fredoka/latin-700.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { initTheme } from './lib/theme'
import { migrateLegacyStorage } from './lib/storage'

// Settings saved under the app's old name move to the new keys (once).
migrateLegacyStorage()
// Light or dark before the first paint, so there's no flash.
initTheme()
import { registerSW } from 'virtual:pwa-register'
import ErrorBoundary from './components/ErrorBoundary'
import { watchForErrors } from './lib/problems'
import Root from './Root'

// App errors go to the admin's problem list (src/lib/problems.ts).
watchForErrors()

// Installable app (PWA): works from the Home Screen and offline. When a new version is published,
// load it right away instead of showing the old cached copy; check on launch, when the app comes
// back to the foreground, and every hour.
registerSW({
  immediate: true,
  onRegisteredSW(_url, reg) {
    if (!reg) return
    const check = () => void reg.update().catch(() => {})
    setInterval(check, 60 * 60 * 1000)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') check()
    })
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <Root />
    </ErrorBoundary>
  </StrictMode>,
)
