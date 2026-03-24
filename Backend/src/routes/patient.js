const express = require('express')
const router = express.Router()
const { requireAuth } = require('../middleware/auth')
const { syncPatient, getDashboard, updateProfileImage } = require('../controllers/patientController')

router.post('/sync',           syncPatient)
router.get('/dashboard',       requireAuth, getDashboard)
router.patch('/profile-image', requireAuth, updateProfileImage)

module.exports = router
