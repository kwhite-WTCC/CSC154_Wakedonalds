const express = require("express")
const router = express.Router()
const db = require("../db")

const DEFAULT_MENU = [
  { name: "Fries", cat: "Starters", price: 5, description: "Crispy golden fries", emoji: "🍟", tag: "popular" },
  { name: "Crunchwrap Supreme", cat: "Mains", price: 9, description: "Flour tortilla, seasoned beef, nacho cheese, lettuce, tomato", emoji: "🌯", tag: "popular" },
  { name: "Tonkotsu Ramen", cat: "Mains", price: 14, description: "Rich pork broth, noodles, chashu pork, soft-boiled egg", emoji: "🍜", tag: "" },
  { name: "Chicken Filet Sandwich", cat: "Mains", price: 10, description: "Crispy chicken filet, lettuce, pickles, brioche bun", emoji: "🥪", tag: "popular" },
  { name: "Burger", cat: "Mains", price: 11, description: "Beef patty, cheese, lettuce, tomato, special sauce", emoji: "🍔", tag: "" },
  { name: "Hot Dog", cat: "Mains", price: 7, description: "All-beef frank, mustard, ketchup, relish", emoji: "🌭", tag: "" },
  { name: "Spicy Pasta", cat: "Pasta & Risotto", price: 12, description: "Rigatoni, spicy tomato sauce, parmigiano", emoji: "🍝", tag: "spicy" },
  { name: "Mac & Cheese", cat: "Pasta & Risotto", price: 10, description: "Creamy cheddar sauce, elbow pasta, breadcrumb topping", emoji: "🧀", tag: "popular" },
  { name: "Ice Cream", cat: "Desserts", price: 4, description: "Vanilla soft serve, cone or cup", emoji: "🍦", tag: "popular" },
  { name: "Chocolate Brownie", cat: "Desserts", price: 5, description: "Warm fudge brownie, powdered sugar", emoji: "🍫", tag: "" },
  { name: "Apple Pie", cat: "Desserts", price: 4, description: "Flaky crust, cinnamon apple filling", emoji: "🥧", tag: "" },
  { name: "Water", cat: "Drinks", price: 1, description: "Cold bottled water", emoji: "💧", tag: "" },
  { name: "Soda", cat: "Drinks", price: 3, description: "Coke, Sprite, or Dr. Pepper", emoji: "🥤", tag: "popular" },
  { name: "Milkshake", cat: "Drinks", price: 6, description: "Vanilla, chocolate, or strawberry", emoji: "🥛", tag: "" },
  { name: "Supreme meal", cat: "Starters", price: 10000, description: "Profitable meal for us to rob your money.", emoji: "💰", tag: "popular" },
]

// Whether menu_items has description_es (null = not yet known)
let schemaHasDescriptionEs = null

async function queryMenuRows() {
  const fullSql = "SELECT id, name, cat, price, description, description_es, emoji, tag, active FROM menu_items ORDER BY cat, name"
  try {
    const rows = await db.query(fullSql)
    schemaHasDescriptionEs = true
    return { rows: rows || [], hasDescriptionEs: true }
  } catch (err) {
    if (err.code === "ER_BAD_FIELD_ERROR" && err.sqlMessage && err.sqlMessage.includes("description_es")) {
      schemaHasDescriptionEs = false
      const rows = await db.query(
        "SELECT id, name, cat, price, description, emoji, tag, active FROM menu_items ORDER BY cat, name"
      )
      return { rows: rows || [], hasDescriptionEs: false }
    }
    throw err
  }
}

async function insertMenuItem(item) {
  const hasCol = schemaHasDescriptionEs !== false
  if (hasCol) {
    try {
      await db.query(
        "INSERT INTO menu_items (name, cat, price, description, description_es, emoji, tag, active) VALUES (?, ?, ?, ?, ?, ?, ?, 1)",
        [item.name, item.cat, item.price, item.description || "", item.description_es || null, item.emoji || "🍽️", item.tag || ""]
      )
      return
    } catch (err) {
      if (err.code === "ER_BAD_FIELD_ERROR" && err.sqlMessage && err.sqlMessage.includes("description_es")) {
        schemaHasDescriptionEs = false
      } else throw err
    }
  }
  await db.query(
    "INSERT INTO menu_items (name, cat, price, description, emoji, tag, active) VALUES (?, ?, ?, ?, ?, ?, 1)",
    [item.name, item.cat, item.price, item.description || "", item.emoji || "🍽️", item.tag || ""]
  )
}

