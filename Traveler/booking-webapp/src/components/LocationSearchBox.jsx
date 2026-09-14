import { useState, useRef, useEffect } from "react";
import { Search, Loader2, X } from "lucide-react";

// nominatim je besplatan, samo ogranicimo na nase drzave da ne vraca svasta
async function searchPlaces(query) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "6");
  url.searchParams.set("countrycodes", "hr,ba,si,rs,me");
  const res = await fetch(url, { headers: { "Accept-Language": "hr" } });
  if (!res.ok) return [];
  return res.json();
}

export default function LocationSearchBox({ onSelect, placeholder = "Pretraži lokaciju ili adresu..." }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);
  const boxRef = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const handleChange = (value) => {
    setQuery(value);
    clearTimeout(debounceRef.current);
    if (value.trim().length < 3) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await searchPlaces(value);
        setResults(data);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 500);
  };

  const handlePick = (place) => {
    onSelect({
      lat: Number(place.lat),
      lng: Number(place.lon),
      label: place.display_name,
    });
    setQuery(place.display_name);
    setOpen(false);
    setResults([]);
  };

  return (
    <div className="relative" ref={boxRef}>
      <div className="flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2">
        <Search size={15} className="flex-shrink-0 text-muted" />
        <input
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted"
        />
        {loading && <Loader2 size={14} className="flex-shrink-0 animate-spin text-muted" />}
        {query && !loading && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setResults([]);
              setOpen(false);
            }}
            className="flex-shrink-0 text-muted hover:text-ink"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-[1000] mt-1 max-h-60 overflow-y-auto rounded-md border border-line bg-white card-shadow">
          {results.map((place) => (
            <button
              key={place.place_id}
              type="button"
              onClick={() => handlePick(place)}
              className="block w-full border-b border-line px-3 py-2 text-left text-xs text-ink last:border-0 hover:bg-sky-bg"
            >
              {place.display_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
