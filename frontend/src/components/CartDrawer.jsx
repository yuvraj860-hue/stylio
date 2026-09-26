import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { fmt } from '../utils/format'
import { CloseIcon, TrashIcon } from './icons'
import SafeImage from './SafeImage'

export default function CartDrawer() {
  const {
    items,
    subtotal,
    isOpen,
    closeCart,
    increment,
    decrement,
    removeItem
  } = useCart()

  const panelRef = useRef(null)
  const prevFocusRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return
    prevFocusRef.current = document.activeElement
    const el = panelRef.current
    if (el) {
      const focusable = el.querySelector('button, [href], input, [tabindex]:not([tabindex="-1"])')
      if (focusable) focusable.focus()
    }
    const onKey = (e) => {
      if (e.key === 'Escape') closeCart()
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
  }, [isOpen, closeCart])

  if (!isOpen) return null

  return (
    <div className="drawer-overlay" onClick={closeCart}>
      <aside
        ref={panelRef}
        className="cart-drawer"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
      >
        <div className="cart-drawer__header">
          <h3 className="serif" style={{ fontSize: '1.3rem' }}>
            Your Bag
          </h3>
          <button className="icon-btn" onClick={closeCart} aria-label="Close cart">
            <CloseIcon />
          </button>
        </div>

        {/* Free Shipping Progress Indicator */}
        {items.length > 0 && (
          <div style={{ padding: '12px 20px', background: '#f8fafc', borderBottom: '1px solid var(--color-line)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 6 }}>
              <span>
                {subtotal >= 1500 ? (
                  <strong style={{ color: '#16a34a' }}>🎉 You unlocked Free Express Delivery!</strong>
                ) : (
                  <span>Add <strong>{fmt(1500 - subtotal)}</strong> more for <strong>Free Delivery</strong></span>
                )}
              </span>
              <span style={{ fontWeight: 600, color: 'var(--color-ink-soft)' }}>
                {Math.min(100, Math.round((subtotal / 1500) * 100))}%
              </span>
            </div>
            <div style={{ width: '100%', height: 5, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
              <div
                style={{
                  width: `${Math.min(100, (subtotal / 1500) * 100)}%`,
                  height: '100%',
                  background: subtotal >= 1500 ? '#16a34a' : 'var(--color-gold)',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
        )}

        <div className="cart-drawer__items">
          {items.length === 0 ? (
            <div className="empty-state">
              <h3>Your bag is empty</h3>
              <p>Discover pieces worth keeping.</p>
              <Link
                to="/shop"
                className="btn btn-outline"
                style={{ marginTop: 16 }}
                onClick={closeCart}
              >
                Explore the Shop
              </Link>
            </div>
          ) : (
            items.map((item) => (
              <div className="cart-item" key={item._id}>
                <SafeImage
                  className="cart-item__img"
                  src={item.imageUrl}
                  alt={item.name}
                />
                <div className="cart-item__info">
                  <div className="cart-item__name">{item.name}</div>
                  {item.variant && (
                    <div className="cart-item__meta">
                      {item.variant.size ? `Size ${item.variant.size}` : ''}
                      {item.variant.size && item.variant.color ? ' · ' : ''}
                      {item.variant.color ? item.variant.color : ''}
                    </div>
                  )}
                  <div className="cart-item__price">
                    {fmt(item.price)}
                  </div>
                  <div className="qty-control">
                    <button onClick={() => decrement(item._id)} aria-label="Decrease quantity">
                      −
                    </button>
                    <span style={{ minWidth: 20, textAlign: 'center' }}>{item.qty}</span>
                    <button onClick={() => increment(item._id)} aria-label="Increase quantity">
                      +
                    </button>
                    <button
                      onClick={() => removeItem(item._id)}
                      className="icon-btn"
                      style={{
                        width: 40,
                        height: 40,
                        marginLeft: 12,
                        color: 'var(--color-ink-muted)'
                      }}
                      aria-label={`Remove ${item.name}`}
                    >
                      <TrashIcon size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="cart-drawer__footer">
          {items.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: '#854d0e', background: '#fefce8', padding: '6px 10px', borderRadius: 4, marginBottom: 12, border: '1px dashed #fde047' }}>
              <span>🏷️</span>
              <span>Use promo code <strong>STYLIO10</strong> for 10% OFF at checkout</span>
            </div>
          )}
          <div className="cart-drawer__total">
            <span>Subtotal</span>
            <span>{fmt(subtotal)}</span>
          </div>
          <Link to="/checkout" className="btn btn-dark btn-block" onClick={closeCart}>
            Proceed to Checkout
          </Link>
          <button className="btn btn-ghost btn-block" onClick={closeCart}>
            Continue Shopping
          </button>
        </div>
      </aside>
    </div>
  )
}