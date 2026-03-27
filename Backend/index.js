require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')

const doctorRoutes       = require('./src/routes/doctor')
const appointmentRoutes  = require('./src/routes/appointment')
const consultationRoutes = require('./src/routes/consultation')
const patientRoutes      = require('./src/routes/patient')
const cartRoutes         = require('./src/routes/cart')
const productRoutes      = require('./src/routes/product')
const orderRoutes        = require('./src/routes/order')
const wishlistRoutes     = require('./src/routes/wishlist')

const app = express()

app.use(cors({ origin: /^http:\/\/localhost:\d+$/, credentials: true }))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))

app.use('/api/doctors',       doctorRoutes)
app.use('/api/appointments',  appointmentRoutes)
app.use('/api/consultations', consultationRoutes)
app.use('/api/patients',      patientRoutes)
app.use('/api/cart',          cartRoutes)
app.use('/api/products',      productRoutes)
app.use('/api/orders',        orderRoutes)
app.use('/api/wishlist',      wishlistRoutes)

app.get('/health', (_, res) => res.json({ status: 'ok' }))

// ── In-memory WebRTC Signaling ──────────────────────────────────────────────
const rooms = {} // roomId -> { offer, answer, iceCandidates: [] }

const getRoom = (id) => {
  if (!rooms[id]) rooms[id] = { offer: null, answer: null, iceCandidates: [] }
  return rooms[id]
}

// Push signal data
app.post('/api/signal/:roomId', (req, res) => {
  const room = getRoom(req.params.roomId)
  const { type, data } = req.body
  if (type === 'offer')         room.offer = data
  else if (type === 'answer')   room.answer = data
  else if (type === 'ice')      room.iceCandidates.push(data)
  else if (type === 'end')      { delete rooms[req.params.roomId] }
  res.json({ ok: true })
})

// Poll signal data
app.get('/api/signal/:roomId', (req, res) => {
  const room = getRoom(req.params.roomId)
  const { since = 0, role } = req.query
  // Return what the OTHER role needs
  res.json({
    offer:          role === 'patient' ? room.offer   : null,
    answer:         role === 'doctor'  ? room.answer  : null,
    iceCandidates:  room.iceCandidates.slice(Number(since)),
    ended:          !rooms[req.params.roomId] && since > 0,
  })
})

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected')
    app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`))
  })
  .catch(err => { console.error('MongoDB connection error:', err); process.exit(1) })
