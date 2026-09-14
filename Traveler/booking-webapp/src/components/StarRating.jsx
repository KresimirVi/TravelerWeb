import { Star } from "lucide-react";

// crta 5 zvjezdica, boji ih zavisno od ocjene
export default function StarRating({ rating, reviews, size = 14 }) {
  const hasReviews = reviews && reviews > 0;
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={size}
            className={
              hasReviews && i < Math.round(rating)
                ? "fill-amber-400 text-amber-400"
                : "fill-slate-200 text-slate-200"
            }
          />
        ))}
      </div>
      {hasReviews ? (
        <>
          <span className="text-xs font-semibold text-ink">{rating.toFixed(1)}</span>
          <span className="text-xs text-muted">({reviews})</span>
        </>
      ) : (
        <span className="text-xs text-muted">Novo</span>
      )}
    </div>
  );
}
