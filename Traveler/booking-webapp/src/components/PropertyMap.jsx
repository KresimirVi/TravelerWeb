import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import LocationSearchBox from "./LocationSearchBox";

// custom pin umjesto default leaflet markera
function makePinIcon(color = "#d1652e") {
  return new L.DivIcon({
    className: "",
    html: `<div style="
      width: 28px; height: 28px; border-radius: 50% 50% 50% 0;
      background: ${color}; transform: rotate(-45deg);
      border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
}
const pinIcon = makePinIcon();
const pickerPinIcon = makePinIcon("#1f6f43");

function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 12);
    } else {
      const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [points, map]);
  return null;
}

function FlyTo({ position, zoom = 15 }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo([position.lat, position.lng], zoom);
  }, [position, map]);
  return null;
}

export function PropertiesMap({ hotels, height = 360 }) {
  const navigate = useNavigate();
  const [flyTarget, setFlyTarget] = useState(null);
  const points = hotels.filter((h) => h.latitude && h.longitude);

  if (points.length === 0) return null;

  return (
    <div className="space-y-2">
      <LocationSearchBox
        onSelect={(place) => setFlyTarget({ lat: place.lat, lng: place.lng })}
        placeholder="Pretraži grad ili adresu na karti..."
      />
      <div style={{ height }} className="relative z-0 overflow-hidden rounded-lg border border-line">
        <MapContainer
          center={[43.5, 17.0]}
          zoom={7}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> saradnici'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds points={points.map((h) => ({ lat: h.latitude, lng: h.longitude }))} />
          <FlyTo position={flyTarget} />
          {points.map((h) => (
            <Marker
              key={h.dbId || h.id}
              position={[h.latitude, h.longitude]}
              icon={pinIcon}
              eventHandlers={{ click: () => navigate(`/hotel/${h.id}`) }}
            >
              <Popup>
                <p className="font-semibold text-ink">{h.name}</p>
                <p className="text-xs text-muted">{h.location}</p>
                <p className="mt-1 text-xs font-semibold text-brand">€{h.pricePerNight}/noć</p>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}

export function SingleLocationMap({ hotel, height = 260 }) {
  if (!hotel.latitude || !hotel.longitude) return null;

  return (
    <div style={{ height }} className="relative z-0 overflow-hidden rounded-lg border border-line">
      <MapContainer
        center={[hotel.latitude, hotel.longitude]}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> saradnici'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[hotel.latitude, hotel.longitude]} icon={pinIcon}>
          <Popup>
            <p className="font-semibold text-ink">{hotel.name}</p>
            <p className="text-xs text-muted">{hotel.location}</p>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}

function ClickToPlacePin({ onPick }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export function MapPicker({ value, onChange, height = 300 }) {
  const [flyTarget, setFlyTarget] = useState(null);
  const defaultCenter = value ? [value.lat, value.lng] : [43.85, 17.5];

  const handlePick = (pos) => {
    onChange(pos);
    setFlyTarget(pos);
  };

  return (
    <div className="space-y-2">
      <LocationSearchBox
        onSelect={(place) => handlePick({ lat: place.lat, lng: place.lng })}
        placeholder="Pretraži adresu objekta..."
      />
      <div style={{ height }} className="relative z-0 overflow-hidden rounded-lg border border-line">
        <MapContainer
          center={defaultCenter}
          zoom={value ? 15 : 7}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> saradnici'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickToPlacePin onPick={handlePick} />
          <FlyTo position={flyTarget} />
          {value && <Marker position={[value.lat, value.lng]} icon={pickerPinIcon} />}
        </MapContainer>
      </div>
      <p className="text-[11px] text-muted">
        {value
          ? `Odabrana lokacija: ${value.lat.toFixed(5)}, ${value.lng.toFixed(5)} — klikni negdje drugo na karti da promijeniš.`
          : "Pretraži adresu iznad ili klikni direktno na kartu da postaviš tačnu lokaciju objekta."}
      </p>
    </div>
  );
}
