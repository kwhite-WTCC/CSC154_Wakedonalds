const nodemailer = require("nodemailer")

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASS,
  MAIL_FROM,
} = process.env

let transporter = null

function getTransporter() {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.warn(
      "Email disabled: set SMTP_HOST, SMTP_USER, SMTP_PASS (and optionally SMTP_PORT, SMTP_SECURE, MAIL_FROM)"
    )
    return null
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: SMTP_SECURE === "true" || SMTP_SECURE === "1",
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
  }
  return transporter
}

async function sendOrderEmail(order) {
  const transport = getTransporter()
  if (!transport) return

  const to = order && order.email ? String(order.email).trim() : ""
  if (!to) {
    console.warn("Order email skipped: no email on order")
    return
  }

  try {
    const subtotal = Number(order.subtotal || 0).toFixed(2)
    const tax = Number(order.tax || 0).toFixed(2)
    const total = Number(order.total || 0).toFixed(2)
    const from = MAIL_FROM || SMTP_USER || "orders@wakedonalds.com"
    const customerName = (order.customer || "Guest").replace(/</g, "&lt;")

    const itemsHtml =
      order.items && order.items.length
        ? order.items
            .map(
              (it) =>
                `<tr>
  <td style="padding:12px 16px;border-bottom:1px solid #eee;font-size:15px;color:#333;">${(it.qty || 1)}x ${(it.name || "Item").replace(/</g, "&lt;")}</td>
  <td style="padding:12px 16px;border-bottom:1px solid #eee;font-size:15px;color:#333;text-align:right;white-space:nowrap;">$${Number(it.price || 0).toFixed(2)}</td>
</tr>`
            )
            .join("\n")
        : '<tr><td colspan="2" style="padding:16px;color:#888;font-style:italic;">No items</td></tr>'

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Order #${order.orderNum} — Wakedonalds</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',system-ui,-apple-system,sans-serif;background:#f0f2f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f0f2f5;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:480px;background:#fff;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,.08);overflow:hidden;">
        <tr><td style="background:linear-gradient(135deg,#c8913a 0%,#a8762a 100%);padding:28px 32px;text-align:center;">
          <h1 style="margin:0;font-size:24px;font-weight:700;color:#fff;letter-spacing:.5px;">WAKEDONALDS</h1>
          <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,.9);letter-spacing:1px;">Order #${order.orderNum}</p>
        </td></tr>
        <tr><td style="padding:32px;color:#333;">
  <p style="margin:0 0 24px;font-size:16px;line-height:1.5;">Hi ${customerName},</p>
  <p style="margin:0 0 20px;font-size:15px;font-weight:600;color:#555;">Thanks for your order! Here’s what you are getting:</p>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8f9fa;border-radius:8px;border:1px solid #eee;margin-bottom:24px;"><tbody>${itemsHtml}</tbody></table>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr><td style="padding:8px 0;font-size:15px;font-weight:600;color:#555;">Subtotal</td><td style="padding:8px 0;font-size:15px;font-weight:600;color:#333;text-align:right;">$${subtotal}</td></tr>
    <tr><td style="padding:8px 0;font-size:15px;font-weight:600;color:#555;">Tax</td><td style="padding:8px 0;font-size:15px;font-weight:600;color:#333;text-align:right;">$${tax}</td></tr>
    <tr><td style="padding:12px 0 0;font-size:17px;font-weight:700;color:#a8762a;">Total</td><td style="padding:12px 0 0;font-size:17px;font-weight:700;color:#a8762a;text-align:right;">$${total}</td></tr>
  </table>
  ${order.notes && String(order.notes).trim() ? `<p style="margin:20px 0 0;padding:12px;background:#fff9e6;border-left:4px solid #c8913a;border-radius:4px;font-size:14px;color:#555;"><strong>Note:</strong> ${String(order.notes).replace(/</g, "&lt;")}</p>` : ""}
        </td></tr>
        <tr><td style="padding:20px 32px;background:#f8f9fa;border-top:1px solid #eee;text-align:center;">
          <p style="margin:0;font-size:13px;font-weight:600;color:#666;">Thanks for ordering at Wakedonalds. See you soon!</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

    const text =
      `Order #${order.orderNum}\n\n` +
      `Customer: ${order.customer || "Guest"}\n` +
      `Items:\n${order.items && order.items.length ? order.items.map((it) => `  ${it.qty || 1}x ${it.name} — $${Number(it.price || 0).toFixed(2)}`).join("\n") : "  (none)"}\n` +
      `Subtotal: $${subtotal}  Tax: $${tax}  Total: $${total}\n` +
      (order.notes && String(order.notes).trim() ? `Notes: ${order.notes}\n` : "")

    await transport.sendMail({
      from: `Wakedonalds <${from}>`,
      to,
      subject: `Order #${order.orderNum} — Wakedonalds`,
      text,
      html,
    })
  } catch (err) {
    console.error("Failed to send order email:", err.message)
  }
}

