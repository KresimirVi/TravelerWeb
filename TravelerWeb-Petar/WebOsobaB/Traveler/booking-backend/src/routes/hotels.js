const express = require("express");
const { pool } = require("../db/pool");
const { coordsForLocation } = require("../db/cityCoords");

const router = express.Router();

function slugify(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

router.get("/", async (req, res) => {
  try {
    // svi filteri su opcioni, dodaju se u WHERE samo ako su poslani
    const { type, search, country, location, minPrice, maxPrice, minRating, amenities, checkIn, checkOut } = req.query;
    const conditions = [];
    const params = [];

    if (type) {
      params.push(type);
      conditions.push(`h.type = $${params.length}`);
    }
    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      conditions.push(`(LOWER(h.name) LIKE $${params.length} OR LOWER(h.location) LIKE $${params.length})`);
    }
    if (country) {
      params.push(country);
      conditions.push(`h.country = $${params.length}`);
    }
    if (location) {
      params.push(`%${location.toLowerCase()}%`);
      conditions.push(`LOWER(h.location) LIKE $${params.length}`);
    }
    if (minPrice) {
      params.push(Number(minPrice));
      conditions.push(`h.price_per_night >= $${params.length}`);
    }
    if (maxPrice) {
      params.push(Number(maxPrice));
      conditions.push(`h.price_per_night <= $${params.length}`);
    }
    if (minRating) {
      params.push(Number(minRating));
      conditions.push(`h.rating >= $${params.length}`);
    }
    if (amenities) {
      const list = String(amenities).split(",").map((a) => a.trim()).filter(Boolean);
      if (list.length > 0) {
        params.push(list);
        conditions.push(
          `h.id IN (SELECT hotel_id FROM hotel_amenities WHERE amenity_name = ANY($${params.length}) GROUP BY hotel_id HAVING COUNT(DISTINCT amenity_name) = ${list.length})`
        );
      }
    }
    if (checkIn && checkOut) {
      params.push(checkIn, checkOut);
      conditions.push(
        `h.id NOT IN (
           SELECT hotel_id FROM bookings
           WHERE status = 'confirmed' AND check_in < $${params.length} AND check_out > $${params.length - 1}
         )`
      );
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const { rows } = await pool.query(
      `SELECT h.id, h.slug, h.type, h.name, h.location, h.country, h.distance_km, h.rating,
              h.reviews_count, h.price_per_night, h.badge, h.latitude, h.longitude,
              (SELECT image_url FROM hotel_images WHERE hotel_id = h.id ORDER BY position ASC LIMIT 1) AS cover
       FROM hotels h
       ${where}
       ORDER BY h.rating DESC`,
      params
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Greška pri dohvatanju smještaja." });
  }
});

router.get("/meta/countries", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT DISTINCT country FROM hotels ORDER BY country ASC`
    );
    res.json(rows.map((r) => r.country));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Greška pri dohvatanju zemalja." });
  }
});

router.get("/mine/list", async (req, res) => {
  try {
    const { ownerId } = req.query;
    if (!ownerId) return res.status(400).json({ error: "ownerId je obavezan." });

    const { rows } = await pool.query(
      `SELECT h.*,
              (SELECT image_url FROM hotel_images WHERE hotel_id = h.id ORDER BY position ASC LIMIT 1) AS cover
       FROM hotels h
       WHERE h.owner_id = $1
       ORDER BY h.created_at DESC`,
      [ownerId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Greška pri dohvatanju tvojih objekata." });
  }
});

router.get("/mine/:id", async (req, res) => {
  try {
    const { ownerId } = req.query;
    const { rows: hotelRows } = await pool.query(
      `SELECT * FROM hotels WHERE id = $1 AND owner_id = $2`,
      [req.params.id, ownerId]
    );
    if (hotelRows.length === 0) return res.status(404).json({ error: "Objekat nije pronađen." });

    const { rows: images } = await pool.query(
      `SELECT image_url FROM hotel_images WHERE hotel_id = $1 ORDER BY position ASC`,
      [req.params.id]
    );
    const { rows: amenities } = await pool.query(
      `SELECT amenity_name FROM hotel_amenities WHERE hotel_id = $1`,
      [req.params.id]
    );

    res.json({
      ...hotelRows[0],
      images: images.map((i) => i.image_url),
      amenities: amenities.map((a) => a.amenity_name),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Greška pri dohvatanju objekta." });
  }
});

router.get("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    const { rows: hotelRows } = await pool.query(`SELECT * FROM hotels WHERE slug = $1`, [slug]);
    if (hotelRows.length === 0) {
      return res.status(404).json({ error: "Smještaj nije pronađen." });
    }
    const hotel = hotelRows[0];

    const { rows: images } = await pool.query(
      `SELECT image_url, room_type FROM hotel_images WHERE hotel_id = $1 ORDER BY position ASC`,
      [hotel.id]
    );
    const { rows: amenities } = await pool.query(
      `SELECT amenity_name FROM hotel_amenities WHERE hotel_id = $1`,
      [hotel.id]
    );

    res.json({
      ...hotel,
      gallery: images.map((i) => i.image_url),
      cover: images[0]?.image_url || null,
      amenities: amenities.map((a) => a.amenity_name),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Greška pri dohvatanju smještaja." });
  }
});

router.post("/", async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      ownerId,
      type,
      name,
      location,
      country,
      pricePerNight,
      description,
      amenities,
      images,
      contactEmail,
      contactPhone,
      ownerName,
      street,
      latitude,
      longitude,
    } = req.body;

    if (!ownerId || !type || !name || !location || !country || !pricePerNight || !description) {
      return res.status(400).json({ error: "Sva polja su obavezna." });
    }
    if (!contactEmail || !contactPhone) {
      return res.status(400).json({ error: "Kontakt email i broj telefona su obavezni." });
    }
    if (!street) {
      return res.status(400).json({ error: "Ulica i broj su obavezni." });
    }
    if (latitude == null || longitude == null) {
      return res.status(400).json({ error: "Označi tačnu lokaciju objekta na karti." });
    }
    if (!Array.isArray(amenities) || amenities.length === 0) {
      return res.status(400).json({ error: "Odaberi bar jedan sadržaj." });
    }
    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: "Dodaj bar jednu sliku." });
    }

    await client.query("BEGIN");

    let slug = slugify(name);
    const { rows: dupe } = await client.query("SELECT id FROM hotels WHERE slug = $1", [slug]);
    if (dupe.length > 0) slug = `${slug}-${Date.now().toString(36)}`;

    const { rows } = await client.query(
      `INSERT INTO hotels (slug, type, name, location, country, distance_km, rating, reviews_count, price_per_night, badge, description, contact_email, contact_phone, owner_name, owner_id, latitude, longitude, street)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING *`,
      [slug, type, name, location, country, 0, 0, 0, pricePerNight, "Novo", description, contactEmail, contactPhone, ownerName || null, ownerId, latitude, longitude, street]
    );
    const hotel = rows[0];

    for (let i = 0; i < images.length; i++) {
      await client.query(
        `INSERT INTO hotel_images (hotel_id, image_url, position, room_type) VALUES ($1,$2,$3,$4)`,
        [hotel.id, images[i], i, i === 0 ? "exterior" : "other"]
      );
    }

    for (const amenity of amenities) {
      await client.query(`INSERT INTO hotel_amenities (hotel_id, amenity_name) VALUES ($1,$2)`, [
        hotel.id,
        amenity,
      ]);
    }

    await client.query("COMMIT");
    res.status(201).json({ ...hotel, slug });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Greška pri dodavanju smještaja." });
  } finally {
    client.release();
  }
});

router.patch("/:id", async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      ownerId, type, name, location, country, pricePerNight,
      description, amenities, images, contactEmail, contactPhone,
      street, latitude, longitude,
    } = req.body;

    const { rows: existing } = await client.query(`SELECT owner_id FROM hotels WHERE id = $1`, [
      req.params.id,
    ]);
    if (existing.length === 0) return res.status(404).json({ error: "Objekat nije pronađen." });
    if (existing[0].owner_id !== ownerId) {
      return res.status(403).json({ error: "Nemaš dozvolu da uređuješ ovaj objekat." });
    }

    await client.query("BEGIN");

    let lat = latitude;
    let lng = longitude;
    if (lat == null || lng == null) {
      const guessed = coordsForLocation(location, Date.now() % 1000);
      lat = guessed.lat;
      lng = guessed.lng;
    }

    await client.query(
      `UPDATE hotels SET type=$1, name=$2, location=$3, country=$4, price_per_night=$5,
         description=$6, contact_email=$7, contact_phone=$8, latitude=$9, longitude=$10,
         street=$11, updated_at=now()
       WHERE id=$12`,
      [type, name, location, country, pricePerNight, description, contactEmail, contactPhone, lat, lng, street || null, req.params.id]
    );

    if (Array.isArray(images)) {
      await client.query(`DELETE FROM hotel_images WHERE hotel_id = $1`, [req.params.id]);
      for (let i = 0; i < images.length; i++) {
        await client.query(
          `INSERT INTO hotel_images (hotel_id, image_url, position, room_type) VALUES ($1,$2,$3,$4)`,
          [req.params.id, images[i], i, i === 0 ? "exterior" : "other"]
        );
      }
    }

    if (Array.isArray(amenities)) {
      await client.query(`DELETE FROM hotel_amenities WHERE hotel_id = $1`, [req.params.id]);
      for (const amenity of amenities) {
        await client.query(`INSERT INTO hotel_amenities (hotel_id, amenity_name) VALUES ($1,$2)`, [
          req.params.id,
          amenity,
        ]);
      }
    }

    await client.query("COMMIT");
    res.json({ success: true });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error(err);
    res.status(500).json({ error: "Greška pri uređivanju objekta." });
  } finally {
    client.release();
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { ownerId } = req.query;
    const { rows: existing } = await pool.query(`SELECT owner_id FROM hotels WHERE id = $1`, [
      req.params.id,
    ]);
    if (existing.length === 0) return res.status(404).json({ error: "Objekat nije pronađen." });
    if (existing[0].owner_id !== ownerId) {
      return res.status(403).json({ error: "Nemaš dozvolu da obrišeš ovaj objekat." });
    }
    await pool.query(`DELETE FROM hotels WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Greška pri brisanju objekta." });
  }
});

module.exports = router;
