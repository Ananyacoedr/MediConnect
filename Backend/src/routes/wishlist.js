const express = require('express')
const router = express.Router()
const { requireAuth } = require('../middleware/auth')
const { getWishlist, toggleWishlist } = require('../controllers/wishlistController')

router.get('/', requireAuth, getWishlist)
router.post('/toggle', requireAuth, toggleWishlist)

module.exports = router
