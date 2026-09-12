require("dotenv").config();
const { Pool } = require("pg");

// jedan pool za citavu app, ne pravimo novu konekciju za svaki upit
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on("error", (err) => {
  console.error("Neočekivana greška na neaktivnom klijentu baze", err);
  process.exit(1);
});

module.exports = { pool };
