import { useEffect, useRef } from 'react'

export default function Toast({ message }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const anim = el.animate(
      [
        { opacity: 0, transform: 'translateY(16px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ],
      { duration: 250, easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)', fill: 'backwards' }
    )
    return () => anim.cancel()
  }, [message])

  return (
    <div
      ref={ref}
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 'var(--space-6)',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        background: 'var(--color-ink)',
        color: 'var(--color-paper)',
        padding: 'var(--space-3) var(--space-5)',
        borderRadius: 'var(--radius-pill)',
        fontSize: '0.85rem',
        letterSpacing: '0.04em',
        boxShadow: 'var(--shadow-lift)',
        maxWidth: '90vw',
        textAlign: 'center'
      }}
    >
      {message}
    </div>
  )
}