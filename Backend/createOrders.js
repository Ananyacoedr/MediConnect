require('dotenv').config()
const { Pool } = require('pg')
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function createTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
        items JSONB NOT NULL DEFAULT '[]',
        total_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
        address TEXT,
        prescription_url TEXT,
        prescription_status VARCHAR(50) DEFAULT 'not-required',
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log("Orders table perfectly created.")
  } catch (err) {
    console.error(err)
  } finally { pool.end() }
}
createTable()
