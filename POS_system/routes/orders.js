const express = require("express")
const router = express.Router()
const { sendOrderSms } = require("../sms")

// In-memory orders (shared with frontend logic; could be replaced with DB)
const orders = []
let nextOrderNum = 1001

router.post("/", async (req, res) => {
  try {
    const { customer, phone, notes, items, subtotal, tax, total } = req.body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Order must have at least one item" })
    }

    const orderNum = String(nextOrderNum++)
    const order = {
      num: orderNum,
      customer: customer || "Guest",
      phone: phone || "",
      notes: notes || "",
      items,
      subtotal: Number(subtotal) || 0,
      tax: Number(tax) || 0,
      total: Number(total) || 0,
      status: "In Progress",
      time: new Date().toLocaleTimeString(),
    }

    orders.push(order)

    // Send SMS if customer provided a phone number
    let smsResult = { sent: false }
    if (phone && phone.trim() && phone !== "—") {
      smsResult = await sendOrderSms(phone.trim(), order)
    }

    res.status(201).json({
      message: "Order placed successfully",
      order,
      sms: smsResult,
    })
  } catch (err) {
    console.error("[Orders API]", err)
    res.status(500).json({ message: "Failed to place order" })
  }
})

router.get("/", (req, res) => {
  res.json(orders)
})

module.exports = { router, orders }
