require('dotenv').config()
const { Pool } = require('pg')
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function createTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wishlist (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        patient_id UUID UNIQUE REFERENCES patients(id) ON DELETE CASCADE,
        products JSONB DEFAULT '[]',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log("Wishlist table created perfectly.")
  } catch (err) {
    console.error(err)
  } finally { pool.end() }
}
createTable()
