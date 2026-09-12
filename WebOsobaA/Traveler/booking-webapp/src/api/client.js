export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const BACKEND_ORIGIN = API_BASE.replace(/\/api\/?$/, "");
// slike iz baze mogu biti relativna putanja (nase) ili puni url (unsplash)
function resolveImageUrl(url) {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  return `${BACKEND_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;
}

// nazivi tipova objekata na hrvatskom, za prikaz u ui-u
export const TYPE_LABELS = {
  hotel: "Hotel",
  hostel: "Hostel",
  apartman: "Apartman",
  vikendica: "Vikendica",
  stan: "Stan",
  kuca: "Kuća",
  garsonijera: "Garsonijera",
};

export const ALL_AMENITIES = [
  "Besplatan WiFi", "Klima", "Kuhinja", "Kuhinjski kutak", "Privatna kupaonica",
  "Terasa", "Balkon", "Bazen", "Bazen s morskom vodom", "Spa", "Restoran",
  "Parking", "Doručak uključen", "Room service", "Wellness centar", "Beach bar",
  "Iznajmljivanje brodica", "Krovna terasa", "Concierge", "Pogled na more",
  "Pogled na grad", "Pogled na rijeku", "Pogled na jezero", "Vinski podrum",
  "Biciklističke rute", "Zajednička kuhinja", "Zajednički boravak",
  "Ormarić sa ključem", "Perilica rublja", "Vrt", "Iznajmljivanje bicikala",
  "Roštilj", "Kamin", "Jacuzzi", "Sef",
];

export const locations = [
  "Dubrovnik, Hrvatska",
  "Hvar, Hrvatska",
  "Split, Hrvatska",
  "Korčula, Hrvatska",
  "Zadar, Hrvatska",
  "Makarska, Hrvatska",
  "Trogir, Hrvatska",
];

export const COUNTRIES_FALLBACK = ["Hrvatska", "Bosna i Hercegovina", "Slovenija", "Crna Gora", "Srbija"];

function normalizeHotel(row) {
  return {
    id: row.slug,
    dbId: row.id,
    type: row.type,
    name: row.name,
    location: row.location,
    country: row.country,
    distanceKm: row.distance_km !== undefined && row.distance_km !== null ? Number(row.distance_km) : null,
    rating: Number(row.rating),
    reviews: row.reviews_count,
    pricePerNight: Number(row.price_per_night),
    badge: row.badge,
    cover: resolveImageUrl(row.cover),
    gallery: Array.isArray(row.gallery) ? row.gallery.map(resolveImageUrl) : row.gallery,
    description: row.description,
    amenities: row.amenities,
    ownerName: row.owner_name,
    ownerId: row.owner_id,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    latitude: row.latitude !== undefined && row.latitude !== null ? Number(row.latitude) : null,
    longitude: row.longitude !== undefined && row.longitude !== null ? Number(row.longitude) : null,
    street: row.street,
  };
}

export async function fetchHotels(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") params.set(key, value);
  });
  const res = await fetch(`${API_BASE}/hotels?${params.toString()}`);
  if (!res.ok) throw new Error("Greška pri dohvatanju smještaja");
  const rows = await res.json();
  return rows.map(normalizeHotel);
}

export async function fetchHotelBySlug(slug) {
  const res = await fetch(`${API_BASE}/hotels/${slug}`);
  if (!res.ok) return null;
  const row = await res.json();
  return normalizeHotel(row);
}

export async function fetchCountries() {
  try {
    const res = await fetch(`${API_BASE}/hotels/meta/countries`);
    if (!res.ok) throw new Error();
    return await res.json();
  } catch {
    return COUNTRIES_FALLBACK;
  }
}

export async function createBooking(payload) {
  const res = await fetch(`${API_BASE}/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Greška pri kreiranju rezervacije");
  }
  return res.json();
}

export async function updateUserProfile(userId, fullName) {
  const res = await fetch(`${API_BASE}/auth/profile`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, fullName }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Greška pri ažuriranju profila.");
  return data.user;
}

export async function syncUser({ firebaseUid, email, fullName }) {
  const res = await fetch(`${API_BASE}/auth/sync`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ firebaseUid, email, fullName }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Greška pri sinhronizaciji korisnika.");
  return data.user;
}

export async function fetchOwnerBookings(ownerId) {
  const res = await fetch(`${API_BASE}/bookings/owner?ownerId=${ownerId}`);
  if (!res.ok) throw new Error("Greška pri dohvatanju gostiju");
  return res.json();
}

