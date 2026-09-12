import { useEffect, useRef, useState } from "react";
import { X, Loader2, Trash2, Upload, ImageIcon } from "lucide-react";
import {
  ALL_AMENITIES, TYPE_LABELS, COUNTRIES_FALLBACK,
  createHotelListing, updateHotelListing, uploadImages,
} from "../api/client";
import { useAuth } from "../context/AuthContext";
import { MapPicker } from "./PropertyMap";

const EMPTY = {
  type: "",
  name: "",
  location: "",
  country: "",
  street: "",
  pricePerNight: "",
  description: "",
  amenities: [],
  contactEmail: "",
  contactPhone: "",
};

// koristi se i za dodavanje i za uredjivanje objekta (isti form)
export default function ListPropertyModal({ onCreated, onUpdated }) {
  const { user, listModalOpen, closeListModal, editingProperty } = useAuth();
  const isEditing = Boolean(editingProperty);
  const [form, setForm] = useState(EMPTY);
  const [mapLocation, setMapLocation] = useState(null);
  const [images, setImages] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!listModalOpen) return;
    if (editingProperty) {
      setForm({
        type: editingProperty.type || "",
        name: editingProperty.name || "",
        location: editingProperty.location || "",
        country: editingProperty.country || "",
        street: editingProperty.street || "",
        pricePerNight: String(editingProperty.price_per_night || ""),
        description: editingProperty.description || "",
        amenities: editingProperty.amenities || [],
        contactEmail: editingProperty.contact_email || "",
        contactPhone: editingProperty.contact_phone || "",
      });
      setImages((editingProperty.images || []).map((url) => ({ url, uploading: false })));
      if (editingProperty.latitude && editingProperty.longitude) {
        setMapLocation({ lat: Number(editingProperty.latitude), lng: Number(editingProperty.longitude) });
      }
    } else if (user && !form.contactEmail) {
      setForm((f) => ({ ...f, contactEmail: user.email }));
    }
  }, [listModalOpen, editingProperty]);

  if (!listModalOpen) return null;

  const set = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setFieldErrors((fe) => ({ ...fe, [field]: undefined }));
  };

  const toggleAmenity = (a) => {
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(a) ? f.amenities.filter((x) => x !== a) : [...f.amenities, a],
    }));
    setFieldErrors((fe) => ({ ...fe, amenities: undefined }));
  };

  const handleFilesSelected = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setFieldErrors((fe) => ({ ...fe, images: undefined }));

    const tooBig = files.find((f) => f.size > 8 * 1024 * 1024);
    if (tooBig) {
      setFieldErrors((fe) => ({ ...fe, images: `"${tooBig.name}" je prevelika — maksimalno 8MB po slici.` }));
      return;
    }

    const placeholders = files.map((f) => ({ url: URL.createObjectURL(f), uploading: true }));
    setImages((prev) => [...prev, ...placeholders]);

    try {
      const urls = await uploadImages(files);
      setImages((prev) => {
        const next = [...prev];
        const startIdx = next.length - placeholders.length;
        urls.forEach((url, i) => {
          next[startIdx + i] = { url, uploading: false };
        });
        return next;
      });
    } catch (err) {
      setFieldErrors((fe) => ({ ...fe, images: err.message }));
      setImages((prev) => prev.filter((img) => !placeholders.includes(img)));
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = (i) => setImages((prev) => prev.filter((_, idx) => idx !== i));

  const close = () => {
    setForm(EMPTY);
    setImages([]);
    setFieldErrors({});
    setFormError(null);
    setSuccess(false);
    closeListModal();
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Naziv objekta je obavezan.";
    if (!form.type) errs.type = "Odaberi tip smještaja.";
    if (!form.pricePerNight || Number(form.pricePerNight) <= 0)
      errs.pricePerNight = "Unesi cijenu veću od 0.";
    if (!form.location.trim()) errs.location = "Grad je obavezan.";
    if (!form.country.trim()) errs.country = "Država je obavezna.";
    if (!form.street.trim()) errs.street = "Ulica i broj su obavezni.";
    if (!mapLocation) errs.map = "Označi tačnu lokaciju objekta na karti (pretraži ili klikni na kartu).";
    if (!form.description.trim()) errs.description = "Opis je obavezan.";
    else if (form.description.trim().length < 20)
      errs.description = "Opis je prekratak — napiši bar par rečenica (min. 20 karaktera).";
    if (form.amenities.length === 0) errs.amenities = "Odaberi bar jedan sadržaj.";
    if (images.length === 0) errs.images = "Dodaj bar jednu sliku objekta.";
    else if (images.some((img) => img.uploading)) errs.images = "Sačekaj da se sve slike uploaduju.";
    if (!form.contactEmail.trim()) errs.contactEmail = "Kontakt email je obavezan.";
    else if (!/\S+@\S+\.\S+/.test(form.contactEmail)) errs.contactEmail = "Email adresa nije ispravna.";
    if (!form.contactPhone.trim()) errs.contactPhone = "Kontakt broj telefona je obavezan.";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      setFormError("Provjeri istaknuta polja ispod — nešto nedostaje ili nije ispravno uneseno.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ownerId: user.id,
        ownerName: user.fullName,
        type: form.type,
        name: form.name,
        location: form.location,
        country: form.country,
        street: form.street,
        latitude: mapLocation.lat,
        longitude: mapLocation.lng,
        pricePerNight: Number(form.pricePerNight),
        description: form.description,
        amenities: form.amenities,
        images: images.map((img) => img.url),
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone,
      };
      if (isEditing) {
        await updateHotelListing(editingProperty.id, payload);
        setSuccess(true);
        onUpdated?.();
      } else {
        const created = await createHotelListing(payload);
        setSuccess(true);
        onCreated?.(created);
      }
    } catch (err) {
      setFormError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fieldClass = (field) =>
    `mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-brand ${
      fieldErrors[field] ? "border-red-400" : "border-line"
    }`;

  const FieldError = ({ field }) =>
    fieldErrors[field] ? <p className="mt-1 text-[11px] text-red-600">{fieldErrors[field]}</p> : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 card-shadow">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-ink">
            {isEditing ? "Uredi objekat" : "Prijavi svoj objekat"}
          </h2>
          <button
            onClick={close}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-sky-bg hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>

        {success ? (
          <div className="py-10 text-center">
            <p className="font-display text-lg font-bold text-ink">
              {isEditing ? "Izmjene su sačuvane!" : "Objekat je objavljen!"}
            </p>
            <p className="mt-2 text-sm text-muted">
              {isEditing
                ? "Podaci o tvom objektu su ažurirani."
                : "Tvoj smještaj se sada prikazuje ostalim korisnicima na početnoj stranici."}
            </p>
            <button
              onClick={close}
              className="mt-6 rounded-md bg-brand px-6 py-3 text-sm font-semibold text-white hover:opacity-90"
            >
              Zatvori
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="text-xs font-medium text-muted">Naziv objekta *</label>
              <input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className={fieldClass("name")}
              />
              <FieldError field="name" />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-muted">Tip smještaja *</label>
                <select
                  value={form.type}
                  onChange={(e) => set("type", e.target.value)}
                  className={fieldClass("type")}
                >
                  <option value="">Odaberi...</option>
                  {Object.entries(TYPE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
                <FieldError field="type" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted">Cijena po noći (€) *</label>
                <input
                  type="number"
                  min={1}
                  value={form.pricePerNight}
                  onChange={(e) => set("pricePerNight", e.target.value)}
                  className={fieldClass("pricePerNight")}
                />
                <FieldError field="pricePerNight" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-muted">Grad *</label>
                <input
                  value={form.location}
                  onChange={(e) => set("location", e.target.value)}
                  placeholder="npr. Mostar"
                  className={fieldClass("location")}
                />
                <FieldError field="location" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted">Država *</label>
                <input
                  list="country-options"
                  value={form.country}
                  onChange={(e) => set("country", e.target.value)}
                  placeholder="npr. Bosna i Hercegovina"
                  className={fieldClass("country")}
                />
                <datalist id="country-options">
                  {COUNTRIES_FALLBACK.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
                <FieldError field="country" />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted">Ulica i broj *</label>
              <input
                value={form.street}
                onChange={(e) => set("street", e.target.value)}
                placeholder="npr. Stradun 5"
                className={fieldClass("street")}
              />
              <FieldError field="street" />
            </div>

            <div>
              <label className="text-xs font-medium text-muted">Tačna lokacija na karti *</label>
              <div className="mt-2">
                <MapPicker value={mapLocation} onChange={setMapLocation} />
              </div>
              <FieldError field="map" />
            </div>

            <div>
              <label className="text-xs font-medium text-muted">Opis *</label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                className={fieldClass("description")}
              />
              <FieldError field="description" />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-muted">Kontakt email *</label>
                <input
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => set("contactEmail", e.target.value)}
                  placeholder="tvoj@email.com"
                  className={fieldClass("contactEmail")}
                />
                <FieldError field="contactEmail" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted">Kontakt broj telefona *</label>
                <input
                  type="tel"
                  value={form.contactPhone}
                  onChange={(e) => set("contactPhone", e.target.value)}
                  placeholder="+387 6X XXX XXX"
                  className={fieldClass("contactPhone")}
                />
                <FieldError field="contactPhone" />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted">Sadržaji * (odaberi bar jedan)</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {ALL_AMENITIES.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => toggleAmenity(a)}
                    className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                      form.amenities.includes(a)
                        ? "border-brand bg-brand text-white"
                        : "border-line bg-white text-ink"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
              <FieldError field="amenities" />
            </div>

            <div>
              <label className="text-xs font-medium text-muted">Slike * (prva slika je naslovna)</label>

              <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {images.map((img, i) => (
                  <div key={i} className="relative aspect-square overflow-hidden rounded-md border border-line">
                    <img src={img.url} alt="" className="h-full w-full object-cover" />
                    {img.uploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <Loader2 size={18} className="animate-spin text-white" />
                      </div>
                    )}
                    {i === 0 && !img.uploading && (
                      <span className="absolute left-1 top-1 rounded bg-brand px-1.5 py-0.5 text-[9px] font-semibold text-white">
                        Naslovna
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-red-600"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex aspect-square flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-line text-muted hover:border-brand hover:text-brand"
                >
                  <Upload size={18} />
                  <span className="text-[10px] font-medium">Dodaj slike</span>
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                onChange={handleFilesSelected}
                className="hidden"
              />
              <FieldError field="images" />
              <p className="mt-1 flex items-center gap-1 text-[11px] text-muted">
                <ImageIcon size={11} /> JPG, PNG, WEBP ili GIF — max 8MB po slici.
              </p>
            </div>

            {formError && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{formError}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-brand py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {isEditing ? "Sačuvaj izmjene" : "Objavi oglas"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
