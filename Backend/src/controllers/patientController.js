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

const getMe = async (req, res) => {
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
    const populated = await appointment.populate([
      { path: 'doctor', select: 'firstName lastName specialty clerkId title' },
      { path: 'patient', select: 'firstName lastName' },
    ])

    // Notify doctor via socket
    const io = req.app.get('io')
    const onlineUsers = req.app.get('onlineUsers')
    const doctorSocketId = onlineUsers[populated.doctor.clerkId]
    console.log(`[Booking] Doctor clerkId: ${populated.doctor.clerkId}`)
    console.log(`[Booking] Online users:`, Object.keys(onlineUsers))
    console.log(`[Booking] Doctor socket:`, doctorSocketId)
    if (doctorSocketId) {
      io.to(doctorSocketId).emit('new-booking', {
        appointmentId: populated._id,
        patientName: `${patient.firstName} ${patient.lastName}`,
        date, time, reason, consultationType,
      })
      console.log(`[Booking] Notification sent to doctor`)
    } else {
      console.log(`[Booking] Doctor NOT online - no notification sent`)
    }

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
      .populate('doctor', 'firstName lastName specialty profileImage location title')
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

const uploadReport = async (req, res) => {
  try {
    const patient = await Patient.findOne({ clerkId: req.auth.userId })
    if (!patient) return res.status(404).json({ error: 'Patient not found' })
    const { reports } = req.body // array of base64 strings
    const appointment = await Appointment.findOneAndUpdate(
      { _id: req.params.id, patient: patient._id },
      { $push: { uploadedReports: { $each: reports } } },
      { new: true }
    ).populate('doctor', 'firstName lastName specialty')
    if (!appointment) return res.status(404).json({ error: 'Appointment not found' })
    res.json(appointment)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports = { syncPatient, getMe, getDashboard, updateProfileImage, bookAppointment, getMyAppointments, getReminders, uploadReport }
