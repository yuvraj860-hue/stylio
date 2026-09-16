import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { useCart } from '../context/CartContext'
import { orderApi } from '../services/api'
import { fmt } from '../utils/format'

const STRIPE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''
const SHIPPING_COST = 0
const FREE_SHIPPING_THRESHOLD = 1500

async function detectMockMode() {
  if (!STRIPE_KEY) return 'mock'
  return 'live'
}

function StripePaymentSection({ itemPayload, shippingPayload, email, totalDue, onPaid }) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const [sectionError, setSectionError] = useState(null)

  const handleStripeSubmit = async (e) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setProcessing(true)
    setSectionError(null)
    try {
      const intent = await orderApi.checkout(itemPayload(), shippingPayload())
      const clientSecret = intent && (intent.clientSecret || (intent.paymentIntent && intent.paymentIntent.clientSecret))
      const paymentIntentId =
        (intent && (intent.paymentIntentId || (intent.paymentIntent && intent.paymentIntent.id)))

      if (!clientSecret || String(clientSecret).startsWith('mock_')) {
        const id = paymentIntentId || String(clientSecret || '').replace(/^mock_/, '')
        await onPaid(id)
        return
      }

      const { error: confirmError } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: elements.getElement(CardElement), billing_details: { email } }
      })
      if (confirmError) throw new Error(confirmError.message)

      await onPaid(paymentIntentId)
    } catch (err) {
      setSectionError(err.message)
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handleStripeSubmit}>
      <div className="field">
        <label>Card Details</label>
        <div style={{ padding: 'var(--space-4)', border: '1px solid var(--color-line)', borderRadius: 'var(--radius-sm)', background: 'var(--color-white)' }}>
          <CardElement options={{ style: { base: { fontSize: '15px', color: '#111111', fontFamily: 'Inter, sans-serif' } } }} />
        </div>
        <p className="text-muted" style={{ fontSize: '0.76rem', marginTop: 8 }}>
          Securely processed by Stripe.
        </p>
      </div>
      {sectionError && <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>{sectionError}</div>}
      <button className="btn btn-dark btn-block" type="submit" disabled={processing || !stripe}>
        {processing ? 'Processing payment…' : `Pay ${fmt(totalDue)}`}
      </button>
    </form>
  )
}

function CheckoutForm() {
  const navigate = useNavigate()
  const { items, subtotal, clearCart } = useCart()

  const [mode, setMode] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', address: '', city: '', zip: '', country: '' })
  const [formErrors, setFormErrors] = useState({})
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState(null)
  const [placed, setPlaced] = useState(null)

  useEffect(() => {
    if (mode === null) {
      detectMockMode().then(setMode)
    }
  }, [mode])

  if (items.length === 0 && !placed) {
    return (
      <section className="section">
        <div className="container" style={{ maxWidth: 640 }}>
          <div className="empty-state">
            <h3>Your bag is empty</h3>
            <p>Add a few pieces before you check out.</p>
            <Link to="/shop" className="btn btn-dark" style={{ marginTop: 16 }}>
              Browse the Shop
            </Link>
          </div>
        </div>
      </section>
    )
  }

  const update = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
    setFormErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const validateForm = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Please enter your full name'
    if (!form.email.trim()) errs.email = 'Please enter your email'
    else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) errs.email = 'Please enter a valid email'
    if (!form.address.trim()) errs.address = 'Please enter your street address'
    if (!form.city.trim()) errs.city = 'Please enter your city'
    if (!form.zip.trim()) errs.zip = 'Please enter your postal code'
    if (!form.country.trim()) errs.country = 'Please enter your country'
    setFormErrors(errs)
    return Object.keys(errs).length === 0
  }

  const itemPayload = () =>
    items.map((i) => ({
      productId: i._id,
      qty: i.qty,
      size: i.variant && i.variant.size ? i.variant.size : '',
      color: i.variant && i.variant.color ? i.variant.color : ''
    }))

  const shippingPayload = () => ({
    name: form.name,
    email: form.email,
    street: form.address,
    city: form.city,
    zip: form.zip,
    country: form.country
  })

  const confirmOrder = async (paymentIntentId) => {
    const order = await orderApi.confirm(paymentIntentId)
    clearCart()
    setPlaced(order && (order._id || order.id || order.orderId) ? order : { _id: 'pending' })
    navigate(`/account`, { replace: true })
  }

  const handleMockOrder = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    setProcessing(true)
    setError(null)
    try {
      const intent = await orderApi.checkout(itemPayload(), shippingPayload())
      const paymentIntentId =
        (intent && (intent.paymentIntentId || (intent.paymentIntent && intent.paymentIntent.id))) ||
        (intent && intent.clientSecret && intent.clientSecret.replace(/^mock_/, ''))
      if (!paymentIntentId) throw new Error('Order setup failed. Please try again.')
      await confirmOrder(paymentIntentId)
    } catch (err) {
      setError(err && err.message ? err.message : "We couldn't place your order. Please check your details and try again.")
    } finally {
      setProcessing(false)
    }
  }

  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST
  const totalDue = () => subtotal + shipping

