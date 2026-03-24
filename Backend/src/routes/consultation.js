const express = require('express')
const router = express.Router()
const { requireAuth } = require('../middleware/auth')
const { getConsultation, saveConsultationNotes, endConsultation, getEarnings, getPreviousConsultations } = require('../controllers/consultationController')

router.get('/earnings',        requireAuth, getEarnings)
router.get('/previous',        requireAuth, getPreviousConsultations)
router.get('/:id',             requireAuth, getConsultation)
router.put('/:id/notes',       requireAuth, saveConsultationNotes)
router.patch('/:id/end',       requireAuth, endConsultation)

module.exports = router
