import { useEffect, useState } from 'react'

export default function SafeImage({ src, alt, className, fallbackText = 'STYLIO', ...rest }) {
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [src])

  if (!src || failed) {
    return (
      <div
        className={className}
        role="img"
        aria-label={alt || fallbackText}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-ink-muted)',
          fontSize: '0.8rem',
          letterSpacing: '0.2em',
          background: 'var(--color-paper-deep)'
        }}
      >
        {fallbackText}
      </div>
    )
  }

  return (
    <img
      className={className}
      src={src}
      alt={alt || ''}
      onError={() => setFailed(true)}
      {...rest}
    />
  )
}