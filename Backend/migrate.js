require('dotenv').config()
const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function runSchema() {
  const client = await pool.connect()
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8')
    await client.query(sql)
    console.log('✅ Schema created successfully! Tables: doctors, patients, appointments, medicine_cart')
  } catch (err) {
    console.error('❌ Failed:', err.message)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

runSchema()
