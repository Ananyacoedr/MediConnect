const mongoose = require('mongoose')

const doctorSchema = new mongoose.Schema({
  clerkId:      { type: String, required: true, unique: true },
  firstName:    { type: String, required: true },
  lastName:     { type: String, required: true },
  email:        { type: String, required: true, unique: true },
  specialty:    { type: String, default: '' },
  phone:        { type: String, default: '' },
  bio:          { type: String, default: '' },
  availability: [{
    day:       { type: String, enum: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'] },
    startTime: { type: String },
    endTime:   { type: String },
    isAvailable: { type: Boolean, default: true },
  }],
  profileImage: { type: String, default: '' },
}, { timestamps: true })

module.exports = mongoose.model('Doctor', doctorSchema)
