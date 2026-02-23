const { Pool } = require("pg")

// Prefer Netlify DB connection string when present.
// Fallback to generic DATABASE_URL, then individual parts (mainly for local dev).
const connectionString =
  process.env.NETLIFY_DATABASE_URL ||
  process.env.DATABASE_URL ||
  null

const config = connectionString
  ? { connectionString }
  : {
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "wakedonalds",
    }

let pool = null

async function getPool() {
  if (pool) return pool
  try {
    pool = new Pool(config)
    await pool.query("SELECT 1")
    console.log("✅ Database connected")
    return pool
  } catch (err) {
    console.warn("⚠️ Database not available:", err.message, "| Using in-memory/localStorage fallback.")
    return null
  }
}

// Convert "?" placeholders to PostgreSQL-style "$1", "$2", ...
function toPgPlaceholders(sql, params) {
  if (!params || params.length === 0) return { text: sql, values: [] }
  let index = 0
  const text = sql.replace(/\?/g, () => {
    index += 1
    return "$" + index
  })
  return { text, values: params }
}

async function query(sql, params = []) {
  const p = await getPool()
  if (!p) return null
  const { text, values } = toPgPlaceholders(sql, params)
  const result = await p.query(text, values)
  return result.rows
}

async function queryOne(sql, params = []) {
  const rows = await query(sql, params)
  return rows && rows[0] ? rows[0] : null
}

module.exports = { getPool, query, queryOne }
