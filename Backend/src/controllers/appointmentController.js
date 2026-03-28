const pool = require('../db')

const getConfirmed = async (req, res) => {
  try {
    const { rows: dRows } = await pool.query('SELECT id FROM doctors WHERE clerk_id = $1', [req.auth.userId])
    if (!dRows.length) return res.status(404).json({ error: 'Doctor not found' })

    const { rows } = await pool.query(
      `SELECT a.*, p.first_name, p.last_name, p.email AS patient_email
       FROM appointments a JOIN patients p ON p.id = a.patient_id
       WHERE a.doctor_id = $1 AND a.status = 'Confirmed'
       ORDER BY a.date ASC`,
      [dRows[0].id]
    )
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const updateStatus = async (req, res) => {
  try {
    const { rows: dRows } = await pool.query('SELECT id FROM doctors WHERE clerk_id = $1', [req.auth.userId])
    if (!dRows.length) return res.status(404).json({ error: 'Doctor not found' })

    const { rows } = await pool.query(
      `UPDATE appointments SET status = $1, updated_at = NOW()
       WHERE id = $2 AND doctor_id = $3 RETURNING *`,
      [req.body.status, req.params.id, dRows[0].id]
    )
    if (!rows.length) return res.status(404).json({ error: 'Appointment not found' })

    // Notify patient via socket
    const io = req.app.get('io')
    const onlineUsers = req.app.get('onlineUsers')
    const { rows: pRows } = await pool.query('SELECT clerk_id, first_name, last_name FROM patients WHERE id = $1', [rows[0].patient_id])
    const { rows: docRows } = await pool.query('SELECT title, first_name, last_name FROM doctors WHERE id = $1', [dRows[0].id])
    const patient = pRows[0]
    const doc = docRows[0]
    const patientSocketId = onlineUsers[patient?.clerk_id]
    if (patientSocketId) {
      io.to(patientSocketId).emit('appointment-status', {
        appointmentId: rows[0].id,
        status: req.body.status,
        doctorName: `${doc?.title || ''} ${doc?.first_name} ${doc?.last_name}`.trim(),
        roomLink: req.body.status === 'Confirmed' ? `${process.env.FRONTEND_URL || 'http://localhost:5173'}/video/${rows[0].id}` : null,
      })
    }
    res.json({ ...rows[0], first_name: patient?.first_name, last_name: patient?.last_name })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports = { getConfirmed, updateStatus }
