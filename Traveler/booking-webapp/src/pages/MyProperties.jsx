import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Home, Loader2, Pencil, Trash2, Plus, Star } from "lucide-react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { fetchMyProperties, fetchMyPropertyDetail, deleteHotelListing, TYPE_LABELS } from "../api/client";

export default function MyProperties() {
  const { user, openAuthModal, openListModal, openEditModal } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const load = () => {
    if (!user) return;
    setLoading(true);
    fetchMyProperties(user.id)
      .then(setProperties)
      .finally(() => setLoading(false));
  };

  useEffect(load, [user]);

  const handleEdit = async (id) => {
    try {
      const detail = await fetchMyPropertyDetail(id, user.id);
      openEditModal(detail);
    } catch (err) {
      alert(err.message);
    }
  };

  // brise objekat, backend se brine da obrise i slike/rezervacije uz njega
  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await deleteHotelListing(id, user.id);
      setProperties((prev) => prev.filter((p) => p.id !== id));
      setConfirmDeleteId(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="mx-auto max-w-3xl px-8 py-24 text-center">
          <p className="font-display text-xl font-semibold text-ink">
            Prijavi se da upravljaš svojim objektima
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
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold text-ink">Moji objekti</h1>
          <button
            onClick={openListModal}
            className="flex items-center gap-1.5 rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            <Plus size={15} /> Prijavi novi objekat
          </button>
        </div>

        {loading && (
          <div className="mt-8 flex items-center gap-2 text-sm text-muted">
            <Loader2 size={16} className="animate-spin" /> Učitavanje...
          </div>
        )}

        {!loading && properties.length === 0 && (
          <div className="mt-16 flex flex-col items-center text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-bg">
              <Home className="text-brand" size={28} />
            </span>
            <p className="mt-5 font-display text-lg font-semibold text-ink">
              Još uvijek nemaš prijavljenih objekata
            </p>
            <p className="mt-2 max-w-sm text-sm text-muted">
              Klikni "Prijavi novi objekat" da dodaš svoj prvi smještaj.
            </p>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {properties.map((p) => (
            <div key={p.id} className="overflow-hidden rounded-lg border border-line bg-white">
              <Link to={`/hotel/${p.slug}`} className="block h-40 overflow-hidden">
                <img
                  src={p.cover}
                  alt={p.name}
                  className="h-full w-full object-cover transition-transform hover:scale-105"
                />
              </Link>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-display text-sm font-semibold text-ink">{p.name}</p>
                  <span className="flex-shrink-0 rounded-md border border-line px-1.5 py-0.5 text-[10px] font-semibold text-muted">
                    {TYPE_LABELS[p.type]}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted">{p.location}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-display text-sm font-bold text-ink">
                    €{Number(p.price_per_night).toLocaleString()} <span className="text-xs font-normal text-muted">/ noć</span>
                  </span>
                  {Number(p.reviews_count) > 0 ? (
                    <span className="flex items-center gap-1 text-xs text-muted">
                      <Star size={12} className="fill-amber-400 text-amber-400" />
                      {Number(p.rating).toFixed(1)} ({p.reviews_count})
                    </span>
                  ) : (
                    <span className="text-xs text-muted">Nema ocjena</span>
                  )}
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleEdit(p.id)}
                    className="flex flex-1 items-center justify-center gap-1 rounded-md border border-line px-3 py-2 text-xs font-semibold text-ink hover:border-brand hover:text-brand"
                  >
                    <Pencil size={12} /> Uredi
                  </button>
                  {confirmDeleteId === p.id ? (
                    <button
                      onClick={() => handleDelete(p.id)}
                      disabled={deletingId === p.id}
                      className="flex flex-1 items-center justify-center gap-1 rounded-md bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
                    >
                      {deletingId === p.id ? <Loader2 size={12} className="animate-spin" /> : "Potvrdi brisanje"}
                    </button>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(p.id)}
                      className="flex flex-1 items-center justify-center gap-1 rounded-md border border-line px-3 py-2 text-xs font-semibold text-muted hover:border-red-300 hover:text-red-600"
                    >
                      <Trash2 size={12} /> Obriši
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
