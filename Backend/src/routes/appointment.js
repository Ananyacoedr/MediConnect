const express = require('express')
const router = express.Router()
const { requireAuth } = require('../middleware/auth')
const { updateStatus } = require('../controllers/appointmentController')

router.patch('/:id/status', requireAuth, updateStatus)

module.exports = router
