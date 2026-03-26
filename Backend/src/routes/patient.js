const express = require('express')
const router = express.Router()
const { requireAuth } = require('../middleware/auth')
const { syncPatient, getProfile, updateProfile, updateProfileImage,
        getDashboard, getAllAppointments, bookAppointment, getPrescriptions, getDoctors,
        getByClerkId } = require('../controllers/patientController')

router.post('/sync',              syncPatient)
router.get('/profile',            requireAuth, getProfile)
router.put('/profile',            requireAuth, updateProfile)
router.patch('/profile-image',    requireAuth, updateProfileImage)
router.get('/dashboard',          requireAuth, getDashboard)
router.get('/appointments',       requireAuth, getAllAppointments)
router.post('/appointments',      requireAuth, bookAppointment)
router.get('/prescriptions',      requireAuth, getPrescriptions)
router.get('/doctors',            requireAuth, getDoctors)
router.get('/:clerkId',           requireAuth, getByClerkId)

module.exports = router
