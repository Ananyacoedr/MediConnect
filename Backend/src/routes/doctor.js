const express = require('express')
const router = express.Router()
const pool = require('../db')
const { requireAuth } = require('../middleware/auth')
const { syncDoctor, getProfile, updateProfile, updateAvailability, getDashboardStats, getAllAppointments } = require('../controllers/doctorController')

router.get('/debug', async (req, res) => {
  try {
    const { rows: doctors } = await pool.query('SELECT clerk_id, first_name, last_name, specialty FROM doctors')
    const { rows: cnt } = await pool.query('SELECT COUNT(*) AS cnt FROM appointments')
    res.json({ doctors, appointmentCount: parseInt(cnt[0].cnt) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/list', async (req, res) => {
  try {
    const { specialty } = req.query
    const { rows } = specialty
      ? await pool.query('SELECT * FROM doctors WHERE specialty ILIKE $1 ORDER BY created_at DESC', [`%${specialty}%`])
      : await pool.query('SELECT * FROM doctors ORDER BY created_at DESC')
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/sync',        syncDoctor)
router.get('/profile',      requireAuth, getProfile)
router.put('/profile',      requireAuth, updateProfile)
router.put('/availability', requireAuth, updateAvailability)
router.get('/dashboard',    requireAuth, getDashboardStats)
router.get('/appointments', requireAuth, getAllAppointments)

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM doctors WHERE id = $1', [req.params.id])
    if (!rows.length) return res.status(404).json({ error: 'Doctor not found' })
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
