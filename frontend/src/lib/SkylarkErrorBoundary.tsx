import { Component, type ErrorInfo, type ReactNode } from 'react'
import { captureException } from './skylark'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
}

/** Catches React render errors, reports them to Skylark, and shows a fallback. */
export class SkylarkErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    captureException(error, { componentStack: info?.componentStack })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif', color: '#334155' }}>
            <h2 style={{ marginBottom: 8 }}>Something went wrong.</h2>
            <p style={{ marginBottom: 16, color: '#64748b' }}>The error was reported. Try reloading.</p>
            <button
              onClick={() => window.location.reload()}
              style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: '#2563eb', color: 'white', cursor: 'pointer' }}
            >
              Reload
            </button>
          </div>
        )
      )
    }
    return this.props.children
  }
}
