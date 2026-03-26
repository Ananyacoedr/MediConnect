const Patient = require('../models/Patient')
const Appointment = require('../models/Appointment')
const Doctor = require('../models/Doctor')

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

const getMe = async (req, res) => {
  try {
    const patient = await Patient.findOne({ clerkId: req.auth.userId })
    if (!patient) return res.status(404).json({ error: 'Patient not found' })
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

    const [total, completed, pending, upcoming, recentAppointments] = await Promise.all([
      Appointment.countDocuments({ patient: patient._id }),
      Appointment.countDocuments({ patient: patient._id, status: 'Completed' }),
      Appointment.countDocuments({ patient: patient._id, status: 'Pending' }),
      Appointment.countDocuments({ patient: patient._id, date: { $gte: today }, status: { $in: ['Pending', 'Confirmed'] } }),
      Appointment.find({ patient: patient._id })
        .populate('doctor', 'firstName lastName specialty profileImage')
        .sort({ date: -1 })
        .limit(5),
    ])

    res.json({
      patient,
      stats: { total, completed, pending, upcoming },
      recentAppointments,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const bookAppointment = async (req, res) => {
  try {
    const { doctorId, date, time, reason, symptoms, consultationType } = req.body
    const patient = await Patient.findOne({ clerkId: req.auth.userId })
    if (!patient) return res.status(404).json({ error: 'Patient not found' })

    const appointment = await Appointment.create({
      doctor: doctorId,
      patient: patient._id,
      date: new Date(date),
      time,
      reason: reason || '',
      symptoms: symptoms || '',
      consultationType: consultationType || 'in-person',
      status: 'Pending',
    })

    const populated = await appointment.populate('doctor', 'firstName lastName specialty')
    res.status(201).json(populated)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const getMyAppointments = async (req, res) => {
  try {
    const patient = await Patient.findOne({ clerkId: req.auth.userId })
    if (!patient) return res.status(404).json({ error: 'Patient not found' })

    const appointments = await Appointment.find({ patient: patient._id })
      .populate('doctor', 'firstName lastName specialty profileImage location')
      .sort({ date: -1 })

    res.json(appointments)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const getReminders = async (req, res) => {
  try {
    const patient = await Patient.findOne({ clerkId: req.auth.userId })
    if (!patient) return res.status(404).json({ error: 'Patient not found' })

    const now = new Date()
    const reminders = await Appointment.find({
      patient: patient._id,
      status: { $in: ['Pending', 'Confirmed'] },
      date: { $gte: now },
    })
      .populate('doctor', 'firstName lastName specialty profileImage title')
      .sort({ date: 1 })

    res.json(reminders)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports = { syncPatient, getMe, getDashboard, updateProfileImage, bookAppointment, getMyAppointments, getReminders }
