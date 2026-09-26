import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { productApi } from '../services/api'
import ProductCard from '../components/ProductCard'
import SafeImage from '../components/SafeImage'
import ProductGridSkeleton from '../components/ProductGridSkeleton'
import { ChevronLeftIcon, ChevronRightIcon } from '../components/icons'

const HERO_SLIDES = [
  {
    id: 'slide-1',
    eyebrow: 'Autumn · Winter 2026 Atelier',
    title: 'Quiet Luxury, Considered.',
    description: 'Timeless silhouettes. Honest natural materials. A wardrobe distilled to what truly matters — now with a private stylist in your pocket.',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=2000&q=85',
    primaryCta: { label: 'Shop The Season', to: '/shop' },
    secondaryCta: { label: 'Explore Lookbook ↓', to: '/lookbook' },
    pillText: '01 · Capsule'
  },
  {
    id: 'slide-2',
    eyebrow: 'Atelier Eveningwear',
    title: 'Mulberry Silk, Sculpted Noir.',
    description: 'Bias-cut 22-momme Mulberry silk slip dresses and architectural evening silhouettes crafted for intimate galas and modern eveningwear.',
    image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=2000&q=85',
    primaryCta: { label: 'Explore Dresses', to: '/shop?category=Dresses' },
    secondaryCta: { label: 'Evening Edit', to: '/lookbook' },
    pillText: '02 · Evening'
  },
  {
    id: 'slide-3',
    eyebrow: 'Italian Leather Craft',
    title: 'Architectural Soles & Form.',
    description: 'Hand-burnished Italian calfskin sneakers with Margom cup-soles. Bridging Savile Row formality with supreme daily comfort.',
    image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=2000&q=85',
    primaryCta: { label: 'Shop Footwear', to: '/shop?category=Sneakers' },
    secondaryCta: { label: 'Discover Sneakers', to: '/shop?category=Sneakers' },
    pillText: '03 · Footwear'
  },
  {
    id: 'slide-4',
    eyebrow: 'Neural AI Fashion Concierge',
    title: 'Your Private Stylist, In Pocket.',
    description: 'Upload any outfit photo or ask Stylio in Hinglish. Bespoke silhouette matching, occasion lookbooks, and tailored recommendations.',
    image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=2000&q=85',
    primaryCta: { label: 'Explore Collection', to: '/shop' },
    secondaryCta: { label: 'Ask Stylio ✨', to: '/lookbook#lookbook' },
    pillText: '04 · AI Stylist'
  }
]

const categoryImage = (photoId) =>
  `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=900&q=80`

const CATEGORIES = [
  {
    name: 'Dresses',
    query: 'category=Dresses',
    image: categoryImage('photo-1515372039744-b8f02a3ae446')
  },
  {
    name: 'Sneakers',
    query: 'category=Sneakers',
    image: categoryImage('photo-1549298916-b41d501d3772')
  },
  {
    name: 'Accessories',
    query: 'category=Accessories',
    image: categoryImage('photo-1584917865442-de89df76afd3')
  }
]

const VALUE_PROPS = [
  {
    title: 'Considered Materials',
    body: 'Natural fabrics and honest construction, chosen to last beyond a season.'
  },
  {
    title: 'Curated For You',
    body: 'Editorial edits plus AI recommendations tuned to your taste.'
  },
  {
    title: 'Visual Search',
    body: 'Upload any outfit photo and find pieces that share its spirit.'
  },
  {
    title: 'Personal Stylist',
    body: 'Ask Stylio for advice — gifts, fits and occasions, day or night.'
  }
]

