export function SkeletonCard({ count = 3 }: { count?: number }) {
  return (
    <>
      <h1 className="visually-hidden">Loading</h1>
      <div className="projects-grid" aria-label="Loading content">
        {Array.from({ length: count }).map((_, i) => (
          <div className="card skeleton skeleton--card" key={i} aria-hidden="true">
            <div className="skeleton__line" style={{ width: "40%" }} />
            <div className="skeleton__line" style={{ width: "85%" }} />
            <div className="skeleton__line" style={{ width: "95%" }} />
            <div className="skeleton__line" style={{ width: "65%" }} />
          </div>
        ))}
      </div>
    </>
  );
}