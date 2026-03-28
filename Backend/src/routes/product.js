const express = require('express')
const router = express.Router()
const { requireAuth } = require('../middleware/auth')
const { getProducts, getProduct, createProduct, updateProduct, deleteProduct } = require('../controllers/productController')

router.get('/', getProducts)
router.get('/:id', getProduct)
router.post('/', requireAuth, createProduct)
router.patch('/:id', requireAuth, updateProduct)
router.delete('/:id', requireAuth, deleteProduct)

module.exports = router
