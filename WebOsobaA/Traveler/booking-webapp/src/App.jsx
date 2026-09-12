import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import AuthModal from "./components/AuthModal";
import ListPropertyModal from "./components/ListPropertyModal";
import Home from "./pages/Home";
import HotelDetail from "./pages/HotelDetail";
import Booking from "./pages/Booking";
import MyBookings from "./pages/MyBookings";
import MyGuests from "./pages/MyGuests";
import Favorites from "./pages/Favorites";
import MyProperties from "./pages/MyProperties";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* sve rute aplikacije */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/hotel/:id" element={<HotelDetail />} />
          <Route path="/booking/:id" element={<Booking />} />
          <Route path="/rezervacije" element={<MyBookings />} />
          <Route path="/moji-gosti" element={<MyGuests />} />
          <Route path="/favoriti" element={<Favorites />} />
          <Route path="/moji-objekti" element={<MyProperties />} />
        </Routes>
        <AuthModal />
        <ListPropertyModal onCreated={() => window.location.assign("/moji-objekti")} onUpdated={() => window.location.reload()} />
      </BrowserRouter>
    </AuthProvider>
  );
}
