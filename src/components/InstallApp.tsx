import { useEffect, useState } from 'react'

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

type Platform = 'ios-safari' | 'ios-other' | 'android' | 'mac-safari' | 'desktop-chromium' | 'firefox' | 'other'

function detect(): Platform {
  const ua = navigator.userAgent
  const ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  if (ios) return /CriOS|FxiOS|EdgiOS/.test(ua) ? 'ios-other' : 'ios-safari'
  if (/Android/.test(ua)) return 'android'
  if (/Firefox\//.test(ua)) return 'firefox'
  if (/Edg\/|Chrome\//.test(ua)) return 'desktop-chromium'
  if (/Safari\//.test(ua) && /Macintosh/.test(ua)) return 'mac-safari'
  return 'other'
}

const STEPS: Record<Platform, { title: string; steps: string[] }> = {
  'ios-safari': { title: 'iPhone or iPad (Safari)', steps: ['Tap the Share button (the square with an arrow) at the bottom or top of Safari.', 'Scroll down and tap “Add to Home Screen”.', 'Tap “Add”. Language Stars appears on your Home Screen like an app, and Face ID sign-in works there too.'] },
  'ios-other': { title: 'iPhone or iPad', steps: ['Tap the Share button (the square with an arrow) in your browser.', 'Tap “Add to Home Screen”, then “Add”. (If you don’t see it, open this page in Safari.)'] },
  android: { title: 'Android (Chrome)', steps: ['Tap the ⋮ menu at the top right.', 'Tap “Install app” or “Add to Home screen”.', 'Tap “Install”. Language Stars opens from your app drawer.'] },
  'mac-safari': { title: 'Mac (Safari)', steps: ['In the menu bar choose File → Add to Dock.', 'Click “Add”. Language Stars opens from the Dock like any app.'] },
  'desktop-chromium': { title: 'Computer (Chrome or Edge)', steps: ['Click the install icon (a screen with a down arrow) at the right end of the address bar,', 'or open the ⋮ / … menu and choose “Install Language Stars” (Chrome: Cast, save and share → Install page as app).', 'Click “Install”.'] },
  firefox: { title: 'Firefox', steps: ['Firefox on computers can’t install web apps. Bookmark this page, or open it in Chrome, Edge or Safari to install it.', 'On Android Firefox: tap ⋮ → “Install” or “Add to Home screen”.'] },
  other: { title: 'Your device', steps: ['Open your browser’s Share or ⋮ menu and look for “Add to Home Screen” or “Install app”.'] },
}

/** "Save as an app" help on the sign-in page, for whatever device is in use. Hidden once installed. */
export default function InstallApp() {
  const [installed] = useState(() => window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true)
  const [platform] = useState(detect)
  const [open, setOpen] = useState(false)
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null)

  useEffect(() => {
    const onPrompt = (e: Event) => { e.preventDefault(); setPrompt(e as InstallPromptEvent) }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  if (installed) return null
  const info = STEPS[platform]
  return (
    <div className="mt-8 rounded-2xl border border-indigo-100 bg-white/80 p-4 text-sm shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📲</span>
          <div>
            <div className="font-bold text-slate-800">Save Language Stars as an app</div>
            <div className="text-xs text-slate-500">Opens full screen from your Home Screen or Dock.</div>
          </div>
        </div>
        {prompt ? (
          <button type="button" className="btn-primary shrink-0 px-3 py-2 text-sm" onClick={async () => { await prompt.prompt(); setPrompt(null) }}>Install</button>
        ) : (
          <button type="button" className="btn-secondary shrink-0 px-3 py-2 text-sm" aria-expanded={open} onClick={() => setOpen((o) => !o)}>{open ? 'Hide' : 'How?'}</button>
        )}
      </div>
      {open && !prompt && (
        <div className="mt-3">
          <div className="text-xs font-bold uppercase tracking-wide text-indigo-700">{info.title}</div>
          <ol className="mt-1.5 list-decimal space-y-1 pl-5 text-slate-700">
            {info.steps.map((s) => <li key={s}>{s}</li>)}
          </ol>
          <details className="mt-3 text-xs text-slate-500">
            <summary className="cursor-pointer font-semibold">Other devices</summary>
            <div className="mt-2 space-y-2">
              {(Object.keys(STEPS) as Platform[]).filter((p) => p !== platform && p !== 'other' && p !== 'ios-other').map((p) => (
                <div key={p}><span className="font-bold text-slate-600">{STEPS[p].title}:</span> {STEPS[p].steps.join(' ')}</div>
              ))}
            </div>
          </details>
        </div>
      )}
    </div>
  )
}
