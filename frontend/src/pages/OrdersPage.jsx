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

  // Cancellation and Return modal states
  const [cancelTargetOrder, setCancelTargetOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('Order created by mistake');
  const [cancelLoading, setCancelLoading] = useState(false);

  const [returnTargetOrder, setReturnTargetOrder] = useState(null);
  const [returnReason, setReturnReason] = useState('Size does not fit');
  const [returnLoading, setReturnLoading] = useState(false);

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

  const handleCancelOrder = async () => {
    if (!cancelTargetOrder) return;
    try {
      setCancelLoading(true);
      const id = cancelTargetOrder._id || cancelTargetOrder.id;
      await orderApi.cancel(id, cancelReason);
      setOrders((prev) =>
        prev.map((o) =>
          (o._id || o.id) === id
            ? { ...o, status: 'cancelled', cancellationReason: cancelReason, cancelledAt: new Date() }
            : o
        )
      );
      setCancelTargetOrder(null);
      setCancelReason('Order created by mistake');
    } catch (err) {
      alert(err.message || 'Could not cancel order');
    } finally {
      setCancelLoading(false);
    }
  };

  const handleReturnOrder = async () => {
    if (!returnTargetOrder) return;
    try {
      setReturnLoading(true);
      const id = returnTargetOrder._id || returnTargetOrder.id;
      await orderApi.requestReturn(id, returnReason);
      setOrders((prev) =>
        prev.map((o) =>
          (o._id || o.id) === id
            ? { ...o, returnStatus: 'requested', returnReason }
            : o
        )
      );
      setReturnTargetOrder(null);
      setReturnReason('Size does not fit');
    } catch (err) {
      alert(err.message || 'Could not request return');
    } finally {
      setReturnLoading(false);
    }
  };

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
            const canCancel = order.status === 'placed' || order.status === 'processing';
            const canReturn = order.status === 'delivered' && (!order.returnStatus || order.returnStatus === 'none');

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
                    {order.discountAmount > 0 && (
                      <div>
                        <span className="order-card__label">Savings</span>
                        <span style={{ color: '#16a34a', fontWeight: 600, fontSize: '0.85rem' }}>
                          -{fmt(order.discountAmount)} {order.promoCode && `(${order.promoCode})`}
                        </span>
                      </div>
                    )}
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

                {/* Delivery OTP Banner */}
                {order.deliveryOtp && order.status !== 'delivered' && order.status !== 'cancelled' && (
                  <div className="order-otp-banner">
                    <div className="order-otp-info">
                      <span className="order-otp-badge">🔐 Delivery OTP</span>
                      <span className="order-otp-text">Share with delivery agent at delivery</span>
                    </div>
                    <div className="order-otp-number">{order.deliveryOtp}</div>
                  </div>
                )}

                {/* Cancellation notice */}
                {order.status === 'cancelled' && (
                  <div style={{ margin: '10px 18px 0', padding: '8px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, fontSize: '0.82rem', color: '#b91c1c' }}>
                    <strong>Cancelled:</strong> {order.cancellationReason || 'Cancelled by customer'}.
                  </div>
                )}

                {/* Return request notice */}
                {order.returnStatus && order.returnStatus !== 'none' && (
                  <div style={{ margin: '10px 18px 0', padding: '8px 14px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6, fontSize: '0.82rem', color: '#1d4ed8' }}>
                    <strong>Return ({order.returnStatus.toUpperCase()}):</strong> {order.returnReason || 'Exchange/Return pickup is being processed'}.
                  </div>
                )}

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
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    {canCancel && (
                      <button
                        type="button"
                        className="order-cancel-btn"
                        onClick={() => setCancelTargetOrder(order)}
                        title="Cancel this order"
                      >
                        Cancel Order
                      </button>
                    )}

                    {canReturn && (
                      <button
                        type="button"
                        className="order-return-btn"
                        onClick={() => setReturnTargetOrder(order)}
                        title="Request 7-day Return or Exchange"
                      >
                        Return / Exchange
                      </button>
                    )}

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

      {/* Invoice Modal */}
      {invoiceOrder && (
        <InvoiceModal
          order={invoiceOrder}
          onClose={() => setInvoiceOrder(null)}
        />
      )}

      {/* Order Cancellation Modal */}
      {cancelTargetOrder && (
        <div className="order-action-modal-backdrop" onClick={() => setCancelTargetOrder(null)}>
          <div className="order-action-modal" onClick={(e) => e.stopPropagation()}>
            <div className="order-action-modal__header">
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Cancel Order</h3>
              <button className="order-action-modal__close" onClick={() => setCancelTargetOrder(null)}>✕</button>
            </div>
            <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: 12 }}>
              Are you sure you want to cancel Order #{String(cancelTargetOrder._id || cancelTargetOrder.id).slice(-8).toUpperCase()}? Product items will be returned to inventory.
            </p>
            <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Reason for cancellation:</label>
            <div className="order-action-modal__reasons">
              {[
                'Order created by mistake',
                'Found a better price elsewhere',
                'Need to change delivery address or size',
                'Delivery time is too long',
                'Other reason',
              ].map((reason) => (
                <label
                  key={reason}
                  className={`order-action-modal__reason-opt ${cancelReason === reason ? 'active' : ''}`}
                >
                  <input
                    type="radio"
                    name="cancelReason"
                    value={reason}
                    checked={cancelReason === reason}
                    onChange={(e) => setCancelReason(e.target.value)}
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18 }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setCancelTargetOrder(null)}
                disabled={cancelLoading}
              >
                Keep Order
              </button>
              <button
                type="button"
                className="btn"
                style={{ background: '#dc2626', color: '#fff' }}
                onClick={handleCancelOrder}
                disabled={cancelLoading}
              >
                {cancelLoading ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Request Modal */}
      {returnTargetOrder && (
        <div className="order-action-modal-backdrop" onClick={() => setReturnTargetOrder(null)}>
          <div className="order-action-modal" onClick={(e) => e.stopPropagation()}>
            <div className="order-action-modal__header">
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Return / Exchange Request</h3>
              <button className="order-action-modal__close" onClick={() => setReturnTargetOrder(null)}>✕</button>
            </div>
            <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: 12 }}>
              STYLIO 7-Day Hassle-free Return & Exchange. Please specify the reason for return:
            </p>
            <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Reason for return / exchange:</label>
            <div className="order-action-modal__reasons">
              {[
                'Size does not fit properly',
                'Item looks different from images',
                'Defective or damaged piece',
                'Quality or fabric not as expected',
                'Incorrect product received',
              ].map((reason) => (
                <label
                  key={reason}
                  className={`order-action-modal__reason-opt ${returnReason === reason ? 'active' : ''}`}
                >
                  <input
                    type="radio"
                    name="returnReason"
                    value={reason}
                    checked={returnReason === reason}
                    onChange={(e) => setReturnReason(e.target.value)}
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18 }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setReturnTargetOrder(null)}
                disabled={returnLoading}
              >
                Dismiss
              </button>
              <button
                type="button"
                className="btn btn-dark"
                onClick={handleReturnOrder}
                disabled={returnLoading}
              >
                {returnLoading ? 'Submitting...' : 'Submit Return Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
