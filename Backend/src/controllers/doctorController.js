const Doctor = require('../models/Doctor')
const Appointment = require('../models/Appointment')
require('../models/Patient')

const syncDoctor = async (req, res) => {
  try {
    const { clerkId, firstName, lastName, email, profileImage } = req.body
    let doctor = await Doctor.findOne({ clerkId })
    if (!doctor && email) {
      doctor = await Doctor.findOneAndUpdate(
        { email },
        { $set: { clerkId, firstName, lastName, profileImage } },
        { new: true }
      )
    }
    if (!doctor) {
      doctor = await Doctor.create({ clerkId, firstName, lastName, email, profileImage })
    } else {
      // Update name/image in case it changed
      if (firstName) doctor.firstName = firstName
      if (lastName)  doctor.lastName  = lastName
      if (profileImage) doctor.profileImage = profileImage
      await doctor.save()
    }
    res.json(doctor)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const getOrCreateDoctor = async (clerkId) => {
  let doctor = await Doctor.findOne({ clerkId })
  if (!doctor) doctor = await Doctor.create({ clerkId, firstName: 'Doctor', lastName: '', email: '' })
  return doctor
}

const getProfile = async (req, res) => {
  try {
    const doctor = await getOrCreateDoctor(req.auth.userId)
    res.json(doctor)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const updateProfile = async (req, res) => {
  try {
    const allowed = ['firstName', 'lastName', 'title', 'designation', 'specialty',
                     'experience', 'location', 'phone', 'bio', 'profileImage']
    const update = {}
    allowed.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k] })

    const doctor = await Doctor.findOneAndUpdate(
      { clerkId: req.auth.userId },
      { $set: update },
      { new: true, upsert: true }
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
      { returnDocument: 'after' }
    )
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' })
    res.json(doctor)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const getDashboardStats = async (req, res) => {
  try {
    const doctor = await getOrCreateDoctor(req.auth.userId)

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
      doctor,
      stats: {
        totalPatients:         totalPatients.length,
        successfullyAppointed: confirmed,
        pendingBookings:       pending,
        requestedAppointments: requested,
      },
      todayAppointments,
      pendingRequests,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const getAllAppointments = async (req, res) => {
  try {
    const doctor = await getOrCreateDoctor(req.auth.userId)

    const appointments = await Appointment.find({ doctor: doctor._id })
      .populate('patient', 'firstName lastName email phone gender dob profileImage')
      .sort({ date: -1, time: -1 })

    res.json(appointments)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports = { syncDoctor, getProfile, updateProfile, updateAvailability, getDashboardStats, getAllAppointments }
