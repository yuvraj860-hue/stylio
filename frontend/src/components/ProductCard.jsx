import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { fmt } from '../utils/format'
import SafeImage from './SafeImage'

export default function ProductCard({ product }) {
  const { addItem } = useCart()
  if (!product || !product._id) return null

  const price = Number(product.price)
  const image = product.imageUrl || product.image || ''

  return (
    <article className="product-card" data-testid="product-card">
      <Link to={`/product/${product._id}`} aria-label={product.name}>
        <div className="product-card__image-wrap">
          <SafeImage
            className="product-card__image"
            src={image}
            alt={product.name}
            loading="lazy"
            fallbackText={product.name?.slice(0, 6).toUpperCase() || 'STYLIO'}
          />
        </div>
      </Link>
      <div className="product-card__body">
        <h3 className="product-card__name">{product.name}</h3>
        <div className="product-card__price">
          {Number.isFinite(price) ? fmt(price) : '—'}
        </div>
      </div>
      <div className="product-card__overlay">
        <button
          className="product-card__add"
          onClick={() => addItem(product)}
          aria-label={`Add ${product.name} to cart`}
        >
          Add to Cart
        </button>
      </div>
    </article>
  )
}