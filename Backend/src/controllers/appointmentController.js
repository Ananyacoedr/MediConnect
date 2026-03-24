const Appointment = require('../models/Appointment')
const Doctor = require('../models/Doctor')

const updateStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body
    const doctor = await Doctor.findOne({ clerkId: req.auth.userId })
    const appointment = await Appointment.findOneAndUpdate(
      { _id: id, doctor: doctor._id },
      { $set: { status } },
      { new: true }
    ).populate('patient', 'firstName lastName')
    if (!appointment) return res.status(404).json({ error: 'Appointment not found' })
    res.json(appointment)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports = { updateStatus }
