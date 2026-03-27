const pool = require('../db')

const syncPatient = async (req, res) => {
  try {
    const { clerkId, firstName, lastName, email, profileImage } = req.body
    const { rows } = await pool.query(
      `INSERT INTO patients (clerk_id, first_name, last_name, email, profile_image)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (clerk_id) DO UPDATE SET profile_image = EXCLUDED.profile_image, updated_at = NOW()
       RETURNING *`,
      [clerkId, firstName, lastName, email, profileImage || '']
    )
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const getMe = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM patients WHERE clerk_id = $1', [req.auth.userId])
    if (!rows.length) return res.status(404).json({ error: 'Patient not found' })
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const updateProfile = async (req, res) => {
  try {
    const colMap = {
      firstName: 'first_name', lastName: 'last_name', phone: 'phone',
      dob: 'dob', gender: 'gender', profileImage: 'profile_image',
    }
    const fields = []
    const values = []
    let i = 1
    Object.keys(colMap).forEach(k => {
      if (req.body[k] !== undefined) {
        fields.push(`${colMap[k]} = $${i++}`)
        values.push(req.body[k])
      }
    })
    if (!fields.length) return res.status(400).json({ error: 'No fields to update' })
    values.push(req.auth.userId)
    const { rows } = await pool.query(
      `UPDATE patients SET ${fields.join(', ')}, updated_at = NOW() WHERE clerk_id = $${i} RETURNING *`,
      values
    )
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const updateProfileImage = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'UPDATE patients SET profile_image = $1, updated_at = NOW() WHERE clerk_id = $2 RETURNING *',
      [req.body.profileImage, req.auth.userId]
    )
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const getDashboard = async (req, res) => {
  try {
    const { rows: pRows } = await pool.query('SELECT * FROM patients WHERE clerk_id = $1', [req.auth.userId])
    if (!pRows.length) return res.status(404).json({ error: 'Patient not found' })
    const patient = pRows[0]

    const [totalRes, completedRes, pendingRes, recentRes] = await Promise.all([
      pool.query('SELECT COUNT(*) AS cnt FROM appointments WHERE patient_id = $1', [patient.id]),
      pool.query("SELECT COUNT(*) AS cnt FROM appointments WHERE patient_id = $1 AND status = 'Completed'", [patient.id]),
      pool.query("SELECT COUNT(*) AS cnt FROM appointments WHERE patient_id = $1 AND status = 'Pending'", [patient.id]),
      pool.query(
        `SELECT a.*, d.first_name, d.last_name, d.specialty, d.profile_image AS doctor_profile_image, d.title
         FROM appointments a JOIN doctors d ON d.id = a.doctor_id
         WHERE a.patient_id = $1 ORDER BY a.date DESC LIMIT 5`,
        [patient.id]
      ),
    ])

    res.json({
      patient,
      stats: {
        total:     parseInt(totalRes.rows[0].cnt),
        completed: parseInt(completedRes.rows[0].cnt),
        pending:   parseInt(pendingRes.rows[0].cnt),
      },
      recentAppointments: recentRes.rows,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const bookAppointment = async (req, res) => {
  try {
    const { doctorId, date, time, reason, symptoms, consultationType } = req.body
    const { rows: pRows } = await pool.query('SELECT id FROM patients WHERE clerk_id = $1', [req.auth.userId])
    if (!pRows.length) return res.status(404).json({ error: 'Patient not found' })

    const { rows } = await pool.query(
      `INSERT INTO appointments (doctor_id, patient_id, date, time, reason, symptoms, consultation_type, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'Pending') RETURNING *`,
      [doctorId, pRows[0].id, date, time, reason || '', symptoms || '', consultationType || 'in-person']
    )
    const appt = rows[0]
    const { rows: dRows } = await pool.query('SELECT first_name, last_name, specialty FROM doctors WHERE id = $1', [appt.doctor_id])
    res.status(201).json({ ...appt, ...dRows[0] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const getMyAppointments = async (req, res) => {
  try {
    const { rows: pRows } = await pool.query('SELECT id FROM patients WHERE clerk_id = $1', [req.auth.userId])
    if (!pRows.length) return res.status(404).json({ error: 'Patient not found' })

    const { rows } = await pool.query(
      `SELECT a.*, d.first_name, d.last_name, d.specialty, d.profile_image AS doctor_profile_image,
              d.location AS doctor_location, d.title
       FROM appointments a JOIN doctors d ON d.id = a.doctor_id
       WHERE a.patient_id = $1 ORDER BY a.date DESC`,
      [pRows[0].id]
    )
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const getReminders = async (req, res) => {
  try {
    const { rows: pRows } = await pool.query('SELECT id FROM patients WHERE clerk_id = $1', [req.auth.userId])
    if (!pRows.length) return res.status(404).json({ error: 'Patient not found' })

    const { rows } = await pool.query(
      `SELECT a.*, d.first_name, d.last_name, d.specialty, d.profile_image AS doctor_profile_image, d.title
       FROM appointments a JOIN doctors d ON d.id = a.doctor_id
       WHERE a.patient_id = $1 AND a.status IN ('Pending','Confirmed') AND a.date >= CURRENT_DATE
       ORDER BY a.date ASC`,
      [pRows[0].id]
    )
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const uploadReport = async (req, res) => {
  try {
    const { rows: pRows } = await pool.query('SELECT id FROM patients WHERE clerk_id = $1', [req.auth.userId])
    if (!pRows.length) return res.status(404).json({ error: 'Patient not found' })

    const { reports } = req.body
    const { rows } = await pool.query(
      `UPDATE appointments
       SET uploaded_reports = uploaded_reports || $1::jsonb, updated_at = NOW()
       WHERE id = $2 AND patient_id = $3 RETURNING *`,
      [JSON.stringify(reports), req.params.id, pRows[0].id]
    )
    if (!rows.length) return res.status(404).json({ error: 'Appointment not found' })
    const { rows: dRows } = await pool.query('SELECT first_name, last_name, specialty FROM doctors WHERE id = $1', [rows[0].doctor_id])
    res.json({ ...rows[0], ...dRows[0] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports = { syncPatient, getMe, getDashboard, updateProfileImage, bookAppointment, getMyAppointments, getReminders, uploadReport, updateProfile }
