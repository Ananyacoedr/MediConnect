const pool = require('../db')

const getConsultation = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT a.*,
        p.first_name, p.last_name, p.email AS patient_email,
        p.phone AS patient_phone, p.dob AS patient_dob, p.gender AS patient_gender_field,
        d.first_name AS doctor_first_name, d.last_name AS doctor_last_name,
        d.title AS doctor_title, d.specialty AS doctor_specialty
       FROM appointments a
       JOIN patients p ON p.id = a.patient_id
       JOIN doctors  d ON d.id = a.doctor_id
       WHERE a.id = $1`,
      [req.params.id]
    )
    if (!rows.length) return res.status(404).json({ error: 'Appointment not found' })
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const saveConsultationNotes = async (req, res) => {
  try {
    const { consultationNotes, diagnosis, prescription, consultationFee, feePaid } = req.body
    const { rows } = await pool.query(
      `UPDATE appointments
       SET consultation_notes = $1, diagnosis = $2, prescription = $3,
           consultation_fee = $4, fee_paid = $5, updated_at = NOW()
       WHERE id = $6 RETURNING *`,
      [consultationNotes, diagnosis, JSON.stringify(prescription), consultationFee, feePaid, req.params.id]
    )
    if (!rows.length) return res.status(404).json({ error: 'Appointment not found' })
    const { rows: pRows } = await pool.query(
      'SELECT first_name, last_name, email AS patient_email, phone AS patient_phone, dob AS patient_dob, gender AS patient_gender_field FROM patients WHERE id = $1',
      [rows[0].patient_id]
    )
    res.json({ ...rows[0], ...pRows[0] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const endConsultation = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE appointments SET consultation_ended = TRUE, status = 'Completed', updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [req.params.id]
    )
    if (!rows.length) return res.status(404).json({ error: 'Appointment not found' })
    const appt = rows[0]

    const { rows: pRows } = await pool.query('SELECT id, first_name, last_name FROM patients WHERE id = $1', [appt.patient_id])
    const patient = pRows[0]

    // Auto-fill medicine cart if prescription exists
    if (appt.prescription?.length) {
      const OUT_OF_STOCK = ['Sumatriptan', 'Propranolol']
      const ALTERNATIVES = { 'Sumatriptan': 'Rizatriptan 10mg', 'Propranolol': 'Metoprolol 50mg' }
      const { rows: dRows } = await pool.query('SELECT title, first_name, last_name FROM doctors WHERE id = $1', [appt.doctor_id])
      const doc = dRows[0]
      const doctorName = `${doc?.title || 'Dr.'} ${doc?.first_name} ${doc?.last_name}`

      await pool.query('DELETE FROM medicine_cart WHERE patient_id = $1 AND appointment_id = $2 AND ordered = FALSE', [patient.id, appt.id])

      for (const p of appt.prescription) {
        await pool.query(
          `INSERT INTO medicine_cart (patient_id, appointment_id, medicine, dosage, duration, notes, quantity, in_stock, alternative, doctor_name, diagnosis)
           VALUES ($1,$2,$3,$4,$5,$6,1,$7,$8,$9,$10)`,
          [patient.id, appt.id, p.medicine, p.dosage, p.duration, p.notes,
           !OUT_OF_STOCK.includes(p.medicine), ALTERNATIVES[p.medicine] || '', doctorName, appt.diagnosis || '']
        )
      }
    }

    res.json({ ...appt, first_name: patient.first_name, last_name: patient.last_name })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const getEarnings = async (req, res) => {
  try {
    const { rows: dRows } = await pool.query('SELECT id FROM doctors WHERE clerk_id = $1', [req.auth.userId])
    if (!dRows.length) return res.status(404).json({ error: 'Doctor not found' })
    const doctorId = dRows[0].id

    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const [allEarnings, monthEarnings, prescriptionsCount, completedCount] = await Promise.all([
      pool.query('SELECT COALESCE(SUM(consultation_fee),0) AS total FROM appointments WHERE doctor_id = $1 AND fee_paid = TRUE', [doctorId]),
      pool.query('SELECT COALESCE(SUM(consultation_fee),0) AS total FROM appointments WHERE doctor_id = $1 AND fee_paid = TRUE AND created_at >= $2', [doctorId, startOfMonth.toISOString()]),
      pool.query("SELECT COUNT(*) AS cnt FROM appointments WHERE doctor_id = $1 AND jsonb_array_length(prescription) > 0", [doctorId]),
      pool.query("SELECT COUNT(*) AS cnt FROM appointments WHERE doctor_id = $1 AND status = 'Completed'", [doctorId]),
    ])

    res.json({
      totalEarnings:          parseFloat(allEarnings.rows[0].total),
      monthlyEarnings:        parseFloat(monthEarnings.rows[0].total),
      prescriptionsIssued:    parseInt(prescriptionsCount.rows[0].cnt),
      completedConsultations: parseInt(completedCount.rows[0].cnt),
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const getPreviousConsultations = async (req, res) => {
  try {
    const { rows: dRows } = await pool.query('SELECT id FROM doctors WHERE clerk_id = $1', [req.auth.userId])
    if (!dRows.length) return res.status(404).json({ error: 'Doctor not found' })

    const { rows } = await pool.query(
      `SELECT a.*, p.first_name, p.last_name, p.email AS patient_email, p.gender AS patient_gender_field
       FROM appointments a JOIN patients p ON p.id = a.patient_id
       WHERE a.doctor_id = $1 AND a.status IN ('Completed', 'Confirmed')
       ORDER BY a.date DESC LIMIT 50`,
      [dRows[0].id]
    )
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports = { getConsultation, saveConsultationNotes, endConsultation, getEarnings, getPreviousConsultations }
