import { Component, type ReactNode } from 'react'
import { isLoadError, reloadForUpdate } from '../lib/freshLoad'
import { reportProblem } from '../lib/problems'

interface Props {
  children: ReactNode
}
interface State {
  error: Error | null
}

/** Shows a message with a Reload button instead of a blank screen if something breaks. */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error('[app error]', error)
    if (isLoadError(error)) reloadForUpdate()
    else reportProblem({ kind: 'error', item: location.hash || location.pathname, detail: `Screen crashed: ${error.message}\n${error.stack ?? ''}` })
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    return (
      <div role="alert" className="card mx-auto mt-10 max-w-md space-y-3 text-center">
        <h2 className="font-kids text-xl font-bold">Something went wrong</h2>
        <p className="text-sm text-slate-600">Saved progress is safe. Tap Reload to try again.</p>
        <p className="break-words rounded-lg bg-slate-100 px-3 py-2 text-left font-mono text-xs text-slate-500">{error.message || String(error)}</p>
        <button type="button" className="btn-primary w-full" onClick={() => window.location.reload()}>
          Reload
        </button>
      </div>
    )
  }
}
