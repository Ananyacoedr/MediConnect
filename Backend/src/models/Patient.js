const mongoose = require('mongoose')

const patientSchema = new mongoose.Schema({
  clerkId:   { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName:  { type: String, required: true },
  email:     { type: String, required: true, unique: true },
  phone:     { type: String, default: '' },
  dob:       { type: Date },
  gender:    { type: String, enum: ['Male', 'Female', 'Other'], default: 'Other' },
}, { timestamps: true })

module.exports = mongoose.model('Patient', patientSchema)
