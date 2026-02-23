/**
 * SMS service for Wakedonalds POS.
 * Sends order confirmation text messages to customers.
 * Uses Twilio when TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are set.
 * Otherwise logs to console (no real SMS sent).
 */

let twilioClient = null

function initTwilio() {
  if (twilioClient) return twilioClient
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  if (!accountSid || !authToken) return null
  try {
    const twilio = require("twilio")
    twilioClient = twilio(accountSid, authToken)
    return twilioClient
  } catch (err) {
    console.warn("[SMS] Twilio not installed or invalid. Run: npm install twilio")
    return null
  }
}

/**
 * Format phone for E.164 (US). Accepts 252-123-1234 or 2521231234.
 */
function normalizePhone(phone) {
  if (!phone || typeof phone !== "string") return null
  const digits = phone.replace(/\D/g, "")
  if (digits.length === 10) return "+1" + digits
  if (digits.length === 11 && digits[0] === "1") return "+" + digits
  return digits.length >= 10 ? "+" + digits.slice(-11) : null
}

/**
 * Build order confirmation message.
 */
function buildOrderMessage(orderNum, customerName, items, total) {
  const itemList = items
    .map((i) => `${i.name} × ${i.qty}`)
    .join(", ")
  return (
    `🍔 Wakedonalds: Hi ${customerName}! Your order #${orderNum} is confirmed. ` +
    `Items: ${itemList}. Total: $${Number(total).toFixed(2)}. Thank you!`
  )
}

/**
 * Send order confirmation SMS.
 * @param {string} to - Customer phone (e.g. "252-123-1234")
 * @param {object} order - { num, customer, items, total }
 * @returns {{ sent: boolean, sid?: string, error?: string }}
 */
async function sendOrderSms(to, order) {
  const client = initTwilio()
  const phone = normalizePhone(to)

  if (!phone) {
    return { sent: false, error: "Invalid or missing phone number" }
  }

  const body = buildOrderMessage(
    order.num,
    order.customer,
    order.items,
    order.total
  )

  if (!client) {
    console.log("[SMS] (Twilio not configured) Would send to", phone, ":", body)
    return { sent: true, sid: "mock-no-twilio" }
  }

  const fromNumber = process.env.TWILIO_PHONE_NUMBER
  if (!fromNumber) {
    console.warn("[SMS] TWILIO_PHONE_NUMBER not set. Set it to your Twilio number.")
    console.log("[SMS] Would send to", phone, ":", body)
    return { sent: true, sid: "mock-no-from-number" }
  }

  try {
    const message = await client.messages.create({
      body,
      to: phone,
      from: fromNumber,
    })
    console.log("[SMS] Sent to", phone, "sid:", message.sid)
    return { sent: true, sid: message.sid }
  } catch (err) {
    console.error("[SMS] Failed:", err.message)
    return { sent: false, error: err.message }
  }
}

module.exports = { sendOrderSms, normalizePhone, buildOrderMessage }
