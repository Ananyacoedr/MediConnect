const express = require('express')
const router = express.Router()
const { requireAuth } = require('../middleware/auth')
const { syncPatient, getMe, getDashboard, updateProfileImage, bookAppointment, getMyAppointments, getReminders, uploadReport } = require('../controllers/patientController')

router.post('/sync',                        syncPatient)
router.get('/me',                           requireAuth, getMe)
router.get('/dashboard',                    requireAuth, getDashboard)
router.patch('/profile-image',              requireAuth, updateProfileImage)
router.post('/appointments/book',           requireAuth, bookAppointment)
router.get('/appointments',                 requireAuth, getMyAppointments)
router.post('/appointments/:id/reports',    requireAuth, uploadReport)
router.get('/reminders',                    requireAuth, getReminders)

module.exports = router
