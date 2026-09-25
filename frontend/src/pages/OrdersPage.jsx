import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { orderApi } from '../services/api';
import SafeImage from '../components/SafeImage';
import InvoiceModal from '../components/InvoiceModal';
import { OrdersIcon, InvoiceIcon } from '../components/icons';
import { fmt } from '../utils/format';

function getStatusBadge(status) {
  const map = {
    placed: { label: 'Order Placed', className: 'order-badge order-badge--placed' },
    processing: { label: 'In Progress', className: 'order-badge order-badge--processing' },
    shipped: { label: 'Dispatched & Shipped', className: 'order-badge order-badge--shipped' },
    delivered: { label: 'Delivered', className: 'order-badge order-badge--delivered' },
    cancelled: { label: 'Cancelled', className: 'order-badge order-badge--cancelled' },
  };
  return map[status] || { label: status || 'Placed', className: 'order-badge' };
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invoiceOrder, setInvoiceOrder] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await orderApi.myOrders();
      const list = res?.orders || (Array.isArray(res) ? res : []);
      setOrders(list);
    } catch (err) {
      setError(err.message || 'Could not load your orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="orders-page container section">
      <div className="section-head" style={{ marginBottom: 'var(--space-6)' }}>
        <div>
          <div className="eyebrow">Account</div>
          <h2>My Orders</h2>
          <p className="text-muted" style={{ marginTop: 6, fontSize: '0.9rem' }}>
            View your purchase history, track shipping progress, and review items.
          </p>
        </div>
      </div>

      {loading && (
        <div className="orders-skeleton-wrap">
          {[1, 2].map((i) => (
            <div key={i} className="order-card-skeleton" />
          ))}
        </div>
      )}

      {error && !loading && (
        <div className="alert alert-error" style={{ marginBottom: 'var(--space-6)' }}>
          <span>{error}</span>
          <button
            onClick={fetchOrders}
            className="btn btn-outline"
            style={{ marginLeft: 16, padding: '4px 12px', fontSize: '0.8rem' }}
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && orders.length === 0 && (
        <div className="empty-state orders-empty">
          <div className="orders-empty__icon">
            <OrdersIcon size={48} />
          </div>
          <h3>No Orders Yet</h3>
          <p className="text-muted" style={{ maxWidth: 420, margin: '8px auto 24px' }}>
            You haven't placed any orders yet. Discover our curated wardrobe essentials and treat yourself.
          </p>
          <Link to="/shop" className="btn btn-dark">
            Explore Collection
          </Link>
        </div>
      )}

      {!loading && orders.length > 0 && (
        <div className="orders-list">
          {orders.map((order) => {
            const badge = getStatusBadge(order.status);
            const date = new Date(order.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });
            const orderIdShort = String(order._id || order.id || '').slice(-8).toUpperCase();

            return (
              <div key={order._id || order.id} className="order-card">
                <div className="order-card__header">
                  <div className="order-card__meta">
                    <div>
                      <span className="order-card__label">Order Placed</span>
                      <strong className="order-card__value">{date}</strong>
                    </div>
                    <div>
                      <span className="order-card__label">Total</span>
                      <strong className="order-card__value">{fmt(order.total)}</strong>
                    </div>
                    <div>
                      <span className="order-card__label">Payment</span>
                      <span
                        className={`order-pill ${order.paymentStatus === 'paid' ? 'order-pill--paid' : 'order-pill--pending'}`}
                      >
                        {order.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                      </span>
                    </div>
                  </div>

                  <div className="order-card__header-right">
                    <span className="order-card__id">Order #{orderIdShort}</span>
                    <span className={badge.className}>{badge.label}</span>
                  </div>
                </div>

                {order.trackingNumber && (
                  <div className="order-tracking-banner">
                    <span className="order-tracking-dot" />
                    <span>
                      Dispatched via <strong>{order.courierName || 'Courier Partner'}</strong> &bull; Tracking ID:{' '}
                      <code>{order.trackingNumber}</code>
                    </span>
                  </div>
                )}

                <div className="order-items-list">
                  {(order.items || []).map((item, idx) => (
                    <div key={idx} className="order-item">
                      <div className="order-item__image-wrap">
                        <SafeImage
                          src={item.imageUrl}
                          alt={item.name}
                          className="order-item__image"
                          fallbackText={item.name?.slice(0, 4).toUpperCase() || 'STYLIO'}
                        />
                      </div>
                      <div className="order-item__info">
                        <h4 className="order-item__name">
                          {item.productId ? (
                            <Link to={`/product/${item.productId}`}>{item.name}</Link>
                          ) : (
                            item.name
                          )}
                        </h4>
                        <div className="order-item__specs">
                          {item.size && <span className="spec-tag">Size: {item.size}</span>}
                          {item.color && <span className="spec-tag">Color: {item.color}</span>}
                          <span className="spec-tag">Qty: {item.qty}</span>
                        </div>
                      </div>
                      <div className="order-item__price">
                        {fmt(item.price * item.qty)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="order-card__footer">
                  <div className="order-shipping-summary">
                    <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                      Delivering to:{' '}
                    </span>
                    <span style={{ fontSize: '0.84rem', fontWeight: 500 }}>
                      {[order.shippingAddress?.street, order.shippingAddress?.city, order.shippingAddress?.zip]
                        .filter(Boolean)
                        .join(', ') || 'Address on file'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="order-invoice-btn"
                      onClick={() => setInvoiceOrder(order)}
                      title="Download or Print Tax Invoice"
                    >
                      <InvoiceIcon size={15} />
                      <span>Invoice / Receipt</span>
                    </button>
                    <Link to="/shop" className="btn btn-outline" style={{ fontSize: '0.82rem', padding: '6px 14px' }}>
                      Shop Similar
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {invoiceOrder && (
        <InvoiceModal
          order={invoiceOrder}
          onClose={() => setInvoiceOrder(null)}
        />
      )}
    </div>
  );
}
