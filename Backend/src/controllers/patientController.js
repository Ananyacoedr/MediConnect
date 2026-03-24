const Patient = require('../models/Patient')
const Appointment = require('../models/Appointment')

const syncPatient = async (req, res) => {
  try {
    const { clerkId, firstName, lastName, email, profileImage } = req.body
    const patient = await Patient.findOneAndUpdate(
      { clerkId },
      { $set: { profileImage: profileImage || '' }, $setOnInsert: { clerkId, firstName, lastName, email } },
      { upsert: true, new: true }
    )
    res.json(patient)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const updateProfileImage = async (req, res) => {
  try {
    const { profileImage } = req.body
    const patient = await Patient.findOneAndUpdate(
      { clerkId: req.auth.userId },
      { $set: { profileImage } },
      { new: true }
    )
    res.json(patient)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const getDashboard = async (req, res) => {
  try {
    const patient = await Patient.findOne({ clerkId: req.auth.userId })
    if (!patient) return res.status(404).json({ error: 'Patient not found' })

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const [total, completed, pending, upcoming, recentAppointments] = await Promise.all([
      Appointment.countDocuments({ patient: patient._id }),
      Appointment.countDocuments({ patient: patient._id, status: 'Completed' }),
      Appointment.countDocuments({ patient: patient._id, status: 'Pending' }),
      Appointment.countDocuments({ patient: patient._id, date: { $gte: today }, status: { $in: ['Pending', 'Confirmed'] } }),
      Appointment.find({ patient: patient._id })
        .populate('doctor', 'firstName lastName specialty')
        .sort({ date: -1 })
        .limit(5),
    ])

    res.json({
      stats: { total, completed, pending, upcoming },
      recentAppointments,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports = { syncPatient, getDashboard, updateProfileImage }
