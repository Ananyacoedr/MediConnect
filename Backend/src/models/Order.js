const mongoose = require('mongoose')

const orderSchema = new mongoose.Schema({
  patient:  { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  items: [{
    product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name:     { type: String },
    price:    { type: Number },
    quantity: { type: Number, default: 1 },
  }],
  totalAmount:  { type: Number, required: true },
  status:       { type: String, enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
  address:      { type: String, default: '' },
  prescriptionUrl: { type: String, default: '' },
  prescriptionStatus: { type: String, enum: ['not-required', 'pending', 'approved', 'rejected'], default: 'not-required' },
  trackingId:   { type: String, default: '' },
}, { timestamps: true })

module.exports = mongoose.model('Order', orderSchema)
