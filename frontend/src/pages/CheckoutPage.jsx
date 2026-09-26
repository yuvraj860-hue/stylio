import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { useCart } from '../context/CartContext'
import { useUser } from '@clerk/clerk-react'
import { orderApi } from '../services/api'
import { fmt } from '../utils/format'

const STRIPE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''
const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID || ''
const SHIPPING_COST = 0
const FREE_SHIPPING_THRESHOLD = 1500

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`)
    if (existing) return resolve(true)
    const script = document.createElement('script')
    script.src = src
    script.onload = () => resolve(true)
    script.onerror = () => reject(new Error('Failed to load the payment gateway'))
    document.body.appendChild(script)
  })
}

async function detectMockMode() {
  if (RAZORPAY_KEY) return 'razorpay'
  if (STRIPE_KEY) return 'live'
  return 'mock'
}

function RazorpayPaymentSection({ itemPayload, shippingPayload, user, totalDue, promoCode, onPaid }) {
  const [processing, setProcessing] = useState(false)
  const [sectionError, setSectionError] = useState(null)

  const handleRazorpay = async (e) => {
    e.preventDefault()
    setProcessing(true)
    setSectionError(null)
    try {
      const order = await orderApi.razorpayCheckout(itemPayload(), shippingPayload(), promoCode)
      const { orderId, amount, currency } = order
      if (!orderId) throw new Error('Order setup failed. Please try again.')

      await loadScript('https://checkout.razorpay.com/v1/checkout.js')

      const options = {
        key: RAZORPAY_KEY,
        order_id: orderId,
        amount,
        currency: currency || 'INR',
        name: 'STYLIO',
        description: 'Fashion, made for you',
        handler: async (response) => {
          try {
            await orderApi.razorpayVerify({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            })
            await onPaid(response.razorpay_order_id)
          } catch (err) {
            setSectionError(err.message || 'Payment could not be confirmed. Please check your order.')
          }
        },
        prefill: {
          name: user?.fullName || user?.firstName || '',
          email: user?.emailAddresses?.[0]?.emailAddress || '',
        },
        modal: {
          ondismiss: () => setProcessing(false),
        },
        theme: { color: '#111111' },
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', (resp) => {
        const errObj = resp.error || {}
        setSectionError(errObj.description || 'Payment failed. Please try again.')
        setProcessing(false)
      })
      rzp.open()
    } catch (err) {
      setSectionError(err.message || "We couldn't start the payment. Please try again.")
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handleRazorpay}>
      <p className="text-muted" style={{ fontSize: '0.88rem', marginBottom: 'var(--space-5)' }}>
        Pay securely with UPI, cards, net banking and wallets via Razorpay.
      </p>
      {sectionError && <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>{sectionError}</div>}
      <button className="btn btn-dark btn-block" type="submit" disabled={processing}>
        {processing ? 'Redirecting to payment…' : `Pay ${fmt(totalDue)} with Razorpay`}
      </button>
    </form>
  )
}

function StripePaymentSection({ itemPayload, shippingPayload, email, totalDue, promoCode, onPaid }) {
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
      const intent = await orderApi.checkout(itemPayload(), shippingPayload(), promoCode)
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
  const { user } = useUser()
  const { items, subtotal, clearCart } = useCart()

  const [mode, setMode] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', address: '', city: '', zip: '', country: '' })
  const [formErrors, setFormErrors] = useState({})
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState(null)
  const [placed, setPlaced] = useState(null)

  // Promo code state
  const [promoInput, setPromoInput] = useState('')
  const [appliedPromo, setAppliedPromo] = useState(null)
  const [promoDiscount, setPromoDiscount] = useState(0)
  const [promoLoading, setPromoLoading] = useState(false)
  const [promoMessage, setPromoMessage] = useState(null)

  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        name: f.name || user.fullName || user.firstName || '',
        email: f.email || user.emailAddresses?.[0]?.emailAddress || '',
      }))
    }
  }, [user])

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
    navigate(`/orders`, { replace: true })
  }

  const handleApplyPromo = async (codeToTry) => {
    const code = (codeToTry || promoInput).trim().toUpperCase()
    if (!code) return
    setPromoLoading(true)
    setPromoMessage(null)
    try {
      const res = await orderApi.validateCoupon(code, subtotal)
      if (res && res.valid) {
        setAppliedPromo(res)
        setPromoDiscount(res.discount || 0)
        setPromoMessage({ type: 'success', text: `Coupon ${res.code} applied! Saved ₹${res.discount}` })
        setPromoInput('')
      } else {
        setPromoMessage({ type: 'error', text: res?.message || 'Invalid promo code' })
      }
    } catch (err) {
      setPromoMessage({ type: 'error', text: err?.message || 'Could not apply coupon' })
    } finally {
      setPromoLoading(false)
    }
  }

  const handleRemovePromo = () => {
    setAppliedPromo(null)
    setPromoDiscount(0)
    setPromoMessage(null)
  }

  const handleMockOrder = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    setProcessing(true)
    setError(null)
    try {
      const intent = await orderApi.checkout(itemPayload(), shippingPayload(), appliedPromo?.code || '')
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
  const totalDue = () => Math.max(1, Math.round((subtotal + shipping - promoDiscount) * 100) / 100)

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

              {mode === 'razorpay' && (
                <RazorpayPaymentSection
                  itemPayload={itemPayload}
                  shippingPayload={shippingPayload}
                  user={user}
                  totalDue={totalDue()}
                  promoCode={appliedPromo?.code || ''}
                  onPaid={confirmOrder}
                />
              )}

              {mode === 'live' && (
                <StripePaymentSection
                  itemPayload={itemPayload}
                  shippingPayload={shippingPayload}
                  email={form.email}
                  totalDue={totalDue()}
                  promoCode={appliedPromo?.code || ''}
                  onPaid={confirmOrder}
                />
              )}

              {mode === 'mock' && (
                <form onSubmit={handleMockOrder}>
                  <p className="text-muted" style={{ fontSize: '0.88rem', marginBottom: 'var(--space-5)' }}>
                    No payment gateway is configured in this environment, so this demo checkout places
                    your order directly without a real charge.
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

            {/* Promo Code Input & Badges */}
            <div style={{ borderTop: '1px solid var(--color-line)', paddingTop: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                Have a Promo Code?
              </label>
              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                <input
                  type="text"
                  placeholder="e.g. STYLIO10"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                  style={{
                    flex: 1,
                    textTransform: 'uppercase',
                    fontSize: '0.82rem',
                    padding: '8px 10px',
                    borderRadius: 4,
                    border: '1px solid var(--color-line)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleApplyPromo()}
                  disabled={promoLoading || !promoInput.trim()}
                  className="btn btn-dark"
                  style={{ padding: '8px 14px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                >
                  {promoLoading ? '...' : 'Apply'}
                </button>
              </div>

              {/* Quick coupons chips */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                {['STYLIO10', 'WELCOME500', 'FESTIVE20'].map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => handleApplyPromo(code)}
                    style={{
                      background: appliedPromo?.code === code ? '#111827' : '#f3f4f6',
                      color: appliedPromo?.code === code ? '#fff' : '#374151',
                      border: '1px dashed #d1d5db',
                      borderRadius: 12,
                      fontSize: '0.72rem',
                      padding: '3px 8px',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    🏷️ {code}
                  </button>
                ))}
              </div>

              {promoMessage && (
                <div
                  style={{
                    fontSize: '0.78rem',
                    padding: '6px 8px',
                    borderRadius: 4,
                    marginBottom: 10,
                    background: promoMessage.type === 'success' ? '#f0fdf4' : '#fef2f2',
                    color: promoMessage.type === 'success' ? '#15803d' : '#b91c1c',
                    border: `1px solid ${promoMessage.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
                  }}
                >
                  {promoMessage.text}
                </div>
              )}
            </div>

            <div className="summary-row">
              <span>Subtotal</span>
              <span>{fmt(subtotal)}</span>
            </div>

            {promoDiscount > 0 && appliedPromo && (
              <div className="summary-row" style={{ color: '#16a34a' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  Discount ({appliedPromo.code})
                  <button
                    type="button"
                    onClick={handleRemovePromo}
                    title="Remove coupon"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      padding: 0,
                    }}
                  >
                    ✕
                  </button>
                </span>
                <span>-{fmt(promoDiscount)}</span>
              </div>
            )}

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