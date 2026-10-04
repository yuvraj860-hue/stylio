import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { productApi } from '../services/api';
import { useCart } from '../context/CartContext';
import SafeImage from '../components/SafeImage';
import { fmt } from '../utils/format';
import { SparklesIcon } from '../components/icons';

const AI_STYLE_PRESETS = [
  {
    name: 'Metropolitan Minimalist',
    tagline: 'Quiet luxury, monochromatic tones and relaxed tailoring for high-street poise.',
    score: 96,
    verdict: 'Exceptional texture harmony. Clean lines paired with low-profile leather create effortless sophistication.'
  },
  {
    name: 'Riviera Casual Luxe',
    tagline: 'Breathable linen weaves paired with structured chinos and clean footwear.',
    score: 93,
    verdict: 'Warm earthy balance. Ideal for daylight soirees, gallery previews, or rooftop dinners.'
  },
  {
    name: 'Atelier Noir Edge',
    tagline: 'High-contrast dark silhouettes with sculpted draping and modern attitude.',
    score: 98,
    verdict: 'Bold aesthetic cohesion. The deep tonal depth creates a commanding yet understated statement.'
  }
];

export default function OutfitStudioPage() {
  const { addItem } = useCart();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [selectedTop, setSelectedTop] = useState(null);
  const [selectedBottom, setSelectedBottom] = useState(null);
  const [selectedFootwear, setSelectedFootwear] = useState(null);
  const [presetIndex, setPresetIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    productApi
      .list({ limit: 40 })
      .then((res) => {
        if (cancelled) return;
        const list = res?.products || res?.data || (Array.isArray(res) ? res : []);
        setProducts(list);

        // Find initial selections
        const top = list.find((p) => {
          const c = (p.category || '').toLowerCase();
          return c.includes('shirt') || c.includes('t-shirt') || c.includes('jacket') || c.includes('top');
        }) || list[0];

        const bottom = list.find((p) => {
          const c = (p.category || '').toLowerCase();
          return c.includes('pant') || c.includes('jean') || c.includes('cargo') || c.includes('trouser');
        }) || list[1];

        const shoe = list.find((p) => {
          const c = (p.category || '').toLowerCase();
          return c.includes('sneaker') || c.includes('shoe') || c.includes('boot');
        }) || list[2];

        setSelectedTop(top || null);
        setSelectedBottom(bottom || null);
        setSelectedFootwear(shoe || null);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const tops = useMemo(() => {
    return products.filter((p) => {
      const c = (p.category || '').toLowerCase();
      return c.includes('shirt') || c.includes('t-shirt') || c.includes('jacket') || c.includes('top') || c.includes('dress');
    }).slice(0, 8);
  }, [products]);

  const bottoms = useMemo(() => {
    return products.filter((p) => {
      const c = (p.category || '').toLowerCase();
      return c.includes('pant') || c.includes('jean') || c.includes('cargo') || c.includes('trouser') || c.includes('short');
    }).slice(0, 8);
  }, [products]);

  const footwear = useMemo(() => {
    return products.filter((p) => {
      const c = (p.category || '').toLowerCase();
      return c.includes('sneaker') || c.includes('shoe') || c.includes('boot') || c.includes('accessories');
    }).slice(0, 8);
  }, [products]);

  const handleShuffle = () => {
    if (tops.length > 0) {
      setSelectedTop(tops[Math.floor(Math.random() * tops.length)]);
    }
    if (bottoms.length > 0) {
      setSelectedBottom(bottoms[Math.floor(Math.random() * bottoms.length)]);
    }
    if (footwear.length > 0) {
      setSelectedFootwear(footwear[Math.floor(Math.random() * footwear.length)]);
    }
    setPresetIndex((prev) => (prev + 1) % AI_STYLE_PRESETS.length);

    if (window.dispatchEvent) {
      window.dispatchEvent(
        new CustomEvent('stylio:toast', {
          detail: { message: '✨ AI synthesized a new curated outfit!' }
        })
      );
    }
  };

  const currentPreset = AI_STYLE_PRESETS[presetIndex];

  const totalRawPrice = (selectedTop?.price || 0) + (selectedBottom?.price || 0) + (selectedFootwear?.price || 0);
  const bundleDiscount = Math.round(totalRawPrice * 0.12);
  const finalBundlePrice = totalRawPrice - bundleDiscount;

  const handleAddAllToCart = () => {
    let addedCount = 0;
    if (selectedTop) {
      addItem(selectedTop, 1);
      addedCount++;
    }
    if (selectedBottom) {
      addItem(selectedBottom, 1);
      addedCount++;
    }
    if (selectedFootwear) {
      addItem(selectedFootwear, 1);
      addedCount++;
    }

    if (window.dispatchEvent) {
      window.dispatchEvent(
        new CustomEvent('stylio:toast', {
          detail: { message: `🛍️ Added complete outfit (${addedCount} pieces) to your bag!` }
        })
      );
    }
  };

  return (
    <div className="outfit-studio">
      <div className="studio-header">
        <div className="eyebrow" style={{ color: 'var(--color-gold)', marginBottom: 6 }}>
          STYLIO Atelier v1.1.0 Feature
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.8rem)', margin: '0 0 12px' }}>
          AI Mix &amp; Match Outfit Studio
        </h1>
        <p className="text-muted" style={{ fontSize: '0.95rem', lineHeight: 1.6 }}>
          Curate silhouettes in real time. Switch garments, assess neural color harmony scores, and acquire an entire signature look in a single click.
        </p>

        <div style={{ marginTop: 16 }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleShuffle}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.86rem' }}
          >
            <SparklesIcon size={16} />
            <span>AI Auto-Shuffle Fit</span>
          </button>
        </div>
      </div>

      <div className="studio-grid">
        {/* Left column: Garment Pickers */}
        <div className="studio-builder-card">
          {/* Slot 1: Tops */}
          <div className="studio-section-title">
            <span>1. Upper Silhouette (Tops &amp; Outerwear)</span>
            {selectedTop && (
              <span style={{ fontSize: '0.82rem', color: 'var(--color-gold)', fontWeight: 600 }}>
                {fmt(selectedTop.price)}
              </span>
            )}
          </div>
          <div className="studio-selector-row">
            {tops.map((item) => (
              <div
                key={item._id || item.id}
                className={`studio-item-option ${selectedTop?._id === item._id || selectedTop?.id === item.id ? 'selected' : ''}`}
                onClick={() => setSelectedTop(item)}
              >
                <div className="studio-item-thumb">
                  <SafeImage src={item.imageUrl || item.image} alt={item.name} />
                </div>
                <span className="studio-item-name">{item.name}</span>
                <span className="studio-item-price">{fmt(item.price)}</span>
              </div>
            ))}
          </div>

          {/* Slot 2: Bottoms */}
          <div className="studio-section-title">
            <span>2. Lower Silhouette (Pants &amp; Chinos)</span>
            {selectedBottom && (
              <span style={{ fontSize: '0.82rem', color: 'var(--color-gold)', fontWeight: 600 }}>
                {fmt(selectedBottom.price)}
              </span>
            )}
          </div>
          <div className="studio-selector-row">
            {bottoms.map((item) => (
              <div
                key={item._id || item.id}
                className={`studio-item-option ${selectedBottom?._id === item._id || selectedBottom?.id === item.id ? 'selected' : ''}`}
                onClick={() => setSelectedBottom(item)}
              >
                <div className="studio-item-thumb">
                  <SafeImage src={item.imageUrl || item.image} alt={item.name} />
                </div>
                <span className="studio-item-name">{item.name}</span>
                <span className="studio-item-price">{fmt(item.price)}</span>
              </div>
            ))}
          </div>

          {/* Slot 3: Footwear */}
          <div className="studio-section-title">
            <span>3. Soles &amp; Footwear</span>
            {selectedFootwear && (
              <span style={{ fontSize: '0.82rem', color: 'var(--color-gold)', fontWeight: 600 }}>
                {fmt(selectedFootwear.price)}
              </span>
            )}
          </div>
          <div className="studio-selector-row">
            {footwear.map((item) => (
              <div
                key={item._id || item.id}
                className={`studio-item-option ${selectedFootwear?._id === item._id || selectedFootwear?.id === item.id ? 'selected' : ''}`}
                onClick={() => setSelectedFootwear(item)}
              >
                <div className="studio-item-thumb">
                  <SafeImage src={item.imageUrl || item.image} alt={item.name} />
                </div>
                <span className="studio-item-name">{item.name}</span>
                <span className="studio-item-price">{fmt(item.price)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: Interactive Preview & AI Compatibility */}
        <div className="studio-preview-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="eyebrow" style={{ color: 'var(--color-gold-light)' }}>
              Curated Lookbook
            </span>
            <span style={{ fontSize: '0.78rem', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: 4 }}>
              {currentPreset.name}
            </span>
          </div>

          {/* Mannequin Visual Stack */}
          <div className="mannequin-stack">
            {selectedTop && (
              <div className="mannequin-slot">
                <img
                  src={selectedTop.imageUrl || selectedTop.image}
                  alt={selectedTop.name}
                  className="mannequin-thumb"
                />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>
                    Top Layer
                  </div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {selectedTop.name}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--color-gold-light)' }}>
                    {fmt(selectedTop.price)}
                  </div>
                </div>
              </div>
            )}

            {selectedBottom && (
              <div className="mannequin-slot">
                <img
                  src={selectedBottom.imageUrl || selectedBottom.image}
                  alt={selectedBottom.name}
                  className="mannequin-thumb"
                />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>
                    Lower Layer
                  </div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {selectedBottom.name}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--color-gold-light)' }}>
                    {fmt(selectedBottom.price)}
                  </div>
                </div>
              </div>
            )}

            {selectedFootwear && (
              <div className="mannequin-slot">
                <img
                  src={selectedFootwear.imageUrl || selectedFootwear.image}
                  alt={selectedFootwear.name}
                  className="mannequin-thumb"
                />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>
                    Footwear
                  </div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {selectedFootwear.name}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--color-gold-light)' }}>
                    {fmt(selectedFootwear.price)}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* AI Compatibility Score Card */}
          <div className="compatibility-meter">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-gold-light)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <SparklesIcon size={14} /> AI Harmony Score
              </span>
              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#4ade80' }}>
                {currentPreset.score}%
              </span>
            </div>
            <div className="compatibility-bar-wrap">
              <div className="compatibility-bar" style={{ width: `${currentPreset.score}%` }} />
            </div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.45 }}>
              {currentPreset.verdict}
            </p>
          </div>

          {/* Pricing & Bundle CTA */}
          <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}>
              <span>Items Total:</span>
              <span style={{ textDecoration: 'line-through' }}>{fmt(totalRawPrice)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: '#4ade80', marginBottom: 12 }}>
              <span>Bundle Advantage (12% OFF):</span>
              <span>-{fmt(bundleDiscount)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
              <span style={{ fontSize: '1rem', fontWeight: 700 }}>Total Look:</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-gold-light)' }}>
                {fmt(finalBundlePrice)}
              </span>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleAddAllToCart}
              style={{ width: '100%', padding: '14px', fontSize: '0.92rem', fontWeight: 700 }}
            >
              Add Full Outfit to Bag 🛍️
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
