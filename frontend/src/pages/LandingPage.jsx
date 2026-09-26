import { useState } from 'react';
import { Link } from 'react-router-dom';
import SafeImage from '../components/SafeImage';

const CAPSULE_LOOKS = [
  {
    id: 'look-01',
    title: 'The Structured Trench',
    subtitle: 'Look 01 · Transitional Tailoring',
    image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1200&q=80',
    description: 'Double-faced water-repellent gabardine with horn buttons. Cut generously to drape effortlessly over tailored suits or heavy cashmere knits.',
    palette: ['#d7c4b7', '#2b2725', '#f0ede6'],
    materials: '100% Organic Cotton Gabardine · Horn Buttons · Cupro Lining',
    categoryQuery: 'category=Dresses',
  },
  {
    id: 'look-02',
    title: 'Monochromatic Mulberry Silk',
    subtitle: 'Look 02 · Evening Fluidity',
    image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=1200&q=80',
    description: 'Bias-cut 22-momme Mulberry silk slip dress paired with structured monochrome outer layers. Fluid elegance designed for intimate dinners and evening gatherings.',
    palette: ['#0f172a', '#1e293b', '#c5a059'],
    materials: 'Grade-6A Mulberry Silk · Hand-rolled Hems · Natural Plant Dyes',
    categoryQuery: 'category=Dresses',
  },
  {
    id: 'look-03',
    title: 'Architectural Footwear & Leather',
    subtitle: 'Look 03 · Modern Craft',
    image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1200&q=80',
    description: 'Hand-burnished Italian calfskin sneakers with Margom rubber soles. An architectural foundation bridging casual comfort with Savile Row formality.',
    palette: ['#ffffff', '#e2e8f0', '#0f172a'],
    materials: 'Full-Grain Tuscan Calfskin · Margom Cupsole · Vegetable-Tanned Lining',
    categoryQuery: 'category=Sneakers',
  },
  {
    id: 'look-04',
    title: 'The Minimalist Uniform',
    subtitle: 'Look 04 · Heavy Gauge Layers',
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1200&q=80',
    description: 'Substantial 320 GSM organic jersey tees, sculpted trousers, and brushed brass accessories crafted to outlast fleeting trend cycles.',
    palette: ['#f8fafc', '#94a3b8', '#1e293b'],
    materials: '320 GSM Organic Combed Cotton · Solid Brass Accents · Zero Waste Weave',
    categoryQuery: 'category=Accessories',
  },
];

const PRESS_ACCOLADES = [
  { publication: 'VOGUE INDIA', quote: '“STYLIO brings a razor-sharp Savile Row precision to contemporary everyday dressing.”' },
  { publication: 'GQ STYLE', quote: '“A masterclass in quiet luxury. Sourcing honest materials without the theatrical markups.”' },
  { publication: 'GRAZIA', quote: '“The AI personal styling engine actually understands silhouettes and fabric weights.”' },
  { publication: 'ELLE ATELIER', quote: '“Doorstep OTP handover and custom dust bag packaging elevate online shopping to private boutique standards.”' },
];

const STYLING_PROMPTS = [
  {
    id: 'rooftop',
    prompt: 'Dressing for a modern art gallery opening & dinner in Mumbai',
    response: {
      recommendation: 'Sculpted Mulberry Silk Dress + Brushed Silver Minimal Cuff + Architectural Leather Mules',
      stylistNote: 'Focus on fluid draping with stark minimalist accessories. Mumbai evenings call for breathable 22-momme silk that catches warm ambient gallery lighting.',
      palette: 'Noir · Titanium Silver · Champagne Sand',
    },
  },
  {
    id: 'business-casual',
    prompt: 'Executive travel wardrobe for Bangalore tech conferences',
    response: {
      recommendation: 'Tailored Wool-Blend Double Breasted Blazer + Heavy Organic Knit + Minimalist Leather Low-Tops',
      stylistNote: 'Pair high-gauge tailoring with relaxed luxury sneakers. Crisp lines command boardroom presence while remaining breathable for trans-terminal transit.',
      palette: 'Deep Navy · Heather Oatmeal · Optic White',
    },
  },
  {
    id: 'weekend',
    prompt: 'Understated Sunday brunch & seaside afternoon',
    response: {
      recommendation: 'Relaxed Drop-Shoulder Linen Tunic + Wide-Leg Pleated Chinos + Handcrafted Leather Slides',
      stylistNote: 'Unstructured tailoring at its best. Natural European flax linen breathes effortlessly and develops a gorgeous patina with every wear.',
      palette: 'Unbleached Flax · Warm Terracotta · Ecru',
    },
  },
];

