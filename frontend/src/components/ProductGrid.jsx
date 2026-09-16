import ProductCard from './ProductCard'

export default function ProductGrid({ products, emptyMessage = 'No pieces match your search.' }) {
  if (!products || products.length === 0) {
    return (
      <div className="empty-state">
        <h3>Nothing here yet</h3>
        <p>{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  )
}