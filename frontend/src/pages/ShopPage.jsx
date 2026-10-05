import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { productApi } from '../services/api'
import ProductGrid from '../components/ProductGrid'
import ProductGridSkeleton from '../components/ProductGridSkeleton'
import { SearchIcon, FilterIcon } from '../components/icons'
import { fmt } from '../utils/format'

const CATEGORIES = ['Beauty', 'Shirts', 'T-Shirts', 'Pants', 'Jeans', 'Dresses', 'Jackets', 'Hoodies', 'Sneakers', 'Accessories']

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
  const genderParam = (searchParams.get('gender') || '').toLowerCase().trim()
  const isMenSelected = genderParam === 'men'
  const isWomenSelected = genderParam === 'women'

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
      gender: genderParam || undefined,
      search: searchParams.get('search') || undefined,
      minPrice: minPrice > 0 ? minPrice : undefined,
      maxPrice: maxPrice < 15000 ? maxPrice : undefined,
      sort: sort === 'new' ? 'newest' : sort === 'price_asc' ? 'price_asc' : sort === 'price_desc' ? 'price_desc' : sort === 'top_rated' ? 'rating' : undefined,
      limit: 120
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
  }, [activeCategories, genderParam, minPrice, maxPrice, sort, searchParams])

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

  const selectQuickCategory = (cat) => {
    if (activeCategories.length === 1 && activeCategories[0].toLowerCase() === cat.toLowerCase()) {
      updateParams({ category: undefined })
    } else {
      updateParams({ category: cat })
    }
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

  const isBeautyOnly = activeCategories.length === 1 && activeCategories[0].toLowerCase() === 'beauty'
  const isNewInApparel = sort === 'new' && !activeCategories.includes('Beauty')

  const displayedProducts = useMemo(() => {
    if (!products) return null
    return products.filter((p) => {
      const c = (p.category || '').toLowerCase()
      const tags = (p.tags || []).map((t) => t.toLowerCase())
      const pGender = (p.gender || '').toLowerCase()
      const name = (p.name || '').toLowerCase()

      const isBeautyItem =
        c === 'beauty' ||
        tags.includes('beauty') ||
        tags.includes('makeup') ||
        tags.includes('cosmetics') ||
        tags.includes('lipstick') ||
        tags.includes('kajal') ||
        tags.includes('mascara') ||
        tags.includes('skincare') ||
        tags.includes('perfume') ||
        name.includes('lipstick') ||
        name.includes('perfume') ||
        name.includes('foundation') ||
        name.includes('eyeshadow') ||
        name.includes('serum') ||
        name.includes('kajal') ||
        name.includes('mascara')

      const isWomenItem =
        pGender === 'women' ||
        c === 'dresses' ||
        tags.includes('women') ||
        tags.includes('womens') ||
        tags.includes("women's") ||
        tags.includes('female') ||
        tags.includes('dress') ||
        tags.includes('blouse') ||
        tags.includes('crop top') ||
        tags.includes('skirt') ||
        tags.includes('milkmaid') ||
        tags.includes('cottagecore') ||
        tags.includes('co-ord') ||
        name.includes('women') ||
        name.includes('dress') ||
        name.includes('blouse') ||
        name.includes('crop top') ||
        name.includes('skirt') ||
        name.includes('palazzo') ||
        name.includes('mom fit') ||
        name.includes('flared') ||
        name.includes('milkmaid') ||
        name.includes('cottagecore') ||
        name.includes('co-ord') ||
        name.includes('power blazer') ||
        name.includes('crossbody bag')

      const isMenItem =
        !isBeautyItem &&
        !isWomenItem &&
        (pGender === 'men' ||
          tags.includes('men') ||
          tags.includes('mens') ||
          tags.includes("men's") ||
          tags.includes('male') ||
          name.includes('oxford') ||
          name.includes('cuban') ||
          name.includes('chino') ||
          name.includes('cargo') ||
          name.includes('jogger') ||
          name.includes('puffer') ||
          name.includes('polo') ||
          ['shirts', 't-shirts', 'pants', 'jeans', 'hoodies', 'jackets'].includes(c))

      // If user selected Beauty specifically: strictly only show beauty items
      if (isBeautyOnly) {
        return isBeautyItem
      }

      // When Men is chosen: strictly show only Men's clothes
      if (isMenSelected) {
        if (isBeautyItem || isWomenItem) return false
        if (activeCategories.length > 0) {
          const lowerCats = activeCategories.map((x) => x.toLowerCase())
          if (!lowerCats.includes(c)) return false
        }
        return isMenItem || pGender === 'men'
      }

      // When Women is chosen: strictly show only Women's clothes
      if (isWomenSelected) {
        if (isBeautyItem || (!isWomenItem && pGender !== 'women')) return false
        if (activeCategories.length > 0) {
          const lowerCats = activeCategories.map((x) => x.toLowerCase())
          if (!lowerCats.includes(c)) return false
        }
        return true
      }

      // If user selected other specific categories (not Beauty): match those
      if (activeCategories.length > 0 && !activeCategories.includes('Beauty')) {
        const lowerCats = activeCategories.map((x) => x.toLowerCase())
        return lowerCats.includes(c)
      }

      // If user clicked "New In" from navbar/filters: show new apparel/clothing, exclude makeup
      if (isNewInApparel) {
        return !isBeautyItem
      }

      return true
    })
  }, [products, isMenSelected, isWomenSelected, isBeautyOnly, isNewInApparel, activeCategories])

  const resultCount = displayedProducts ? displayedProducts.length : 0

  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <div>
            <div className="eyebrow" style={{ color: isBeautyOnly ? 'var(--color-gold)' : undefined }}>
              {isMenSelected
                ? "Men's Atelier • Tailoring & Streetwear"
                : isWomenSelected
                  ? "Women's Collection • Couture & Everyday"
                  : isBeautyOnly
                    ? "L'Atelier Beauté • Complete Makeup"
                    : isNewInApparel
                      ? 'Fresh Season Drops • New In'
                      : 'The Collection'}
            </div>
            <h2>
              {isMenSelected
                ? "Men's Collection"
                : isWomenSelected
                  ? "Women's Collection"
                  : isBeautyOnly
                    ? 'Beauty & Cosmetics Atelier'
                    : isNewInApparel
                      ? 'New In (Apparel & Fashion)'
                      : activeCategories.length === 1
                        ? activeCategories[0]
                        : 'Shop'}
            </h2>
          </div>
          <div className="text-muted" style={{ fontSize: '0.85rem', fontWeight: isBeautyOnly ? 600 : 400, color: isBeautyOnly ? 'var(--color-gold)' : undefined }}>
            {displayedProducts ? `${resultCount} ${resultCount === 1 ? 'piece' : 'pieces'}` : 'Loading…'}
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

        {/* Department / Gender Quick Selection */}
        <div className="gender-pills-bar" style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`category-pill ${!isMenSelected && !isWomenSelected && !isBeautyOnly ? 'active' : ''}`}
            onClick={() => updateParams({ gender: undefined, category: undefined })}
            style={{ fontWeight: 600 }}
          >
            ✦ All Departments
          </button>
          <button
            type="button"
            className={`category-pill ${isMenSelected ? 'active' : ''}`}
            onClick={() => updateParams({ gender: isMenSelected ? undefined : 'men' })}
            style={{ fontWeight: 600 }}
          >
            👔 Men's Collection
          </button>
          <button
            type="button"
            className={`category-pill ${isWomenSelected ? 'active' : ''}`}
            onClick={() => updateParams({ gender: isWomenSelected ? undefined : 'women' })}
            style={{ fontWeight: 600 }}
          >
            👗 Women's Collection
          </button>
          <button
            type="button"
            className={`category-pill ${isBeautyOnly ? 'active' : ''}`}
            onClick={() => updateParams({ category: isBeautyOnly ? undefined : 'Beauty', gender: undefined })}
            style={{ fontWeight: 600 }}
          >
            💄 Beauty &amp; Makeup
          </button>
        </div>

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
                onClick={() => selectQuickCategory(cat)}
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
              <h4>Department</h4>
              <label className="filter-option">
                <input
                  type="radio"
                  name="deptRadio"
                  checked={!isMenSelected && !isWomenSelected}
                  onChange={() => updateParams({ gender: undefined })}
                />
                All Fashion
              </label>
              <label className="filter-option">
                <input
                  type="radio"
                  name="deptRadio"
                  checked={isMenSelected}
                  onChange={() => updateParams({ gender: 'men' })}
                />
                👔 Men's Wear
              </label>
              <label className="filter-option">
                <input
                  type="radio"
                  name="deptRadio"
                  checked={isWomenSelected}
                  onChange={() => updateParams({ gender: 'women' })}
                />
                👗 Women's Wear
              </label>
            </div>

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
            {!error && displayedProducts === null && <ProductGridSkeleton count={8} />}
            {!error && displayedProducts !== null && (
              <div style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s ease' }}>
                <ProductGrid
                  products={displayedProducts}
                  emptyMessage={
                    isBeautyOnly
                      ? 'No beauty or cosmetics items found matching this filter.'
                      : isNewInApparel
                        ? 'No new apparel items found matching this filter.'
                        : 'No pieces found in this price range. Try widening your price range.'
                  }
                />
                {displayedProducts.length === 0 && (
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