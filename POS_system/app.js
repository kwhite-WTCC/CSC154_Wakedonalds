const express = require("express")
const cors = require("cors")
const path = require("path")

const authRoutes = require("./auth")
const menuRoutes = require("./routes/menu")
const ordersRoutes = require("./routes/orders")

const app = express()

app.use(cors())
app.use(express.json())

// Static assets (HTML, JS, CSS, images) from POS_system directory
app.use(express.static(path.join(__dirname)))

app.use("/api/auth", authRoutes)
app.use("/api/menu", menuRoutes)
app.use("/api/orders", ordersRoutes)

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"))
})

module.exports = app

