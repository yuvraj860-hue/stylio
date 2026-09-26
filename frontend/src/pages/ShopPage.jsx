import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { productApi } from '../services/api'
import ProductGrid from '../components/ProductGrid'
import ProductGridSkeleton from '../components/ProductGridSkeleton'
import { SearchIcon, FilterIcon } from '../components/icons'
import { fmt } from '../utils/format'

const CATEGORIES = ['T-Shirts', 'Dresses', 'Sneakers', 'Hoodies', 'Jeans', 'Jackets', 'Accessories']

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()

  const [products, setProducts] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [textQuery, setTextQuery] = useState(searchParams.get('search') || '')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const activeCategories = useMemo(
    () => (searchParams.get('category') || '').split(',').filter(Boolean),
    [searchParams]
  )
  const minPrice = Number(searchParams.get('minPrice')) || 0
  const maxPrice = Number(searchParams.get('maxPrice')) || 15000
  const sort = searchParams.get('sort') || ''

  const [sliderMaxPrice, setSliderMaxPrice] = useState(maxPrice)

  // Sync local slider state when URL maxPrice changes from outside (e.g. back button, clear filters)
  useEffect(() => {
    setSliderMaxPrice(maxPrice)
  }, [maxPrice])

  // Debounced URL update when slider is dragged, preventing 30 URL changes per second
  useEffect(() => {
    const timer = setTimeout(() => {
      if (sliderMaxPrice !== maxPrice) {
        updateParams({ maxPrice: sliderMaxPrice })
      }
    }, 350)
    return () => clearTimeout(timer)
  }, [sliderMaxPrice, maxPrice])

  const fetchProducts = useCallback(() => {
    setError(null)
    setLoading(true)
    const params = {
      category: activeCategories,
      search: searchParams.get('search') || undefined,
      minPrice: minPrice > 0 ? minPrice : undefined,
      maxPrice: maxPrice < 15000 ? maxPrice : undefined,
      sort: sort === 'new' ? 'newest' : sort === 'price_asc' ? 'price_asc' : sort === 'price_desc' ? 'price_desc' : sort === 'top_rated' ? 'rating' : undefined,
      limit: 60
    }
    productApi
      .list(params)
      .then((data) => {
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data && data.products)
            ? data.products
            : Array.isArray(data && data.data)
              ? data.data
              : []
        setProducts(list)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [activeCategories, minPrice, maxPrice, sort, searchParams])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const updateParams = (updates) => {
    const next = new URLSearchParams(searchParams)
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
        next.delete(key)
      } else if (Array.isArray(value)) {
        next.set(key, value.join(','))
      } else {
        next.set(key, value)
      }
    })
    setSearchParams(next, { replace: true, preventScrollReset: true })
  }

  const toggleCategory = (cat) => {
    const has = activeCategories.includes(cat)
    const next = has
      ? activeCategories.filter((c) => c !== cat)
      : [...activeCategories, cat]
    updateParams({ category: next })
  }

  const handleTextSearch = (e) => {
    e.preventDefault()
    updateParams({ search: textQuery.trim() || undefined })
  }

  const clearAll = () => {
    setTextQuery('')
    setSliderMaxPrice(15000)
    setSearchParams({}, { replace: true, preventScrollReset: true })
  }

  const resultCount = products ? products.length : 0

  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <div>
            <div className="eyebrow">The Collection</div>
            <h2>Shop</h2>
          </div>
          <div className="text-muted" style={{ fontSize: '0.85rem' }}>
            {products ? `${resultCount} ${resultCount === 1 ? 'piece' : 'pieces'}` : 'Loading…'}
          </div>
        </div>

        <form className="search-bar" style={{ maxWidth: 420, marginBottom: 'var(--space-6)' }} onSubmit={handleTextSearch}>
          <span className="search-icon"><SearchIcon /></span>
          <input
            type="text"
            placeholder="Search this collection…"
            value={textQuery}
            onChange={(e) => setTextQuery(e.target.value)}
            aria-label="Search the shop"
          />
          <button type="submit" className="upload-btn" style={{ letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '0.72rem' }}>
            Go
          </button>
        </form>

        {/* Quick Category Selection Pills */}
        <div className="category-pills-bar">
          <button
            type="button"
            className={`category-pill ${activeCategories.length === 0 ? 'active' : ''}`}
            onClick={() => updateParams({ category: undefined })}
          >
            All Pieces
          </button>
          {CATEGORIES.map((cat) => {
            const isActive = activeCategories.includes(cat);
            return (
              <button
                key={cat}
                type="button"
                className={`category-pill ${isActive ? 'active' : ''}`}
                onClick={() => toggleCategory(cat)}
              >
                {cat}
              </button>
            );
          })}
        </div>

        <div className="shop-layout">
          <button
            className="filter-toggle"
            onClick={() => setFiltersOpen((v) => !v)}
            aria-expanded={filtersOpen}
            aria-controls="filter-panel"
          >
            <FilterIcon size={16} />
            {filtersOpen ? 'Hide Filters' : 'Show Filters'}
          </button>

          <aside
            id="filter-panel"
            className={`filter-panel ${filtersOpen ? 'open' : ''}`}
            aria-label="Filters"
          >
            <div className="filter-group">
              <h4>Category</h4>
              {CATEGORIES.map((cat) => (
                <label className="filter-option" key={cat}>
                  <input
                    type="checkbox"
                    checked={activeCategories.includes(cat)}
                    onChange={() => toggleCategory(cat)}
                  />
                  {cat}
                </label>
              ))}
            </div>

            <div className="filter-group">
              <h4>Price</h4>
              <div className="price-range">
                <input
                  type="range"
                  min={0}
                  max={15000}
                  step={500}
                  value={sliderMaxPrice}
                  onChange={(e) => setSliderMaxPrice(Number(e.target.value))}
                  onPointerUp={() => updateParams({ maxPrice: sliderMaxPrice })}
                  onTouchEnd={() => updateParams({ maxPrice: sliderMaxPrice })}
                  aria-label="Maximum price"
                />
                <div className="price-range__labels">
                  <span>{fmt(minPrice)}</span>
                  <span>{fmt(sliderMaxPrice)}</span>
                </div>
              </div>
            </div>

            <div className="filter-group">
              <h4>Sort</h4>
              <label className="filter-option">
                <input
                  type="radio"
                  name="sort"
                  checked={sort === ''}
                  onChange={() => updateParams({ sort: undefined })}
                />
                Featured
              </label>
              <label className="filter-option">
                <input
                  type="radio"
                  name="sort"
                  checked={sort === 'new'}
                  onChange={() => updateParams({ sort: 'new' })}
                />
                New In
              </label>
              <label className="filter-option">
                <input
                  type="radio"
                  name="sort"
                  checked={sort === 'price_asc'}
                  onChange={() => updateParams({ sort: 'price_asc' })}
                />
                Price: Low to High
              </label>
              <label className="filter-option">
                <input
                  type="radio"
                  name="sort"
                  checked={sort === 'price_desc'}
                  onChange={() => updateParams({ sort: 'price_desc' })}
                />
                Price: High to Low
              </label>
              <label className="filter-option">
                <input
                  type="radio"
                  name="sort"
                  checked={sort === 'top_rated'}
                  onChange={() => updateParams({ sort: 'top_rated' })}
                />
                Top Rated ★
              </label>
            </div>

            <button className="btn btn-ghost" style={{ alignSelf: 'flex-start', fontSize: '0.78rem' }} onClick={clearAll}>
              Clear all filters
            </button>
          </aside>

          <div className="shop-products-wrap" style={{ minHeight: '650px', position: 'relative' }}>
            {error && (
              <div className="alert alert-error">
                We couldn't load the collection. {error}
              </div>
            )}
            {!error && products === null && <ProductGridSkeleton count={8} />}
            {!error && products !== null && (
              <div style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s ease' }}>
                <ProductGrid
                  products={products}
                  emptyMessage={
                    location.pathname === '/shop'
                      ? 'No pieces found in this price range. Try widening your price range.'
                      : 'No pieces found.'
                  }
                />
                {products.length === 0 && (
                  <div style={{ textAlign: 'center', marginTop: 24 }}>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => {
                        setSliderMaxPrice(15000);
                        updateParams({ minPrice: undefined, maxPrice: undefined });
                      }}
                      style={{ fontSize: '0.82rem' }}
                    >
                      Reset Price Filter
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}