import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, Heart, X, MapPin, Wifi, Wind, Bath, Utensils, Waves, Sparkles,
  Users, Music, Sprout, Flame, Lock, ShieldCheck, Bike, WashingMachine, Loader2, Star,
} from "lucide-react";
import Navbar from "../components/Navbar";
import { SingleLocationMap } from "../components/PropertyMap";
import FavoriteListPicker from "../components/FavoriteListPicker";
import { useAuth } from "../context/AuthContext";
import {
  fetchHotelBySlug, fetchReviews, fetchReviewsSummary, fetchFavoriteIds, replyToReview, TYPE_LABELS,
} from "../api/client";

const amenityIcons = {
  "Besplatan WiFi": Wifi, Klima: Wind, "Privatna kupaonica": Bath, Terasa: Sparkles,
  Bazen: Waves, Spa: Sparkles, Restoran: Utensils, Parking: MapPin,
  "Wellness centar": Sparkles, "Room service": Utensils, "Beach bar": Music,
  "Iznajmljivanje brodica": Waves, "Krovna terasa": Sparkles, "Doručak uključen": Utensils,
  Concierge: Users, "Pogled na more": Waves, "Pogled na grad": MapPin,
  "Vinski podrum": Sprout, "Bazen s morskom vodom": Waves, "Biciklističke rute": Bike,
  "Zajednička kuhinja": Utensils, "Zajednički boravak": Users, "Ormarić sa ključem": Lock,
  "Perilica rublja": WashingMachine, Vrt: Sprout, "Iznajmljivanje bicikala": Bike,
  Kuhinja: Utensils, Balkon: Sparkles, Roštilj: Flame, Kamin: Flame, Jacuzzi: Waves,
  Sef: ShieldCheck, "Kuhinjski kutak": Utensils,
};

const SORT_OPTIONS = [
  { key: "newest", label: "Najnovije" },
  { key: "oldest", label: "Najstarije" },
  { key: "highest", label: "Najviša ocjena" },
  { key: "lowest", label: "Najniža ocjena" },
];

function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(value === n ? null : n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          className="p-0.5"
          title={`${n} zvjezdice`}
        >
          <Star
            size={22}
            className={
              n <= (hover || value || 0)
                ? "fill-amber-400 text-amber-400"
                : "fill-slate-200 text-slate-200"
            }
          />
        </button>
      ))}
    </div>
  );
}

