const express = require('express')
const router = express.Router()
const { requireAuth } = require('../middleware/auth')
const { getCart, autofillCart, updateCartItem, removeCartItem, orderAll, getPrescriptions } = require('../controllers/cartController')

router.get('/',                          requireAuth, getCart)
router.get('/prescriptions',             requireAuth, getPrescriptions)
router.post('/autofill/:appointmentId',  requireAuth, autofillCart)
router.patch('/:itemId',                 requireAuth, updateCartItem)
router.delete('/:itemId',                requireAuth, removeCartItem)
router.post('/order',                    requireAuth, orderAll)

module.exports = router
