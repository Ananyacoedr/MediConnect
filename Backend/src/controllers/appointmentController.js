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
    ).populate('patient', 'firstName lastName clerkId')
    if (!appointment) return res.status(404).json({ error: 'Appointment not found' })

    // Notify patient via socket
    const io = req.app.get('io')
    const onlineUsers = req.app.get('onlineUsers')
    const patientSocketId = onlineUsers[appointment.patient.clerkId]
    console.log(`[Status] Patient clerkId: ${appointment.patient.clerkId}`)
    console.log(`[Status] Online users:`, Object.keys(onlineUsers))
    console.log(`[Status] Patient socket:`, patientSocketId)
    if (patientSocketId) {
      io.to(patientSocketId).emit('appointment-status', {
        appointmentId: appointment._id,
        status,
        doctorName: `${doctor.title || ''} ${doctor.firstName} ${doctor.lastName}`.trim(),
        roomLink: status === 'Confirmed' ? `${process.env.FRONTEND_URL || 'http://localhost:5173'}/video/${appointment._id}` : null,
      })
      console.log(`[Status] Notification sent to patient`)
    } else {
      console.log(`[Status] Patient NOT online - no notification sent`)
    }

    res.json(appointment)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports = { getConfirmed, updateStatus }
