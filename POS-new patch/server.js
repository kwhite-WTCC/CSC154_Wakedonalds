const app = require("./app")
const db = require("./db")
const PORT = 8080

// ── Start Server ────────────────────────────
app.listen(PORT, async () => {
  await db.getPool()
  console.log("─────────────────────────────────────")
  console.log(`🍔 Wakedonalds server is running!`)
  console.log(`👉 Open: http://localhost:${PORT}`)
  console.log("─────────────────────────────────────")
})