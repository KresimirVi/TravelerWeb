const { pool } = require("./pool");

const STATEMENTS = [
  `CREATE EXTENSION IF NOT EXISTS "pgcrypto"`,

  `DO $$ BEGIN
     CREATE TYPE accommodation_type AS ENUM
       ('hotel', 'hostel', 'apartman', 'vikendica', 'stan', 'kuca', 'garsonijera');
   EXCEPTION WHEN duplicate_object THEN null; END $$`,

  `DO $$ BEGIN
     CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled');
   EXCEPTION WHEN duplicate_object THEN null; END $$`,

  `CREATE TABLE IF NOT EXISTS users (
     id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     email         VARCHAR(255) UNIQUE NOT NULL,
     full_name     VARCHAR(255) NOT NULL,
     password_hash VARCHAR(255),
     firebase_uid  VARCHAR(255) UNIQUE,
     created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,

  `CREATE TABLE IF NOT EXISTS hotels (
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
     owner_name       VARCHAR(255),
     latitude         NUMERIC(9,6),
     longitude        NUMERIC(9,6),
     street           VARCHAR(255),
     owner_id         UUID REFERENCES users(id) ON DELETE SET NULL,
     created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
     updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,

  `ALTER TABLE hotels ADD COLUMN IF NOT EXISTS country VARCHAR(100) NOT NULL DEFAULT 'Hrvatska'`,
  `ALTER TABLE hotels ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255)`,
  `ALTER TABLE hotels ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50)`,
  `ALTER TABLE hotels ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES users(id) ON DELETE SET NULL`,
  `ALTER TABLE hotels ADD COLUMN IF NOT EXISTS owner_name VARCHAR(255)`,
  `ALTER TABLE hotels ADD COLUMN IF NOT EXISTS latitude NUMERIC(9,6)`,
  `ALTER TABLE hotels ADD COLUMN IF NOT EXISTS longitude NUMERIC(9,6)`,
  `ALTER TABLE hotels ADD COLUMN IF NOT EXISTS street VARCHAR(255)`,
  `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_by VARCHAR(20)`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS firebase_uid VARCHAR(255) UNIQUE`,

  `CREATE INDEX IF NOT EXISTS idx_hotels_type ON hotels (type)`,
  `CREATE INDEX IF NOT EXISTS idx_hotels_location ON hotels (location)`,
  `CREATE INDEX IF NOT EXISTS idx_hotels_country ON hotels (country)`,

  `CREATE TABLE IF NOT EXISTS hotel_images (
     id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     hotel_id   UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
     image_url  TEXT NOT NULL,
     position   INTEGER NOT NULL DEFAULT 0,
     room_type  VARCHAR(50)
   )`,
  `CREATE INDEX IF NOT EXISTS idx_hotel_images_hotel_id ON hotel_images (hotel_id)`,

  `CREATE TABLE IF NOT EXISTS hotel_amenities (
     id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     hotel_id      UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
     amenity_name  VARCHAR(100) NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS idx_hotel_amenities_hotel_id ON hotel_amenities (hotel_id)`,

  `CREATE TABLE IF NOT EXISTS bookings (
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
   )`,
  `CREATE INDEX IF NOT EXISTS idx_bookings_hotel_id ON bookings (hotel_id)`,
  `CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings (user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings (check_in, check_out)`,

  `CREATE TABLE IF NOT EXISTS reviews (
     id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     hotel_id      UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
     user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
     booking_id    UUID UNIQUE REFERENCES bookings(id) ON DELETE SET NULL,
     guest_name    VARCHAR(255) NOT NULL,
     rating        SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
     comment       TEXT,
     created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS idx_reviews_hotel_id ON reviews (hotel_id)`,
  `CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews (rating)`,
  `ALTER TABLE reviews ADD COLUMN IF NOT EXISTS owner_reply TEXT`,
  `ALTER TABLE reviews ADD COLUMN IF NOT EXISTS owner_reply_at TIMESTAMPTZ`,

  `CREATE TABLE IF NOT EXISTS favorite_lists (
     id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     name       VARCHAR(100) NOT NULL,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS idx_favorite_lists_user_id ON favorite_lists (user_id)`,

  `CREATE TABLE IF NOT EXISTS favorites (
     id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     hotel_id   UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
     list_id    UUID REFERENCES favorite_lists(id) ON DELETE CASCADE,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites (user_id)`,
  `ALTER TABLE favorites ADD COLUMN IF NOT EXISTS list_id UUID REFERENCES favorite_lists(id) ON DELETE CASCADE`,
  `CREATE INDEX IF NOT EXISTS idx_favorites_list_id ON favorites (list_id)`,

  `ALTER TABLE favorites DROP CONSTRAINT IF EXISTS favorites_user_id_hotel_id_key`,
  `DO $$ BEGIN
     ALTER TABLE favorites ADD CONSTRAINT favorites_list_hotel_unique UNIQUE (list_id, hotel_id);
   EXCEPTION WHEN duplicate_object THEN null; END $$`,

  `CREATE TABLE IF NOT EXISTS _meta (
     key   VARCHAR(100) PRIMARY KEY,
     value TEXT
   )`,
];

// pravi tabele ako ne postoje, pokrece se svaki put kad se server digne
async function ensureSchema() {
  for (const statement of STATEMENTS) {
    try {
      await pool.query(statement);
    } catch (err) {

      console.warn(`[schema] Upozorenje na koraku: ${statement.slice(0, 60)}...`);
      console.warn(`[schema] ${err.message}`);
    }
  }
  await backfillMissingOwners();
  await migrateFavoritesToLists();
  await autoReseedIfOutdated();
  console.log("[schema] Baza je provjerena — sve potrebne tabele postoje.");
}

async function autoReseedIfOutdated() {
  try {
    const { seed, SEED_DATA_VERSION } = require("./seed");
    const { rows } = await pool.query(`SELECT value FROM _meta WHERE key = 'seed_data_version'`);
    const currentVersion = rows[0]?.value;
    if (currentVersion === SEED_DATA_VERSION) return;

    console.log(
      `[schema] Demo podaci su zastarjeli (verzija ${currentVersion || "nepoznata"} -> ${SEED_DATA_VERSION}) — automatski osvježavam...`
    );
    await seed();
    console.log("[schema] Demo podaci su osvježeni na najnoviju verziju.");
    await pool
      .query(`DELETE FROM _meta WHERE key = 'last_seed_error'`)
      .catch(() => {});
  } catch (err) {
    console.warn("[schema] Automatsko osvježavanje demo podataka nije uspjelo:", err.message);

    await pool
      .query(
        `INSERT INTO _meta (key, value) VALUES ('last_seed_error', $1)
         ON CONFLICT (key) DO UPDATE SET value = $1`,
        [`${new Date().toISOString()}: ${err.message}`]
      )
      .catch(() => {});
  }
}

const BACKFILL_OWNER_NAMES = [
  "Ivan Kovačević", "Marija Perić", "Ante Horvat", "Ana Jurić", "Marko Babić",
  "Petra Marić", "Josip Novak", "Lucija Radić", "Tomislav Barišić", "Katarina Šimić",
];
async function backfillMissingOwners() {
  try {
    const { rows } = await pool.query(
      `SELECT id, country FROM hotels WHERE owner_name IS NULL OR contact_email IS NULL OR contact_phone IS NULL`
    );
    if (rows.length === 0) return;

    for (let i = 0; i < rows.length; i++) {
      const name = BACKFILL_OWNER_NAMES[i % BACKFILL_OWNER_NAMES.length];
      const ascii = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const [first, last] = ascii.split(" ");
      const email = `${first}.${last}@gmail.com`;
      const prefix = rows[i].country === "Bosna i Hercegovina" ? "+387 6" : rows[i].country === "Slovenija" ? "+386 3" : "+385 9";
      const phone = `${prefix}${1 + (i % 9)} ${100 + i} ${200 + i}`;
      await pool.query(
        `UPDATE hotels SET
           owner_name = COALESCE(owner_name, $1),
           contact_email = COALESCE(contact_email, $2),
           contact_phone = COALESCE(contact_phone, $3)
         WHERE id = $4`,
        [name, email, phone, rows[i].id]
      );
    }
    console.log(`[schema] Popunio podatke o vlasniku za ${rows.length} objekata koji su ih imali prazne.`);
  } catch (err) {
    console.warn("[schema] Backfill vlasnika nije uspio:", err.message);
  }
}

async function migrateFavoritesToLists() {
  try {
    const { rows: orphans } = await pool.query(
      `SELECT DISTINCT user_id FROM favorites WHERE list_id IS NULL`
    );
    if (orphans.length === 0) return;

    for (const { user_id } of orphans) {
      let { rows: existingList } = await pool.query(
        `SELECT id FROM favorite_lists WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1`,
        [user_id]
      );
      let listId;
      if (existingList.length > 0) {
        listId = existingList[0].id;
      } else {
        const { rows: created } = await pool.query(
          `INSERT INTO favorite_lists (user_id, name) VALUES ($1, 'Favoriti') RETURNING id`,
          [user_id]
        );
        listId = created[0].id;
      }
      await pool.query(`UPDATE favorites SET list_id = $1 WHERE user_id = $2 AND list_id IS NULL`, [
        listId,
        user_id,
      ]);
    }
    console.log(`[schema] Prebacio stare favorite u podrazumijevane liste za ${orphans.length} korisnika.`);
  } catch (err) {
    console.warn("[schema] Migracija favorita nije uspjela:", err.message);
  }
}

module.exports = { ensureSchema };
