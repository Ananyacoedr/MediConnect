const Order = require('../models/Order')
const Patient = require('../models/Patient')
const Product = require('../models/Product')

const placeOrder = async (req, res) => {
  try {
    const patient = await Patient.findOne({ clerkId: req.auth.userId })
    if (!patient) return res.status(404).json({ error: 'Patient not found' })

    const { items, address, prescriptionUrl } = req.body
    if (!items?.length) return res.status(400).json({ error: 'No items in order' })

    let totalAmount = 0
    const enriched = []
    for (const item of items) {
      const product = await Product.findById(item.productId)
      if (!product) continue
      const price = +(product.price * (1 - product.discountPercent / 100)).toFixed(2)
      totalAmount += price * item.quantity
      enriched.push({ product: product._id, name: product.name, price, quantity: item.quantity })
    }

    const needsRx = await Product.exists({ _id: { $in: enriched.map(i => i.product) }, requiresPrescription: true })
    const prescriptionStatus = needsRx ? (prescriptionUrl ? 'pending' : 'pending') : 'not-required'

    const order = await Order.create({
      patient: patient._id, items: enriched, totalAmount: +totalAmount.toFixed(2),
      address, prescriptionUrl: prescriptionUrl || '', prescriptionStatus,
    })
    res.status(201).json(order)
  } catch (err) { res.status(500).json({ error: err.message }) }
}

const getMyOrders = async (req, res) => {
  try {
    const patient = await Patient.findOne({ clerkId: req.auth.userId })
    if (!patient) return res.status(404).json({ error: 'Patient not found' })
    const orders = await Order.find({ patient: patient._id }).populate('items.product').sort({ createdAt: -1 })
    res.json(orders)
  } catch (err) { res.status(500).json({ error: err.message }) }
}

const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate('patient', 'firstName lastName email').populate('items.product').sort({ createdAt: -1 })
    res.json(orders)
  } catch (err) { res.status(500).json({ error: err.message }) }
}

const updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true })
    if (!order) return res.status(404).json({ error: 'Order not found' })
    res.json(order)
  } catch (err) { res.status(500).json({ error: err.message }) }
}

const updatePrescriptionStatus = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, { prescriptionStatus: req.body.prescriptionStatus }, { new: true })
    if (!order) return res.status(404).json({ error: 'Order not found' })
    res.json(order)
  } catch (err) { res.status(500).json({ error: err.message }) }
}

module.exports = { placeOrder, getMyOrders, getAllOrders, updateOrderStatus, updatePrescriptionStatus }