export async function fetchBlockedDates(hotelId) {
  const res = await fetch(`${API_BASE}/bookings/blocked?hotelId=${hotelId}`);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchMyBookings(userId) {
  const res = await fetch(`${API_BASE}/bookings?userId=${userId}`);
  if (!res.ok) throw new Error("Greška pri dohvatanju rezervacija");
  return res.json();
}

export async function approveBooking(id, ownerId) {
  const res = await fetch(`${API_BASE}/bookings/${id}/approve`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ownerId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Greška pri odobravanju rezervacije.");
  return data;
}

export async function rejectBooking(id, ownerId) {
  const res = await fetch(`${API_BASE}/bookings/${id}/reject`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ownerId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Greška pri odbijanju rezervacije.");
  return data;
}

export async function replyToReview(reviewId, ownerId, reply) {
  const res = await fetch(`${API_BASE}/reviews/${reviewId}/reply`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ownerId, reply }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Greška pri slanju odgovora.");
  return data;
}

export async function cancelBooking(id, userId) {
  const res = await fetch(`${API_BASE}/bookings/${id}/cancel`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Greška pri otkazivanju rezervacije");
  return data;
}

export async function fetchReviewsSummary(hotelId) {
  const res = await fetch(`${API_BASE}/reviews/summary?hotelId=${hotelId}`);
  if (!res.ok) throw new Error("Greška pri dohvatanju statistike recenzija");
  return res.json();
}

export async function fetchReviews(hotelId, { rating, sort } = {}) {
  const params = new URLSearchParams({ hotelId });
  if (rating) params.set("rating", rating);
  if (sort) params.set("sort", sort);
  const res = await fetch(`${API_BASE}/reviews?${params.toString()}`);
  if (!res.ok) throw new Error("Greška pri dohvatanju recenzija");
  return res.json();
}

export async function createReview({ bookingId, userId, rating, comment }) {
  const res = await fetch(`${API_BASE}/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bookingId, userId, rating, comment }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Greška pri objavi recenzije.");
  return data;
}

export async function uploadImages(files) {
  const formData = new FormData();
  Array.from(files).forEach((f) => formData.append("images", f));
  const res = await fetch(`${API_BASE}/uploads`, { method: "POST", body: formData });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Greška pri uploadu slika.");
  return data.urls;
}

export async function fetchFavorites(userId, listId) {
  const params = new URLSearchParams({ userId });
  if (listId) params.set("listId", listId);
  const res = await fetch(`${API_BASE}/favorites?${params.toString()}`);
  if (!res.ok) throw new Error("Greška pri dohvatanju favorita");
  return res.json();
}

export async function fetchFavoriteIds(userId) {
  if (!userId) return [];
  const res = await fetch(`${API_BASE}/favorites/ids?userId=${userId}`);
  if (!res.ok) return [];
  return res.json();
}

export async function toggleFavorite(userId, hotelId) {
  const res = await fetch(`${API_BASE}/favorites/toggle`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, hotelId }),
  });
  if (!res.ok) throw new Error("Greška pri ažuriranju favorita");
  return res.json();
}

export async function fetchListsForHotel(userId, hotelId) {
  const res = await fetch(`${API_BASE}/favorites/for-hotel?userId=${userId}&hotelId=${hotelId}`);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchFavoriteLists(userId) {
  const res = await fetch(`${API_BASE}/favorites/lists?userId=${userId}`);
  if (!res.ok) throw new Error("Greška pri dohvatanju listi");
  return res.json();
}

export async function createFavoriteList(userId, name) {
  const res = await fetch(`${API_BASE}/favorites/lists`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Greška pri kreiranju liste.");
  return data;
}

export async function renameFavoriteList(id, userId, name) {
  const res = await fetch(`${API_BASE}/favorites/lists/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Greška pri preimenovanju liste.");
  return data;
}

export async function deleteFavoriteList(id, userId) {
  const res = await fetch(`${API_BASE}/favorites/lists/${id}?userId=${userId}`, { method: "DELETE" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Greška pri brisanju liste.");
  return data;
}

export async function addToFavoriteList(userId, hotelId, listId) {
  const res = await fetch(`${API_BASE}/favorites/add-to-list`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, hotelId, listId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Greška pri dodavanju u listu.");
  return data;
}

export async function removeFromFavoriteList(listId, hotelId) {
  const res = await fetch(`${API_BASE}/favorites?listId=${listId}&hotelId=${hotelId}`, { method: "DELETE" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Greška pri uklanjanju iz liste.");
  return data;
}

export async function registerUser({ firstName, lastName, email, password }) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ firstName, lastName, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Greška pri registraciji.");
  return data.user;
}

export async function loginUser({ email, password }) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Greška pri prijavi.");
  return data.user;
}

export async function fetchMyProperties(ownerId) {
  const res = await fetch(`${API_BASE}/hotels/mine/list?ownerId=${ownerId}`);
  if (!res.ok) throw new Error("Greška pri dohvatanju tvojih objekata");
  return res.json();
}

export async function fetchMyPropertyDetail(id, ownerId) {
  const res = await fetch(`${API_BASE}/hotels/mine/${id}?ownerId=${ownerId}`);
  if (!res.ok) throw new Error("Greška pri dohvatanju objekta");
  return res.json();
}

export async function updateHotelListing(id, payload) {
  const res = await fetch(`${API_BASE}/hotels/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Greška pri uređivanju objekta.");
  return data;
}

export async function deleteHotelListing(id, ownerId) {
  const res = await fetch(`${API_BASE}/hotels/${id}?ownerId=${ownerId}`, { method: "DELETE" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Greška pri brisanju objekta.");
  return data;
}

export async function createHotelListing(payload) {
  const res = await fetch(`${API_BASE}/hotels`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Greška pri dodavanju objekta.");
  return data;
}
