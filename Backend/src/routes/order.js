const express = require('express')
const router = express.Router()
const { requireAuth } = require('../middleware/auth')
const { placeOrder, getMyOrders, getAllOrders, updateOrderStatus, updatePrescriptionStatus } = require('../controllers/orderController')

router.post('/', requireAuth, placeOrder)
router.get('/my', requireAuth, getMyOrders)
router.get('/all', requireAuth, getAllOrders)
router.patch('/:id/status', requireAuth, updateOrderStatus)
router.patch('/:id/prescription', requireAuth, updatePrescriptionStatus)

module.exports = router
