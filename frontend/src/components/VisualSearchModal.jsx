import { useEffect, useMemo, useRef } from 'react'
import { fmt } from '../utils/format'
import { CloseIcon } from './icons'
import SafeImage from './SafeImage'

export default function VisualSearchModal({ open, onClose, preview, searching, results, error }) {
  const products = useMemo(() => {
    if (!results) return []
    if (Array.isArray(results)) return results
    if (Array.isArray(results.results)) return results.results
    if (Array.isArray(results.products)) return results.products
    return []
  }, [results])

  const panelRef = useRef(null)
  const prevFocusRef = useRef(null)

  useEffect(() => {
    if (!open) return
    prevFocusRef.current = document.activeElement
    const el = panelRef.current
    if (el) {
      const focusable = el.querySelector('button, [href], input, [tabindex]:not([tabindex="-1"])')
      if (focusable) focusable.focus()
    }
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      const prev = prevFocusRef.current
      if (prev && prev.focus) prev.focus()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        ref={panelRef}
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Visual search results"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <div className="eyebrow">Visual Search</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', marginTop: 4 }}>
              Found Similar Pieces
            </h2>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close visual search">
            <CloseIcon />
          </button>
        </div>

        <div style={{ padding: 'var(--space-6)' }}>
          {searching && (
            <div style={{ textAlign: 'center' }}>
              <div className="spinner" />
              <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                Analysing silhouette, colour and textiles…
              </p>
            </div>
          )}

          {!searching && error && (
            <div className="empty-state">
              <h3>We couldn't complete that search</h3>
              <p>{error}</p>
            </div>
          )}

          {!searching && !error && products.length === 0 && (
            <div className="empty-state">
              <h3>No matches found</h3>
              <p>Try a different photo — clearer, well-lit full outfit shots work best.</p>
            </div>
          )}

          {!searching && !error && products.length > 0 && (
            <div className="product-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
              {products.map((p) => {
                const id = p.product_id || p._id || p.id
                const image = p.image_url || p.imageUrl || p.image
                const price = Number(p.price)
                return (
                  <a
                    key={id}
                    href={`/product/${id}`}
                    onClick={onClose}
                    className="product-card"
                  >
                    <div className="product-card__image-wrap" style={{ aspectRatio: '3/4' }}>
                      <SafeImage
                        className="product-card__image"
                        src={image}
                        alt={p.name || 'Product'}
                        loading="lazy"
                      />
                    </div>
                    <div className="product-card__body">
                      <h3 className="product-card__name">{p.name || 'Untitled'}</h3>
                      <div className="product-card__price">
                        {Number.isFinite(price) ? fmt(price) : '—'}
                      </div>
                    </div>
                  </a>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}