import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, LogOut, Home as HomeIcon, Menu, X, CalendarClock, Users, ChevronDown, Heart, Plus, Settings } from "lucide-react";
import { useAuth } from "../context/AuthContext";

function UserMenu({ user, logout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-md py-1 pl-1 pr-2 hover:bg-sky-bg"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-ink text-white">
          <User size={15} />
        </span>
        <span className="hidden text-sm font-medium text-ink lg:block">{user.fullName}</span>
        <ChevronDown size={14} className="text-muted" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 w-64 rounded-md border border-line bg-white p-2 card-shadow">
          <div className="border-b border-line px-2 pb-2">
            <p className="truncate text-sm font-semibold text-ink">{user.fullName}</p>
            <p className="mt-0.5 truncate text-xs text-muted">{user.email}</p>
          </div>
          <button
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className="mt-2 flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <LogOut size={15} /> Odjava
          </button>
        </div>
      )}
    </div>
  );
}

function MyPropertiesMenu({ openListModal }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-md border border-brand px-3 py-2 text-sm font-semibold text-brand transition-colors hover:bg-brand hover:text-white"
      >
        <HomeIcon size={14} /> Moji objekti <ChevronDown size={13} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 w-60 rounded-md border border-line bg-white p-2 card-shadow">
          <button
            onClick={() => {
              setOpen(false);
              openListModal();
            }}
            className="flex w-full items-center gap-2 rounded-md px-2 py-2.5 text-left text-sm font-medium text-ink hover:bg-sky-bg"
          >
            <Plus size={15} className="text-brand" /> Prijavi objekat
          </button>
          <button
            onClick={() => {
              setOpen(false);
              navigate("/moji-objekti");
            }}
            className="flex w-full items-center gap-2 rounded-md px-2 py-2.5 text-left text-sm font-medium text-ink hover:bg-sky-bg"
          >
            <Settings size={15} className="text-brand" /> Upravljaj objektima
          </button>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { user, logout, openAuthModal, openListModal } = useAuth();
  // hamburger meni za mobitel, na desktopu se ne koristi
  const [menuOpen, setMenuOpen] = useState(false);

  const navPill = (to, label, Icon) => (
    <Link
      to={to}
      className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-sky-bg"
    >
      <Icon size={15} className="text-muted" /> {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-white/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between px-4 py-4 sm:px-8 lg:px-16">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-display text-2xl font-bold tracking-tight text-ink">
            Traveler
          </span>
        </Link>

        {}
        <div className="hidden items-center gap-1 md:flex">
          {navPill("/rezervacije", "Moje rezervacije", CalendarClock)}
          {navPill("/moji-gosti", "Moji gosti", Users)}
          {navPill("/favoriti", "Favoriti", Heart)}

          <div className="ml-2">
            <MyPropertiesMenu openListModal={openListModal} />
          </div>

          <div className="ml-2">
            {user ? (
              <UserMenu user={user} logout={logout} />
            ) : (
              <button
                onClick={openAuthModal}
                className="flex items-center gap-1.5 rounded-md border border-brand bg-brand px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-transparent hover:text-brand"
              >
                <User size={14} /> Prijava
              </button>
            )}
          </div>
        </div>

        {}
        <div className="flex items-center gap-2 md:hidden">
          {user ? (
            <UserMenu user={user} logout={logout} />
          ) : (
            <button
              onClick={openAuthModal}
              className="flex items-center gap-1.5 rounded-md border border-brand bg-brand px-3 py-2 text-sm font-semibold text-white"
            >
              <User size={14} /> Prijava
            </button>
          )}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-line text-ink"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {}
      {menuOpen && (
        <div className="space-y-1 border-t border-line bg-white px-4 py-3 md:hidden">
          <Link
            to="/rezervacije"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 rounded-md px-2 py-3 text-sm font-medium text-ink hover:bg-sky-bg"
          >
            <CalendarClock size={16} /> Moje rezervacije
          </Link>
          <Link
            to="/moji-gosti"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 rounded-md px-2 py-3 text-sm font-medium text-ink hover:bg-sky-bg"
          >
            <Users size={16} /> Moji gosti
          </Link>
          <Link
            to="/favoriti"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 rounded-md px-2 py-3 text-sm font-medium text-ink hover:bg-sky-bg"
          >
            <Heart size={16} /> Favoriti
          </Link>
          <button
            onClick={() => {
              setMenuOpen(false);
              openListModal();
            }}
            className="flex w-full items-center gap-2 rounded-md px-2 py-3 text-left text-sm font-medium text-brand hover:bg-sky-bg"
          >
            <Plus size={16} /> Prijavi objekat
          </button>
          <Link
            to="/moji-objekti"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 rounded-md px-2 py-3 text-sm font-medium text-brand hover:bg-sky-bg"
          >
            <Settings size={16} /> Upravljaj objektima
          </Link>
        </div>
      )}
    </header>
  );
}
