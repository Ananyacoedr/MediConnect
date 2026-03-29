const pool = require('../db')

const getWishlist = async (req, res) => {
  try {
    const { rows: pRows } = await pool.query('SELECT id FROM patients WHERE clerk_id = $1', [req.auth.userId])
    if (!pRows.length) return res.status(404).json({ error: 'Patient not found' })
    const { rows } = await pool.query('SELECT products FROM wishlist WHERE patient_id = $1', [pRows[0].id])
    const productIds = rows[0]?.products || []
    if (!productIds.length) return res.json([])
    const { rows: products } = await pool.query(`SELECT * FROM products WHERE id = ANY($1::uuid[])`, [productIds])
    res.json(products)
  } catch (err) { res.status(500).json({ error: err.message }) }
}

const toggleWishlist = async (req, res) => {
  try {
    const { rows: pRows } = await pool.query('SELECT id FROM patients WHERE clerk_id = $1', [req.auth.userId])
    if (!pRows.length) return res.status(404).json({ error: 'Patient not found' })
    const patientId = pRows[0].id
    const { productId } = req.body

    await pool.query(`INSERT INTO wishlist (patient_id, products) VALUES ($1, '[]') ON CONFLICT (patient_id) DO NOTHING`, [patientId])
    const { rows } = await pool.query('SELECT products FROM wishlist WHERE patient_id = $1', [patientId])
    const products = rows[0].products || []
    const exists = products.includes(productId)
    const updated = exists ? products.filter(id => id !== productId) : [...products, productId]
    await pool.query('UPDATE wishlist SET products = $1, updated_at = NOW() WHERE patient_id = $2', [JSON.stringify(updated), patientId])
    res.json({ wishlisted: !exists })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

module.exports = { getWishlist, toggleWishlist }
