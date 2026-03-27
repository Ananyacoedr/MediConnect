const Wishlist = require('../models/Wishlist')
const Patient = require('../models/Patient')

const getWishlist = async (req, res) => {
  try {
    const patient = await Patient.findOne({ clerkId: req.auth.userId })
    if (!patient) return res.status(404).json({ error: 'Patient not found' })
    const wishlist = await Wishlist.findOne({ patient: patient._id }).populate('products')
    res.json(wishlist?.products || [])
  } catch (err) { res.status(500).json({ error: err.message }) }
}

const toggleWishlist = async (req, res) => {
  try {
    const patient = await Patient.findOne({ clerkId: req.auth.userId })
    if (!patient) return res.status(404).json({ error: 'Patient not found' })
    const { productId } = req.body
    let wishlist = await Wishlist.findOne({ patient: patient._id })
    if (!wishlist) wishlist = await Wishlist.create({ patient: patient._id, products: [] })

    const exists = wishlist.products.includes(productId)
    if (exists) wishlist.products.pull(productId)
    else wishlist.products.push(productId)
    await wishlist.save()
    res.json({ wishlisted: !exists })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

module.exports = { getWishlist, toggleWishlist }
