const express = require("express");
const bcrypt = require("bcryptjs");
const { pool } = require("../db/pool");

const router = express.Router();

function publicUser(row) {
  return { id: row.id, email: row.email, fullName: row.full_name };
}

router.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: "Sva polja su obavezna." });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Lozinka mora imati najmanje 6 karaktera." });
    }

    const { rows: existing } = await pool.query("SELECT id FROM users WHERE email = $1", [
      email.toLowerCase(),
    ]);
    if (existing.length > 0) {
      return res.status(409).json({ error: "Korisnik sa ovim emailom već postoji." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const fullName = `${firstName} ${lastName}`.trim();

    const { rows } = await pool.query(
      `INSERT INTO users (email, full_name, password_hash) VALUES ($1, $2, $3) RETURNING *`,
      [email.toLowerCase(), fullName, passwordHash]
    );

    res.status(201).json({ user: publicUser(rows[0]) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Greška pri registraciji." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email i lozinka su obavezni." });
    }

    const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [
      email.toLowerCase(),
    ]);
    if (rows.length === 0) {
      return res.status(401).json({ error: "Pogrešan email ili lozinka." });
    }

    const valid = await bcrypt.compare(password, rows[0].password_hash || "");
    if (!valid) {
      return res.status(401).json({ error: "Pogrešan email ili lozinka." });
    }

    res.json({ user: publicUser(rows[0]) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Greška pri prijavi." });
  }
});

// poziva se posle svakog firebase logina da imamo i lokalni users red za FK
router.post("/sync", async (req, res) => {
  try {
    const { firebaseUid, email, fullName } = req.body;
    if (!firebaseUid || !email) {
      return res.status(400).json({ error: "firebaseUid i email su obavezni." });
    }

    const looksLikeRealName = fullName && fullName.trim() && fullName.trim().toLowerCase() !== email.toLowerCase();

    const { rows: existing } = await pool.query("SELECT * FROM users WHERE firebase_uid = $1", [
      firebaseUid,
    ]);
    if (existing.length > 0) {

      const currentLooksWrong = existing[0].full_name.toLowerCase() === existing[0].email.toLowerCase();
      if (currentLooksWrong && looksLikeRealName) {
        const { rows: fixed } = await pool.query(
          `UPDATE users SET full_name = $1 WHERE id = $2 RETURNING *`,
          [fullName.trim(), existing[0].id]
        );
        return res.json({ user: publicUser(fixed[0]) });
      }
      return res.json({ user: publicUser(existing[0]) });
    }

    const { rows } = await pool.query(
      `INSERT INTO users (email, full_name, firebase_uid)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET
         firebase_uid = EXCLUDED.firebase_uid,
         full_name = CASE
           WHEN EXCLUDED.full_name IS NOT NULL AND LOWER(EXCLUDED.full_name) != LOWER(EXCLUDED.email)
           THEN EXCLUDED.full_name
           ELSE users.full_name
         END
       RETURNING *`,
      [email.toLowerCase(), fullName || email, firebaseUid]
    );

    res.status(201).json({ user: publicUser(rows[0]) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Greška pri sinhronizaciji korisnika." });
  }
});

router.patch("/profile", async (req, res) => {
  try {
    const { userId, fullName } = req.body;
    if (!userId || !fullName || !fullName.trim()) {
      return res.status(400).json({ error: "userId i fullName su obavezni." });
    }
    const { rows } = await pool.query(
      `UPDATE users SET full_name = $1 WHERE id = $2 RETURNING *`,
      [fullName.trim(), userId]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Korisnik nije pronađen." });
    res.json({ user: publicUser(rows[0]) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Greška pri ažuriranju profila." });
  }
});

module.exports = router;
