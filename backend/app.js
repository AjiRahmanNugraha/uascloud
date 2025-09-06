// backend/app.js
require("dotenv").config();
const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const cors = require("cors");
const session = require("express-session");
const bcrypt = require("bcrypt");
const mysql = require("mysql2/promise");

const app = express();
const PORT = process.env.PORT || 5000;

// MySQL pool from ENV (RDS)
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "mental_health_db",
  waitForConnections: true,
  connectionLimit: 10
});

// CORS - allow only frontend origin
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN,
  credentials: true
}));

app.use(bodyParser.json());

// Session: use secure cookie settings for production (ensure behind HTTPS)
app.use(session({
  name: "mh.sid",
  secret: process.env.SESSION_SECRET || "pleasechangeit",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.COOKIE_SECURE === "true", // false untuk HTTP
    sameSite: process.env.COOKIE_SAMESITE || "Lax",
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 // 1 hari
  }
}));

// Init DB table if not exists
async function initDatabase() {
  const conn = await pool.getConnection();
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=INNODB;
    `);
    console.log("DB initialized");
  } catch (err) {
    console.error("DB init error:", err);
  } finally {
    conn.release();
  }
}
initDatabase().catch(console.error);

// Simple auth endpoints
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "username and password required" });
  try {
    const hash = await bcrypt.hash(password, 10);
    const [r] = await pool.query("INSERT INTO users (username, password_hash) VALUES (?,?)", [username, hash]);
    req.session.userId = r.insertId;
    res.json({ ok: true, userId: r.insertId });
  } catch (err) {
    console.error(err);
    if (err.code === "ER_DUP_ENTRY") return res.status(400).json({ error: "username taken" });
    res.status(500).json({ error: "db error" });
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "username and password required" });
  try {
    const [rows] = await pool.query("SELECT id, password_hash FROM users WHERE username = ?", [username]);
    if (!rows.length) return res.status(401).json({ error: "invalid credentials" });
    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "invalid credentials" });
    req.session.userId = user.id;
    res.json({ ok: true, userId: user.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "db error" });
  }
});

app.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("mh.sid");
    res.json({ ok: true });
  });
});

app.get("/auth-status", (req, res) => {
  if (req.session && req.session.userId) return res.json({ authenticated: true, userId: req.session.userId });
  return res.json({ authenticated: false });
});

// Predict: proxy to local Python model server
app.post("/predict", async (req, res) => {
  const text = req.body.text || "";
  if (!text) return res.status(400).json({ error: "text is required" });

  try {
    // python model server runs on port 5001 inside container
    const resp = await axios.post(process.env.PYTHON_SERVER_URL || "http://127.0.0.1:5001/predict", { text }, { timeout: 30000 });
    // resp.data expected: { prediction: "...", confidence: 0.95 }
    // Add timestamp & optionally userId to logs
    const log = {
      timestamp: new Date().toISOString(),
      userId: req.session.userId || null,
      text: text.length > 1000 ? text.slice(0,1000)+"..." : text,
      prediction: resp.data
    };
    console.log("PREDICTION:", JSON.stringify(log));
    res.json(resp.data);
  } catch (err) {
    console.error("predict error:", err && err.message || err);
    res.status(500).json({ error: "prediction failed" });
  }
});

app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});