export default function HomePage() {
  const [featured, setFeatured] = useState(null)
  const [error, setError] = useState(null)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [touchStartPos, setTouchStartPos] = useState({ x: 0, y: 0 })
  const [touchEndPos, setTouchEndPos] = useState({ x: 0, y: 0 })

  // Auto-play continuous cycle: strictly slides automatically every 5 seconds (5000ms)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [currentSlide])

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length)
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)

  const handleTouchStart = (e) => {
    const t = e.targetTouches[0]
    setTouchStartPos({ x: t.clientX, y: t.clientY })
    setTouchEndPos({ x: t.clientX, y: t.clientY })
  }
  const handleTouchMove = (e) => {
    const t = e.targetTouches[0]
    setTouchEndPos({ x: t.clientX, y: t.clientY })
  }
  const handleTouchEnd = () => {
    const distX = touchStartPos.x - touchEndPos.x
    const distY = touchStartPos.y - touchEndPos.y
    // Strictly require intentional horizontal swipe (>60px and 1.5x greater than vertical movement)
    if (Math.abs(distX) > 60 && Math.abs(distX) > Math.abs(distY) * 1.5) {
      if (distX > 0) nextSlide()
      else prevSlide()
    }
  }

  useEffect(() => {
    let cancelled = false
    productApi
      .list({ featured: true, limit: 8 })
      .then((data) => {
        if (cancelled) return
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data && data.products)
            ? data.products
            : Array.isArray(data && data.data)
              ? data.data
              : []
        setFeatured(list)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      <div className="hero-wrapper">
        <section
          className="hero"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          aria-label="Featured Collections Carousel"
        >
          {HERO_SLIDES.map((slide, idx) => {
            const isActive = idx === currentSlide
            return (
              <div
                key={slide.id}
                className={`hero__slide ${isActive ? 'active' : ''}`}
                aria-hidden={!isActive}
              >
                <div className="hero__slide-bg">
                  <SafeImage
                    src={slide.image}
                    alt={slide.title}
                  />
                </div>
                <div className="hero__slide-content">
                  <div className="eyebrow">{slide.eyebrow}</div>
                  <h1>{slide.title}</h1>
                  <p>{slide.description}</p>
                  <div className="hero__actions">
                    <Link to={slide.primaryCta.to} className="btn btn-gold">
                      {slide.primaryCta.label}
                    </Link>
                    {slide.secondaryCta && (
                      <Link
                        to={slide.secondaryCta.to}
                        className="btn btn-outline"
                        style={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.6)' }}
                      >
                        {slide.secondaryCta.label}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {/* Previous & Next Arrow Buttons */}
          <button
            type="button"
            className="hero__arrow hero__arrow--prev"
            onClick={prevSlide}
            aria-label="Previous Slide"
          >
            <ChevronLeftIcon size={22} />
          </button>
          <button
            type="button"
            className="hero__arrow hero__arrow--next"
            onClick={nextSlide}
            aria-label="Next Slide"
          >
            <ChevronRightIcon size={22} />
          </button>

          {/* Bottom Slide Indicators */}
          <div className="hero__indicators">
            {HERO_SLIDES.map((slide, idx) => (
              <button
                key={slide.id}
                type="button"
                className={`hero__indicator-pill ${idx === currentSlide ? 'active' : ''}`}
                onClick={() => setCurrentSlide(idx)}
                aria-label={`Jump to slide ${idx + 1}: ${slide.title}`}
              >
                {slide.pillText}
              </button>
            ))}
          </div>
        </section>
      </div>

      <section className="section">
        <div className="container">
          <div className="value-props">
            {VALUE_PROPS.map((v) => (
              <div className="value-prop" key={v.title}>
                <h4 className="serif">{v.title}</h4>
                <p>{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <div>
              <div className="eyebrow">Browse</div>
              <h2>By Category</h2>
            </div>
          </div>
          <div className="category-tiles">
            {CATEGORIES.map((c) => (
              <Link to={`/shop?${c.query}`} className="category-tile" key={c.name}>
                <SafeImage src={c.image} alt={c.name} loading="lazy" />
                <span className="category-tile__label">
                  {c.name}
                  <span className="category-tile__sub">Explore →</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <div>
              <div className="eyebrow">Editor's Pick</div>
              <h2>Featured Pieces</h2>
            </div>
            <Link to="/shop" className="btn btn-ghost" style={{ fontSize: '0.78rem', letterSpacing: '0.18em' }}>
              View All →
            </Link>
          </div>

          {error && (
            <div className="alert alert-error">Couldn't load featured pieces. {error}</div>
          )}
          {!featured && !error && <ProductGridSkeleton count={4} />}

          {featured && featured.length > 0 && (
            <div className="product-grid">
              {featured.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          )}
          {featured && featured.length === 0 && !error && (
            <div className="empty-state">
              <h3>New pieces arriving soon</h3>
              <p>Our buyers are out curating something special.</p>
            </div>
          )}
        </div>
      </section>

      {/* Curated Editorial Split Banner */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <div>
              <div className="eyebrow">Curated Editions</div>
              <h2>Style Directions</h2>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 'var(--space-6)' }}>
            <div
              style={{
                position: 'relative',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
                minHeight: 380,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                padding: 'var(--space-6)',
                background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.78) 100%), url(https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80) center/cover no-repeat',
                color: '#fff',
              }}
            >
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--color-gold-light)' }}>
                The Evening Edit
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.65rem', margin: '6px 0 10px' }}>
                Sculpted Silhouettes
              </h3>
              <p style={{ fontSize: '0.86rem', color: 'rgba(255,255,255,0.85)', marginBottom: 18, maxWidth: 360 }}>
                Mulberry silk drapes, razor-sharp tailoring, and understated monochrome drama for after hours.
              </p>
              <Link to="/shop?category=Dresses" className="btn btn-outline" style={{ alignSelf: 'flex-start', color: '#fff', borderColor: 'rgba(255,255,255,0.6)', padding: '8px 20px', fontSize: '0.8rem' }}>
                Discover The Edit →
              </Link>
            </div>

            <div
              style={{
                position: 'relative',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
                minHeight: 380,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                padding: 'var(--space-6)',
                background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.78) 100%), url(https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&q=80) center/cover no-repeat',
                color: '#fff',
              }}
            >
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--color-gold-light)' }}>
                Modern Essentials
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.65rem', margin: '6px 0 10px' }}>
                Architectural Footwear & Layers
              </h3>
              <p style={{ fontSize: '0.86rem', color: 'rgba(255,255,255,0.85)', marginBottom: 18, maxWidth: 360 }}>
                Italian calfskin sneakers and structural heavy knits designed for effortless everyday wear.
              </p>
              <Link to="/shop?category=Sneakers" className="btn btn-outline" style={{ alignSelf: 'flex-start', color: '#fff', borderColor: 'rgba(255,255,255,0.6)', padding: '8px 20px', fontSize: '0.8rem' }}>
                Explore Footwear →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Testimonials & Reviews */}
      <section className="section" style={{ background: 'var(--color-paper-light, #faf9f5)', borderTop: '1px solid var(--color-line)', borderBottom: '1px solid var(--color-line)' }}>
        <div className="container">
          <div className="section-head" style={{ textAlign: 'center', margin: '0 auto var(--space-7)' }}>
            <div>
              <div className="eyebrow" style={{ color: 'var(--color-gold)' }}>Client Stories</div>
              <h2 style={{ fontFamily: 'var(--font-display)' }}>Voices of the Atelier</h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-ink-muted)', marginTop: 6 }}>
                Loved by discerning wardrobes across India. Rated 4.9 ★ by 10,000+ patrons.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 'var(--space-5)' }}>
            {[
              {
                stars: 5,
                quote: '“The fabric weight and stitching on the wool blazer are Savile Row caliber. The AI Stylist recommendation paired it perfectly with the wide trousers.”',
                author: 'Anya Roy',
                location: 'Mumbai',
                badge: 'Verified Buyer · 3 Orders',
              },
              {
                stars: 5,
                quote: '“Visual search blew me away. I uploaded a Pinterest moodboard photo and Stylio matched the exact minimal silk top. Arrived in 2 days.”',
                author: 'Vikram Mehta',
                location: 'Bengaluru',
                badge: 'Verified Buyer · 5 Orders',
              },
              {
                stars: 5,
                quote: '“The discrete packaging and doorstep OTP delivery make shopping completely stress-free. It feels like receiving a private boutique shipment.”',
                author: 'Radhika Sharma',
                location: 'New Delhi',
                badge: 'Verified Buyer · 2 Orders',
              },
            ].map((t, idx) => (
              <div
                key={idx}
                style={{
                  background: '#ffffff',
                  padding: '24px 26px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-line)',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ color: '#eab308', fontSize: '1rem', letterSpacing: 2, marginBottom: 12 }}>
                    {'★'.repeat(t.stars)}
                  </div>
                  <p style={{ fontSize: '0.88rem', fontStyle: 'italic', lineHeight: 1.6, color: 'var(--color-ink)' }}>
                    {t.quote}
                  </p>
                </div>
                <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--color-ink)' }}>{t.author}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-ink-muted)', display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                    <span>{t.location}</span>
                    <span style={{ color: '#16a34a', fontWeight: 500 }}>{t.badge}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Stylio Atelier VIP Club (Newsletter with Instant ₹500 Voucher) */}
      <section className="section">
        <div className="container">
          <NewsletterSection />
        </div>
      </section>

      {/* Atelier Trust Guarantee Badges */}
      <section style={{ borderTop: '1px solid var(--color-line)', padding: 'var(--space-6) 0', background: 'var(--color-paper)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))', gap: 'var(--space-5)', textAlign: 'center' }}>
            <div style={{ padding: '12px' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>💎</div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-ink)' }}>100% Certified Authentic</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-ink-muted)', marginTop: 2 }}>Direct boutique & atelier sourcing</div>
            </div>
            <div style={{ padding: '12px' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>⚡</div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-ink)' }}>Complimentary Express Delivery</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-ink-muted)', marginTop: 2 }}>Free on all orders ₹1,500+</div>
            </div>
            <div style={{ padding: '12px' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>🔄</div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-ink)' }}>7-Day Doorstep Returns</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-ink-muted)', marginTop: 2 }}>Free pickup & instant refunds</div>
            </div>
            <div style={{ padding: '12px' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>🛡️</div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-ink)' }}>Delivery OTP Protection</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-ink-muted)', marginTop: 2 }}>Verified handover security</div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

function NewsletterSection() {
  const [email, setEmail] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!email || !email.includes('@')) return
    setUnlocked(true)
    window.dispatchEvent(
      new CustomEvent('stylio:toast', {
        detail: { message: '🎉 Welcome to The Atelier! Your ₹500 voucher is unlocked.' }
      })
    )
  }

  const handleCopy = () => {
    navigator.clipboard.writeText('WELCOME500')
    setCopied(true)
    window.dispatchEvent(
      new CustomEvent('stylio:toast', {
        detail: { message: 'Copied code WELCOME500 to clipboard!' }
      })
    )
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div
      style={{
        background: 'var(--color-ink, #0f172a)',
        color: '#ffffff',
        borderRadius: 'var(--radius-sm)',
        padding: 'clamp(32px, 5vw, 64px)',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: -100,
          right: -100,
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(197, 160, 89, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div style={{ maxWidth: 560, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.24em', color: 'var(--color-gold-light)', marginBottom: 8 }}>
          Private Invitation
        </div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 3.5vw, 2.4rem)', margin: '0 0 12px', color: '#ffffff' }}>
          Join The Stylio Atelier
        </h2>
        <p style={{ fontSize: '0.92rem', color: 'rgba(255,255,255,0.78)', lineHeight: 1.6, marginBottom: 28 }}>
          Receive private seasonal drops, personal stylist editorials, and an instant <strong>₹500 voucher</strong> on your first order.
        </p>

        {!unlocked ? (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: 10, maxWidth: 440, width: '100%', margin: '0 auto' }}>
            <input
              type="email"
              placeholder="Enter your email address..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                flex: 1,
                padding: '13px 18px',
                borderRadius: 4,
                border: '1px solid rgba(255,255,255,0.22)',
                background: 'rgba(255,255,255,0.08)',
                color: '#fff',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              className="btn btn-gold"
              style={{ padding: '13px 24px', fontSize: '0.84rem', letterSpacing: '0.12em', whiteSpace: 'nowrap' }}
            >
              Unlock ₹500
            </button>
          </form>
        ) : (
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px dashed var(--color-gold-light)',
              borderRadius: 8,
              padding: '18px 24px',
              maxWidth: 420,
              margin: '0 auto',
            }}
          >
            <div style={{ fontSize: '0.8rem', color: 'var(--color-gold-light)', marginBottom: 6 }}>
              ✨ YOUR EXCLUSIVE FIRST ORDER VOUCHER
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <span style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '0.15em', color: '#ffffff' }}>
                WELCOME500
              </span>
              <button
                type="button"
                onClick={handleCopy}
                style={{
                  background: 'var(--color-gold)',
                  color: '#000',
                  border: 'none',
                  borderRadius: 4,
                  padding: '6px 14px',
                  fontWeight: 600,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                }}
              >
                {copied ? '✓ Copied' : 'Copy Code'}
              </button>
            </div>
            <div style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.6)', marginTop: 8 }}>
              Valid on orders above ₹1,999. Apply at checkout.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}