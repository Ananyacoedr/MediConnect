const Appointment = require('../models/Appointment')
const Doctor = require('../models/Doctor')

const getConfirmed = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ clerkId: req.auth.userId })
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' })
    const appointments = await Appointment.find({ doctor: doctor._id, status: 'Confirmed' })
      .populate('patient', 'firstName lastName email')
      .sort({ date: 1 })
    res.json(appointments)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const updateStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body
    const doctor = await Doctor.findOne({ clerkId: req.auth.userId })
    const appointment = await Appointment.findOneAndUpdate(
      { _id: id, doctor: doctor._id },
      { $set: { status } },
      { returnDocument: 'after' }
    ).populate('patient', 'firstName lastName')
    if (!appointment) return res.status(404).json({ error: 'Appointment not found' })
    res.json(appointment)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports = { getConfirmed, updateStatus }
