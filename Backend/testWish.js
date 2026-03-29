require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    const res = await pool.query('SELECT * FROM wishlist LIMIT 1');
    console.log(res.rows);
  } catch (err) {
    console.error('Crash:', err.message);
  } finally {
    pool.end();
  }
}
run();
