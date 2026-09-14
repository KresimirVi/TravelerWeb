const express = require("express");
const { pool } = require("../db/pool");

const router = express.Router();

// pravi novu rezervaciju, uvijek krece kao pending dok vlasnik ne odobri
router.post("/", async (req, res) => {
  try {
    const {
      hotelId,
      userId,
      guestName,
      guestEmail,
      checkIn,
      checkOut,
      rooms = 1,
      adults = 1,
      children = 0,
    } = req.body;

    if (!hotelId || !checkIn || !checkOut) {
      return res.status(400).json({ error: "hotelId, checkIn i checkOut su obavezni." });
    }

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    if (checkIn < todayStr) {
      return res.status(400).json({ error: "Ne možeš rezervisati datum koji je već prošao." });
    }

    const { rows: hotelRows } = await pool.query(
      `SELECT price_per_night, name FROM hotels WHERE id = $1`,
      [hotelId]
    );
    if (hotelRows.length === 0) {
      return res.status(404).json({ error: "Smještaj nije pronađen." });
    }

    const nights = Math.round(
      (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)
    );
    if (nights <= 0) {
      return res.status(400).json({ error: "Datum odjave mora biti nakon datuma prijave." });
    }

    const { rows: conflicts } = await pool.query(
      `SELECT id FROM bookings
       WHERE hotel_id = $1 AND status = 'confirmed'
       AND check_in < $3 AND check_out > $2`,
      [hotelId, checkIn, checkOut]
    );
    if (conflicts.length > 0) {
      return res.status(409).json({ error: "Ovaj smještaj je već rezervisan za odabrane datume." });
    }

    const totalPrice = nights * Number(hotelRows[0].price_per_night) * Number(rooms);

    const { rows } = await pool.query(
      `INSERT INTO bookings (hotel_id, user_id, guest_name, guest_email, check_in, check_out, rooms, adults, children, total_price, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'pending') RETURNING *`,
      [hotelId, userId || null, guestName, guestEmail, checkIn, checkOut, rooms, adults, children, totalPrice]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Greška pri kreiranju rezervacije." });
  }
});

router.get("/", async (req, res) => {
  try {
    const { userId } = req.query;
    const conditions = [];
    const params = [];
    if (userId) {
      params.push(userId);
      conditions.push(`b.user_id = $${params.length}`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const { rows } = await pool.query(
      `SELECT b.*, h.name AS hotel_name, h.location AS hotel_location, h.slug AS hotel_slug,
              (SELECT image_url FROM hotel_images WHERE hotel_id = h.id ORDER BY position ASC LIMIT 1) AS hotel_cover,
              EXISTS(SELECT 1 FROM reviews r WHERE r.booking_id = b.id) AS has_review
       FROM bookings b JOIN hotels h ON h.id = b.hotel_id
       ${where}
       ORDER BY b.check_in DESC`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Greška pri dohvatanju rezervacija." });
  }
});

router.patch("/:id/approve", async (req, res) => {
  try {
    const { ownerId } = req.body || {};

    const { rows: bookingRows } = await pool.query(
      `SELECT b.*, h.owner_id AS hotel_owner_id
       FROM bookings b JOIN hotels h ON h.id = b.hotel_id
       WHERE b.id = $1`,
      [req.params.id]
    );
    if (bookingRows.length === 0) return res.status(404).json({ error: "Rezervacija nije pronađena." });
    const booking = bookingRows[0];

    if (!ownerId || booking.hotel_owner_id !== ownerId) {
      return res.status(403).json({ error: "Nemaš dozvolu da odobriš ovu rezervaciju." });
    }
    if (booking.status !== "pending") {
      return res.status(400).json({ error: "Ova rezervacija više nije na čekanju." });
    }

    const { rows: conflicts } = await pool.query(
      `SELECT id FROM bookings
       WHERE hotel_id = $1 AND status = 'confirmed' AND id != $2
       AND check_in < $4 AND check_out > $3`,
      [booking.hotel_id, booking.id, booking.check_in, booking.check_out]
    );
    if (conflicts.length > 0) {
      return res.status(409).json({ error: "Ovi datumi su u međuvremenu već potvrđeni za drugog gosta." });
    }

    const { rows } = await pool.query(
      `UPDATE bookings SET status = 'confirmed' WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Greška pri odobravanju rezervacije." });
  }
});

router.patch("/:id/reject", async (req, res) => {
  try {
    const { ownerId } = req.body || {};

    const { rows: bookingRows } = await pool.query(
      `SELECT b.*, h.owner_id AS hotel_owner_id
       FROM bookings b JOIN hotels h ON h.id = b.hotel_id
       WHERE b.id = $1`,
      [req.params.id]
    );
    if (bookingRows.length === 0) return res.status(404).json({ error: "Rezervacija nije pronađena." });
    const booking = bookingRows[0];

    if (!ownerId || booking.hotel_owner_id !== ownerId) {
      return res.status(403).json({ error: "Nemaš dozvolu da odbiješ ovu rezervaciju." });
    }
    if (booking.status !== "pending") {
      return res.status(400).json({ error: "Ova rezervacija više nije na čekanju." });
    }

    const { rows } = await pool.query(
      `UPDATE bookings SET status = 'cancelled', cancelled_by = 'owner_rejected' WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Greška pri odbijanju rezervacije." });
  }
});

router.patch("/:id/cancel", async (req, res) => {
  try {
    const { userId } = req.body || {};

    const { rows: bookingRows } = await pool.query(
      `SELECT b.*, h.owner_id AS hotel_owner_id, h.name AS hotel_name
       FROM bookings b JOIN hotels h ON h.id = b.hotel_id
       WHERE b.id = $1`,
      [req.params.id]
    );
    if (bookingRows.length === 0) return res.status(404).json({ error: "Rezervacija nije pronađena." });
    const booking = bookingRows[0];

    const isGuest = userId && booking.user_id === userId;
    const isOwner = userId && booking.hotel_owner_id === userId;
    if (!isGuest && !isOwner) {
      return res.status(403).json({ error: "Nemaš dozvolu da otkažeš ovu rezervaciju." });
    }

    const cancelledBy = isOwner ? "owner" : "guest";

    const { rows } = await pool.query(
      `UPDATE bookings SET status = 'cancelled', cancelled_by = $1 WHERE id = $2 RETURNING *`,
      [cancelledBy, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Greška pri otkazivanju rezervacije." });
  }
});

router.get("/owner", async (req, res) => {
  try {
    const { ownerId } = req.query;
    if (!ownerId) return res.status(400).json({ error: "ownerId je obavezan." });

    const { rows } = await pool.query(
      `SELECT b.*, h.name AS hotel_name, h.slug AS hotel_slug,
              (SELECT image_url FROM hotel_images WHERE hotel_id = h.id ORDER BY position ASC LIMIT 1) AS hotel_cover
       FROM bookings b JOIN hotels h ON h.id = b.hotel_id
       WHERE h.owner_id = $1
       ORDER BY b.created_at DESC`,
      [ownerId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Greška pri dohvatanju gostiju." });
  }
});

router.get("/blocked", async (req, res) => {
  try {
    const { hotelId } = req.query;
    if (!hotelId) return res.status(400).json({ error: "hotelId je obavezan." });

    const { rows } = await pool.query(
      `SELECT DISTINCT to_char(d, 'YYYY-MM-DD') AS blocked_date
       FROM bookings b,
            generate_series(b.check_in, b.check_out - INTERVAL '1 day', INTERVAL '1 day') d
       WHERE b.hotel_id = $1 AND b.status = 'confirmed' AND b.check_out >= CURRENT_DATE
       ORDER BY blocked_date ASC`,
      [hotelId]
    );
    res.json(rows.map((r) => r.blocked_date));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Greška pri dohvatanju zauzetih datuma." });
  }
});

module.exports = router;
