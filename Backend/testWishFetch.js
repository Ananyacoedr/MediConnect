require('dotenv').config()
const { Pool } = require('pg')
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function check() {
  try {
    const { rows } = await pool.query('SELECT products FROM wishlist LIMIT 1');
    const productIds = rows[0]?.products || [];
    console.log("Got productIds:", typeof productIds, Array.isArray(productIds), productIds);
    if (productIds.length > 0) {
      const { rows: products } = await pool.query(`SELECT * FROM products WHERE id = ANY($1::uuid[])`, [productIds]);
      console.log("Got products:", products.length);
    }
  } catch (err) {
    console.error("Crash:", err);
  } finally { pool.end() }
}
check()
