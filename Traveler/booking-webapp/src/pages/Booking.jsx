import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Minus, Plus, CheckCircle2, Loader2 } from "lucide-react";
import Navbar from "../components/Navbar";
import Calendar, { toDateStr } from "../components/Calendar";
import { fetchHotelBySlug, createBooking, fetchBlockedDates } from "../api/client";
import { useAuth } from "../context/AuthContext";

const fmt = (d) =>
  d ? d.toLocaleDateString("hr-BA", { weekday: "short", day: "numeric", month: "long" }) : "—";

function Counter({ label, value, setValue, min = 0 }) {
  return (
    <div className="flex items-center justify-between py-3">
      <p className="text-sm font-semibold text-ink">{label}</p>
      <div className="flex items-center gap-3">
        <button
          onClick={() => setValue(Math.max(min, value - 1))}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-ink hover:border-brand hover:text-brand"
        >
          <Minus size={14} />
        </button>
        <span className="w-5 text-center font-display text-sm font-bold text-ink">{value}</span>
        <button
          onClick={() => setValue(value + 1)}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-ink hover:border-brand hover:text-brand"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

export default function Booking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, openAuthModal } = useAuth();
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const [checkIn, setCheckIn] = useState(null);
  const [checkOut, setCheckOut] = useState(null);
  const [rooms, setRooms] = useState(1);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  const [blockedDates, setBlockedDates] = useState([]);

  useEffect(() => {
    let cancelled = false;
    fetchHotelBySlug(id)
      .then((data) => !cancelled && setHotel(data))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [id]);

  const loadBlockedDates = () => {
    if (!hotel) return;
    fetchBlockedDates(hotel.dbId).then(setBlockedDates);
  };
  useEffect(loadBlockedDates, [hotel]);

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    return Math.round((checkOut - checkIn) / (1000 * 60 * 60 * 24));
  }, [checkIn, checkOut]);

  // koliko nocenja x cijena x broj soba
  const total = nights * (hotel?.pricePerNight || 0) * Math.max(1, rooms);

  const handleConfirm = async () => {
    if (!hotel || !checkIn || !checkOut) return;
    if (!user) {
      openAuthModal();
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await createBooking({
        hotelId: hotel.dbId,
        userId: user.id,
        guestName: user.fullName,
        guestEmail: user.email,
        checkIn: toDateStr(checkIn),
        checkOut: toDateStr(checkOut),
        rooms,
        adults,
        children,
      });
      setConfirmed(true);
      loadBlockedDates();
    } catch (err) {
      setSubmitError(err.message);

      loadBlockedDates();
      setCheckIn(null);
      setCheckOut(null);
    } finally {
      setSubmitting(false);
    }
  };

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
        <p className="p-10 text-center text-ink">Smještaj nije pronađen.</p>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="mx-auto flex max-w-lg flex-col items-center px-8 py-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <CheckCircle2 size={32} />
          </div>
          <h1 className="mt-6 font-display text-2xl font-bold text-ink">Zahtjev je poslan!</h1>
          <p className="mt-2 text-sm text-muted">
            {hotel.name} · {fmt(checkIn)} – {fmt(checkOut)} · {rooms} {rooms === 1 ? "jedinica" : "jedinice"}, {adults} odrasla{children ? `, ${children} djece` : ""}
          </p>
          <p className="mt-2 max-w-sm text-xs text-muted">
            Vlasnik objekta treba potvrditi tvoju rezervaciju — dobit ćeš obavijest čim odluči.
          </p>
          <div className="mt-8 flex gap-3">
            <button
              onClick={() => navigate("/rezervacije")}
              className="rounded-lg border border-brand px-6 py-3 text-sm font-semibold text-brand hover:bg-brand hover:text-white"
            >
              Moje rezervacije
            </button>
            <button
              onClick={() => navigate("/")}
              className="rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-white hover:opacity-90"
            >
              Nazad na pretragu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-[1300px] px-8 py-8 lg:px-16">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-medium text-muted hover:text-ink">
          <ChevronLeft size={16} /> Nazad
        </button>

        <h1 className="mt-4 font-display text-2xl font-bold text-ink">Odaberi datume</h1>
        <p className="mt-1 text-sm text-muted">{hotel.name} · {hotel.location}</p>

        {!user && (
          <p className="mt-3 rounded-md border border-brand/30 bg-sky-bg px-4 py-2 text-sm text-ink">
            Moraš biti prijavljen da bi rezervisao smještaj.{" "}
            <button onClick={openAuthModal} className="font-semibold text-brand hover:underline">
              Prijavi se
            </button>
          </p>
        )}

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Calendar
              checkIn={checkIn}
              checkOut={checkOut}
              blockedDates={blockedDates}
              onSelect={(inD, outD) => { setCheckIn(inD); setCheckOut(outD); }}
            />
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-lg border border-line bg-white p-5 card-shadow">
              <p className="font-display text-sm font-bold text-ink">Rezerviši</p>
              <div className="mt-4 flex items-center justify-between rounded-md bg-sky-bg p-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Check-in</p>
                  <p className="font-display text-sm font-bold text-brand">{checkIn ? fmt(checkIn) : "Odaberi datum"}</p>
                </div>
                <div className="h-8 w-px bg-line" />
                <div className="text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Check-out</p>
                  <p className="font-display text-sm font-bold text-brand">{checkOut ? fmt(checkOut) : "Odaberi datum"}</p>
                </div>
              </div>

              <div className="mt-2 divide-y divide-line">
                <Counter label="Jedinice" value={rooms} setValue={setRooms} min={1} />
                <Counter label="Odrasli" value={adults} setValue={setAdults} min={1} />
                <Counter label="Djeca" value={children} setValue={setChildren} min={0} />
              </div>
            </div>

            <div className="rounded-lg border border-line bg-white p-5 card-shadow">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">€{hotel.pricePerNight.toLocaleString()} × {nights || 0} noći</span>
                <span className="font-semibold text-ink">€{nights ? total.toLocaleString(undefined, { maximumFractionDigits: 0 }) : 0}</span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                <span className="font-display text-sm font-bold text-ink">Ukupno</span>
                <span className="font-display text-lg font-bold text-ink">€{nights ? total.toLocaleString(undefined, { maximumFractionDigits: 0 }) : 0}</span>
              </div>
              {submitError && (
                <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{submitError}</p>
              )}
              <button
                disabled={!checkIn || !checkOut || submitting}
                onClick={handleConfirm}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-brand py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {submitting && <Loader2 size={15} className="animate-spin" />}
                {user ? "Pošalji zahtjev za rezervaciju" : "Prijavi se za rezervaciju"}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="h-16" />
    </div>
  );
}
