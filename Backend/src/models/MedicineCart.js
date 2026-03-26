const mongoose = require('mongoose')

const medicineCartSchema = new mongoose.Schema({
  patient:       { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  appointment:   { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
  medicine:      { type: String, required: true },
  dosage:        { type: String, default: '' },
  duration:      { type: String, default: '' },
  notes:         { type: String, default: '' },
  quantity:      { type: Number, default: 1 },
  inStock:       { type: Boolean, default: true },
  alternative:   { type: String, default: '' },
  ordered:       { type: Boolean, default: false },
  doctorName:    { type: String, default: '' },
  diagnosis:     { type: String, default: '' },
}, { timestamps: true })

module.exports = mongoose.model('MedicineCart', medicineCartSchema)
