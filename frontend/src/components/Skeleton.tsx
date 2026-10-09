export function Skeleton({ variant = "text", width }: { variant?: "text" | "card" | "button"; width?: string }) {
  return (
    <span
      className={`skeleton skeleton--${variant}`}
      style={variant === "text" ? { width: width ?? "100%", maxWidth: "540px" } : undefined}
      aria-hidden="true"
    />
  );
}

export function SkeletonBlock({ lines = 3 }: { lines?: number }) {
  return (
    <div aria-label="Loading" role="status">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} width={i === lines - 1 ? "55%" : "100%"} />
      ))}
    </div>
  );
}