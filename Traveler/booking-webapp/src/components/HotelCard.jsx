import { useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Heart } from "lucide-react";
import StarRating from "./StarRating";
import { TYPE_LABELS } from "../api/client";
import { useAuth } from "../context/AuthContext";
import FavoriteListPicker from "./FavoriteListPicker";

// srce dugme, ako nije ulogovan otvara login umjesto da doda u favorite
function FavoriteButton({ hotel, isFavorited, onToggled, onHeartClick, className }) {
  const { user, openAuthModal } = useAuth();
  const [pickerOpen, setPickerOpen] = useState(false);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      openAuthModal();
      return;
    }

    if (onHeartClick) {
      onHeartClick(hotel);
      return;
    }
    setPickerOpen((v) => !v);
  };

  const needsRelative = !className.includes("absolute");

  return (
    <div
      className={`${needsRelative ? "relative " : ""}${className}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <button onClick={handleClick} className="flex h-full w-full items-center justify-center" title={isFavorited ? "Sačuvano u favoritima" : "Sačuvaj u favorite"}>
        <Heart size={15} className={isFavorited ? "fill-red-500 text-red-500" : ""} />
      </button>
      {pickerOpen && (
        <FavoriteListPicker
          userId={user.id}
          hotel={hotel}
          onClose={() => setPickerOpen(false)}
          onChanged={(nowFavorited) => onToggled?.(hotel.dbId, nowFavorited)}
        />
      )}
    </div>
  );
}

export default function HotelCard({ hotel, variant = "grid", isFavorited = false, onFavoriteToggled, onHeartClick }) {
  if (variant === "row") {
    return (
      <Link
        to={`/hotel/${hotel.id}`}
        className="group flex items-center gap-4 rounded-lg border border-line bg-white p-3 transition-all hover:border-brand/40 hover:shadow-md"
      >
        <img
          src={hotel.cover}
          alt={hotel.name}
          className="h-20 w-24 flex-shrink-0 rounded-md object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-display text-sm font-semibold text-ink">
              {hotel.name}
            </p>
            <span className="flex-shrink-0 rounded-md bg-sky-bg px-1.5 py-0.5 text-[10px] font-semibold text-brand">
              {TYPE_LABELS[hotel.type]}
            </span>
          </div>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
            <MapPin size={12} /> {hotel.location}
          </p>
          <div className="mt-1.5 flex items-center gap-3">
            <span className="text-sm font-bold text-brand">
              €{hotel.pricePerNight.toLocaleString()}
            </span>
            <span className="text-[11px] text-muted">/ noć</span>
            <StarRating rating={hotel.rating} reviews={hotel.reviews} size={11} />
          </div>
        </div>
        <FavoriteButton
          hotel={hotel}
          isFavorited={isFavorited}
          onToggled={onFavoriteToggled}
          onHeartClick={onHeartClick}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-muted hover:bg-sky-bg hover:text-red-500"
        />
      </Link>
    );
  }

  return (
    <Link
      to={`/hotel/${hotel.id}`}
      className="group block flex-shrink-0 overflow-hidden rounded-lg border border-line bg-white transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-brand/10"
    >
      <div className="relative h-44 overflow-hidden">
        <img
          src={hotel.cover}
          alt={hotel.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <FavoriteButton
          hotel={hotel}
          isFavorited={isFavorited}
          onToggled={onFavoriteToggled}
          onHeartClick={onHeartClick}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-ink backdrop-blur transition-colors hover:text-red-500"
        />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="font-display text-[15px] font-semibold text-ink">{hotel.name}</p>
          <span className="flex-shrink-0 rounded-md border border-line px-1.5 py-0.5 text-[10px] font-semibold text-muted">
            {TYPE_LABELS[hotel.type]}
          </span>
        </div>
        <p className="mt-1 flex items-center gap-1 text-xs text-muted">
          <MapPin size={12} /> {hotel.location}
          {hotel.distanceFromMe != null && (
            <span className="ml-1 font-semibold text-brand">· {hotel.distanceFromMe.toFixed(1)} km</span>
          )}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <div>
            <span className="font-display text-base font-bold text-ink">
              €{hotel.pricePerNight.toLocaleString()}
            </span>
            <span className="text-xs text-muted"> / noć</span>
          </div>
          <StarRating rating={hotel.rating} reviews={hotel.reviews} size={12} />
        </div>
      </div>
    </Link>
  );
}
