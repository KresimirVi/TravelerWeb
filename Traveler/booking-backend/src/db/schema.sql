-- ============================================================
-- Havenly booking platform — database schema
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Vrste smještaja
CREATE TYPE accommodation_type AS ENUM (
  'hotel', 'hostel', 'apartman', 'vikendica', 'stan', 'kuca', 'garsonijera'
);

CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled');

-- ------------------------------------------------------------
-- Korisnici
-- ------------------------------------------------------------
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  full_name     VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255),             -- bcrypt hash (privremeno, dok se ne poveže Firebase Auth)
  firebase_uid  VARCHAR(255) UNIQUE,       -- veza sa Firebase Authentication (kasnije)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- Smještaji (hoteli, hosteli, apartmani, vikendice, stanovi, kuće, garsonijere)
-- ------------------------------------------------------------
CREATE TABLE hotels (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             VARCHAR(255) UNIQUE NOT NULL,
  type             accommodation_type NOT NULL,
  name             VARCHAR(255) NOT NULL,
  location         VARCHAR(255) NOT NULL,
  country          VARCHAR(100) NOT NULL DEFAULT 'Hrvatska',
  distance_km      NUMERIC(5, 1),
  rating           NUMERIC(2, 1) NOT NULL DEFAULT 0,
  reviews_count    INTEGER NOT NULL DEFAULT 0,
  price_per_night  NUMERIC(10, 2) NOT NULL,
  badge            VARCHAR(100),
  description      TEXT NOT NULL,
  contact_email    VARCHAR(255),
  contact_phone    VARCHAR(50),
  owner_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_hotels_type ON hotels (type);
CREATE INDEX idx_hotels_location ON hotels (location);
CREATE INDEX idx_hotels_country ON hotels (country);

-- ------------------------------------------------------------
-- Slike smještaja (samo URL — fajlovi žive na cloud storage-u,
-- npr. Firebase Storage; baza čuva samo referencu)
-- ------------------------------------------------------------
CREATE TABLE hotel_images (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id   UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  image_url  TEXT NOT NULL,
  position   INTEGER NOT NULL DEFAULT 0,   -- redoslijed u galeriji (0 = naslovna)
  room_type  VARCHAR(50)                   -- npr. 'exterior','bedroom','bathroom','kitchen','living_room','balcony'
);

CREATE INDEX idx_hotel_images_hotel_id ON hotel_images (hotel_id);

-- ------------------------------------------------------------
-- Sadržaji smještaja (WiFi, klima, bazen...)
-- ------------------------------------------------------------
CREATE TABLE hotel_amenities (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id      UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  amenity_name  VARCHAR(100) NOT NULL
);

CREATE INDEX idx_hotel_amenities_hotel_id ON hotel_amenities (hotel_id);

-- ------------------------------------------------------------
-- Rezervacije
-- ------------------------------------------------------------
CREATE TABLE bookings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id      UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  guest_name    VARCHAR(255),
  guest_email   VARCHAR(255),
  check_in      DATE NOT NULL,
  check_out     DATE NOT NULL,
  rooms         INTEGER NOT NULL DEFAULT 1,
  adults        INTEGER NOT NULL DEFAULT 1,
  children      INTEGER NOT NULL DEFAULT 0,
  total_price   NUMERIC(10, 2) NOT NULL,
  status        booking_status NOT NULL DEFAULT 'confirmed',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT check_dates CHECK (check_out > check_in)
);

CREATE INDEX idx_bookings_hotel_id ON bookings (hotel_id);
CREATE INDEX idx_bookings_user_id ON bookings (user_id);
CREATE INDEX idx_bookings_dates ON bookings (check_in, check_out);

-- ------------------------------------------------------------
-- Recenzije — jedna recenzija po rezervaciji, samo nakon check-in datuma
-- ------------------------------------------------------------
CREATE TABLE reviews (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id      UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  booking_id    UUID UNIQUE REFERENCES bookings(id) ON DELETE SET NULL,
  guest_name    VARCHAR(255) NOT NULL,
  rating        SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reviews_hotel_id ON reviews (hotel_id);
CREATE INDEX idx_reviews_rating ON reviews (rating);

-- ------------------------------------------------------------
-- Favoriti — korisnik može sačuvati smještaje koji mu se sviđaju
-- ------------------------------------------------------------
CREATE TABLE favorites (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hotel_id   UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, hotel_id)
);

CREATE INDEX idx_favorites_user_id ON favorites (user_id);
