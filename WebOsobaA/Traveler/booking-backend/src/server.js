require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const hotelsRouter = require("./routes/hotels");
const bookingsRouter = require("./routes/bookings");
const authRouter = require("./routes/auth");
const reviewsRouter = require("./routes/reviews");
const uploadsRouter = require("./routes/uploads");
const favoritesRouter = require("./routes/favorites");
const { ensureSchema } = require("./db/ensureSchema");

const app = express();
app.use(cors());
app.use(express.json());
// slike sluzimo direktno iz uploads foldera
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/api/health", async (req, res) => {
  try {
    const { pool } = require("./db/pool");
    const { rows: countRows } = await pool.query(`SELECT COUNT(*)::int AS count FROM hotels`);
    const { rows: errorRows } = await pool
      .query(`SELECT value FROM _meta WHERE key = 'last_seed_error'`)
      .catch(() => ({ rows: [] }));
    res.json({
      status: "ok",
      hotelCount: countRows[0]?.count ?? null,
      lastSeedError: errorRows[0]?.value ?? null,
    });
  } catch (err) {
    res.json({ status: "ok", hotelCount: null, dbError: err.message });
  }
});
app.use("/api/hotels", hotelsRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/auth", authRouter);
app.use("/api/reviews", reviewsRouter);
app.use("/api/uploads", uploadsRouter);
app.use("/api/favorites", favoritesRouter);

// sve sto ne pogodi ni jednu rutu iznad
app.use((req, res) => res.status(404).json({ error: "Ruta ne postoji." }));

const PORT = process.env.PORT || 4000;

ensureSchema()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Traveler API radi na http://localhost:${PORT}`);
      console.log(`[verzija koda: 2026-08-22-2313]`);
    });
  })
  .catch((err) => {
    console.error("Greška pri provjeri šeme baze:", err);
    process.exit(1);
  });
