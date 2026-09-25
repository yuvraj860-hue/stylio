import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import { fmt } from '../utils/format'
import SafeImage from './SafeImage'
import { HeartIcon } from './icons'

export default function ProductCard({ product }) {
  const { addItem } = useCart()
  const { isInWishlist, toggleWishlist } = useWishlist()
  if (!product || !product._id) return null

  const price = Number(product.price)
  const image = product.imageUrl || product.image || ''
  const inWish = isInWishlist(product._id)

  return (
    <article className="product-card" data-testid="product-card">
      <div className="product-card__image-wrap">
        <button
          className={`product-card__wishlist-btn ${inWish ? 'product-card__wishlist-btn--active' : ''}`}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            toggleWishlist(product)
          }}
          title={inWish ? 'Remove from Wishlist' : 'Save to Wishlist'}
          aria-label={inWish ? 'Remove from Wishlist' : 'Save to Wishlist'}
          type="button"
        >
          <HeartIcon size={18} filled={inWish} />
        </button>
        <Link
          to={`/product/${product._id}`}
          className="product-card__link"
          aria-label={product.name}
        >
          <SafeImage
            className="product-card__image"
            src={image}
            alt={product.name}
            loading="lazy"
            fallbackText={product.name?.slice(0, 6).toUpperCase() || 'STYLIO'}
          />
        </Link>
        <div className="product-card__overlay">
          <button
            className="product-card__add"
            onClick={() => addItem(product)}
            aria-label={`Add ${product.name} to cart`}
            type="button"
          >
            Add to Cart
          </button>
        </div>
      </div>
      <div className="product-card__body">
        <h3 className="product-card__name">{product.name}</h3>
        <div className="product-card__price">
          {Number.isFinite(price) ? fmt(price) : '—'}
        </div>
      </div>
    </article>
  )
}