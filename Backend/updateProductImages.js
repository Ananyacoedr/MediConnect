require('dotenv').config()
const { Pool } = require('pg')

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })

const photoMap = {
  'Paracetamol 500mg': ['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop'],
  'Amoxicillin 500mg': ['https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=500&auto=format&fit=crop'],
  'Vitamin C 1000mg': ['https://images.unsplash.com/photo-1550572017-edb79a5270da?w=500&auto=format&fit=crop'],
  'Digital Thermometer': ['https://images.unsplash.com/photo-1628770281163-54cd73a38ce3?w=500&auto=format&fit=crop'],
  'BP Monitor (Automatic)': ['https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=500&auto=format&fit=crop'],
  'Hand Sanitizer 500ml': ['https://images.unsplash.com/photo-1584483759714-b15392fb27f1?w=500&auto=format&fit=crop'],
  'Omega-3 Fish Oil': ['https://images.unsplash.com/photo-1512069772995-ec65ed4aeafe?w=500&auto=format&fit=crop'],
  'N95 Face Mask (Pack of 5)': ['https://images.unsplash.com/photo-1586942693892-c1c0453efbe2?w=500&auto=format&fit=crop'],
  'Glucometer Kit': ['https://images.unsplash.com/photo-1634567990117-cd232aeba55b?w=500&auto=format&fit=crop'],
  'Multivitamin Daily': ['https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=500&auto=format&fit=crop']
}

async function updatePhotos() {
  const client = await pool.connect()
  try {
    const { rows } = await client.query('SELECT id, name FROM products')
    let count = 0
    for (const row of rows) {
      if (photoMap[row.name]) {
        await client.query('UPDATE products SET images = $1 WHERE id = $2', [JSON.stringify(photoMap[row.name]), row.id])
        count++
      }
    }
    console.log(`✅ Successfully injected high-quality cover photos for ${count} products!`)
  } catch (err) {
    console.error('❌ Error:', err.message)
  } finally {
    client.release()
    await pool.end()
  }
}

updatePhotos()
