const Patient = require('../models/Patient')
const Appointment = require('../models/Appointment')
const Doctor = require('../models/Doctor')

const syncPatient = async (req, res) => {
  try {
    const { clerkId, firstName, lastName, email, profileImage } = req.body
    const patient = await Patient.findOneAndUpdate(
      { clerkId },
      { $set: { profileImage: profileImage || '' }, $setOnInsert: { clerkId, firstName, lastName, email } },
      { upsert: true, returnDocument: 'after' }
    )
    res.json(patient)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const getProfile = async (req, res) => {
  try {
    const patient = await Patient.findOne({ clerkId: req.auth.userId })
    if (!patient) return res.status(404).json({ error: 'Patient not found' })
    res.json(patient)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const updateProfile = async (req, res) => {
  try {
    const allowed = ['firstName', 'lastName', 'phone', 'dob', 'gender', 'profileImage']
    const update = {}
    allowed.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k] })
    const patient = await Patient.findOneAndUpdate(
      { clerkId: req.auth.userId },
      { $set: update },
      { returnDocument: 'after' }
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
      { returnDocument: 'after' }
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

    const [total, completed, pending, recentAppointments] = await Promise.all([
      Appointment.countDocuments({ patient: patient._id }),
      Appointment.countDocuments({ patient: patient._id, status: 'Completed' }),
      Appointment.countDocuments({ patient: patient._id, status: 'Pending' }),
      Appointment.find({ patient: patient._id })
        .populate('doctor', 'firstName lastName specialty profileImage')
        .sort({ date: -1 })
        .limit(5),
    ])

    res.json({
      patient,
      stats: { total, completed, pending },
      recentAppointments,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const getAllAppointments = async (req, res) => {
  try {
    const patient = await Patient.findOne({ clerkId: req.auth.userId })
    if (!patient) return res.status(404).json({ error: 'Patient not found' })
    const appointments = await Appointment.find({ patient: patient._id })
      .populate('doctor', 'firstName lastName specialty profileImage')
      .sort({ date: -1 })
    res.json(appointments)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const bookAppointment = async (req, res) => {
  try {
    const patient = await Patient.findOne({ clerkId: req.auth.userId })
    if (!patient) return res.status(404).json({ error: 'Patient not found' })
    const { doctorId, date, time, reason, consultationType, symptoms, medicalHistory } = req.body
    const doctor = await Doctor.findById(doctorId)
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' })
    const appointment = await Appointment.create({
      doctor: doctorId,
      patient: patient._id,
      date, time, reason, consultationType: consultationType || 'video',
      symptoms: symptoms || '', medicalHistory: medicalHistory || '',
      patientAge: patient.dob ? Math.floor((new Date() - new Date(patient.dob)) / (365.25 * 24 * 60 * 60 * 1000)) : undefined,
      patientGender: patient.gender,
    })
    await appointment.populate('doctor', 'firstName lastName specialty')
    res.status(201).json(appointment)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const getPrescriptions = async (req, res) => {
  try {
    const patient = await Patient.findOne({ clerkId: req.auth.userId })
    if (!patient) return res.status(404).json({ error: 'Patient not found' })
    const appointments = await Appointment.find({
      patient: patient._id,
      prescription: { $exists: true, $not: { $size: 0 } },
    })
      .populate('doctor', 'firstName lastName specialty')
      .sort({ date: -1 })
    res.json(appointments)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const getByClerkId = async (req, res) => {
  try {
    // Security: only allow access to own record
    if (req.params.clerkId !== req.auth.userId)
      return res.status(403).json({ error: 'Forbidden' })

    let patient = await Patient.findOne({ clerkId: req.params.clerkId })
      .populate({
        path: 'appointments',
        populate: { path: 'doctor', select: 'firstName lastName specialty profileImage title' },
        options: { sort: { date: -1 } },
      })

    // Auto-create if first time (Clerk data passed in query)
    if (!patient) {
      const { firstName, lastName, email } = req.query
      if (!firstName || !email) return res.status(404).json({ error: 'Patient not found' })
      patient = await Patient.create({
        clerkId: req.params.clerkId,
        firstName, lastName: lastName || '', email,
      })
    }

    // Attach live appointment stats
    const allAppts = await Appointment.find({ patient: patient._id })
    const stats = {
      total:     allAppts.length,
      completed: allAppts.filter(a => a.status === 'Completed').length,
      pending:   allAppts.filter(a => a.status === 'Pending').length,
      confirmed: allAppts.filter(a => a.status === 'Confirmed').length,
    }

    const recentAppointments = await Appointment.find({ patient: patient._id })
      .populate('doctor', 'firstName lastName specialty profileImage title')
      .sort({ date: -1 })
      .limit(5)

    res.json({ patient, stats, recentAppointments })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const getDoctors = async (req, res) => {
  try {
    const { specialty } = req.query
    const filter = specialty ? { specialty: { $regex: specialty, $options: 'i' } } : {}
    const doctors = await Doctor.find(filter, '-availability -__v').sort({ createdAt: -1 })
    res.json(doctors)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports = {
  syncPatient, getProfile, updateProfile, updateProfileImage,
  getDashboard, getAllAppointments, bookAppointment, getPrescriptions, getDoctors,
  getByClerkId,
}
