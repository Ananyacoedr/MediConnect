const express = require('express')
const router = express.Router()
const { requireAuth } = require('../middleware/auth')
const { syncDoctor, getProfile, updateProfile, updateAvailability, getDashboardStats } = require('../controllers/doctorController')

router.post('/sync',               syncDoctor)
router.get('/profile',             requireAuth, getProfile)
router.put('/profile',             requireAuth, updateProfile)
router.put('/availability',        requireAuth, updateAvailability)
router.get('/dashboard',           requireAuth, getDashboardStats)

module.exports = router
