const Appointment = require('../models/Appointment')
const Doctor = require('../models/Doctor')

const getConsultation = async (req, res) => {
  try {
    const appt = await Appointment.findById(req.params.id)
      .populate('patient', 'firstName lastName email phone dob gender')
      .populate('doctor', 'firstName lastName title specialty')
    if (!appt) return res.status(404).json({ error: 'Appointment not found' })
    res.json(appt)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const saveConsultationNotes = async (req, res) => {
  try {
    const { consultationNotes, diagnosis, prescription, consultationFee, feePaid } = req.body
    const appt = await Appointment.findByIdAndUpdate(
      req.params.id,
      { $set: { consultationNotes, diagnosis, prescription, consultationFee, feePaid } },
      { returnDocument: 'after' }
    ).populate('patient', 'firstName lastName email phone dob gender')
    if (!appt) return res.status(404).json({ error: 'Appointment not found' })
    res.json(appt)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const endConsultation = async (req, res) => {
  try {
    const appt = await Appointment.findByIdAndUpdate(
      req.params.id,
      { $set: { consultationEnded: true, status: 'Completed' } },
      { returnDocument: 'after' }
    ).populate('patient', 'firstName lastName')
    if (!appt) return res.status(404).json({ error: 'Appointment not found' })
    res.json(appt)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const getEarnings = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ clerkId: req.auth.userId })
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' })

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [allEarnings, monthEarnings, prescriptionsCount, completedCount] = await Promise.all([
      Appointment.aggregate([
        { $match: { doctor: doctor._id, feePaid: true } },
        { $group: { _id: null, total: { $sum: '$consultationFee' } } }
      ]),
      Appointment.aggregate([
        { $match: { doctor: doctor._id, feePaid: true, createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$consultationFee' } } }
      ]),
      Appointment.countDocuments({ doctor: doctor._id, prescription: { $exists: true, $not: { $size: 0 } } }),
      Appointment.countDocuments({ doctor: doctor._id, status: 'Completed' }),
    ])

    res.json({
      totalEarnings:    allEarnings[0]?.total || 0,
      monthlyEarnings:  monthEarnings[0]?.total || 0,
      prescriptionsIssued: prescriptionsCount,
      completedConsultations: completedCount,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const getPreviousConsultations = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ clerkId: req.auth.userId })
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' })
    const consultations = await Appointment.find({ doctor: doctor._id, status: 'Completed' })
      .populate('patient', 'firstName lastName email gender')
      .sort({ date: -1 })
      .limit(50)
    res.json(consultations)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports = { getConsultation, saveConsultationNotes, endConsultation, getEarnings, getPreviousConsultations }
