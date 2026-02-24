require("dotenv").config()
const express = require("express")
const cors = require("cors")
const path = require("path")
const authRoutes = require("./auth")
const menuRoutes = require("./routes/menu")
const ordersRoutes = require("./routes/orders")
const db = require("./db")

const app = express()
const PORT = 8080

// ── Middleware ──────────────────────────────
app.use(cors())
app.use(express.json())

// ── Serve HTML files from the same folder ──
app.use(express.static(path.join(__dirname)))

// ── API Routes ──────────────────────────────
app.use("/api/auth", authRoutes)
app.use("/api/menu", menuRoutes)
app.use("/api/orders", ordersRoutes)

// ── Home Route ──────────────────────────────
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"))
})

// ── Start Server ────────────────────────────
app.listen(PORT, async () => {
  await db.getPool()
  console.log("─────────────────────────────────────")
  console.log(`🍔 Wakedonalds server is running!`)
  console.log(`👉 Open: http://localhost:${PORT}`)
  console.log("─────────────────────────────────────")
})