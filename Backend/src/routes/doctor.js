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

const mapDoctor = (r) => ({
  id:           r.id,
  clerkId:      r.clerk_id,
  firstName:    r.first_name,
  lastName:     r.last_name,
  title:        r.title,
  designation:  r.designation,
  specialty:    r.specialty,
  experience:   r.experience,
  location:     r.location,
  phone:        r.phone,
  bio:          r.bio,
  email:        r.email,
  profileImage: r.profile_image,
  availability: r.availability,
  createdAt:    r.created_at,
})

router.get('/list', async (req, res) => {
  try {
    const { specialty, search } = req.query
    let query = 'SELECT * FROM doctors'
    const values = []
    const conditions = []
    if (specialty) { conditions.push(`specialty ILIKE $${values.length + 1}`); values.push(`%${specialty}%`) }
    if (search) {
      const idx = values.length + 1
      conditions.push(`(first_name ILIKE $${idx} OR last_name ILIKE $${idx} OR specialty ILIKE $${idx} OR email ILIKE $${idx})`)
      values.push(`%${search}%`)
    }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ')
    query += ' ORDER BY created_at DESC'
    const { rows } = await pool.query(query, values)
    res.json(rows.map(mapDoctor))
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

// Admin doctor management
router.post('/admin', requireAuth, async (req, res) => {
  try {
    const { firstName, lastName, title, designation, specialty, experience, location, phone, bio, profileImage, email, clerkId } = req.body
    const { rows } = await pool.query(
      `INSERT INTO doctors (clerk_id, first_name, last_name, title, designation, specialty, experience, location, phone, bio, profile_image, email)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [clerkId || `admin_${Date.now()}`, firstName, lastName, title || 'Dr.', designation || '', specialty || '', experience || 0, location || '', phone || '', bio || '', profileImage || '', email || '']
    )
    res.status(201).json(rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.patch('/admin/:id', requireAuth, async (req, res) => {
  try {
    const colMap = { firstName: 'first_name', lastName: 'last_name', title: 'title', designation: 'designation', specialty: 'specialty', experience: 'experience', location: 'location', phone: 'phone', bio: 'bio', profileImage: 'profile_image' }
    const fields = []; const values = []; let i = 1
    Object.keys(colMap).forEach(k => { if (req.body[k] !== undefined) { fields.push(`${colMap[k]} = $${i++}`); values.push(req.body[k]) } })
    if (!fields.length) return res.status(400).json({ error: 'No fields to update' })
    values.push(req.params.id)
    const { rows } = await pool.query(`UPDATE doctors SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${i} RETURNING *`, values)
    if (!rows.length) return res.status(404).json({ error: 'Doctor not found' })
    res.json(rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.delete('/admin/:id', requireAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM doctors WHERE id = $1', [req.params.id])
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM doctors WHERE id = $1', [req.params.id])
    if (!rows.length) return res.status(404).json({ error: 'Doctor not found' })
    res.json(mapDoctor(rows[0]))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
