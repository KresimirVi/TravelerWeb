const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = crypto.randomBytes(16).toString("hex");
    cb(null, `${name}${ext}`);
  },
});

// max 8mb po slici, do 10 slika odjednom
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024, files: 10 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      return cb(new Error("Dozvoljeni su samo JPG, PNG, WEBP i GIF fajlovi."));
    }
    cb(null, true);
  },
});

router.post("/", (req, res) => {
  upload.array("images", 10)(req, res, (err) => {
    if (err) {
      const message =
        err.code === "LIMIT_FILE_SIZE"
          ? "Slika je prevelika — maksimalna veličina je 8MB."
          : err.message || "Greška pri uploadu slike.";
      return res.status(400).json({ error: message });
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "Nijedna slika nije primljena." });
    }
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const urls = req.files.map((f) => `${baseUrl}/uploads/${f.filename}`);
    res.status(201).json({ urls });
  });
});

module.exports = router;
