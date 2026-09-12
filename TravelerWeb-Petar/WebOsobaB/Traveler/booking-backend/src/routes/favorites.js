const express = require("express");
const { pool } = require("../db/pool");

const router = express.Router();

async function getOrCreateDefaultList(userId) {
  const { rows } = await pool.query(
    `SELECT id FROM favorite_lists WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1`,
    [userId]
  );
  if (rows.length > 0) return rows[0].id;
  const { rows: created } = await pool.query(
    `INSERT INTO favorite_lists (user_id, name) VALUES ($1, 'Favoriti') RETURNING id`,
    [userId]
  );
  return created[0].id;
}

router.get("/lists", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "userId je obavezan." });

    const { rows } = await pool.query(
      `SELECT l.id, l.name, l.created_at, COUNT(f.id)::int AS count
       FROM favorite_lists l
       LEFT JOIN favorites f ON f.list_id = l.id
       WHERE l.user_id = $1
       GROUP BY l.id
       ORDER BY l.created_at ASC`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Greška pri dohvatanju listi." });
  }
});

router.post("/lists", async (req, res) => {
  try {
    const { userId, name } = req.body;
    if (!userId || !name || !name.trim()) {
      return res.status(400).json({ error: "userId i naziv liste su obavezni." });
    }
    const { rows } = await pool.query(
      `INSERT INTO favorite_lists (user_id, name) VALUES ($1, $2) RETURNING id, name, created_at, 0 AS count`,
      [userId, name.trim()]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Greška pri kreiranju liste." });
  }
});

router.patch("/lists/:id", async (req, res) => {
  try {
    const { userId, name } = req.body;
    if (!userId || !name || !name.trim()) {
      return res.status(400).json({ error: "userId i novi naziv su obavezni." });
    }
    const { rows } = await pool.query(
      `UPDATE favorite_lists SET name = $1 WHERE id = $2 AND user_id = $3 RETURNING id, name`,
      [name.trim(), req.params.id, userId]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Lista nije pronađena." });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Greška pri preimenovanju liste." });
  }
});

router.delete("/lists/:id", async (req, res) => {
  try {
    const { userId } = req.query;
    const { rows } = await pool.query(
      `DELETE FROM favorite_lists WHERE id = $1 AND user_id = $2 RETURNING id`,
      [req.params.id, userId]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Lista nije pronađena." });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Greška pri brisanju liste." });
  }
});

router.get("/", async (req, res) => {
  try {
    const { userId, listId } = req.query;
    if (!userId) return res.status(400).json({ error: "userId je obavezan." });

    const targetListId = listId || (await getOrCreateDefaultList(userId));

    const { rows } = await pool.query(
      `SELECT h.id, h.slug, h.type, h.name, h.location, h.country, h.distance_km, h.rating,
              h.reviews_count, h.price_per_night, h.badge,
              (SELECT image_url FROM hotel_images WHERE hotel_id = h.id ORDER BY position ASC LIMIT 1) AS cover
       FROM favorites f JOIN hotels h ON h.id = f.hotel_id
       WHERE f.list_id = $1
       ORDER BY f.created_at DESC`,
      [targetListId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Greška pri dohvatanju favorita." });
  }
});

router.get("/ids", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.json([]);
    const { rows } = await pool.query(`SELECT DISTINCT hotel_id FROM favorites WHERE user_id = $1`, [
      userId,
    ]);
    res.json(rows.map((r) => r.hotel_id));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Greška pri dohvatanju favorita." });
  }
});

router.get("/for-hotel", async (req, res) => {
  try {
    const { userId, hotelId } = req.query;
    if (!userId || !hotelId) return res.json([]);
    const { rows } = await pool.query(
      `SELECT list_id FROM favorites WHERE user_id = $1 AND hotel_id = $2`,
      [userId, hotelId]
    );
    res.json(rows.map((r) => r.list_id));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Greška." });
  }
});

// dodaj/skini iz favorita - ako vec postoji obrise ga, ako ne postoji doda
router.post("/toggle", async (req, res) => {
  try {
    const { userId, hotelId } = req.body;
    if (!userId || !hotelId) {
      return res.status(400).json({ error: "userId i hotelId su obavezni." });
    }

    const { rows: existing } = await pool.query(
      `SELECT id FROM favorites WHERE user_id = $1 AND hotel_id = $2`,
      [userId, hotelId]
    );

    if (existing.length > 0) {
      await pool.query(`DELETE FROM favorites WHERE user_id = $1 AND hotel_id = $2`, [userId, hotelId]);
      return res.json({ favorited: false });
    }

    const listId = await getOrCreateDefaultList(userId);
    await pool.query(`INSERT INTO favorites (user_id, hotel_id, list_id) VALUES ($1, $2, $3)`, [
      userId,
      hotelId,
      listId,
    ]);
    res.json({ favorited: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Greška pri ažuriranju favorita." });
  }
});

router.post("/add-to-list", async (req, res) => {
  try {
    const { userId, hotelId, listId } = req.body;
    if (!userId || !hotelId || !listId) {
      return res.status(400).json({ error: "userId, hotelId i listId su obavezni." });
    }
    await pool.query(
      `INSERT INTO favorites (user_id, hotel_id, list_id) VALUES ($1, $2, $3)
       ON CONFLICT (list_id, hotel_id) DO NOTHING`,
      [userId, hotelId, listId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Greška pri dodavanju u listu." });
  }
});

router.delete("/", async (req, res) => {
  try {
    const { listId, hotelId } = req.query;
    if (!listId || !hotelId) {
      return res.status(400).json({ error: "listId i hotelId su obavezni." });
    }
    await pool.query(`DELETE FROM favorites WHERE list_id = $1 AND hotel_id = $2`, [listId, hotelId]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Greška pri uklanjanju iz liste." });
  }
});

module.exports = router;
