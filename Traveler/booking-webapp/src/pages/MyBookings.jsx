import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarX, Loader2, Star, X as XIcon } from "lucide-react";
import Navbar from "../components/Navbar";
import ReviewModal from "../components/ReviewModal";
import { useAuth } from "../context/AuthContext";
import { fetchMyBookings, cancelBooking } from "../api/client";

const fmt = (d) => new Date(d).toLocaleDateString("hr-BA", { day: "numeric", month: "long", year: "numeric" });

export default function MyBookings() {
  const { user, openAuthModal } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const load = () => {
    if (!user) return;
    setLoading(true);
    fetchMyBookings(user.id)
      .then((rows) =>

        setBookings((prev) => rows.filter((b) => b.status !== "cancelled" || b.cancelled_by === "owner"))
      )
      .finally(() => setLoading(false));
  };

  useEffect(load, [user]);

  // gost otkazuje svoju rezervaciju, oslobadja datume
  const handleCancel = async (id) => {
    setCancellingId(id);
    try {
      await cancelBooking(id, user.id);
      setBookings((prev) => prev.filter((b) => b.id !== id));
    } finally {
      setCancellingId(null);
    }
  };

  const canReview = (b) => b.status === "confirmed" && !b.has_review && new Date(b.check_in) <= new Date();

  if (!user) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="mx-auto max-w-3xl px-8 py-24 text-center">
          <p className="font-display text-xl font-semibold text-ink">
            Prijavi se da vidiš svoje rezervacije
          </p>
          <button
            onClick={openAuthModal}
            className="mt-6 rounded-md bg-brand px-6 py-3 text-sm font-semibold text-white hover:opacity-90"
          >
            Prijava
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-[1500px] px-8 py-12 lg:px-16">
        <h1 className="font-display text-2xl font-bold text-ink">Moje rezervacije</h1>

        {loading && (
          <div className="mt-8 flex items-center gap-2 text-sm text-muted">
            <Loader2 size={16} className="animate-spin" /> Učitavanje...
          </div>
        )}

        {!loading && bookings.length === 0 && (
          <div className="mt-10 text-center">
            <CalendarX className="mx-auto text-muted" size={40} />
            <p className="mt-4 font-display text-lg font-semibold text-ink">
              Još uvijek nemaš rezervacija
            </p>
            <p className="mt-2 text-sm text-muted">Kada rezerviraš smještaj, pojavit će se ovdje.</p>
          </div>
        )}

        <div className="mt-6 max-w-3xl space-y-4">
          {bookings.map((b) => (
            <div key={b.id} className="flex gap-4 rounded-lg border border-line bg-white p-4">
              <Link to={`/hotel/${b.hotel_slug}`} className="flex-shrink-0">
                <img
                  src={b.hotel_cover}
                  alt={b.hotel_name}
                  className="h-20 w-24 rounded-md object-cover transition-opacity hover:opacity-80"
                />
              </Link>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <Link to={`/hotel/${b.hotel_slug}`} className="hover:underline">
                    <p className="font-display text-sm font-semibold text-ink">{b.hotel_name}</p>
                    <p className="text-xs text-muted">{b.hotel_location}</p>
                  </Link>
                  <span
                    className={`flex-shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                      b.status === "cancelled"
                        ? "bg-red-50 text-red-600"
                        : b.status === "pending"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-sky-bg text-brand"
                    }`}
                  >
                    {b.status === "cancelled"
                      ? b.cancelled_by === "owner"
                        ? "Otkazao vlasnik"
                        : b.cancelled_by === "owner_rejected"
                        ? "Zahtjev odbijen"
                        : "Otkazano"
                      : b.status === "pending"
                      ? "Čeka odobrenje"
                      : "Potvrđeno"}
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted">
                  {fmt(b.check_in)} – {fmt(b.check_out)} · {b.rooms} {b.rooms === 1 ? "jedinica" : "jedinice"}
                </p>
                <p className="mt-1 text-sm font-semibold text-ink">€{Number(b.total_price).toLocaleString()}</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {b.status !== "cancelled" && (
                    <button
                      onClick={() => handleCancel(b.id)}
                      disabled={cancellingId === b.id}
                      className="flex items-center gap-1 rounded-md border border-line px-3 py-1.5 text-xs font-semibold text-muted hover:border-red-300 hover:text-red-600"
                    >
                      <XIcon size={12} /> Otkaži
                    </button>
                  )}
                  {b.status !== "cancelled" && canReview(b) && (
                    <button
                      onClick={() => setReviewTarget(b)}
                      className="flex items-center gap-1 rounded-md border border-brand px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand hover:text-white"
                    >
                      <Star size={12} /> Napiši recenziju
                    </button>
                  )}
                  {b.status !== "cancelled" && b.has_review && (
                    <span className="flex items-center gap-1 text-xs text-muted">
                      <Star size={12} className="fill-amber-400 text-amber-400" /> Recenzija objavljena
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {reviewTarget && (
        <ReviewModal
          booking={reviewTarget}
          onClose={() => setReviewTarget(null)}
          onSubmitted={() => {
            setReviewTarget(null);
            load();
          }}
        />
      )}
    </div>
  );
}
