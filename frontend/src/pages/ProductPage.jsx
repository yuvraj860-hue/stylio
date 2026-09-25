import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { productApi, visualSearchApi } from '../services/api'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import ProductCard from '../components/ProductCard'
import ProductGridSkeleton from '../components/ProductGridSkeleton'
import SafeImage from '../components/SafeImage'
import SizeGuideModal from '../components/SizeGuideModal'
import VisualSearchModal from '../components/VisualSearchModal'
import Toast from '../components/Toast'
import { HeartIcon, CameraIcon } from '../components/icons'
import { fmt } from '../utils/format'
import { colorHex } from '../utils/colors'

export default function ProductPage() {
  const { id } = useParams()
  const { addItem } = useCart()
  const { isInWishlist, toggleWishlist } = useWishlist()
  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState(null)
  const [completeLook, setCompleteLook] = useState([])
  const [error, setError] = useState(null)
  const [size, setSize] = useState('')
  const [color, setColor] = useState('')
  const [toast, setToast] = useState(null)
  const [showSizeGuide, setShowSizeGuide] = useState(false)

  // Visual Search state
  const [visualSearchOpen, setVisualSearchOpen] = useState(false)
  const [visualSearchLoading, setVisualSearchLoading] = useState(false)
  const [visualSearchResults, setVisualSearchResults] = useState(null)
  const [visualSearchError, setVisualSearchError] = useState(null)
  const [visualSearchPreview, setVisualSearchPreview] = useState(null)

  useEffect(() => {
    let cancelled = false
    setProduct(null)
    setError(null)
    setSize('')
    setColor('')
    setCompleteLook([])

    productApi
      .get(id)
      .then((data) => {
        if (cancelled) return
        setProduct(data)
        const sizes = data.sizes || data.availableSizes || []
        const colors = data.colors || data.availableColors || []
        setSize(Array.isArray(sizes) && sizes.length ? sizes[0] : '')
        setColor(Array.isArray(colors) && colors.length ? colors[0] : '')

        // Load recommendations
        productApi
          .recommend(id)
          .then((r) => {
            if (cancelled) return
            const list = Array.isArray(r)
              ? r
              : Array.isArray(r && r.products)
                ? r.products
                : Array.isArray(r && r.data)
                  ? r.data
                  : Array.isArray(r && r.recommendations)
                    ? r.recommendations
                    : []
            setRelated(list)
          })
          .catch(() => {
            if (!cancelled) setRelated([])
          })

        // Load Complete The Look pairing
        const cat = (data.category || '').toLowerCase()
        let compCat = 'Accessories'
        if (cat.includes('dress') || cat.includes('top')) compCat = 'Accessories'
        else if (cat.includes('jean') || cat.includes('pant')) compCat = 'Sneakers'
        else if (cat.includes('sneaker') || cat.includes('shoe')) compCat = 'Hoodies'
        else compCat = 'Jeans'

        productApi
          .list({ category: compCat, limit: 4 })
          .then((r) => {
            if (cancelled) return
            const items = r?.products || r?.data || (Array.isArray(r) ? r : [])
            setCompleteLook(items.filter((p) => String(p._id || p.id) !== id).slice(0, 3))
          })
          .catch(() => {})
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })

    return () => {
      cancelled = true
    }
  }, [id])

  const handleVisualSearch = async () => {
    if (!product) return
    const imgUrl = product.imageUrl || product.image
    setVisualSearchPreview(imgUrl)
    setVisualSearchOpen(true)
    setVisualSearchLoading(true)
    setVisualSearchResults(null)
    setVisualSearchError(null)

    try {
      const res = await visualSearchApi.searchByUrl(imgUrl)
      setVisualSearchResults(res)
    } catch (err) {
      setVisualSearchError(err.message || 'Could not find visually similar pieces')
    } finally {
      setVisualSearchLoading(false)
    }
  }

  const sizes = useMemo(
    () => (product && Array.isArray(product.sizes) && product.sizes.length ? product.sizes : []),
    [product]
  )
  const colors = useMemo(
    () => (product && Array.isArray(product.colors) && product.colors.length ? product.colors : []),
    [product]
  )
  const outOfStock =
    product &&
    (product.stock === 0 || (typeof product.inStock === 'boolean' && !product.inStock))

  const handleAdd = () => {
    if (outOfStock) return
    addItem(product, { size, color })
    setToast(`Added to bag — ${product.name}${size ? ` · ${size}` : ''}`)
  }

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3200)
    return () => clearTimeout(t)
  }, [toast])

  if (error && !product) {
    return (
      <section className="section">
        <div className="container">
          <div className="empty-state">
            <h3>We couldn't find that piece</h3>
            <p>{error}</p>
          </div>
        </div>
      </section>
    )
  }

  if (!product) {
    return (
      <section className="section">
        <div className="container">
          <div className="spinner" />
        </div>
      </section>
    )
  }

  const price = Number(product.price)
  const image = product.imageUrl || product.image

  return (
    <section style={{ paddingBottom: 'var(--space-8)' }}>
      <div className="container">
        <div className="product-detail">
          <div>
            <SafeImage
              className="product-detail__image"
              src={image}
              alt={product.name}
            />
            <button
              type="button"
              className="btn btn-outline btn-block"
              onClick={handleVisualSearch}
              style={{
                marginTop: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontSize: '0.82rem',
                letterSpacing: '0.04em',
              }}
              title="Find visually similar outfits and matches in our catalog"
            >
              <CameraIcon size={16} />
              <span>Find Visually Similar Pieces ✨</span>
            </button>
          </div>

          <div className="product-detail__info">
            <div>
              <div className="product-detail__brand">
                {product.brand || 'STYLIO'}
              </div>
              <h1 className="product-detail__name">{product.name}</h1>
            </div>

            <div className="product-detail__price">
              {Number.isFinite(price) ? fmt(price) : '—'}
            </div>

            {product.description && (
              <p className="product-detail__desc">{product.description}</p>
            )}

            {colors.length > 0 && (
              <div className="selector-group">
                <label>Colour</label>
                <div className="swatches">
                  {colors.map((c) => (
                    <button
                      key={c}
                      className={`swatch ${color === c ? 'active' : ''}`}
                      onClick={() => setColor(c)}
                      title={c}
                      aria-label={`Select colour ${c}`}
                    >
                      <span className="swatch-div" style={{ background: colorHex(c) }} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="selector-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ margin: 0 }}>Size</label>
                <button
                  type="button"
                  className="size-guide-trigger"
                  onClick={() => setShowSizeGuide(true)}
                  title="Open Size Chart and Fit Guide"
                >
                  Size Guide & Fit Advisor 📏
                </button>
              </div>
              {sizes.length > 0 ? (
                <div className="size-list">
                  {sizes.map((s) => (
                    <button
                      key={s}
                      className={`size-btn ${size === s ? 'active' : ''}`}
                      onClick={() => setSize(s)}
                      aria-label={`Select size ${s}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                  One Size
                </p>
              )}
            </div>

            <div className="product-detail__desc detail" style={{ display: 'flex', gap: 'var(--space-5)', fontSize: '0.82rem' }}>
              <span>
                <strong>Free shipping</strong> over ₹1,500
              </span>
              <span>
                <strong>Returns</strong> within 30 days
              </span>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              {outOfStock ? (
                <button className="btn btn-dark" style={{ flex: 1 }} disabled>
                  Sold Out
                </button>
              ) : (
                <button className="btn btn-dark" style={{ flex: 1 }} onClick={handleAdd}>
                  Add to Bag — {Number.isFinite(price) ? fmt(price) : '—'}
                </button>
              )}
              <button
                className={`btn btn-outline ${product && isInWishlist(product._id) ? 'btn-wishlist--active' : ''}`}
                onClick={() => product && toggleWishlist(product)}
                style={{
                  minWidth: 52,
                  padding: '0 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderColor: product && isInWishlist(product._id) ? '#ef4444' : undefined,
                  background: product && isInWishlist(product._id) ? 'rgba(239, 68, 68, 0.06)' : undefined,
                }}
                title={product && isInWishlist(product._id) ? 'Remove from Wishlist' : 'Save to Wishlist'}
                type="button"
                aria-label="Wishlist toggle"
              >
                <HeartIcon size={20} filled={product && isInWishlist(product._id)} />
              </button>
            </div>
          </div>
        </div>

        {/* Complete The Look Section */}
        {completeLook.length > 0 && (
          <div className="complete-look-section">
            <div className="complete-look-header">
              <div>
                <div className="eyebrow" style={{ color: 'var(--color-gold)' }}>Stylist Pairing</div>
                <h3 style={{ margin: '4px 0 0', fontSize: '1.25rem' }}>Complete The Look</h3>
                <p className="text-muted" style={{ margin: '4px 0 0', fontSize: '0.84rem' }}>
                  Hand-selected pieces curated to elevate and complement this look.
                </p>
              </div>
            </div>

            <div className="complete-look-grid">
              {completeLook.map((item) => (
                <div key={item._id || item.id} className="complete-look-card">
                  <div className="complete-look-card__thumb">
                    <Link to={`/product/${item._id || item.id}`}>
                      <SafeImage
                        src={item.imageUrl || item.image}
                        alt={item.name}
                        fallbackText={item.name?.slice(0, 4)}
                      />
                    </Link>
                  </div>
                  <h4 className="complete-look-card__title">
                    <Link to={`/product/${item._id || item.id}`}>{item.name}</Link>
                  </h4>
                  <div className="complete-look-card__price">{fmt(item.price)}</div>
                  <button
                    type="button"
                    className="btn btn-dark complete-look-card__btn"
                    onClick={() => addItem(item)}
                  >
                    + Add to Bag
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="section" style={{ paddingTop: 'var(--space-7)' }}>
          <div className="section-head">
            <div>
              <div className="eyebrow">Styled With</div>
              <h2>You May Also Like</h2>
            </div>
          </div>
          {!related && <ProductGridSkeleton count={4} />}
          {related && related.length > 0 && (
            <div className="product-grid">
              {related.map((p) => (
                <ProductCard key={p._id || p.id} product={p} />
              ))}
            </div>
          )}
          {related && related.length === 0 && (
            <div className="empty-state">
              <h3>No recommendations yet</h3>
              <p>Check back soon — our stylist is refining your edit.</p>
            </div>
          )}
        </div>
      </div>

      {toast && <Toast message={toast} />}

      {showSizeGuide && (
        <SizeGuideModal
          category={product?.category}
          onClose={() => setShowSizeGuide(false)}
        />
      )}

      <VisualSearchModal
        open={visualSearchOpen}
        onClose={() => setVisualSearchOpen(false)}
        preview={visualSearchPreview}
        searching={visualSearchLoading}
        results={visualSearchResults}
        error={visualSearchError}
      />
    </section>
  )
}