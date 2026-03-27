const pool = require('../db')

const syncDoctor = async (req, res) => {
  try {
    const { clerkId, firstName, lastName, email } = req.body
    // Find by clerkId first, then fall back to email (handles seeded doctors)
    let { rows } = await pool.query('SELECT * FROM doctors WHERE clerk_id = $1', [clerkId])
    if (!rows.length && email) {
      const upd = await pool.query(
        'UPDATE doctors SET clerk_id = $1, updated_at = NOW() WHERE email = $2 RETURNING *',
        [clerkId, email]
      )
      rows = upd.rows
    }
    if (!rows.length) {
      const ins = await pool.query(
        'INSERT INTO doctors (clerk_id, first_name, last_name, email) VALUES ($1,$2,$3,$4) RETURNING *',
        [clerkId, firstName, lastName, email]
      )
      rows = ins.rows
    }
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const getProfile = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM doctors WHERE clerk_id = $1', [req.auth.userId])
    if (!rows.length) return res.status(404).json({ error: 'Doctor not found' })
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const updateProfile = async (req, res) => {
  try {
    const allowed = ['firstName','lastName','title','designation','specialty','experience','location','phone','bio','profileImage']
    const fields = []
    const values = []
    let i = 1
    const colMap = {
      firstName: 'first_name', lastName: 'last_name', title: 'title',
      designation: 'designation', specialty: 'specialty', experience: 'experience',
      location: 'location', phone: 'phone', bio: 'bio', profileImage: 'profile_image',
    }
    allowed.forEach(k => {
      if (req.body[k] !== undefined) {
        fields.push(`${colMap[k]} = $${i++}`)
        values.push(req.body[k])
      }
    })
    if (!fields.length) return res.status(400).json({ error: 'No fields to update' })
    values.push(req.auth.userId)
    const { rows } = await pool.query(
      `UPDATE doctors SET ${fields.join(', ')}, updated_at = NOW() WHERE clerk_id = $${i} RETURNING *`,
      values
    )
    if (!rows.length) return res.status(404).json({ error: 'Doctor not found' })
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const updateAvailability = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'UPDATE doctors SET availability = $1, updated_at = NOW() WHERE clerk_id = $2 RETURNING *',
      [JSON.stringify(req.body.availability), req.auth.userId]
    )
    if (!rows.length) return res.status(404).json({ error: 'Doctor not found' })
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const getDashboardStats = async (req, res) => {
  try {
    const { rows: dRows } = await pool.query('SELECT * FROM doctors WHERE clerk_id = $1', [req.auth.userId])
    if (!dRows.length) return res.status(404).json({ error: 'Doctor not found' })
    const doctor = dRows[0]

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const [totalPatientsRes, confirmedRes, pendingRes, requestedRes, todayRes, pendingReqRes] = await Promise.all([
      pool.query('SELECT COUNT(DISTINCT patient_id) AS cnt FROM appointments WHERE doctor_id = $1 AND status = $2', [doctor.id, 'Confirmed']),
      pool.query('SELECT COUNT(*) AS cnt FROM appointments WHERE doctor_id = $1 AND status = $2', [doctor.id, 'Confirmed']),
      pool.query('SELECT COUNT(*) AS cnt FROM appointments WHERE doctor_id = $1 AND status = $2', [doctor.id, 'Pending']),
      pool.query("SELECT COUNT(*) AS cnt FROM appointments WHERE doctor_id = $1 AND status IN ('Pending','Confirmed')", [doctor.id]),
      pool.query(
        `SELECT a.*, p.first_name, p.last_name FROM appointments a
         JOIN patients p ON p.id = a.patient_id
         WHERE a.doctor_id = $1 AND a.date >= $2 AND a.date < $3
         ORDER BY a.time ASC`,
        [doctor.id, today.toISOString(), tomorrow.toISOString()]
      ),
      pool.query(
        `SELECT a.*, p.first_name, p.last_name FROM appointments a
         JOIN patients p ON p.id = a.patient_id
         WHERE a.doctor_id = $1 AND a.status = 'Pending'
         ORDER BY a.date ASC LIMIT 5`,
        [doctor.id]
      ),
    ])

    res.json({
      doctor,
      stats: {
        totalPatients:         parseInt(totalPatientsRes.rows[0].cnt),
        successfullyAppointed: parseInt(confirmedRes.rows[0].cnt),
        pendingBookings:       parseInt(pendingRes.rows[0].cnt),
        requestedAppointments: parseInt(requestedRes.rows[0].cnt),
      },
      todayAppointments: todayRes.rows,
      pendingRequests:   pendingReqRes.rows,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const getAllAppointments = async (req, res) => {
  try {
    const { rows: dRows } = await pool.query('SELECT id FROM doctors WHERE clerk_id = $1', [req.auth.userId])
    if (!dRows.length) return res.status(404).json({ error: 'Doctor not found' })

    const { rows } = await pool.query(
      `SELECT a.*,
        p.first_name, p.last_name, p.email AS patient_email,
        p.phone AS patient_phone, p.gender AS patient_gender_field,
        p.dob AS patient_dob, p.profile_image AS patient_profile_image
       FROM appointments a
       JOIN patients p ON p.id = a.patient_id
       WHERE a.doctor_id = $1
       ORDER BY a.date DESC, a.time DESC`,
      [dRows[0].id]
    )
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports = { syncDoctor, getProfile, updateProfile, updateAvailability, getDashboardStats, getAllAppointments }