async function sendStatusUpdateEmail(order, newStatus) {
  const transport = getTransporter()
  if (!transport) return

  const to = order && order.email ? String(order.email).trim() : ""
  if (!to) {
    console.warn("Status email skipped: no email on order")
    return
  }

  const isReady = newStatus === "Ready for Pickup"
  const isPickedUp = newStatus === "Picked Up"
  if (!isReady && !isPickedUp) return

  try {
    const from = MAIL_FROM || SMTP_USER || "orders@wakedonalds.com"
    const customerName = (order.customer || "Guest").replace(/</g, "&lt;")
    const orderNum = order.orderNum || order.num || "—"

    const headline = isReady ? "Your order is ready for pickup!" : "Your order has been picked up"
    const message = isReady
      ? "Your order is ready at the counter. Come get it!"
      : "Thanks for picking up your order. We hope you enjoy!"
    const icon = isReady ? "✅" : "🎉"
    const badgeBg = isReady ? "#e8f5ee" : "#f0f4ff"
    const badgeColor = isReady ? "#2e7d4a" : "#4f46e5"
    const badgeBorder = isReady ? "#c8e6c9" : "#c7d2fe"
    const subline = isReady ? "Head to the counter to grab your food." : "Enjoy your meal — we hope to see you again soon!"

    const items = order.items && Array.isArray(order.items) ? order.items : []
    const itemsHtml =
      items.length > 0
        ? items
            .map(
              (it) =>
                `<tr>
  <td style="padding:12px 16px;border-bottom:1px solid #eee;font-size:15px;color:#333;">${(it.qty || 1)}x ${(it.name || "Item").replace(/</g, "&lt;")}</td>
  <td style="padding:12px 16px;border-bottom:1px solid #eee;font-size:15px;color:#333;text-align:right;white-space:nowrap;">$${Number(it.price || 0).toFixed(2)}</td>
</tr>`
            )
            .join("\n")
        : '<tr><td colspan="2" style="padding:16px;color:#888;font-style:italic;">No items</td></tr>'

    const subtotal = Number(order.subtotal || 0).toFixed(2)
    const tax = Number(order.tax || 0).toFixed(2)
    const total = Number(order.total || 0).toFixed(2)

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Order #${orderNum} — Wakedonalds</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',system-ui,-apple-system,sans-serif;background:#f0f2f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f0f2f5;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:480px;background:#fff;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,.08);overflow:hidden;">
        <tr><td style="background:linear-gradient(135deg,#c8913a 0%,#a8762a 100%);padding:28px 32px;text-align:center;">
          <h1 style="margin:0;font-size:24px;font-weight:700;color:#fff;letter-spacing:.5px;">WAKEDONALDS</h1>
          <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,.9);letter-spacing:1px;">Order #${orderNum}</p>
        </td></tr>
        <tr><td style="padding:32px;color:#333;">
          <p style="margin:0 0 24px;font-size:16px;line-height:1.5;">Hi ${customerName},</p>
          <div style="background:${badgeBg};border:2px solid ${badgeBorder};border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
            <p style="margin:0 0 12px;font-size:42px;line-height:1;">${icon}</p>
            <p style="margin:0;font-size:20px;font-weight:700;color:${badgeColor};letter-spacing:.02em;">${headline}</p>
          </div>
          <p style="margin:0 0 8px;font-size:15px;font-weight:600;color:#555;line-height:1.6;">${message}</p>
          <p style="margin:0 0 20px;font-size:14px;font-weight:600;color:#666;line-height:1.5;">${subline}</p>
          <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#333;text-transform:uppercase;letter-spacing:.05em;">Order overview</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8f9fa;border-radius:8px;border:1px solid #eee;margin-bottom:20px;"><tbody>${itemsHtml}</tbody></table>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr><td style="padding:8px 0;font-size:15px;font-weight:600;color:#555;">Subtotal</td><td style="padding:8px 0;font-size:15px;font-weight:600;color:#333;text-align:right;">$${subtotal}</td></tr>
            <tr><td style="padding:8px 0;font-size:15px;font-weight:600;color:#555;">Tax</td><td style="padding:8px 0;font-size:15px;font-weight:600;color:#333;text-align:right;">$${tax}</td></tr>
            <tr><td style="padding:12px 0 0;font-size:17px;font-weight:700;color:#a8762a;">Total</td><td style="padding:12px 0 0;font-size:17px;font-weight:700;color:#a8762a;text-align:right;">$${total}</td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:20px 32px;background:#f8f9fa;border-top:1px solid #eee;text-align:center;">
          <p style="margin:0;font-size:13px;font-weight:600;color:#666;">Thanks for ordering at Wakedonalds. See you soon!</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

    const subject = isReady
      ? `Order #${orderNum} is ready for pickup! — Wakedonalds`
      : `Order #${orderNum} picked up — Wakedonalds`
    const itemsText = items.length
      ? items.map((it) => `  ${it.qty || 1}x ${it.name} — $${Number(it.price || 0).toFixed(2)}`).join("\n")
      : "  (no items)"
    const text =
      `Hi ${order.customer || "Guest"},\n\n${headline}\n${message}\n\nOrder overview:\n${itemsText}\n\nSubtotal: $${subtotal}  Tax: $${tax}  Total: $${total}\n\nThanks for ordering at Wakedonalds.`

    await transport.sendMail({
      from: `Wakedonalds <${from}>`,
      to,
      subject,
      text,
      html,
    })
  } catch (err) {
    console.error("Failed to send status email:", err.message)
  }
}

module.exports = { sendOrderEmail, sendStatusUpdateEmail }