export default function LandingPage() {
  const [activeLookIndex, setActiveLookIndex] = useState(0);
  const [selectedPrompt, setSelectedPrompt] = useState(STYLING_PROMPTS[0]);
  const [email, setEmail] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [copied, setCopied] = useState(false);

  const currentLook = CAPSULE_LOOKS[activeLookIndex];

  const handleVipSubmit = (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    setUnlocked(true);
    window.dispatchEvent(
      new CustomEvent('stylio:toast', {
        detail: { message: '🎉 Welcome to The Atelier! Your ₹500 voucher is unlocked.' },
      })
    );
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText('WELCOME500');
    setCopied(true);
    window.dispatchEvent(
      new CustomEvent('stylio:toast', {
        detail: { message: 'Code WELCOME500 copied to clipboard! ✂️' },
      })
    );
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="landing-page" style={{ background: '#faf9f5', color: '#0f172a' }}>
      {/* Hero Section */}
      <section
        style={{
          position: 'relative',
          minHeight: '88vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          overflow: 'hidden',
          padding: '60px 24px',
          background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.45) 0%, rgba(15, 23, 42, 0.82) 100%), url(https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1920&q=80) center/cover no-repeat',
        }}
      >
        <div style={{ maxWidth: 840, textAlign: 'center', margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <div
            style={{
              display: 'inline-block',
              fontSize: '0.74rem',
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: 'var(--color-gold-light, #d4af37)',
              fontWeight: 600,
              padding: '6px 16px',
              border: '1px solid rgba(212, 175, 55, 0.4)',
              borderRadius: 9999,
              marginBottom: 20,
              background: 'rgba(15, 23, 42, 0.35)',
              backdropFilter: 'blur(8px)',
            }}
          >
            Autumn · Winter 2026 Lookbook
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-display, Playfair Display, serif)',
              fontSize: 'clamp(2.4rem, 5.5vw, 4.2rem)',
              fontWeight: 500,
              lineHeight: 1.15,
              margin: '0 0 20px',
              color: '#ffffff',
              letterSpacing: '-0.01em',
            }}
          >
            Quiet Luxury, Considered.
          </h1>

          <p
            style={{
              fontSize: 'clamp(1rem, 1.8vw, 1.25rem)',
              color: 'rgba(255, 255, 255, 0.88)',
              fontWeight: 300,
              maxWidth: 620,
              margin: '0 auto 36px',
              lineHeight: 1.6,
            }}
          >
            A wardrobe distilled to what truly matters. Master tailoring, honest materials, and personalized AI fashion intelligence at your fingertips.
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              to="/shop"
              className="btn btn-gold"
              style={{ padding: '14px 32px', fontSize: '0.88rem', letterSpacing: '0.14em', fontWeight: 600 }}
            >
              Shop The Capsule
            </Link>
            <a
              href="#lookbook"
              className="btn btn-outline"
              style={{ padding: '14px 28px', fontSize: '0.88rem', color: '#ffffff', borderColor: 'rgba(255,255,255,0.6)' }}
            >
              Explore Editorial Lookbook ↓
            </a>
          </div>
        </div>
      </section>

      {/* Press & Accolades Ticker */}
      <section style={{ background: '#0b1120', color: '#ffffff', borderBottom: '1px solid #1e293b', padding: '24px 20px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 24,
              textAlign: 'center',
            }}
          >
            {PRESS_ACCOLADES.map((p, idx) => (
              <div key={idx} style={{ padding: '8px 12px' }}>
                <div style={{ fontSize: '0.72rem', letterSpacing: '0.22em', color: 'var(--color-gold, #c5a059)', fontWeight: 700, marginBottom: 6 }}>
                  {p.publication}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.72)', fontStyle: 'italic', lineHeight: 1.45 }}>
                  {p.quote}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Brand Manifesto / Philosophy */}
      <section style={{ padding: 'clamp(50px, 8vw, 90px) 24px', background: '#faf9f5' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 60px' }}>
            <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.25em', color: 'var(--color-gold, #c5a059)', fontWeight: 600, marginBottom: 10 }}>
              The Atelier Manifesto
            </div>
            <h2 style={{ fontFamily: 'var(--font-display, serif)', fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', margin: 0, color: '#0f172a' }}>
              Designed For Longevity, Not Fleeting Trends
            </h2>
            <p style={{ fontSize: '0.96rem', color: '#64748b', marginTop: 12, lineHeight: 1.65 }}>
              In an era of relentless fast fashion, STYLIO stands for intentional curation. Every silhouette is refined until nothing superfluous remains.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32 }}>
            <div style={{ background: '#ffffff', padding: '36px 30px', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 18px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 300, color: 'var(--color-gold, #c5a059)', fontFamily: 'var(--font-display, serif)', marginBottom: 12 }}>
                01.
              </div>
              <h3 style={{ fontFamily: 'var(--font-display, serif)', fontSize: '1.3rem', margin: '0 0 10px', color: '#0f172a' }}>
                Considered Sourcing
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                We partner exclusively with legacy weavers and artisan workshops. High-thread-count organic cottons, cruelty-free silks, and vegetable-tanned leathers that soften gracefully with age.
              </p>
            </div>

            <div style={{ background: '#ffffff', padding: '36px 30px', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 18px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 300, color: 'var(--color-gold, #c5a059)', fontFamily: 'var(--font-display, serif)', marginBottom: 12 }}>
                02.
              </div>
              <h3 style={{ fontFamily: 'var(--font-display, serif)', fontSize: '1.3rem', margin: '0 0 10px', color: '#0f172a' }}>
                Neural Styling Intelligence
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                Our proprietary AI stylist and CLIP vision engine learn your aesthetic nuances, offering bespoke pairings, occasion lookbooks, and exact silhouette matching from any inspiration photo.
              </p>
            </div>

            <div style={{ background: '#ffffff', padding: '36px 30px', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 18px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 300, color: 'var(--color-gold, #c5a059)', fontFamily: 'var(--font-display, serif)', marginBottom: 12 }}>
                03.
              </div>
              <h3 style={{ fontFamily: 'var(--font-display, serif)', fontSize: '1.3rem', margin: '0 0 10px', color: '#0f172a' }}>
                Bespoke White-Glove Handover
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                Every garment is hand-inspected, wrapped in silk dust bags, and delivered directly to your doorstep in 2 to 4 business days with secure dynamic 4-digit OTP verification.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Lookbook Capsule Section */}
      <section id="lookbook" style={{ padding: 'clamp(50px, 8vw, 90px) 24px', background: '#0b1120', color: '#ffffff' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 20, marginBottom: 36 }}>
            <div>
              <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.24em', color: 'var(--color-gold-light)', fontWeight: 600 }}>
                Interactive Capsule
              </div>
              <h2 style={{ fontFamily: 'var(--font-display, serif)', fontSize: 'clamp(1.9rem, 3.5vw, 2.6rem)', margin: '6px 0 0', color: '#ffffff' }}>
                Curated Style Directions
              </h2>
            </div>

            {/* Look Selector Pills */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {CAPSULE_LOOKS.map((look, idx) => (
                <button
                  key={look.id}
                  onClick={() => setActiveLookIndex(idx)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 9999,
                    border: activeLookIndex === idx ? '1px solid var(--color-gold, #c5a059)' : '1px solid rgba(255,255,255,0.15)',
                    background: activeLookIndex === idx ? 'var(--color-gold, #c5a059)' : 'transparent',
                    color: activeLookIndex === idx ? '#000000' : '#94a3b8',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  Look 0{idx + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Look Showcase Card */}
          <div
            style={{
              background: '#131b2e',
              borderRadius: 16,
              overflow: 'hidden',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              border: '1px solid #1e293b',
              boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ position: 'relative', minHeight: 460 }}>
              <SafeImage
                src={currentLook.image}
                alt={currentLook.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: 20,
                  left: 20,
                  background: 'rgba(11, 17, 32, 0.85)',
                  backdropFilter: 'blur(8px)',
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: '1px solid rgba(255,255,255,0.12)',
                  fontSize: '0.78rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--color-gold-light)',
                }}
              >
                {currentLook.subtitle}
              </div>
            </div>

            <div style={{ padding: 'clamp(28px, 5vw, 48px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--color-gold-light)', marginBottom: 8 }}>
                  Editorial Breakdown
                </div>
                <h3 style={{ fontFamily: 'var(--font-display, serif)', fontSize: '2rem', margin: '0 0 16px', color: '#ffffff' }}>
                  {currentLook.title}
                </h3>
                <p style={{ fontSize: '0.94rem', color: 'rgba(255,255,255,0.78)', lineHeight: 1.7, marginBottom: 24 }}>
                  {currentLook.description}
                </p>

                <div style={{ borderTop: '1px solid #1e293b', paddingTop: 20, marginBottom: 20 }}>
                  <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#94a3b8', marginBottom: 6 }}>
                    Artisan Specifications
                  </div>
                  <div style={{ fontSize: '0.86rem', color: '#e2e8f0', fontWeight: 500 }}>
                    {currentLook.materials}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#94a3b8', marginBottom: 8 }}>
                    Curated Color Palette
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {currentLook.palette.map((color, i) => (
                      <span
                        key={i}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: color,
                          border: '2px solid rgba(255,255,255,0.2)',
                          display: 'inline-block',
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 32 }}>
                <Link
                  to={`/shop?${currentLook.categoryQuery}`}
                  className="btn btn-gold"
                  style={{ display: 'inline-flex', padding: '12px 28px', fontSize: '0.85rem', letterSpacing: '0.12em', textDecoration: 'none' }}
                >
                  Shop This Direction →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive AI Stylist Live Experience Section */}
      <section style={{ padding: 'clamp(50px, 8vw, 90px) 24px', background: '#faf9f5' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 40, alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.24em', color: 'var(--color-gold, #c5a059)', fontWeight: 600, marginBottom: 10 }}>
                Intelligent Concierge
              </div>
              <h2 style={{ fontFamily: 'var(--font-display, serif)', fontSize: 'clamp(1.9rem, 3.5vw, 2.6rem)', margin: '0 0 16px', color: '#0f172a' }}>
                Ask Stylio: Your Private Fashion Intelligence
              </h2>
              <p style={{ fontSize: '0.94rem', color: '#64748b', lineHeight: 1.65, marginBottom: 24 }}>
                Unsure how to layer for a destination wedding or styled boardroom session? Our Hinglish-enabled AI stylist pairs silhouettes, balances fabrics, and offers instant wardrobe solutions.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#64748b', fontWeight: 600 }}>
                  Try a sample styling query:
                </div>
                {STYLING_PROMPTS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPrompt(p)}
                    style={{
                      textAlign: 'left',
                      padding: '12px 18px',
                      borderRadius: 8,
                      border: selectedPrompt.id === p.id ? '1.5px solid var(--color-gold, #c5a059)' : '1px solid #e2e8f0',
                      background: selectedPrompt.id === p.id ? '#ffffff' : '#f8fafc',
                      color: selectedPrompt.id === p.id ? '#0f172a' : '#64748b',
                      fontSize: '0.86rem',
                      fontWeight: selectedPrompt.id === p.id ? 600 : 400,
                      cursor: 'pointer',
                      boxShadow: selectedPrompt.id === p.id ? '0 4px 12px rgba(197, 160, 89, 0.12)' : 'none',
                      transition: 'all 0.2s',
                    }}
                  >
                    💬 “{p.prompt}”
                  </button>
                ))}
              </div>
            </div>

            {/* Stylist Response Card */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 16,
                padding: '32px',
                boxShadow: '0 15px 35px -5px rgba(15, 23, 42, 0.06)',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, borderBottom: '1px solid #f1f5f9', paddingBottom: 16 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: '50%',
                    background: '#0f172a',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1.5px solid var(--color-gold, #c5a059)',
                    fontFamily: 'var(--font-display, serif)',
                    fontWeight: 700,
                  }}
                >
                  S
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.94rem', color: '#0f172a' }}>Stylio Private Concierge</div>
                  <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 500 }}>● Active & Ready to Assist</div>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#94a3b8', marginBottom: 4 }}>
                  Curated Outfit Pairing
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a', fontFamily: 'var(--font-display, serif)' }}>
                  {selectedPrompt.response.recommendation}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: 18, borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 20 }}>
                <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-gold, #c5a059)', fontWeight: 600, marginBottom: 4 }}>
                  Stylist Insight
                </div>
                <p style={{ fontSize: '0.88rem', color: '#334155', lineHeight: 1.6, margin: 0 }}>
                  {selectedPrompt.response.stylistNote}
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Palette: <strong>{selectedPrompt.response.palette}</strong>
                </div>
                <Link to="/shop" className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '6px 16px' }}>
                  Explore Pieces →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Stylio Atelier VIP Club (Newsletter with Instant ₹500 Voucher) */}
      <section style={{ padding: 'clamp(40px, 6vw, 80px) 24px', background: '#0b1120' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center', color: '#ffffff' }}>
          <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.25em', color: 'var(--color-gold-light)', marginBottom: 8 }}>
            Private Membership
          </div>
          <h2 style={{ fontFamily: 'var(--font-display, serif)', fontSize: 'clamp(1.9rem, 3.5vw, 2.5rem)', margin: '0 0 12px', color: '#ffffff' }}>
            Join The Stylio Atelier
          </h2>
          <p style={{ fontSize: '0.92rem', color: 'rgba(255,255,255,0.76)', lineHeight: 1.6, marginBottom: 28 }}>
            Access confidential seasonal drops, private runway editorials, and unlock an instant <strong>₹500 voucher</strong> on your first order.
          </p>

          {!unlocked ? (
            <form onSubmit={handleVipSubmit} style={{ display: 'flex', gap: 10, maxWidth: 440, margin: '0 auto' }}>
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
                padding: '20px 24px',
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
                  onClick={handleCopyCode}
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
      </section>

      {/* Trust Badges */}
      <section style={{ borderTop: '1px solid var(--color-line, #e2e8f0)', padding: '36px 20px', background: '#faf9f5' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>💎</div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0f172a' }}>100% Certified Authentic</div>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Direct boutique & artisan provenance</div>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>⚡</div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0f172a' }}>Complimentary Express Delivery</div>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Free nationwide on orders ₹1,500+</div>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>🔄</div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0f172a' }}>7-Day Doorstep Returns</div>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Effortless pickup & instant refunds</div>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>🛡️</div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0f172a' }}>Delivery OTP Protection</div>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Verified handover security on every order</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
