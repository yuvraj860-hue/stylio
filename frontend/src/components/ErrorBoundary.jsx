import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="container"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            textAlign: 'center',
            gap: 'var(--space-4)'
          }}
        >
          <div className="eyebrow">Something went wrong</div>
          <h1 className="serif">That's on us.</h1>
          <p className="text-muted" style={{ maxWidth: 420 }}>
            The page hit an unexpected error. Please reload to continue
            exploring the collection.
          </p>
          <button className="btn btn-dark" onClick={this.handleReload}>
            Reload page
          </button>
        </div>
      )
    }
    return this.props.children
  }
}