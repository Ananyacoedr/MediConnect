const pool = require('../db')

const OUT_OF_STOCK = ['Sumatriptan', 'Propranolol']
const ALTERNATIVES = { 'Sumatriptan': 'Rizatriptan 10mg', 'Propranolol': 'Metoprolol 50mg' }

const getCart = async (req, res) => {
  try {
    const { rows: pRows } = await pool.query('SELECT id FROM patients WHERE clerk_id = $1', [req.auth.userId])
    if (!pRows.length) return res.status(404).json({ error: 'Patient not found' })

    const { rows } = await pool.query(
      `SELECT mc.*, a.date AS appointment_date, a.time AS appointment_time,
              a.diagnosis AS appointment_diagnosis, a.doctor_id
       FROM medicine_cart mc
       JOIN appointments a ON a.id = mc.appointment_id
       WHERE mc.patient_id = $1 AND mc.ordered = FALSE
       ORDER BY mc.created_at DESC`,
      [pRows[0].id]
    )
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const autofillCart = async (req, res) => {
  try {
    const { rows: pRows } = await pool.query('SELECT id FROM patients WHERE clerk_id = $1', [req.auth.userId])
    if (!pRows.length) return res.status(404).json({ error: 'Patient not found' })

    const { rows: aRows } = await pool.query(
      `SELECT a.*, d.title, d.first_name AS doc_first, d.last_name AS doc_last
       FROM appointments a JOIN doctors d ON d.id = a.doctor_id
       WHERE a.id = $1`,
      [req.params.appointmentId]
    )
    if (!aRows.length) return res.status(404).json({ error: 'Appointment not found' })
    const appt = aRows[0]
    if (!appt.prescription?.length) return res.status(400).json({ error: 'No prescription on this appointment' })

    await pool.query('DELETE FROM medicine_cart WHERE patient_id = $1 AND appointment_id = $2 AND ordered = FALSE', [pRows[0].id, appt.id])

    const doctorName = `${appt.title || 'Dr.'} ${appt.doc_first} ${appt.doc_last}`
    const created = []
    for (const p of appt.prescription) {
      const { rows } = await pool.query(
        `INSERT INTO medicine_cart (patient_id, appointment_id, medicine, dosage, duration, notes, quantity, in_stock, alternative, doctor_name, diagnosis)
         VALUES ($1,$2,$3,$4,$5,$6,1,$7,$8,$9,$10) RETURNING *`,
        [pRows[0].id, appt.id, p.medicine, p.dosage, p.duration, p.notes,
         !OUT_OF_STOCK.includes(p.medicine), ALTERNATIVES[p.medicine] || '', doctorName, appt.diagnosis || '']
      )
      created.push(rows[0])
    }
    res.json(created)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const updateCartItem = async (req, res) => {
  try {
    const allowed = ['medicine','dosage','duration','notes','quantity','in_stock','alternative','ordered']
    const fields = []
    const values = []
    let i = 1
    allowed.forEach(k => {
      if (req.body[k] !== undefined) { fields.push(`${k} = $${i++}`); values.push(req.body[k]) }
    })
    if (!fields.length) return res.status(400).json({ error: 'No fields to update' })
    values.push(req.params.itemId)
    const { rows } = await pool.query(
      `UPDATE medicine_cart SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${i} RETURNING *`,
      values
    )
    if (!rows.length) return res.status(404).json({ error: 'Item not found' })
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const removeCartItem = async (req, res) => {
  try {
    await pool.query('DELETE FROM medicine_cart WHERE id = $1', [req.params.itemId])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const orderAll = async (req, res) => {
  try {
    const { rows: pRows } = await pool.query('SELECT id FROM patients WHERE clerk_id = $1', [req.auth.userId])
    if (!pRows.length) return res.status(404).json({ error: 'Patient not found' })

    const { rowCount } = await pool.query(
      'UPDATE medicine_cart SET ordered = TRUE, updated_at = NOW() WHERE patient_id = $1 AND ordered = FALSE AND in_stock = TRUE',
      [pRows[0].id]
    )
    res.json({ orderedCount: rowCount })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const getPrescriptions = async (req, res) => {
  try {
    const { rows: pRows } = await pool.query('SELECT id FROM patients WHERE clerk_id = $1', [req.auth.userId])
    if (!pRows.length) return res.status(404).json({ error: 'Patient not found' })

    const { rows } = await pool.query(
      `SELECT a.*, d.first_name, d.last_name, d.title, d.specialty
       FROM appointments a JOIN doctors d ON d.id = a.doctor_id
       WHERE a.patient_id = $1 AND a.status = 'Completed' AND jsonb_array_length(a.prescription) > 0
       ORDER BY a.date DESC`,
      [pRows[0].id]
    )
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports = { getCart, autofillCart, updateCartItem, removeCartItem, orderAll, getPrescriptions }
