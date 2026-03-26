const express = require('express')
const router = express.Router()
const { requireAuth } = require('../middleware/auth')
const { getConfirmed, updateStatus } = require('../controllers/appointmentController')

router.get('/confirmed', requireAuth, getConfirmed)
router.patch('/:id/status', requireAuth, updateStatus)

module.exports = router
