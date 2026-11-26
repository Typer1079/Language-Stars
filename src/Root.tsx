import { useEffect, useState } from 'react'
import App from './App'
import PublicPage from './components/PublicPage'
import { publicPageFor } from './lib/publicPages'

/** Public pages (#/privacy, #/terms, #/support) open without signing in; everything else is the app. */
export default function Root() {
  const [hash, setHash] = useState(() => location.hash)
  useEffect(() => {
    const onHash = () => setHash(location.hash)
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  return publicPageFor(hash) ? <PublicPage hash={hash} /> : <App />
}

