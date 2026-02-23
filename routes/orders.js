const express = require("express")
const router = express.Router()
const db = require("../db")

// GET my orders (filter by customer name for order history page)
router.get("/my", async (req, res) => {
  const customer = (req.query.customer || "").trim()
  if (!customer) return res.json([])
  try {
    const rows = await db.query(
      "SELECT id, order_num AS num, customer, phone, notes, items, subtotal, tax, total, status, created_at AS time FROM orders WHERE customer = ? ORDER BY id DESC",
      [customer]
    )
    if (!rows || !rows.length) return res.json([])
    const orders = rows.map((o) => mapOrderRow(o))
    return res.json(orders)
  } catch (err) {
    console.error("GET orders/my error:", err)
    return res.status(500).json({ message: "Failed to load orders" })
  }
})

function mapOrderRow(o) {
  let items = []
  if (o.items) {
    try {
      items = typeof o.items === "string" ? JSON.parse(o.items) : o.items
    } catch (_) {}
  }
  return {
    id: o.id ? Number(o.id) : null,
    num: o.num,
    customer: o.customer,
    phone: o.phone || "—",
    notes: o.notes || "",
    items: Array.isArray(items)
      ? items.map((i) => ({ name: i.name, price: Number(i.price), qty: i.qty || 1 }))
      : [],
    subtotal: Number(o.subtotal),
    tax: Number(o.tax),
    total: Number(o.total),
    status: o.status,
    time: o.time ? String(o.time).replace("T", " ").slice(0, 19) : "",
  }
}

// GET all orders (customer + items in one place)
router.get("/", async (req, res) => {
  try {
    const rows = await db.query(
      "SELECT id, order_num AS num, customer, phone, notes, items, subtotal, tax, total, status, created_at AS time FROM orders ORDER BY id DESC"
    )
    if (!rows || !rows.length) return res.json([])
    const orders = rows.map(mapOrderRow)
    return res.json(orders)
  } catch (err) {
    console.error("GET orders error:", err)
    return res.status(500).json({ message: "Failed to load orders" })
  }
})

// POST create order (items stored in orders.items as JSON)
router.post("/", async (req, res) => {
  try {
    const { customer, phone, notes, items, subtotal, tax, total } = req.body
    if (!items || !items.length || total === undefined) {
      return res.status(400).json({ message: "Items and total required" })
    }
    const orderNum = String(Date.now()).slice(-6)
    const itemsJson = JSON.stringify(
      items.map((it) => ({
        name: it.name,
        price: Number(it.price),
        qty: it.qty || 1,
      }))
    )
    const rows = await db.query(
      "INSERT INTO orders (order_num, customer, phone, notes, items, subtotal, tax, total, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'In Progress') RETURNING id",
      [
        orderNum,
        customer || "Guest",
        phone || null,
        notes || null,
        itemsJson,
        Number(subtotal) || 0,
        Number(tax) || 0,
        Number(total) || 0,
      ]
    )
    const orderId = rows && rows[0] ? rows[0].id : null
    return res.status(201).json({ orderNum, id: orderId, message: "Order placed" })
  } catch (err) {
    console.error("POST order error:", err)
    return res.status(500).json({ message: "Failed to place order" })
  }
})

// Allowed statuses for PATCH
const ALLOWED_STATUSES = ["In Progress", "Ready for Pickup", "Picked Up"]

function normalizeStatus(val) {
  if (!val || typeof val !== "string") return null
  const s = val.trim()
  if (s === "In Progress" || s === "in progress") return "In Progress"
  if (s === "Ready for Pickup" || s === "ready for pickup") return "Ready for Pickup"
  if (s === "Picked Up" || s === "picked up") return "Picked Up"
  return null
}

// PATCH update order status
router.patch("/:id/status", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    const rawStatus = req.body && (req.body.status || req.body.statusText)
    const status = normalizeStatus(rawStatus)
    if (!id || isNaN(id)) {
      return res.status(400).json({ message: "Invalid order id: " + req.params.id })
    }
    if (!status) {
      return res.status(400).json({ message: "Status must be 'In Progress', 'Ready for Pickup', or 'Picked Up'. Received: " + JSON.stringify(rawStatus) })
    }
    const result = await db.query("UPDATE orders SET status = ? WHERE id = ?", [status, id])
    if (!result) {
      return res.status(500).json({ message: "Database unavailable" })
    }
    const affectedRows = result.affectedRows || 0
    if (affectedRows === 0) {
      return res.status(404).json({ message: "Order not found with id: " + id })
    }
    return res.json({ message: "Status updated", status })
  } catch (err) {
    console.error("PATCH order status error:", err)
    return res.status(500).json({ message: "Failed to update status: " + err.message })
  }
})

module.exports = router
