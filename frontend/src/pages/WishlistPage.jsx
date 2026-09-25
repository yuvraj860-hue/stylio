import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import SafeImage from '../components/SafeImage';
import { HeartIcon, TrashIcon, CartIcon } from '../components/icons';
import { fmt } from '../utils/format';

export default function WishlistPage() {
  const { items, count, loading, toggleWishlist } = useWishlist();
  const { addItem } = useCart();

  return (
    <div className="container section wishlist-page">
      <div className="section-head" style={{ marginBottom: 'var(--space-6)' }}>
        <div>
          <div className="eyebrow">Wardrobe</div>
          <h2>My Wishlist ({count})</h2>
          <p className="text-muted" style={{ marginTop: 6, fontSize: '0.9rem' }}>
            Pieces you've curated for your dream wardrobe.
          </p>
        </div>
      </div>

      {loading && items.length === 0 && (
        <div style={{ padding: '60px 0', textAlign: 'center' }}>
          <div className="spinner" />
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="empty-state orders-empty">
          <div className="orders-empty__icon" style={{ color: '#ef4444' }}>
            <HeartIcon size={44} filled={false} />
          </div>
          <h3>Your Wishlist is Empty</h3>
          <p className="text-muted" style={{ maxWidth: 440, margin: '8px auto 24px' }}>
            Save the looks and pieces you love by tapping the heart icon on any product.
          </p>
          <Link to="/shop" className="btn btn-dark">
            Explore the Shop
          </Link>
        </div>
      )}

      {items.length > 0 && (
        <div className="wishlist-grid">
          {items.map((product) => {
            const price = Number(product.price);
            const image = product.imageUrl || product.image || '';

            return (
              <div key={product._id || product.id} className="wishlist-item-card">
                <div className="wishlist-item-card__image-wrap">
                  <Link to={`/product/${product._id || product.id}`}>
                    <SafeImage
                      className="wishlist-item-card__image"
                      src={image}
                      alt={product.name}
                      fallbackText={product.name?.slice(0, 4).toUpperCase() || 'STYLIO'}
                    />
                  </Link>
                  <button
                    className="wishlist-item-card__remove-btn"
                    onClick={() => toggleWishlist(product)}
                    title="Remove from wishlist"
                    aria-label={`Remove ${product.name} from wishlist`}
                    type="button"
                  >
                    <TrashIcon size={16} />
                  </button>
                </div>

                <div className="wishlist-item-card__body">
                  <span className="text-muted" style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {product.brand || 'STYLIO'}
                  </span>
                  <h4 className="wishlist-item-card__title">
                    <Link to={`/product/${product._id || product.id}`}>{product.name}</Link>
                  </h4>
                  <div className="wishlist-item-card__price">
                    {Number.isFinite(price) ? fmt(price) : '—'}
                  </div>

                  <button
                    className="btn btn-dark btn-block wishlist-item-card__cart-btn"
                    onClick={() => addItem(product)}
                    type="button"
                  >
                    <CartIcon size={16} />
                    <span>Add to Bag</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
