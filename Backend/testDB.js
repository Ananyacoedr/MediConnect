require('dotenv').config()
const { Pool } = require('pg')
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function check() {
  try {
    const res = await pool.query("SELECT data_type FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'id'")
    console.log(res.rows)
  } catch (err) {
    console.error(err)
  } finally { pool.end() }
}
check()
