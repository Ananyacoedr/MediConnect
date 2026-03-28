const pool = require('../db')

const placeOrder = async (req, res) => {
  try {
    const { rows: pRows } = await pool.query('SELECT id FROM patients WHERE clerk_id = $1', [req.auth.userId])
    if (!pRows.length) return res.status(404).json({ error: 'Patient not found' })

    const { items, address, prescriptionUrl } = req.body
    if (!items?.length) return res.status(400).json({ error: 'No items in order' })

    let totalAmount = 0
    const enriched = []
    for (const item of items) {
      const { rows } = await pool.query('SELECT * FROM products WHERE id = $1 AND is_active = TRUE', [item.productId])
      if (!rows.length) continue
      const product = rows[0]
      const price = +(product.price * (1 - product.discount_percent / 100)).toFixed(2)
      totalAmount += price * item.quantity
      enriched.push({ productId: product.id, name: product.name, price, quantity: item.quantity })
    }

    const needsRx = enriched.some(i => i.requiresPrescription)
    const prescriptionStatus = needsRx ? 'pending' : 'not-required'

    const { rows } = await pool.query(
      `INSERT INTO orders (patient_id, items, total_amount, address, prescription_url, prescription_status)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [pRows[0].id, JSON.stringify(enriched), +totalAmount.toFixed(2), address||'', prescriptionUrl||'', prescriptionStatus]
    )
    res.status(201).json(rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
}

const getMyOrders = async (req, res) => {
  try {
    const { rows: pRows } = await pool.query('SELECT id FROM patients WHERE clerk_id = $1', [req.auth.userId])
    if (!pRows.length) return res.status(404).json({ error: 'Patient not found' })
    const { rows } = await pool.query('SELECT * FROM orders WHERE patient_id = $1 ORDER BY created_at DESC', [pRows[0].id])
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
}

const getAllOrders = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT o.*, p.first_name, p.last_name, p.email FROM orders o
       JOIN patients p ON p.id = o.patient_id ORDER BY o.created_at DESC`
    )
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
}

const updateOrderStatus = async (req, res) => {
  try {
    const { rows } = await pool.query('UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *', [req.body.status, req.params.id])
    if (!rows.length) return res.status(404).json({ error: 'Order not found' })
    res.json(rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
}

const updatePrescriptionStatus = async (req, res) => {
  try {
    const { rows } = await pool.query('UPDATE orders SET prescription_status = $1, updated_at = NOW() WHERE id = $2 RETURNING *', [req.body.prescriptionStatus, req.params.id])
    if (!rows.length) return res.status(404).json({ error: 'Order not found' })
    res.json(rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
}

module.exports = { placeOrder, getMyOrders, getAllOrders, updateOrderStatus, updatePrescriptionStatus }
