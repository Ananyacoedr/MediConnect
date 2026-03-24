const Doctor = require('../models/Doctor')
const Appointment = require('../models/Appointment')

// Upsert doctor profile on first login
const syncDoctor = async (req, res) => {
  try {
    const { clerkId, firstName, lastName, email } = req.body
    const doctor = await Doctor.findOneAndUpdate(
      { clerkId },
      { $setOnInsert: { clerkId, firstName, lastName, email } },
      { upsert: true, new: true }
    )
    res.json(doctor)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const getProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ clerkId: req.auth.userId })
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' })
    res.json(doctor)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const updateProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findOneAndUpdate(
      { clerkId: req.auth.userId },
      { $set: req.body },
      { new: true }
    )
    res.json(doctor)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const updateAvailability = async (req, res) => {
  try {
    const doctor = await Doctor.findOneAndUpdate(
      { clerkId: req.auth.userId },
      { $set: { availability: req.body.availability } },
      { new: true }
    )
    res.json(doctor)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const getDashboardStats = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ clerkId: req.auth.userId })
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' })

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const [totalPatients, confirmed, pending, requested, todayAppointments, pendingRequests] = await Promise.all([
      Appointment.distinct('patient', { doctor: doctor._id, status: 'Confirmed' }),
      Appointment.countDocuments({ doctor: doctor._id, status: 'Confirmed' }),
      Appointment.countDocuments({ doctor: doctor._id, status: 'Pending' }),
      Appointment.countDocuments({ doctor: doctor._id, status: { $in: ['Pending', 'Confirmed'] } }),
      Appointment.find({ doctor: doctor._id, date: { $gte: today, $lt: tomorrow } })
        .populate('patient', 'firstName lastName')
        .sort({ time: 1 }),
      Appointment.find({ doctor: doctor._id, status: 'Pending' })
        .populate('patient', 'firstName lastName')
        .sort({ date: 1 })
        .limit(5),
    ])

    res.json({
      stats: {
        totalPatients: totalPatients.length,
        successfullyAppointed: confirmed,
        pendingBookings: pending,
        requestedAppointments: requested,
      },
      todayAppointments,
      pendingRequests,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports = { syncDoctor, getProfile, updateProfile, updateAvailability, getDashboardStats }
