import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { productApi } from '../services/api'
import ProductGrid from '../components/ProductGrid'
import ProductGridSkeleton from '../components/ProductGridSkeleton'
import { FilterIcon } from '../components/icons'
import { fmt } from '../utils/format'

const CATEGORIES = ['Shoes', 'Beauty', 'Shirts', 'T-Shirts', 'Pants', 'Jeans', 'Dresses', 'Jackets', 'Hoodies', 'Sneakers', 'Accessories']

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()

  const [products, setProducts] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
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
  const isShoesOnly = activeCategories.length === 1 && (activeCategories[0].toLowerCase() === 'shoes' || activeCategories[0].toLowerCase() === 'sneakers')
  const isNewInApparel = sort === 'new' && !activeCategories.includes('Beauty')

  const displayedProducts = useMemo(() => {
    if (!products) return null
    return products.filter((p) => {
      const c = (p.category || '').toLowerCase()
      const pGender = (p.gender || '').toLowerCase()

      const isBeauty = c === 'beauty'
      const isShoes = c === 'shoes' || c === 'sneakers'

      // If user selected Beauty specifically: strictly only show beauty items
      if (isBeautyOnly) {
        return isBeauty
      }

      // If user selected Shoes specifically: strictly only show footwear items
      if (isShoesOnly) {
        return isShoes
      }

      // When Men is chosen: strictly show only Men's clothes
      if (isMenSelected) {
        if (isBeauty || pGender === 'women') return false
        if (activeCategories.length > 0) {
          const lowerCats = activeCategories.map((x) => x.toLowerCase())
          return lowerCats.some((cat) => (cat === 'shoes' || cat === 'sneakers') ? isShoes : c === cat)
        }
        return pGender === 'men'
      }

      // When Women is chosen: strictly show only Women's clothes
      if (isWomenSelected) {
        if (isBeauty || pGender === 'men') return false
        if (activeCategories.length > 0) {
          const lowerCats = activeCategories.map((x) => x.toLowerCase())
          return lowerCats.some((cat) => (cat === 'shoes' || cat === 'sneakers') ? isShoes : c === cat)
        }
        return pGender === 'women'
      }

      // If user selected other specific categories (not Beauty, not Shoes):
      if (activeCategories.length > 0) {
        const lowerCats = activeCategories.map((x) => x.toLowerCase())
        return lowerCats.some((cat) => (cat === 'shoes' || cat === 'sneakers') ? isShoes : c === cat)
      }

      // If user clicked "New In" from navbar/filters: show new apparel/clothing, exclude makeup
      if (isNewInApparel) {
        return !isBeauty
      }

      return true
    })
  }, [products, isMenSelected, isWomenSelected, isBeautyOnly, isShoesOnly, isNewInApparel, activeCategories])

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
                  : isShoesOnly
                    ? 'Footwear & Sneaker Vault • All Kicks'
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
                  : isShoesOnly
                    ? 'Shoes & Footwear'
                    : isBeautyOnly
                      ? 'Beauty & Cosmetics'
                      : isNewInApparel
                        ? 'New In'
                        : activeCategories.length === 1
                          ? activeCategories[0]
                          : 'Shop'}
            </h2>
          </div>
          <div className="text-muted" style={{ fontSize: '0.85rem', fontWeight: (isBeautyOnly || isShoesOnly) ? 600 : 400, color: (isBeautyOnly || isShoesOnly) ? 'var(--color-gold)' : undefined }}>
            {displayedProducts ? `${resultCount} ${resultCount === 1 ? 'piece' : 'pieces'}` : 'Loading…'}
          </div>
        </div>

        {/* Clean Category Selection Chips */}
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