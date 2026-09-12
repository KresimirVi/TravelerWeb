import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

function firebaseErrorToMessage(err) {
  const code = err?.code || "";
  if (code.includes("email-already-in-use")) return "Korisnik s ovim emailom već postoji — pokušaj se prijaviti umjesto registracije.";
  if (code.includes("weak-password")) return "Lozinka mora imati najmanje 6 karaktera.";
  if (code.includes("invalid-email")) return "Email adresa nije u ispravnom formatu (npr. ime@email.com).";
  if (code.includes("user-not-found") || code.includes("wrong-password") || code.includes("invalid-credential"))
    return "Pogrešan email ili lozinka — provjeri jesi li dobro upisao/la oboje.";
  if (code.includes("too-many-requests")) return "Previše pokušaja prijave. Pričekaj koji minut pa pokušaj ponovo.";
  if (code.includes("network-request-failed")) return "Nema internet konekcije — provjeri vezu i pokušaj ponovo.";
  if (code.includes("user-disabled")) return "Ovaj nalog je onemogućen. Kontaktiraj podršku.";
  return err?.message || "Došlo je do neočekivane greške. Pokušaj ponovo.";
}

export default function AuthModal() {
  const { authModalOpen, closeAuthModal, login, register, resetPassword } = useAuth();
  // login ili register forma, isti modal za oboje
  const [mode, setMode] = useState("login");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!authModalOpen) return null;

  const reset = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPassword("");
    setError(null);
    setInfo(null);
  };

  const switchMode = (m) => {
    setMode(m);
    reset();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (mode === "register") {
      if (!firstName.trim() || !lastName.trim()) {
        setError("Upiši ime i prezime.");
        return;
      }
      if (password.length < 6) {
        setError("Lozinka mora imati najmanje 6 karaktera.");
        return;
      }
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Email adresa nije u ispravnom formatu (npr. ime@email.com).");
      return;
    }

    setLoading(true);
    try {
      if (mode === "register") {
        await register({ firstName, lastName, email, password });
      } else {
        await login({ email, password });
      }
      reset();
    } catch (err) {
      setError(firebaseErrorToMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError(null);
    setInfo(null);
    if (!email) {
      setError("Prvo upiši svoj email pa klikni ponovo.");
      return;
    }
    try {
      await resetPassword(email);
      setInfo("Poslali smo ti email s linkom za resetiranje lozinke.");
    } catch (err) {
      setError(firebaseErrorToMessage(err));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 card-shadow">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-ink">
            {mode === "login" ? "Prijava" : "Napravi nalog"}
          </h2>
          <button
            onClick={closeAuthModal}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-sky-bg hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 flex rounded-md border border-line p-1">
          <button
            onClick={() => switchMode("login")}
            className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors ${
              mode === "login" ? "bg-brand text-white" : "text-muted"
            }`}
          >
            Prijava
          </button>
          <button
            onClick={() => switchMode("register")}
            className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors ${
              mode === "register" ? "bg-brand text-white" : "text-muted"
            }`}
          >
            Registracija
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          {mode === "register" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted">Ime</label>
                <input
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-brand"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted">Prezime</label>
                <input
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-brand"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-muted">Email</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted">Lozinka</label>
            <input
              required
              type="password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-brand"
            />
            {mode === "register" && (
              <p className="mt-1 text-[11px] text-muted">Najmanje 6 karaktera.</p>
            )}
          </div>

          {mode === "login" && (
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-xs font-medium text-brand hover:underline"
            >
              Zaboravljena lozinka?
            </button>
          )}

          {error && <p className="text-xs text-red-600">{error}</p>}
          {info && <p className="text-xs text-emerald-600">{info}</p>}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-brand py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            {mode === "login" ? "Prijavi se" : "Registriraj se"}
          </button>
        </form>
      </div>
    </div>
  );
}
