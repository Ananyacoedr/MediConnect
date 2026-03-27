const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
  name:           { type: String, required: true },
  brand:          { type: String, default: '' },
  category:       { type: String, required: true, enum: ['medicines', 'personal-care', 'health-devices', 'supplements', 'vitamins'] },
  subCategory:    { type: String, default: '' },
  description:    { type: String, default: '' },
  usage:          { type: String, default: '' },
  ingredients:    { type: String, default: '' },
  warnings:       { type: String, default: '' },
  sideEffects:    { type: String, default: '' },
  price:          { type: Number, required: true },
  discountPercent:{ type: Number, default: 0 },
  stock:          { type: Number, default: 0 },
  images:         [{ type: String }],
  requiresPrescription: { type: Boolean, default: false },
  rating:         { type: Number, default: 0 },
  reviewCount:    { type: Number, default: 0 },
  tags:           [{ type: String }],
  isActive:       { type: Boolean, default: true },
}, { timestamps: true })

productSchema.virtual('discountedPrice').get(function () {
  return +(this.price * (1 - this.discountPercent / 100)).toFixed(2)
})

module.exports = mongoose.model('Product', productSchema)
