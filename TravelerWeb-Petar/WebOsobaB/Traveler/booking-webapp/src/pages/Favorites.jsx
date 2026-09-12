import { useEffect, useState } from "react";
import { Heart, Loader2, Plus, Pencil, X, Check } from "lucide-react";
import Navbar from "../components/Navbar";
import HotelCard from "../components/HotelCard";
import { useAuth } from "../context/AuthContext";
import {
  fetchFavorites, fetchFavoriteLists, createFavoriteList, renameFavoriteList, deleteFavoriteList,
} from "../api/client";

function normalize(row) {
  return {
    id: row.slug,
    dbId: row.id,
    type: row.type,
    name: row.name,
    location: row.location,
    pricePerNight: Number(row.price_per_night),
    rating: Number(row.rating),
    reviews: row.reviews_count,
    badge: row.badge,
    cover: row.cover,
  };
}

// stranica sa svim listama favorita korisnika
export default function Favorites() {
  const { user, openAuthModal } = useAuth();
  const [lists, setLists] = useState([]);
  const [activeListId, setActiveListId] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creatingList, setCreatingList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [renamingListId, setRenamingListId] = useState(null);
  const [renameValue, setRenameValue] = useState("");

  const loadLists = () => {
    if (!user) return;
    fetchFavoriteLists(user.id).then((data) => {
      setLists(data);

      setActiveListId((prev) => (data.find((l) => l.id === prev) ? prev : data[0]?.id ?? null));
    });
  };

  useEffect(loadLists, [user]);

  const loadFavorites = () => {
    if (!user || !activeListId) {
      setFavorites([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchFavorites(user.id, activeListId)
      .then((rows) => setFavorites(rows.map(normalize)))
      .finally(() => setLoading(false));
  };

  useEffect(loadFavorites, [user, activeListId]);

  const handleFavoriteChanged = () => {
    loadFavorites();
    loadLists();
  };

  const handleCreateList = async (e) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    const created = await createFavoriteList(user.id, newListName.trim());
    setNewListName("");
    setCreatingList(false);
    setLists((prev) => [...prev, created]);
    setActiveListId(created.id);
  };

  const handleDeleteList = async (listId) => {
    if (!confirm("Obrisati ovu listu i sve objekte u njoj?")) return;
    await deleteFavoriteList(listId, user.id);
    loadLists();
  };

  const startRename = (list) => {
    setRenamingListId(list.id);
    setRenameValue(list.name);
  };

  const handleRename = async (e) => {
    e.preventDefault();
    if (!renameValue.trim()) return;
    await renameFavoriteList(renamingListId, user.id, renameValue.trim());
    setRenamingListId(null);
    loadLists();
  };

  if (!user) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="mx-auto max-w-3xl px-8 py-24 text-center">
          <p className="font-display text-xl font-semibold text-ink">
            Prijavi se da vidiš svoje favorite
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
        <h1 className="font-display text-2xl font-bold text-ink">Moji favoriti</h1>

        {}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {lists.map((l) =>
            renamingListId === l.id ? (
              <form key={l.id} onSubmit={handleRename} className="flex items-center gap-1">
                <input
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  className="rounded-md border border-brand px-3 py-2 text-sm outline-none"
                />
                <button type="submit" className="flex h-8 w-8 items-center justify-center rounded-md bg-brand text-white">
                  <Check size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setRenamingListId(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-line text-muted"
                >
                  <X size={14} />
                </button>
              </form>
            ) : (
              <div key={l.id} className="group relative">
                <button
                  onClick={() => setActiveListId(l.id)}
                  className={`flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                    activeListId === l.id
                      ? "border-brand bg-brand text-white"
                      : "border-line bg-white text-ink hover:border-brand/40"
                  }`}
                >
                  {l.name} <span className="text-xs opacity-70">({l.count})</span>
                </button>
                <div className="absolute -right-1.5 -top-1.5 hidden gap-1 group-hover:flex">
                  <button
                    onClick={() => startRename(l)}
                    title="Preimenuj listu"
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-ink text-white"
                  >
                    <Pencil size={10} />
                  </button>
                  {lists.length > 1 && (
                    <button
                      onClick={() => handleDeleteList(l.id)}
                      title="Obriši listu"
                      className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white"
                    >
                      <X size={11} />
                    </button>
                  )}
                </div>
              </div>
            )
          )}

          {creatingList ? (
            <form onSubmit={handleCreateList} className="flex items-center gap-1.5">
              <input
                autoFocus
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="Naziv liste..."
                className="rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-brand"
              />
              <button
                type="submit"
                className="rounded-md bg-brand px-3 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                Dodaj
              </button>
              <button
                type="button"
                onClick={() => {
                  setCreatingList(false);
                  setNewListName("");
                }}
                className="rounded-md border border-line px-2 py-2 text-muted hover:bg-sky-bg"
              >
                <X size={15} />
              </button>
            </form>
          ) : (
            <button
              onClick={() => setCreatingList(true)}
              className="flex items-center gap-1.5 rounded-md border border-dashed border-line px-3 py-2 text-sm font-medium text-muted hover:border-brand hover:text-brand"
            >
              <Plus size={14} /> Nova lista
            </button>
          )}
        </div>

        {loading && (
          <div className="mt-8 flex items-center gap-2 text-sm text-muted">
            <Loader2 size={16} className="animate-spin" /> Učitavanje...
          </div>
        )}

        {!loading && favorites.length === 0 && (
          <div className="mt-16 flex flex-col items-center text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-bg">
              <Heart className="text-brand" size={28} />
            </span>
            <p className="mt-5 font-display text-lg font-semibold text-ink">
              Ova lista je još uvijek prazna
            </p>
            <p className="mt-2 max-w-sm text-sm text-muted">
              Klikni na srce na bilo kojoj kartici smještaja da ga sačuvaš ovdje.
            </p>
          </div>
        )}

        {!loading && favorites.length > 0 && (
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {favorites.map((hotel) => (
              <HotelCard key={hotel.id} hotel={hotel} isFavorited onFavoriteToggled={handleFavoriteChanged} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
