import { useEffect, useState } from "react";
import { Search, SlidersHorizontal, Loader2, LocateFixed, X } from "lucide-react";
import Navbar from "../components/Navbar";
import HotelCard from "../components/HotelCard";
import FilterModal from "../components/FilterModal";
import { fetchHotels, fetchCountries, fetchFavoriteIds, TYPE_LABELS, API_BASE } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { PropertiesMap } from "../components/PropertyMap";

const categories = [{ key: null, label: "Sve" }, ...Object.entries(TYPE_LABELS).map(([key, label]) => ({ key, label }))];

function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function DiagnosticInfo() {
  const [info, setInfo] = useState("Provjeravam...");

  useEffect(() => {
    fetch(`${API_BASE}/health`)
      .then((r) => r.json())
      .then((health) => {
        let text = `Backend odgovara. Baza ima ${health.hotelCount ?? "?"} objekata.`;
        if (health.lastSeedError) text += ` GREŠKA pri zadnjem punjenju baze: ${health.lastSeedError}`;
        if (health.dbError) text += ` Greška konekcije na bazu: ${health.dbError}`;
        setInfo(text);
      })
      .catch((err) => setInfo(`Backend NE odgovara na ${API_BASE} — greška: ${err.message}`));
  }, []);

  return (
    <div className="mt-3 rounded-md border border-dashed border-line bg-white p-3 text-xs text-muted">
      <p>
        <strong>Dijagnostika:</strong> API adresa = <code className="rounded bg-sky-bg px-1">{API_BASE}</code>
      </p>
      <p className="mt-1">{info}</p>
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [activeType, setActiveType] = useState(null);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({});
  const [countries, setCountries] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);

  const handleNearMe = () => {
    if (userLocation) {
      // isklj blizu mene
      setUserLocation(null);
      return;
    }
    if (!navigator.geolocation) {
      setLocationError("Tvoj browser ne podržava dijeljenje lokacije.");
      return;
    }
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocationError("Nismo mogli dobiti tvoju lokaciju — provjeri dozvole u browseru.");
        setLocating(false);
      },
      { timeout: 10000 }
    );
  };

  useEffect(() => {
    fetchCountries().then(setCountries);
  }, []);

  useEffect(() => {
    if (user) fetchFavoriteIds(user.id).then(setFavoriteIds);
    else setFavoriteIds([]);
  }, [user]);

  const handleFavoriteToggled = (hotelId, favorited) => {
    setFavoriteIds((prev) => (favorited ? [...prev, hotelId] : prev.filter((id) => id !== hotelId)));
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const timeout = setTimeout(() => {
      fetchHotels({ type: activeType, search: query || undefined, ...filters })
        .then((data) => !cancelled && setHotels(data))
        .catch((err) => !cancelled && setError(err.message))
        .finally(() => !cancelled && setLoading(false));
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [activeType, query, filters]);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const sortedHotels = userLocation
    ? [...hotels]
        .filter((h) => h.latitude && h.longitude)
        .map((h) => ({ ...h, distanceFromMe: distanceKm(userLocation.lat, userLocation.lng, h.latitude, h.longitude) }))
        .sort((a, b) => a.distanceFromMe - b.distanceFromMe)
    : hotels;

  const showSplit = !activeType && !query && !userLocation;
  const featured = showSplit ? sortedHotels.slice(0, 4) : sortedHotels;
  const rest = showSplit ? sortedHotels.slice(4) : [];

  return (
    <div className="min-h-screen">
      <Navbar />

      {}
      <section className="mx-auto max-w-[1500px] px-8 pb-10 pt-14 lg:px-16">
        <div>
          <h1 className="font-display text-4xl font-bold leading-tight text-ink md:text-6xl">
            Gdje putuješ<br />sljedeći put?
          </h1>
        </div>

        <div className="mt-10 flex flex-col gap-3 rounded-lg border border-line bg-white p-4 card-shadow md:flex-row md:items-center">
          <div className="flex flex-1 items-center gap-3">
            <Search className="text-muted" size={18} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pretraži smještaj, grad ili državu..."
              className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted"
            />
          </div>

          <button
            onClick={handleNearMe}
            disabled={locating}
            className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold transition-colors ${
              userLocation ? "border-brand bg-brand text-white" : "border-line bg-white text-ink hover:border-brand/40"
            }`}
          >
            {locating ? <Loader2 size={16} className="animate-spin" /> : userLocation ? <X size={16} /> : <LocateFixed size={16} />}
            {userLocation ? "Isključi" : "Blizu mene"}
          </button>

          <button
            onClick={() => setFilterOpen(true)}
            className="relative flex items-center justify-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <SlidersHorizontal size={16} />
            Filteri
            {activeFilterCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {locationError && <p className="mt-2 text-xs text-red-600">{locationError}</p>}

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {categories.map((c) => (
            <button
              key={c.key ?? "sve"}
              onClick={() => setActiveType(c.key)}
              className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                activeType === c.key
                  ? "border-brand bg-brand text-white"
                  : "border-line bg-white text-ink hover:border-brand/40"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </section>

      {}
      {!loading && !error && hotels.length > 0 && (
        <section className="mx-auto max-w-[1500px] px-8 pb-6 lg:px-16">
          <h2 className="mb-3 font-display text-lg font-bold text-ink">Objekti na karti</h2>
          <PropertiesMap hotels={hotels} />
        </section>
      )}

      {}
      <section className="mx-auto max-w-[1500px] px-8 py-6 lg:px-16">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-ink">
            {userLocation ? "Najbliže tebi" : activeType ? TYPE_LABELS[activeType] : "Izdvojeno"}
            {!loading && <span className="ml-2 text-sm font-medium text-muted">({sortedHotels.length})</span>}
          </h2>
        </div>

        {loading && (
          <div className="flex items-center gap-2 py-10 text-sm text-muted">
            <Loader2 size={16} className="animate-spin" /> Učitavanje smještaja iz baze...
          </div>
        )}

        {error && (
          <p className="rounded-lg border border-line bg-white p-4 text-sm text-red-600">
            Ne mogu da se povežem sa API-jem ({error}). Provjeri da li je backend pokrenut.
          </p>
        )}

        {!loading && !error && featured.length === 0 && (
          <>
            <p className="text-sm text-muted">Nema rezultata za ovu pretragu.</p>
            <DiagnosticInfo />
          </>
        )}

        {!loading && !error && featured.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {featured.map((hotel) => (
              <HotelCard
                key={hotel.id}
                hotel={hotel}
                isFavorited={favoriteIds.includes(hotel.dbId)}
                onFavoriteToggled={handleFavoriteToggled}
              />
            ))}
          </div>
        )}
      </section>

      {!loading && showSplit && rest.length > 0 && (
        <section className="mx-auto max-w-[1500px] px-8 py-6 lg:px-16">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-ink">Ostali smještaji</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {rest.map((hotel) => (
              <HotelCard
                key={hotel.id}
                hotel={hotel}
                variant="row"
                isFavorited={favoriteIds.includes(hotel.dbId)}
                onFavoriteToggled={handleFavoriteToggled}
              />
            ))}
          </div>
        </section>
      )}

      <div className="h-16" />

      <FilterModal
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        onApply={setFilters}
        initialFilters={filters}
        countries={countries}
      />
    </div>
  );
}
