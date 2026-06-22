import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error) {
    if (typeof window !== 'undefined' && window.__auraLogError) {
      window.__auraLogError('react_boundary', error?.message || 'unknown')
    }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#080808', color: '#c4c0b8', fontFamily: "'DM Mono', monospace",
          fontSize: '12px', fontWeight: 300, letterSpacing: '0.02em', textAlign: 'center', padding: '24px'
        }}>
          Κάτι σταμάτησε να λειτουργεί.
        </div>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
