const mongoose = require('mongoose')

const appointmentSchema = new mongoose.Schema({
  doctor:  { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor',  required: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  date:    { type: Date, required: true },
  time:    { type: String, required: true },
  reason:  { type: String, default: '' },
  status:  { type: String, enum: ['Pending', 'Confirmed', 'Cancelled', 'Completed'], default: 'Pending' },

  // Consultation
  consultationNotes: { type: String, default: '' },
  diagnosis:         { type: String, default: '' },
  prescription:      [{
    medicine:  { type: String },
    dosage:    { type: String },
    duration:  { type: String },
    notes:     { type: String },
  }],
  consultationFee:   { type: Number, default: 0 },
  feePaid:           { type: Boolean, default: false },
  consultationType:  { type: String, enum: ['video', 'audio', 'in-person'], default: 'video' },
  consultationEnded: { type: Boolean, default: false },

  // Patient info snapshot
  patientAge:     { type: Number },
  patientGender:  { type: String },
  symptoms:       { type: String, default: '' },
  medicalHistory: { type: String, default: '' },
  uploadedReports:{ type: [String], default: [] },
}, { timestamps: true })

module.exports = mongoose.model('Appointment', appointmentSchema)
