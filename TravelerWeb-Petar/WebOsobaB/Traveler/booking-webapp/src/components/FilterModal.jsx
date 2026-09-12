import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { ALL_AMENITIES } from "../api/client";
import Calendar, { toDateStr } from "./Calendar";

function parseAmenities(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.length > 0) return value.split(",");
  return [];
}

// sve ovo su lokalne vrijednosti, na roditelja idu tek kad se klikne primjeni
export default function FilterModal({ open, onClose, onApply, initialFilters, countries }) {
  const [minPrice, setMinPrice] = useState(initialFilters.minPrice || "");
  const [maxPrice, setMaxPrice] = useState(initialFilters.maxPrice || "");
  const [minRating, setMinRating] = useState(initialFilters.minRating || "");
  const [country, setCountry] = useState(initialFilters.country || "");
  const [location, setLocation] = useState(initialFilters.location || "");
  const [amenities, setAmenities] = useState(parseAmenities(initialFilters.amenities));
  const [checkIn, setCheckIn] = useState(initialFilters.checkIn ? new Date(initialFilters.checkIn) : null);
  const [checkOut, setCheckOut] = useState(initialFilters.checkOut ? new Date(initialFilters.checkOut) : null);

  useEffect(() => {
    if (open) {
      setMinPrice(initialFilters.minPrice || "");
      setMaxPrice(initialFilters.maxPrice || "");
      setMinRating(initialFilters.minRating || "");
      setCountry(initialFilters.country || "");
      setLocation(initialFilters.location || "");
      setAmenities(parseAmenities(initialFilters.amenities));
      setCheckIn(initialFilters.checkIn ? new Date(initialFilters.checkIn) : null);
      setCheckOut(initialFilters.checkOut ? new Date(initialFilters.checkOut) : null);
    }
  }, [open]);

  if (!open) return null;

  const toggleAmenity = (a) => {
    setAmenities((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  };

  const fmtDate = (d) => toDateStr(d);

  const handleApply = () => {
    onApply({
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
      minRating: minRating || undefined,
      country: country || undefined,
      location: location || undefined,
      amenities: amenities.length ? amenities.join(",") : undefined,
      checkIn: fmtDate(checkIn),
      checkOut: fmtDate(checkOut),
    });
    onClose();
  };

  const handleReset = () => {
    setMinPrice("");
    setMaxPrice("");
    setMinRating("");
    setCountry("");
    setLocation("");
    setAmenities([]);
    setCheckIn(null);
    setCheckOut(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 card-shadow">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-ink">Filteri</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-sky-bg hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-5">
          <p className="text-sm font-semibold text-ink">Kada putuješ?</p>
          <div className="mt-2">
            <Calendar
              checkIn={checkIn}
              checkOut={checkOut}
              compact
              onSelect={(inD, outD) => {
                setCheckIn(inD);
                setCheckOut(outD);
              }}
            />
          </div>
          {(checkIn || checkOut) && (
            <button
              onClick={() => {
                setCheckIn(null);
                setCheckOut(null);
              }}
              className="mt-2 text-xs font-medium text-brand hover:underline"
            >
              Obriši odabrane datume
            </button>
          )}
        </div>

        <div className="mt-5">
          <p className="text-sm font-semibold text-ink">Država</p>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="mt-2 w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-brand"
          >
            <option value="">Sve države</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4">
          <p className="text-sm font-semibold text-ink">Lokacija</p>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="npr. Split, Mostar, Bled..."
            className="mt-2 w-full rounded-md border border-line px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-brand"
          />
        </div>

        <div className="mt-4">
          <p className="text-sm font-semibold text-ink">Cijena po noći (€)</p>
          <div className="mt-2 flex items-center gap-3">
            <input
              type="number"
              min={0}
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="Min"
              className="w-full rounded-md border border-line px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-brand"
            />
            <span className="text-muted">—</span>
            <input
              type="number"
              min={0}
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="Max"
              className="w-full rounded-md border border-line px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-brand"
            />
          </div>
        </div>

        <div className="mt-4">
          <p className="text-sm font-semibold text-ink">Minimalna ocjena</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {["", "3", "4", "4.5"].map((v) => (
              <button
                key={v}
                onClick={() => setMinRating(v)}
                className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                  minRating === v ? "border-brand bg-brand text-white" : "border-line bg-white text-ink"
                }`}
              >
                {v === "" ? "Sve" : `${v}+`}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <p className="text-sm font-semibold text-ink">Sadržaji</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {ALL_AMENITIES.map((a) => (
              <button
                key={a}
                onClick={() => toggleAmenity(a)}
                className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                  amenities.includes(a) ? "border-brand bg-brand text-white" : "border-line bg-white text-ink"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleReset}
            className="flex-1 rounded-md border border-line py-3 text-sm font-semibold text-ink hover:bg-sky-bg"
          >
            Poništi
          </button>
          <button
            onClick={handleApply}
            className="flex-1 rounded-md bg-brand py-3 text-sm font-semibold text-white hover:opacity-90"
          >
            Primijeni filtere
          </button>
        </div>
      </div>
    </div>
  );
}
