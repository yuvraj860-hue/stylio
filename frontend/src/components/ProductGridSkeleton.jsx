const SKELETONS = [0, 1, 2, 3, 4, 5]

export default function ProductGridSkeleton({ count = 6 }) {
  const cards = SKELETONS.slice(0, count)
  return (
    <div className="product-grid" aria-hidden="true" data-testid="product-grid-skeleton">
      {cards.map((i) => (
        <div className="skeleton-card" key={i}>
          <div className="skeleton skeleton-card__img" />
          <div className="skeleton skeleton-card__line" />
          <div className="skeleton skeleton-card__line short" />
        </div>
      ))}
    </div>
  )
}