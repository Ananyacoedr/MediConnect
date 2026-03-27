const Product = require('../models/Product')

const getProducts = async (req, res) => {
  try {
    const { category, brand, minPrice, maxPrice, search, requiresPrescription, sort } = req.query
    const filter = { isActive: true }

    if (category) filter.category = category
    if (brand) filter.brand = new RegExp(brand, 'i')
    if (requiresPrescription !== undefined) filter.requiresPrescription = requiresPrescription === 'true'
    if (minPrice || maxPrice) {
      filter.price = {}
      if (minPrice) filter.price.$gte = Number(minPrice)
      if (maxPrice) filter.price.$lte = Number(maxPrice)
    }
    if (search) filter.$or = [
      { name: new RegExp(search, 'i') },
      { brand: new RegExp(search, 'i') },
      { tags: new RegExp(search, 'i') },
    ]

    const sortMap = { price_asc: { price: 1 }, price_desc: { price: -1 }, rating: { rating: -1 }, newest: { createdAt: -1 } }
    const products = await Product.find(filter).sort(sortMap[sort] || { createdAt: -1 })
    res.json(products)
  } catch (err) { res.status(500).json({ error: err.message }) }
}

const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) return res.status(404).json({ error: 'Product not found' })
    res.json(product)
  } catch (err) { res.status(500).json({ error: err.message }) }
}

const createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body)
    res.status(201).json(product)
  } catch (err) { res.status(400).json({ error: err.message }) }
}

const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!product) return res.status(404).json({ error: 'Product not found' })
    res.json(product)
  } catch (err) { res.status(400).json({ error: err.message }) }
}

const deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, { isActive: false })
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

module.exports = { getProducts, getProduct, createProduct, updateProduct, deleteProduct }
