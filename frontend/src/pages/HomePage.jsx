import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { productApi } from '../services/api'
import ProductCard from '../components/ProductCard'
import SafeImage from '../components/SafeImage'
import ProductGridSkeleton from '../components/ProductGridSkeleton'

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1800&q=80'

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
      <section className="hero">
        <div className="hero__bg">
          <SafeImage
            src={HERO_IMAGE}
            alt="A model in minimal, monochrome fashion"
          />
        </div>
        <div className="hero__content">
          <div className="eyebrow">Autumn · Winter 2026</div>
          <h1>Quiet Luxury, Considered</h1>
          <p>
            Timeless silhouettes. Honest fabrics. A wardrobe distilled to what
            matters — now with a stylist in your pocket.
          </p>
          <Link to="/shop" className="btn btn-gold">
            Shop the Season
          </Link>
        </div>
      </section>

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
    </>
  )
}