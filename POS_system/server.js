const express = require("express")
const cors    = require("cors")
const path    = require("path")
const authRoutes = require("./auth")
const { router: ordersRouter, orders } = require("./routes/orders")

const app  = express()
const PORT = 8080

// ── Middleware ──────────────────────────────
app.use(cors())
app.use(express.json())

// ── Serve HTML files from the same folder ──
app.use(express.static(path.join(__dirname)))

// ── Auth Routes ─────────────────────────────
app.use("/api/auth", authRoutes)

// ── Orders API (includes SMS on place order) ──
app.use("/api/orders", ordersRouter)

// ── Home Route ──────────────────────────────
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"))
})

// ── Start Server ────────────────────────────
app.listen(PORT, () => {
  console.log("─────────────────────────────────────")
  console.log(`🍔 Wakedonalds server is running!`)
  console.log(`👉 Open: http://localhost:${PORT}`)
  console.log("─────────────────────────────────────")
})