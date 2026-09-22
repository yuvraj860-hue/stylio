import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserProfile, useUser } from '@clerk/clerk-react';
import { useCart } from '../context/CartContext';
import { orderApi } from '../services/api';
import { fmt } from '../utils/format';

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

const STATUS_LABEL = {
  placed: 'Placed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

function statusBadgeClass(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'delivered') return 'badge-muted';
  if (s === 'cancelled') return 'badge-error';
  return 'badge-gold';
}

export default function UserProfilePage() {
  const { user, isLoaded } = useUser();
  const { items, clearCart } = useCart();
  const [orders, setOrders] = useState(null);
  const [orderError, setOrderError] = useState(null);

  useEffect(() => {
    if (!isLoaded) return;
    let cancelled = false;
    orderApi
      .myOrders()
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data && data.orders)
            ? data.orders
            : Array.isArray(data && data.data)
              ? data.data
              : [];
        setOrders(list);
      })
      .catch((err) => {
        if (!cancelled) setOrderError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [isLoaded]);

  const initials = (user && user.fullName)
    ? user.fullName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : (user && user.firstName)
      ? user.firstName.charAt(0).toUpperCase()
      : 'S';

  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <div>
            <div className="eyebrow">Welcome back</div>
            <h2>My Account</h2>
          </div>
        </div>

        <div className="account-grid">
          <aside className="account-side">
            <div className="avatar-circle">{initials}</div>
            <div>
              <div style={{ fontWeight: 500 }}>
                {user && user.fullName ? user.fullName : user?.firstName || 'Stylio Member'}
              </div>
              <div className="text-muted" style={{ fontSize: '0.85rem' }}>
                {user && user.emailAddresses?.[0]?.emailAddress || ''}
              </div>
            </div>
            <Link to="/shop" className="btn btn-outline btn-block">
              Continue Shopping
            </Link>
            {items.length > 0 && (
              <button className="btn btn-ghost btn-block" onClick={clearCart}>
                Clear Bag
              </button>
            )}
          </aside>

          <div>
            <UserProfile
              appearance={{
                elements: {
                  card: 'user-profile-card',
                },
              }}
            />

            <div className="section-head" style={{ marginTop: 'var(--space-8)', marginBottom: 'var(--space-4)' }}>
              <div>
                <div className="eyebrow">Order History</div>
                <h2 style={{ fontSize: '1.5rem' }}>Your Orders</h2>
              </div>
            </div>

            {orderError && <div className="alert alert-error">Couldn't load your orders. {orderError}</div>}
            {!orders && !orderError && <div className="spinner" />}

            {orders && orders.length === 0 && (
              <div className="empty-state">
                <h3>No orders yet</h3>
                <p>Your first Stylio order is a milestone — make it count.</p>
                <Link to="/shop" className="btn btn-dark" style={{ marginTop: 16 }}>
                  Start Shopping
                </Link>
              </div>
            )}

            {orders && orders.length > 0 && (
              orders.map((order) => (
                <div className="order-card" key={order._id || order.id || order.orderId}>
                  <div className="order-card__top">
                    <span className="order-card__id">
                      Order{' '}
                      {order._id || order.orderId || order.id
                        ? String(order._id || order.orderId || order.id).slice(-8).toUpperCase()
                        : 'Pending'}
                    </span>
                    <span className={`badge ${statusBadgeClass(order.status)}`}>
                      {STATUS_LABEL[String(order.status || '').toLowerCase()] || order.status || 'Processing'}
                    </span>
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.82rem' }}>
                    Placed {formatDate(order.createdAt || order.date)}
                  </div>
                  {order.shippingAddress && (order.shippingAddress.street || order.shippingAddress.city) && (
                    <div className="text-muted" style={{ fontSize: '0.78rem', marginTop: 4 }}>
                      {order.shippingAddress.name && <>{order.shippingAddress.name} · </>}
                      {order.shippingAddress.street && <>{order.shippingAddress.street}, </>}
                      {[order.shippingAddress.city, order.shippingAddress.state, order.shippingAddress.zip, order.shippingAddress.country].filter(Boolean).join(', ')}
                    </div>
                  )}
                  <div className="order-card__items">
                    {Array.isArray(order.items) && order.items.length > 0
                      ? order.items
                          .map((i) => {
                            const name = (i && (i.product && i.product.name)) || (i && i.name) || 'Item';
                            const qty = i && (i.qty || i.quantity);
                            const parts = [name];
                            if (qty) parts.push(`× ${qty}`);
                            if (i && i.size) parts.push(i.size);
                            if (i && i.color) parts.push(i.color);
                            return parts.join(' ');
                          })
                          .join(' · ')
                      : 'Order contents pending'}
                  </div>
                  <div className="product-detail__price">
                    {typeof order.total === 'number' || (order.total && !Number.isNaN(Number(order.total)))
                      ? fmt(order.total)
                      : ''}
                  </div>
                </div>
              ))
            )}

            <div className="checkout-panel" style={{ marginTop: 'var(--space-7)' }}>
              <h3 className="serif">Wishlist</h3>
              <div className="empty-state" style={{ padding: 'var(--space-5) 0 0' }}>
                <p>
                  Saved pieces will appear here. Use the Stylio stylist or browse the shop
                  to find your next favourites.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}