// GET all menu items (active only by default; admin can pass ?all=1)
router.get("/", async (req, res) => {
  try {
    let { rows, hasDescriptionEs } = await queryMenuRows()
    if (!rows || !rows.length) {
      for (const item of DEFAULT_MENU) {
        await insertMenuItem(item)
      }
      const again = await queryMenuRows()
      rows = again.rows
      hasDescriptionEs = again.hasDescriptionEs
    }
    if (!rows || !rows.length) return res.json([])
    const activeOnly = req.query.all !== "1"
    const list = (rows || []).map((r) => ({
      id: Number(r.id),
      name: r.name,
      cat: r.cat,
      price: Number(r.price),
      desc: r.description || "",
      desc_es: hasDescriptionEs && r.description_es != null ? String(r.description_es) : "",
      emoji: r.emoji || "🍽️",
      tag: r.tag || "",
      active: !!r.active,
    }))
    return res.json(activeOnly ? list.filter((i) => i.active) : list)
  } catch (err) {
    console.error("GET menu error:", err)
    return res.status(500).json({ message: "Failed to load menu" })
  }
})

// POST add menu item (admin) — use INSERT result insertId so new row id is always correct
router.post("/", async (req, res) => {
  try {
    const { name, cat, price, description, description_es, emoji, tag, active } = req.body
    if (!name || price === undefined) {
      return res.status(400).json({ message: "Name and price required" })
    }
    let insertResult
    if (schemaHasDescriptionEs !== false) {
      try {
        insertResult = await db.query(
          "INSERT INTO menu_items (name, cat, price, description, description_es, emoji, tag, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          [
            name,
            cat || "Mains",
            Number(price),
            description || "",
            description_es || null,
            emoji || "🍽️",
            tag || "",
            active !== false ? 1 : 0,
          ]
        )
      } catch (err) {
        if (err.code === "ER_BAD_FIELD_ERROR" && err.sqlMessage && err.sqlMessage.includes("description_es")) {
          schemaHasDescriptionEs = false
        } else throw err
      }
    }
    if (insertResult == null) {
      insertResult = await db.query(
        "INSERT INTO menu_items (name, cat, price, description, emoji, tag, active) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [name, cat || "Mains", Number(price), description || "", emoji || "🍽️", tag || "", active !== false ? 1 : 0]
      )
    }
    const newId = insertResult && insertResult.insertId != null ? Number(insertResult.insertId) : null
    if (newId == null) {
      return res.status(500).json({ message: "Failed to add item" })
    }
    return res.status(201).json({ id: newId, message: "Item added" })
  } catch (err) {
    console.error("POST menu error:", err)
    return res.status(500).json({ message: "Failed to add item" })
  }
})

// PUT update menu item (admin)
router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    const { name, cat, price, description, description_es, emoji, tag, active } = req.body
    if (!name || price === undefined) {
      return res.status(400).json({ message: "Name and price required" })
    }
    if (schemaHasDescriptionEs !== false) {
      try {
        await db.query(
          "UPDATE menu_items SET name=?, cat=?, price=?, description=?, description_es=?, emoji=?, tag=?, active=? WHERE id=?",
          [name, cat || "Mains", Number(price), description || "", description_es || null, emoji || "🍽️", tag || "", active !== false ? 1 : 0, id]
        )
        return res.json({ message: "Item updated" })
      } catch (err) {
        if (err.code === "ER_BAD_FIELD_ERROR" && err.sqlMessage && err.sqlMessage.includes("description_es")) {
          schemaHasDescriptionEs = false
        } else throw err
      }
    }
    await db.query(
      "UPDATE menu_items SET name=?, cat=?, price=?, description=?, emoji=?, tag=?, active=? WHERE id=?",
      [name, cat || "Mains", Number(price), description || "", emoji || "🍽️", tag || "", active !== false ? 1 : 0, id]
    )
    return res.json({ message: "Item updated" })
  } catch (err) {
    console.error("PUT menu error:", err)
    return res.status(500).json({ message: "Failed to update item" })
  }
})

// DELETE menu item (admin) - soft delete by setting active=0, or hard delete
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    await db.query("DELETE FROM menu_items WHERE id = ?", [id])
    return res.json({ message: "Item deleted" })
  } catch (err) {
    console.error("DELETE menu error:", err)
    return res.status(500).json({ message: "Failed to delete item" })
  }
})

module.exports = router
