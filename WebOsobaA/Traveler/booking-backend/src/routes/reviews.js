const express = require("express");
const { pool } = require("../db/pool");

const router = express.Router();

const SORTS = {
  newest: "r.created_at DESC",
  oldest: "r.created_at ASC",
  highest: "r.rating DESC, r.created_at DESC",
  lowest: "r.rating ASC, r.created_at DESC",
};

router.get("/", async (req, res) => {
  try {
    const { hotelId, rating, sort } = req.query;
    if (!hotelId) return res.status(400).json({ error: "hotelId je obavezan." });

    const conditions = [`r.hotel_id = $1`];
    const params = [hotelId];
    if (rating) {
      params.push(Number(rating));
      conditions.push(`r.rating = $${params.length}`);
    }
    const orderBy = SORTS[sort] || SORTS.newest;

    const { rows } = await pool.query(
      `SELECT r.id, r.guest_name, r.rating, r.comment, r.created_at, r.hotel_id,
              r.owner_reply, r.owner_reply_at
       FROM reviews r
       WHERE ${conditions.join(" AND ")}
       ORDER BY ${orderBy}`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Greška pri dohvatanju recenzija." });
  }
});

router.post("/", async (req, res) => {
  try {
    const { bookingId, userId, rating, comment } = req.body;
    if (!bookingId || !userId || !rating) {
      return res.status(400).json({ error: "bookingId, userId i rating su obavezni." });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Ocjena mora biti između 1 i 5." });
    }

    const { rows: bookingRows } = await pool.query(
      `SELECT b.*, u.full_name AS user_full_name
       FROM bookings b LEFT JOIN users u ON u.id = b.user_id
       WHERE b.id = $1`,
      [bookingId]
    );
    if (bookingRows.length === 0) {
      return res.status(404).json({ error: "Rezervacija nije pronađena." });
    }
    const booking = bookingRows[0];

    if (booking.user_id !== userId) {
      return res.status(403).json({ error: "Ova rezervacija ne pripada tebi." });
    }
    if (new Date(booking.check_in) > new Date()) {
      return res.status(400).json({ error: "Recenziju možeš napisati tek od datuma prijave (check-in) nadalje." });
    }

    const { rows: existing } = await pool.query(
      `SELECT id FROM reviews WHERE booking_id = $1`,
      [bookingId]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: "Već si napisao recenziju za ovu rezervaciju." });
    }

    const { rows } = await pool.query(
      `INSERT INTO reviews (hotel_id, user_id, booking_id, guest_name, rating, comment)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [booking.hotel_id, userId, bookingId, booking.user_full_name || "Gost", rating, comment || null]
    );

    // updateamo prosjecnu ocjenu odmah nakon nove recenzije
    await pool.query(
      `UPDATE hotels SET
         reviews_count = (SELECT COUNT(*) FROM reviews WHERE hotel_id = $1),
         rating = (SELECT ROUND(AVG(rating)::numeric, 1) FROM reviews WHERE hotel_id = $1)
       WHERE id = $1`,
      [booking.hotel_id]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Greška pri kreiranju recenzije." });
  }
});

router.get("/summary", async (req, res) => {
  try {
    const { hotelId } = req.query;
    if (!hotelId) return res.status(400).json({ error: "hotelId je obavezan." });

    const { rows } = await pool.query(
      `SELECT rating, COUNT(*)::int AS count FROM reviews WHERE hotel_id = $1 GROUP BY rating`,
      [hotelId]
    );
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let total = 0;
    let sum = 0;
    for (const row of rows) {
      counts[row.rating] = row.count;
      total += row.count;
      sum += row.rating * row.count;
    }
    res.json({
      counts,
      total,
      average: total > 0 ? Math.round((sum / total) * 10) / 10 : 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Greška pri dohvatanju statistike recenzija." });
  }
});

router.patch("/:id/reply", async (req, res) => {
  try {
    const { ownerId, reply } = req.body;
    if (!ownerId || !reply || !reply.trim()) {
      return res.status(400).json({ error: "ownerId i tekst odgovora su obavezni." });
    }

    const { rows: reviewRows } = await pool.query(
      `SELECT r.id, h.owner_id AS hotel_owner_id
       FROM reviews r JOIN hotels h ON h.id = r.hotel_id
       WHERE r.id = $1`,
      [req.params.id]
    );
    if (reviewRows.length === 0) return res.status(404).json({ error: "Recenzija nije pronađena." });
    if (reviewRows[0].hotel_owner_id !== ownerId) {
      return res.status(403).json({ error: "Nemaš dozvolu da odgovoriš na ovu recenziju." });
    }

    const { rows } = await pool.query(
      `UPDATE reviews SET owner_reply = $1, owner_reply_at = now() WHERE id = $2 RETURNING *`,
      [reply.trim(), req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Greška pri slanju odgovora." });
  }
});

module.exports = router;
