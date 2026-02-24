const express = require("express")
const router = express.Router()
const bcrypt = require("bcrypt")
const db = require("./db")

const SALT_ROUNDS = 10

// Roles: admin, customer only
function normalizeRole(role) {
  const r = (role || "").toLowerCase()
  return r === "admin" ? "admin" : "customer"
}

// Validate email format (must be something@something.something)
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email || "").trim())
}

// True if stored value looks like a bcrypt hash
function isBcryptHash(stored) {
  return typeof stored === "string" && /^\$2[aby]\$\d{2}\$/.test(stored)
}

// In-memory fallback when MySQL is not available (passwords hashed for consistency)
const fallbackUsers = [
  {
    id: 1,
    name: "Admin",
    email: "admin@wakedonalds.com",
    password: bcrypt.hashSync("admin123", SALT_ROUNDS),
    role: "admin",
  },
]

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" })
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ message: "Please enter a valid email address (e.g. name@example.com)" })
  }

  try {
    const hashed = await bcrypt.hash(password, SALT_ROUNDS)
    let usedDb = false
    try {
      const existing = await db.queryOne("SELECT id FROM users WHERE email = ?", [email])
      if (existing) {
        return res.status(400).json({ message: "Email already registered" })
      }
      await db.query(
        "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'customer')",
        [name, email, hashed]
      )
      usedDb = true
    } catch (_) {}

    if (!usedDb) {
      const existingUser = fallbackUsers.find((u) => u.email === email)
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" })
      }
      fallbackUsers.push({
        id: fallbackUsers.length + 1,
        name,
        email,
        password: hashed,
        role: "customer",
      })
    }
    return res.status(201).json({ message: "Account created successfully!" })
  } catch (err) {
    console.error("Register error:", err)
    return res.status(500).json({ message: "Registration failed" })
  }
})

router.post("/login", async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required" })
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ message: "Please enter a valid email address" })
  }

  try {
    let user = null
    try {
      user = await db.queryOne(
        "SELECT id, name, email, password, role FROM users WHERE email = ?",
        [email]
      )
      if (user && user.password) {
        if (isBcryptHash(user.password)) {
          const match = await bcrypt.compare(password, user.password)
          if (!match) user = null
        } else {
          if (user.password !== password) user = null
        }
      } else if (user) {
        user = null
      }
    } catch (_) {}

    if (!user) {
      const fallback = fallbackUsers.find((u) => u.email === email) || null
      if (fallback && fallback.password) {
        const match = await bcrypt.compare(password, fallback.password)
        if (match) user = fallback
      }
    }
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" })
    }

    const role = normalizeRole(user.role)
    return res.status(200).json({
      message: "Login successful!",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role,
      },
    })
  } catch (err) {
    console.error("Login error:", err)
    return res.status(500).json({ message: "Login failed" })
  }
})

// GET list users (admin panel; no passwords returned)
router.get("/users", async (req, res) => {
  try {
    let list = []
    try {
      const rows = await db.query(
        "SELECT id, name, email, role, created_at FROM users ORDER BY name"
      )
      if (rows && rows.length) {
        list = rows.map((r) => ({
          id: Number(r.id),
          name: r.name || "",
          email: r.email || "",
          role: normalizeRole(r.role),
          created_at: r.created_at || null,
        }))
      }
    } catch (_) {}
    if (list.length === 0) {
      list = fallbackUsers.map((u) => ({
        id: u.id,
        name: u.name || "",
        email: u.email || "",
        role: normalizeRole(u.role),
        created_at: null,
      }))
    }
    return res.json(list)
  } catch (err) {
    console.error("List users error:", err)
    return res.status(500).json({ message: "Failed to load users" })
  }
})

// PATCH update user role (admin only in practice; called from admin panel)
router.patch("/users/:id/role", async (req, res) => {
  const id = Number(req.params.id)
  const role = normalizeRole(req.body.role)
  if (!id || isNaN(id)) {
    return res.status(400).json({ message: "Invalid user id" })
  }
  try {
    let updated = false
    try {
      const rows = await db.query(
        "UPDATE users SET role = ? WHERE id = ? RETURNING id",
        [role, id]
      )
      if (rows && rows.length > 0) updated = true
    } catch (_) {}
    if (!updated) {
      const u = fallbackUsers.find((x) => x.id === id)
      if (u) {
        u.role = role
        updated = true
      }
    }
    if (!updated) return res.status(404).json({ message: "User not found" })
    return res.json({ message: "Role updated", role })
  } catch (err) {
    console.error("Update role error:", err)
    return res.status(500).json({ message: "Failed to update role" })
  }
})

module.exports = router
