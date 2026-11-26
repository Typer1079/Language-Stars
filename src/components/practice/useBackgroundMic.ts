import { useEffect, type RefObject } from 'react'
import type { PracticeEngine } from '../../lib/practiceEngine'

/**
 * Leaving the app (home button, switching apps, locking the phone) turns the microphone and voice
 * off at once. Coming back shows "Welcome back"; the mic stays off until the learner taps 🎤.
 */
export function useBackgroundMic(
  engineRef: RefObject<PracticeEngine | null>,
  anyModalRef: RefObject<boolean>,
  log: (tag: string, detail?: string) => void,
) {
  useEffect(() => {
    let asleep = false
    const sleep = () => {
      if (asleep) return
      asleep = true
      engineRef.current?.sleep()
      log('MIC', 'off: app in background')
    }
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') sleep()
      else if (asleep) {
        asleep = false
        engineRef.current?.wake(anyModalRef.current)
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', sleep)
    document.addEventListener('freeze', sleep)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', sleep)
      document.removeEventListener('freeze', sleep)
    }
  }, [engineRef, anyModalRef, log])
}
