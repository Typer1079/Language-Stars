import { useState } from 'react'

type Where = 'ios-app' | 'ios-safari' | 'ios-other' | 'android-app' | 'android' | 'mac-safari' | 'desktop'

function where(): Where {
  const ua = navigator.userAgent
  const standalone = window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true
  const ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  if (ios) return standalone ? 'ios-app' : /CriOS|FxiOS|EdgiOS/.test(ua) ? 'ios-other' : 'ios-safari'
  if (/Android/.test(ua)) return standalone ? 'android-app' : 'android'
  if (/Safari\//.test(ua) && /Macintosh/.test(ua) && !/Chrome\//.test(ua)) return 'mac-safari'
  return 'desktop'
}

const STEPS: Record<Where, string[]> = {
  'ios-safari': [
    'Tap the “aA” (or the page menu) at the left of the address bar.',
    'Tap “Website Settings”, then set Microphone to “Allow”.',
    'Tap “Reload page” below.',
  ],
  'ios-app': [
    'Close Language Stars completely (swipe up from the bottom and flick it away), then open it again. It will ask for the microphone again: tap “Allow”.',
    'If it doesn’t ask: open the Settings app → Apps → Safari → Microphone, and choose “Ask” or “Allow”. Then reopen Language Stars.',
  ],
  'ios-other': [
    'Open the Settings app → Apps → your browser (for example Chrome) → turn Microphone on.',
    'Come back and tap “Reload page” below.',
  ],
  android: [
    'Tap the icon at the left of the address bar (it looks like sliders or a lock).',
    'Tap “Permissions” → Microphone → “Allow”.',
    'Tap “Reload page” below.',
  ],
  'android-app': [
    'Long-press the Language Stars icon on your home screen → App info → Permissions → Microphone → “Allow”.',
    'Reopen Language Stars.',
  ],
  'mac-safari': [
    'In the menu bar choose Safari → Settings for this website (or Settings → Websites → Microphone).',
    'Set Microphone to “Allow”, then tap “Reload page” below.',
  ],
  desktop: [
    'Click the icon at the left of the address bar (a lock or sliders).',
    'Set Microphone to “Allow”.',
    'Click “Reload page” below.',
  ],
}

/**
 * Shown when the microphone was blocked (for example "Don't Allow" was tapped by mistake). Browsers
 * don't ask a second time on their own, so this tries asking again and explains how to switch it on.
 */
export function MicHelp({ reason, onGranted, onClose }: { reason: 'blocked' | 'dictation'; onGranted: () => void; onClose: () => void }) {
  const [status, setStatus] = useState<'idle' | 'asking' | 'still'>('idle')
  const w = where()

  async function askAgain() {
    setStatus('asking')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((t) => t.stop())
      onGranted()
    } catch {
      setStatus('still')
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4" role="dialog" aria-modal="true" aria-labelledby="mic-help-title">
      <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl">
        <div className="text-4xl">🎤</div>
        <h2 id="mic-help-title" className="mt-1 font-kids text-2xl font-bold">{reason === 'dictation' ? 'Turn on Dictation' : 'Turn on the microphone'}</h2>
        {reason === 'dictation' ? (
          <p className="mt-1 text-sm text-slate-600">On iPhone and iPad, listening uses Apple’s Dictation. Open the Settings app → General → Keyboard → turn on <b>Enable Dictation</b>, then reopen Language Stars.</p>
        ) : (
          <>
            <p className="mt-1 text-sm text-slate-600">Language Stars needs the microphone to hear you. It looks like it was turned off (maybe “Don’t Allow” was tapped). Nothing is recorded or saved.</p>
            <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-slate-800">
              {STEPS[w].map((s) => <li key={s}>{s}</li>)}
            </ol>
          </>
        )}
        {status === 'still' && <p role="alert" className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">Still blocked. Follow the steps above, then reload.</p>}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" className="btn-primary" disabled={status === 'asking'} onClick={askAgain}>{status === 'asking' ? 'Asking…' : 'Ask again'}</button>
          <button type="button" className="btn-secondary" onClick={() => window.location.reload()}>Reload page</button>
        </div>
        <button type="button" className="mt-3 w-full text-sm text-slate-500 underline" onClick={onClose}>Not now</button>
      </div>
    </div>
  )
}