const fieldClass = (field) => (formErrors[field] ? 'input-invalid' : '')

  const FieldError = ({ field }) =>
    formErrors[field] ? <div className="field-error">{formErrors[field]}</div> : null

  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <div>
            <div className="eyebrow">Almost yours</div>
            <h2>Checkout</h2>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="checkout-layout">
          <div>
            <div className="checkout-panel">
              <h3 className="serif">Shipping Details</h3>
              <div className="field">
                <label htmlFor="co-name">Full Name</label>
                <input id="co-name" className={fieldClass('name')} value={form.name} onChange={update('name')} required placeholder="Your name" aria-invalid={!!formErrors.name} />
                <FieldError field="name" />
              </div>
              <div className="field">
                <label htmlFor="co-email">Email</label>
                <input id="co-email" type="email" className={fieldClass('email')} value={form.email} onChange={update('email')} required placeholder="you@example.com" aria-invalid={!!formErrors.email} />
                <FieldError field="email" />
              </div>
              <div className="field">
                <label htmlFor="co-address">Street Address</label>
                <input id="co-address" className={fieldClass('address')} value={form.address} onChange={update('address')} required placeholder="123 Fashion Avenue" aria-invalid={!!formErrors.address} />
                <FieldError field="address" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="field">
                  <label htmlFor="co-city">City</label>
                  <input id="co-city" className={fieldClass('city')} value={form.city} onChange={update('city')} required placeholder="Paris" aria-invalid={!!formErrors.city} />
                  <FieldError field="city" />
                </div>
                <div className="field">
                  <label htmlFor="co-zip">Postal Code</label>
                  <input id="co-zip" className={fieldClass('zip')} value={form.zip} onChange={update('zip')} required placeholder="75001" aria-invalid={!!formErrors.zip} />
                  <FieldError field="zip" />
                </div>
              </div>
              <div className="field">
                <label htmlFor="co-country">Country</label>
                <input id="co-country" className={fieldClass('country')} value={form.country} onChange={update('country')} required placeholder="France" aria-invalid={!!formErrors.country} />
                <FieldError field="country" />
              </div>
            </div>

            <div className="checkout-panel">
              <h3 className="serif">Payment</h3>
              {mode === null && (
                <div style={{ textAlign: 'center', padding: 'var(--space-5) 0' }}>
                  <div className="spinner" style={{ margin: '0 auto var(--space-4)' }} />
                  <p className="text-muted" style={{ fontSize: '0.85rem' }}>Preparing secure checkout…</p>
                </div>
              )}

              {mode === 'live' && (
                <StripePaymentSection
                  itemPayload={itemPayload}
                  shippingPayload={shippingPayload}
                  email={form.email}
                  totalDue={totalDue()}
                  onPaid={confirmOrder}
                />
              )}

              {mode === 'mock' && (
                <form onSubmit={handleMockOrder}>
                  <p className="text-muted" style={{ fontSize: '0.88rem', marginBottom: 'var(--space-5)' }}>
                    Stripe isn't configured in this environment, so this demo checkout places your
                    order directly without a real charge.
                  </p>
                  <button className="btn btn-dark btn-block" type="submit" disabled={processing}>
                    {processing ? 'Placing order…' : `Place Order — ${fmt(totalDue())}`}
                  </button>
                </form>
              )}
            </div>
          </div>

          <aside className="checkout-summary">
            <h3 className="serif">Order Summary</h3>
            {items.map((i) => (
              <div className="summary-row" key={i._id} style={{ gap: 8 }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {i.name} × {i.qty}
                </span>
                <span>{fmt(i.price * i.qty)}</span>
              </div>
            ))}
            <div className="summary-row">
              <span>Shipping</span>
              <span>{shipping === 0 ? 'Free' : fmt(shipping)}</span>
            </div>
            <div className="summary-row total">
              <span>Total</span>
              <span>{fmt(totalDue())}</span>
            </div>
            <p className="text-muted" style={{ fontSize: '0.76rem', lineHeight: 1.5 }}>
              Free shipping over {fmt(FREE_SHIPPING_THRESHOLD)}. 30-day returns, always.
            </p>
          </aside>
        </div>
      </div>
    </section>
  )
}

export default function CheckoutPage() {
  const stripePromise = STRIPE_KEY ? loadStripe(STRIPE_KEY) : null
  if (!stripePromise) return <CheckoutForm />
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  )
}