function RatingSummary({ summary }) {
  if (!summary) return null;
  const maxCount = Math.max(1, ...Object.values(summary.counts));
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="flex-shrink-0 text-center sm:text-left">
        <p className="font-display text-4xl font-bold text-ink">{summary.average.toFixed(1)}</p>
        <div className="mt-1 flex items-center justify-center gap-0.5 sm:justify-start">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={14}
              className={i < Math.round(summary.average) ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}
            />
          ))}
        </div>
        <p className="mt-1 text-xs text-muted">{summary.total} recenzija</p>
      </div>
      <div className="flex-1 space-y-1.5">
        {[5, 4, 3, 2, 1].map((n) => (
          <div key={n} className="flex items-center gap-2 text-xs">
            <span className="w-3 text-muted">{n}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-amber-400"
                style={{ width: `${(summary.counts[n] / maxCount) * 100}%` }}
              />
            </div>
            <span className="w-6 text-right text-muted">{summary.counts[n]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HotelDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, openAuthModal } = useAuth();
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  // null = zatvoreno, broj = index slike koja je otvorena
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [replyingId, setReplyingId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [summary, setSummary] = useState(null);
  const [starFilter, setStarFilter] = useState(null);
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchHotelBySlug(id)
      .then((data) => !cancelled && setHotel(data))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (!hotel || !user) {
      setIsFavorited(false);
      return;
    }
    let cancelled = false;
    fetchFavoriteIds(user.id).then((ids) => !cancelled && setIsFavorited(ids.includes(hotel.dbId)));
    return () => { cancelled = true; };
  }, [hotel, user]);

  const [favoritePickerOpen, setFavoritePickerOpen] = useState(false);

  const handleToggleFavorite = () => {
    if (!user) {
      openAuthModal();
      return;
    }
    setFavoritePickerOpen((v) => !v);
  };

  const isOwner = user && hotel && user.id === hotel.ownerId;

  const handleSubmitReply = async (reviewId) => {
    if (!replyText.trim()) return;
    setReplySubmitting(true);
    try {
      await replyToReview(reviewId, user.id, replyText.trim());
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, owner_reply: replyText.trim(), owner_reply_at: new Date().toISOString() } : r))
      );
      setReplyingId(null);
      setReplyText("");
    } catch (err) {
      alert(err.message);
    } finally {
      setReplySubmitting(false);
    }
  };

  useEffect(() => {
    if (!hotel) return;
    let cancelled = false;
    fetchReviewsSummary(hotel.dbId).then((data) => !cancelled && setSummary(data));
    return () => { cancelled = true; };
  }, [hotel]);

  useEffect(() => {
    if (!hotel) return;
    let cancelled = false;
    setReviewsLoading(true);
    fetchReviews(hotel.dbId, { rating: starFilter || undefined, sort: sortBy })
      .then((data) => !cancelled && setReviews(data))
      .finally(() => !cancelled && setReviewsLoading(false));
    return () => { cancelled = true; };
  }, [hotel, starFilter, sortBy]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center gap-2 py-32 text-sm text-muted">
          <Loader2 size={16} className="animate-spin" /> Učitavanje...
        </div>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="mx-auto max-w-3xl px-8 py-20 text-center">
          <p className="font-display text-xl font-semibold text-ink">Smještaj nije pronađen</p>
          <Link to="/" className="mt-4 inline-block text-brand hover:underline">
            Nazad na pretragu
          </Link>
        </div>
      </div>
    );
  }

  const shortDesc =
    hotel.description.length > 140 && !expanded
      ? hotel.description.slice(0, 140) + "… "
      : hotel.description + " ";

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="mx-auto max-w-[1400px] px-8 pt-8 lg:px-16">
        <div className="relative h-72 overflow-hidden rounded-lg md:h-[420px]">
          <img src={hotel.cover} alt={hotel.name} className="h-full w-full object-cover" />
          <button
            onClick={() => navigate(-1)}
            className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-ink backdrop-blur transition-transform hover:scale-105"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="absolute right-4 top-4">
            <button
              onClick={handleToggleFavorite}
              className={`flex h-10 w-10 items-center justify-center rounded-full backdrop-blur transition-transform hover:scale-105 ${
                isFavorited ? "bg-brand text-white" : "bg-white/90 text-ink"
              }`}
            >
              <Heart size={17} className={isFavorited ? "fill-white" : ""} />
            </button>
            {favoritePickerOpen && (
              <FavoriteListPicker
                userId={user.id}
                hotel={hotel}
                onClose={() => setFavoritePickerOpen(false)}
                onChanged={(nowFavorited) => setIsFavorited(nowFavorited)}
              />
            )}
          </div>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-6">
            <span className="mb-2 inline-block rounded-md bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-ink">
              {TYPE_LABELS[hotel.type]}
            </span>
            <h1 className="font-display text-2xl font-bold text-white md:text-3xl">
              {hotel.name}
            </h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-white/80">
              <MapPin size={14} /> {hotel.street ? `${hotel.street}, ${hotel.location}` : hotel.location}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-sky-bg px-3 py-1 text-xs font-semibold text-brand">
                {hotel.badge}
              </span>
            </div>

            <h2 className="mt-8 font-display text-lg font-bold text-ink">Opis</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {shortDesc}
              <button
                onClick={() => setExpanded((e) => !e)}
                className="font-semibold text-brand hover:underline"
              >
                {expanded ? "Prikaži manje" : "Prikaži više"}
              </button>
            </p>

            <h2 className="mt-8 font-display text-lg font-bold text-ink">Sadržaji</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {hotel.amenities.map((a) => {
                const Icon = amenityIcons[a] || Sparkles;
                return (
                  <span
                    key={a}
                    className="flex items-center gap-1.5 rounded-md border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink"
                  >
                    <Icon size={13} className="text-brand" />
                    {a}
                  </span>
                );
              })}
            </div>

            <h2 className="mt-8 font-display text-lg font-bold text-ink">Galerija</h2>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {hotel.gallery.slice(0, 8).map((src, i) => (
                <button
                  key={i}
                  onClick={() => setLightboxIndex(i)}
                  className="relative h-20 overflow-hidden rounded-md sm:h-28"
                >
                  <img src={src} alt="" className="h-full w-full object-cover transition-transform hover:scale-105" />
                  {i === 7 && hotel.gallery.length > 8 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm font-semibold text-white">
                      +{hotel.gallery.length - 8}
                    </div>
                  )}
                </button>
              ))}
            </div>

            <h2 className="mt-8 font-display text-lg font-bold text-ink">Lokacija</h2>
            <div className="mt-3">
              <SingleLocationMap hotel={hotel} />
            </div>

            {}
            <div className="mt-10">
              <h2 className="font-display text-lg font-bold text-ink">Recenzije</h2>

              <div className="mt-4 rounded-lg border border-line bg-white p-5">
                <RatingSummary summary={summary} />
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="mb-1.5 text-xs font-medium text-muted">Filtriraj po ocjeni</p>
                  <StarPicker value={starFilter} onChange={setStarFilter} />
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-medium text-muted">Sortiraj</p>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="rounded-md border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand"
                  >
                    {SORT_OPTIONS.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {reviewsLoading ? (
                <div className="mt-4 flex items-center gap-2 text-sm text-muted">
                  <Loader2 size={14} className="animate-spin" /> Učitavanje recenzija...
                </div>
              ) : reviews.length === 0 ? (
                <p className="mt-4 text-sm text-muted">
                  {starFilter ? "Nema recenzija s tom ocjenom." : "Još uvijek nema recenzija za ovaj smještaj."}
                </p>
              ) : (
                <div className="mt-4 space-y-4">
                  {reviews.map((rv) => (
                    <div key={rv.id} className="rounded-lg border border-line bg-white p-4">
                      <div className="flex items-center justify-between">
                        <p className="font-display text-sm font-semibold text-ink">{rv.guest_name}</p>
                        <span className="text-xs text-muted">
                          {new Date(rv.created_at).toLocaleDateString("hr-HR")}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={13}
                            className={i < rv.rating ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}
                          />
                        ))}
                      </div>
                      {rv.comment && <p className="mt-2 text-sm text-muted">{rv.comment}</p>}

                      {rv.owner_reply && (
                        <div className="mt-3 rounded-md bg-sky-bg p-3">
                          <p className="text-xs font-semibold text-ink">Odgovor vlasnika</p>
                          <p className="mt-1 text-xs text-muted">{rv.owner_reply}</p>
                        </div>
                      )}

                      {isOwner && !rv.owner_reply && (
                        <div className="mt-3">
                          {replyingId === rv.id ? (
                            <div className="space-y-2">
                              <textarea
                                autoFocus
                                rows={2}
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Napiši javni odgovor na ovu recenziju..."
                                className="w-full rounded-md border border-line px-3 py-2 text-xs outline-none focus:border-brand"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleSubmitReply(rv.id)}
                                  disabled={replySubmitting}
                                  className="rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                                >
                                  {replySubmitting ? "Šaljem..." : "Objavi odgovor"}
                                </button>
                                <button
                                  onClick={() => {
                                    setReplyingId(null);
                                    setReplyText("");
                                  }}
                                  className="rounded-md border border-line px-3 py-1.5 text-xs font-semibold text-muted hover:bg-sky-bg"
                                >
                                  Otkaži
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setReplyingId(rv.id)}
                              className="text-xs font-semibold text-brand hover:underline"
                            >
                              Odgovori kao vlasnik
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-lg border border-line bg-white p-6 card-shadow">
              <p className="text-xs font-medium text-muted">Cijena od</p>
              <p className="mt-1 font-display text-3xl font-bold text-ink">
                €{hotel.pricePerNight.toLocaleString()}
                <span className="text-sm font-medium text-muted"> / noć</span>
              </p>
              <div className="mt-5 space-y-3 rounded-md bg-sky-bg p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Ocjena gostiju</span>
                  <span className="font-semibold text-ink">
                    {hotel.reviews > 0 ? `${hotel.rating.toFixed(1)} / 5.0` : "Nema ocjena"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Broj recenzija</span>
                  <span className="font-semibold text-ink">{hotel.reviews}</span>
                </div>
              </div>

              {(hotel.ownerName || hotel.contactEmail || hotel.contactPhone) && (
                <div className="mt-4 space-y-1.5 border-t border-line pt-4">
                  <p className="text-xs font-semibold text-ink">Vlasnik objekta</p>
                  {hotel.ownerName && <p className="text-sm text-ink">{hotel.ownerName}</p>}
                  {hotel.contactEmail && (
                    <p className="truncate text-xs text-muted">{hotel.contactEmail}</p>
                  )}
                  {hotel.contactPhone && <p className="text-xs text-muted">{hotel.contactPhone}</p>}
                </div>
              )}

              <button
                onClick={() => navigate(`/booking/${hotel.id}`)}
                className="mt-5 w-full rounded-lg bg-brand py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                Rezerviši sada
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="h-16" />

      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X size={20} />
          </button>

          {lightboxIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((i) => i - 1);
              }}
              className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <ChevronLeft size={20} />
            </button>
          )}
          {lightboxIndex < hotel.gallery.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((i) => i + 1);
              }}
              className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <ChevronRight size={20} />
            </button>
          )}

          <img
            src={hotel.gallery[lightboxIndex]}
            alt=""
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] max-w-full rounded-lg object-contain"
          />
          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-md bg-black/50 px-3 py-1 text-xs font-medium text-white">
            {lightboxIndex + 1} / {hotel.gallery.length}
          </span>
        </div>
      )}
    </div>
  );
}
