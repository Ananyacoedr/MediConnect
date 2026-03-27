const mongoose = require('mongoose')

const wishlistSchema = new mongoose.Schema({
  patient:  { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, unique: true },
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
}, { timestamps: true })

module.exports = mongoose.model('Wishlist', wishlistSchema)
