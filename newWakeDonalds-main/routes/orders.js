const express = require("express")
const https = require("https")
const router = express.Router()
const db = require("../db")
const { sendOrderEmail, sendStatusUpdateEmail } = require("../email")

const DISCORD_WEBHOOK_URL =
  process.env.DISCORD_WEBHOOK_URL ||
  "https://discord.com/api/webhooks/1475600133587472395/DqGm4IeXUntWaDSZAchRZS9kNbRL23F_DfUxK_VUKkoRknbeHMqeYFUnUYvOD7s80n7T"

// GET my orders (filter by customer name for order history page)
router.get("/my", async (req, res) => {
  const customer = (req.query.customer || "").trim()
  if (!customer) return res.json([])
  try {
    const rows = await db.query(
      "SELECT id, order_num AS num, customer, phone, email, notes, items, subtotal, tax, total, status, created_at AS time FROM orders WHERE customer = ? ORDER BY id DESC",
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
    email: o.email || "",
    notes: o.notes || "",
    items: Array.isArray(items)
      ? items.map((i) => ({ name: i.name, price: Number(i.price), qty: i.qty || 1 }))
      : [],
    subtotal: Number(o.subtotal),
    tax: Number(o.tax),
    total: Number(o.total),
    status: o.status,
    time: o.time ? (o.time instanceof Date ? o.time.toISOString() : (typeof o.time === "string" && /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(o.time) && o.time.indexOf("Z") < 0 && o.time.indexOf("+") < 0 ? new Date(o.time.replace(" ", "T") + "Z").toISOString() : String(o.time))) : "",
  }
}

// GET all orders (customer + items in one place)
router.get("/", async (req, res) => {
  try {
    const rows = await db.query(
      "SELECT id, order_num AS num, customer, phone, email, notes, items, subtotal, tax, total, status, created_at AS time FROM orders ORDER BY id DESC"
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
    const { customer, phone, email, notes, items, subtotal, tax, total } = req.body
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
  await db.query(
    "INSERT INTO orders (order_num, customer, phone, email, notes, items, subtotal, tax, total, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'In Progress')",
    [
      orderNum,
      customer || "Guest",
      phone || null,
      email || null,
      notes || null,
      itemsJson,
      Number(subtotal) || 0,
      Number(tax) || 0,
      Number(total) || 0,
    ]
  )
  const orderRows = await db.query(
    "SELECT id FROM orders WHERE order_num = ? ORDER BY id DESC LIMIT 1",
    [orderNum]
  )
  const orderId = orderRows && orderRows[0] ? orderRows[0].id : null

    const orderForNotify = {
      id: orderId,
      orderNum,
      customer: customer || "Guest",
      phone: phone || "—",
      email: email || "",
      notes: notes || "",
      items: items.map((it) => ({
        name: it.name,
        price: Number(it.price),
        qty: it.qty || 1,
      })),
      subtotal: Number(subtotal) || 0,
      tax: Number(tax) || 0,
      total: Number(total) || 0,
      status: "In Progress",
      createdAt: new Date(),
    }

    sendDiscordOrderWebhook(orderForNotify)
    sendOrderEmail(orderForNotify)

    return res.status(201).json({ orderNum, id: orderId, message: "Order placed" })
  } catch (err) {
    console.error("POST order error:", err)
    return res.status(500).json({ message: "Failed to place order" })
  }
})

function sendDiscordOrderWebhook(order) {
  if (!DISCORD_WEBHOOK_URL) return

  try {
    const url = new URL(DISCORD_WEBHOOK_URL)

    const itemsText =
      order.items && order.items.length
        ? order.items
            .map(
              (it) =>
                `• ${it.qty || 1}x ${it.name} — $${Number(it.price || 0).toFixed(2)}`
            )
            .join("\n")
        : "No items"

    const subtotal = Number(order.subtotal || 0)
    const tax = Number(order.tax || 0)
    const total = Number(order.total || 0)

    const embed = {
      title: `New Order #${order.orderNum}`,
      color: 0xf59e0b,
      fields: [
        { name: "Customer", value: order.customer || "Guest", inline: true },
        { name: "Phone", value: order.phone || "—", inline: true },
        { name: "Status", value: order.status || "In Progress", inline: true },
        { name: "Items", value: itemsText, inline: false },
        {
          name: "Subtotal / Tax / Total",
          value: `$${subtotal.toFixed(2)}  |  $${tax.toFixed(2)}  |  $${total.toFixed(
            2
          )}`,
          inline: false,
        },
        {
          name: "Notes",
          value: order.notes && String(order.notes).trim().length
            ? String(order.notes)
            : "None",
          inline: false,
        },
      ],
      timestamp: (order.createdAt || new Date()).toISOString(),
    }

    const body = JSON.stringify({
      username: "Order Watching",
      embeds: [embed],
    })

    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
    }

    const req = https.request(options, (res) => {
      // Drain response to free up memory; we don't need the body
      res.on("data", () => {})
    })

    req.on("error", (err) => {
      console.error("Discord webhook error:", err.message)
    })

    req.write(body)
    req.end()
  } catch (err) {
    console.error("Discord webhook setup error:", err.message)
  }
}

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
    let readySent = 0
    let pickedUpSent = 0
    try {
      const preRows = await db.query(
        "SELECT ready_email_sent, picked_up_email_sent FROM orders WHERE id = ?",
        [id]
      )
      if (preRows && preRows[0]) {
        readySent = preRows[0].ready_email_sent ? 1 : 0
        pickedUpSent = preRows[0].picked_up_email_sent ? 1 : 0
      }
    } catch (_) {
      // Columns may not exist yet; allow send for backwards compat
    }
    const rows = await db.query(
      "UPDATE orders SET status = ? WHERE id = ? RETURNING id",
      [status, id]
    )
    if (!rows) {
      return res.status(500).json({ message: "Database unavailable" })
    }
    if (!rows.length) {
      return res.status(404).json({ message: "Order not found with id: " + id })
    }
    const shouldSendReady = status === "Ready for Pickup" && !readySent
    const shouldSendPickedUp = status === "Picked Up" && !pickedUpSent
    if (shouldSendReady || shouldSendPickedUp) {
      try {
        const rows = await db.query(
          "SELECT id, order_num AS num, customer, phone, email, notes, items, subtotal, tax, total, status, created_at AS time FROM orders WHERE id = ?",
          [id]
        )
        const row = rows && rows[0]
        if (row) {
          const order = mapOrderRow(row)
          sendStatusUpdateEmail({ ...order, orderNum: order.num }, status)
          try {
            if (shouldSendReady) {
              await db.query("UPDATE orders SET ready_email_sent = 1 WHERE id = ?", [id])
            } else if (shouldSendPickedUp) {
              await db.query("UPDATE orders SET picked_up_email_sent = 1 WHERE id = ?", [id])
            }
          } catch (_) {
            // Columns may not exist (old DB); run: ALTER TABLE orders ADD COLUMN ready_email_sent TINYINT(1) NOT NULL DEFAULT 0, ADD COLUMN picked_up_email_sent TINYINT(1) NOT NULL DEFAULT 0;
          }
        }
      } catch (e) {
        console.error("Status email error:", e.message)
      }
    }
    return res.json({ message: "Status updated", status })
  } catch (err) {
    console.error("PATCH order status error:", err)
    return res.status(500).json({ message: "Failed to update status: " + err.message })
  }
})

module.exports = router
