const { Pool } = require("pg")

// Uses a single DATABASE_URL (e.g. your Neon Postgres URL)
// Example:
// DATABASE_URL=postgresql://user:pass@host/dbname?sslmode=require

const connectionString = process.env.DATABASE_URL || ""

let pool = null

async function getPool() {
  if (pool) return pool
  try {
    if (!connectionString) {
      throw new Error("DATABASE_URL not set")
    }

    pool = new Pool({
      connectionString,
      // Neon requires SSL; this keeps it simple
      ssl: { rejectUnauthorized: false },
    })

    await pool.query("SELECT 1")
    console.log("✅ PostgreSQL connected")
    return pool
  } catch (err) {
    console.warn(
      "⚠️ PostgreSQL not available:",
      err.message,
      "| Using in-memory/localStorage fallback."
    )
    return null
  }
}

// Convert old MySQL-style "?" placeholders into PostgreSQL-style $1, $2, ...
function toPostgresParams(sql, params) {
  if (!params || !params.length) {
    return { text: sql, values: [] }
  }
  let i = 0
  const text = sql.replace(/\?/g, () => {
    i += 1
    return `$${i}`
  })
  return { text, values: params }
}

async function query(sql, params = []) {
  const p = await getPool()
  if (!p) return null
  const { text, values } = toPostgresParams(sql, params)
  const result = await p.query(text, values)
  // Always return rows array so existing code keeps working
  return result.rows
}

async function queryOne(sql, params = []) {
  const rows = await query(sql, params)
  return rows && rows[0] ? rows[0] : null
}

module.exports = { getPool, query, queryOne }
