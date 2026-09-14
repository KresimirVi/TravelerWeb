import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users, Loader2, Mail, Phone, X as XIcon, Check, TrendingUp, Calendar, Wallet } from "lucide-react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { fetchOwnerBookings, cancelBooking, approveBooking, rejectBooking } from "../api/client";

const fmt = (d) => new Date(d).toLocaleDateString("hr-BA", { day: "numeric", month: "long", year: "numeric" });

export default function MyGuests() {
  const { user, openAuthModal } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [decidingId, setDecidingId] = useState(null);

  const load = () => {
    if (!user) return;
    setLoading(true);
    fetchOwnerBookings(user.id)
      .then(setBookings)
      .finally(() => setLoading(false));
  };

  useEffect(load, [user]);

  const handleCancel = async (id) => {
    if (!confirm("Sigurno želiš otkazati ovu rezervaciju gosta? Gost će vidjeti da si ti otkazao/la.")) return;
    setCancellingId(id);
    try {
      await cancelBooking(id, user.id);
      load();
    } finally {
      setCancellingId(null);
    }
  };

  // vlasnik potvrdjuje rezervaciju, tek onda se datumi blokiraju
  const handleApprove = async (id) => {
    setDecidingId(id);
    try {
      await approveBooking(id, user.id);
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setDecidingId(null);
    }
  };

  const handleReject = async (id) => {
    if (!confirm("Odbiti ovaj zahtjev za rezervaciju? Gost će biti obaviješten.")) return;
    setDecidingId(id);
    try {
      await rejectBooking(id, user.id);
      load();
    } finally {
      setDecidingId(null);
    }
  };

  const pendingBookings = bookings.filter((b) => b.status === "pending");
  const sortedBookings = [...bookings].sort((a, b) => {
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (b.status === "pending" && a.status !== "pending") return 1;
    return 0;
  });

  const confirmedBookings = bookings.filter((b) => b.status === "confirmed");
  const totalRevenue = confirmedBookings.reduce((sum, b) => sum + Number(b.total_price), 0);

  if (!user) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="mx-auto max-w-3xl px-8 py-24 text-center">
          <p className="font-display text-xl font-semibold text-ink">
            Prijavi se da vidiš svoje goste
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
        <h1 className="font-display text-2xl font-bold text-ink">Moji gosti</h1>

        {!loading && pendingBookings.length > 0 && (
          <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-800">
            Imaš {pendingBookings.length} {pendingBookings.length === 1 ? "zahtjev" : "zahtjeva"} za rezervaciju koji čeka/ju tvoje odobrenje.
          </div>
        )}

        {!loading && bookings.length > 0 && (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-line bg-white p-4">
              <div className="flex items-center gap-2 text-xs text-muted">
                <Calendar size={14} /> Ukupno rezervacija
              </div>
              <p className="mt-1 font-display text-2xl font-bold text-ink">{confirmedBookings.length}</p>
            </div>
            <div className="rounded-lg border border-line bg-white p-4">
              <div className="flex items-center gap-2 text-xs text-muted">
                <Wallet size={14} /> Ukupna zarada
              </div>
              <p className="mt-1 font-display text-2xl font-bold text-ink">
                €{totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="rounded-lg border border-line bg-white p-4">
              <div className="flex items-center gap-2 text-xs text-muted">
                <TrendingUp size={14} /> Prosječna rezervacija
              </div>
              <p className="mt-1 font-display text-2xl font-bold text-ink">
                €
                {confirmedBookings.length > 0
                  ? Math.round(totalRevenue / confirmedBookings.length).toLocaleString()
                  : 0}
              </p>
            </div>
          </div>
        )}

        {loading && (
          <div className="mt-8 flex items-center gap-2 text-sm text-muted">
            <Loader2 size={16} className="animate-spin" /> Učitavanje...
          </div>
        )}

        {!loading && bookings.length === 0 && (
          <div className="mt-16 flex flex-col items-center text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-bg">
              <Users className="text-brand" size={28} />
            </span>
            <p className="mt-5 font-display text-lg font-semibold text-ink">
              Još uvijek nemaš gostiju
            </p>
            <p className="mt-2 max-w-sm text-sm text-muted">
              Kada netko rezervira jedan od tvojih objekata, pojavit će se ovdje.
            </p>
          </div>
        )}

        <div className="mt-6 max-w-3xl space-y-4">
          {sortedBookings.map((b) => (
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
                  <p className="font-display text-sm font-semibold text-ink">
                    <span className="text-brand">{b.guest_name}</span> je rezervirao/la{" "}
                    <span className="text-brand">{b.hotel_name}</span>
                  </p>
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
                      ? "Otkazano"
                      : b.status === "pending"
                      ? "Čeka odobrenje"
                      : "Potvrđeno"}
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted">
                  {fmt(b.check_in)} – {fmt(b.check_out)} · {b.rooms} {b.rooms === 1 ? "jedinica" : "jedinice"} ·{" "}
                  {b.adults} odrasla{b.children ? `, ${b.children} djece` : ""}
                </p>
                <p className="mt-1 text-sm font-semibold text-ink">€{Number(b.total_price).toLocaleString()}</p>
                {b.guest_email && (
                  <p className="mt-2 flex items-center gap-1 text-xs text-muted">
                    <Mail size={12} /> {b.guest_email}
                  </p>
                )}

                {b.status === "pending" ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => handleApprove(b.id)}
                      disabled={decidingId === b.id}
                      className="flex items-center gap-1 rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                    >
                      {decidingId === b.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                      Odobri
                    </button>
                    <button
                      onClick={() => handleReject(b.id)}
                      disabled={decidingId === b.id}
                      className="flex items-center gap-1 rounded-md border border-line px-3 py-1.5 text-xs font-semibold text-muted hover:border-red-300 hover:text-red-600"
                    >
                      <XIcon size={12} /> Odbij
                    </button>
                  </div>
                ) : (
                  b.status !== "cancelled" && (
                    <button
                      onClick={() => handleCancel(b.id)}
                      disabled={cancellingId === b.id}
                      className="mt-3 flex items-center gap-1 rounded-md border border-line px-3 py-1.5 text-xs font-semibold text-muted hover:border-red-300 hover:text-red-600"
                    >
                      {cancellingId === b.id ? <Loader2 size={12} className="animate-spin" /> : <XIcon size={12} />}
                      Otkaži rezervaciju
                    </button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
