const Patient = require('../models/Patient')
const Appointment = require('../models/Appointment')
const MedicineCart = require('../models/MedicineCart')
require('../models/Doctor')

// Simulated stock — in production this would query a pharmacy DB
const OUT_OF_STOCK = ['Sumatriptan', 'Propranolol']
const ALTERNATIVES = {
  'Sumatriptan':  'Rizatriptan 10mg',
  'Propranolol':  'Metoprolol 50mg',
}

const getCart = async (req, res) => {
  try {
    const patient = await Patient.findOne({ clerkId: req.auth.userId })
    if (!patient) return res.status(404).json({ error: 'Patient not found' })

    const items = await MedicineCart.find({ patient: patient._id, ordered: false })
      .populate('appointment', 'date time diagnosis doctor')
      .sort({ createdAt: -1 })

    res.json(items)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const autofillCart = async (req, res) => {
  try {
    const patient = await Patient.findOne({ clerkId: req.auth.userId })
    if (!patient) return res.status(404).json({ error: 'Patient not found' })

    const appt = await Appointment.findById(req.params.appointmentId)
      .populate('doctor', 'firstName lastName title')
    if (!appt) return res.status(404).json({ error: 'Appointment not found' })
    if (!appt.prescription?.length) return res.status(400).json({ error: 'No prescription on this appointment' })

    // Remove any existing unordered cart items for this appointment
    await MedicineCart.deleteMany({ patient: patient._id, appointment: appt._id, ordered: false })

    const cartItems = appt.prescription.map(p => ({
      patient:     patient._id,
      appointment: appt._id,
      medicine:    p.medicine,
      dosage:      p.dosage,
      duration:    p.duration,
      notes:       p.notes,
      quantity:    1,
      inStock:     !OUT_OF_STOCK.includes(p.medicine),
      alternative: ALTERNATIVES[p.medicine] || '',
      doctorName:  `${appt.doctor?.title || 'Dr.'} ${appt.doctor?.firstName} ${appt.doctor?.lastName}`,
      diagnosis:   appt.diagnosis || '',
    }))

    const created = await MedicineCart.insertMany(cartItems)
    res.json(created)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const updateCartItem = async (req, res) => {
  try {
    const item = await MedicineCart.findByIdAndUpdate(
      req.params.itemId,
      { $set: req.body },
      { returnDocument: 'after' }
    )
    if (!item) return res.status(404).json({ error: 'Item not found' })
    res.json(item)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const removeCartItem = async (req, res) => {
  try {
    await MedicineCart.findByIdAndDelete(req.params.itemId)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const orderAll = async (req, res) => {
  try {
    const patient = await Patient.findOne({ clerkId: req.auth.userId })
    if (!patient) return res.status(404).json({ error: 'Patient not found' })

    const result = await MedicineCart.updateMany(
      { patient: patient._id, ordered: false, inStock: true },
      { $set: { ordered: true } }
    )
    res.json({ orderedCount: result.modifiedCount })
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
      status: 'Completed',
      prescription: { $exists: true, $not: { $size: 0 } },
    })
      .populate('doctor', 'firstName lastName title specialty')
      .sort({ date: -1 })

    res.json(appointments)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports = { getCart, autofillCart, updateCartItem, removeCartItem, orderAll, getPrescriptions }
