import { useState } from "react";
import { X, Star, Loader2 } from "lucide-react";
import { createReview } from "../api/client";
import { useAuth } from "../context/AuthContext";

// forma za ostaviti recenziju nakon boravka
export default function ReviewModal({ booking, onClose, onSubmitted }) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!booking) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (rating === 0) {
      setError("Odaberi ocjenu (bar 1 zvjezdicu).");
      return;
    }
    setLoading(true);
    try {
      await createReview({
        bookingId: booking.id,
        userId: user.id,
        rating,
        comment: comment.trim() || undefined,
      });
      onSubmitted?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 card-shadow">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-ink">Napiši recenziju</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-sky-bg hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>
        <p className="mt-1 text-sm text-muted">{booking.hotel_name}</p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <p className="text-xs font-medium text-muted">Tvoja ocjena</p>
            <div className="mt-2 flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHoverRating(n)}
                  onMouseLeave={() => setHoverRating(0)}
                >
                  <Star
                    size={32}
                    className={
                      n <= (hoverRating || rating)
                        ? "fill-amber-400 text-amber-400"
                        : "fill-slate-200 text-slate-200"
                    }
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted">Komentar (nije obavezno)</label>
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Kako je bilo?"
              className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-brand"
            />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-brand py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            Objavi recenziju
          </button>
        </form>
      </div>
    </div>
  );
}
