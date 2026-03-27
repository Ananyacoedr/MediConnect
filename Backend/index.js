require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const http = require('http')
const { Server } = require('socket.io')

const doctorRoutes       = require('./src/routes/doctor')
const appointmentRoutes  = require('./src/routes/appointment')
const consultationRoutes = require('./src/routes/consultation')
const patientRoutes      = require('./src/routes/patient')
const cartRoutes         = require('./src/routes/cart')
const productRoutes      = require('./src/routes/product')
const orderRoutes        = require('./src/routes/order')
const wishlistRoutes     = require('./src/routes/wishlist')

const app    = express()
const server = http.createServer(app)
const io     = new Server(server, { cors: { origin: '*' } })

app.use(cors({ origin: '*', credentials: true }))
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

// ── Socket.io Real-time Signaling ──────────────────────────────────────────
// Map: userId -> socketId
const onlineUsers = {}

io.on('connection', (socket) => {

  // Register user (patient or doctor) with their userId
  socket.on('register', (userId) => {
    onlineUsers[userId] = socket.id
    socket.userId = userId
    io.emit('online-users', Object.keys(onlineUsers))
  })

  // Patient calls doctor
  socket.on('call-user', ({ to, from, fromName, offer, type }) => {
    const targetSocket = onlineUsers[to]
    if (targetSocket) {
      io.to(targetSocket).emit('incoming-call', { from, fromName, offer, type })
    }
  })

  // Doctor answers call
  socket.on('call-answer', ({ to, answer }) => {
    const targetSocket = onlineUsers[to]
    if (targetSocket) {
      io.to(targetSocket).emit('call-answered', { answer })
    }
  })

  // ICE candidates exchange
  socket.on('ice-candidate', ({ to, candidate }) => {
    const targetSocket = onlineUsers[to]
    if (targetSocket) {
      io.to(targetSocket).emit('ice-candidate', { candidate })
    }
  })

  // Call rejected
  socket.on('call-rejected', ({ to }) => {
    const targetSocket = onlineUsers[to]
    if (targetSocket) {
      io.to(targetSocket).emit('call-rejected')
    }
  })

  // Call ended
  socket.on('call-ended', ({ to }) => {
    const targetSocket = onlineUsers[to]
    if (targetSocket) {
      io.to(targetSocket).emit('call-ended')
    }
  })

  // Disconnect
  socket.on('disconnect', () => {
    if (socket.userId) {
      delete onlineUsers[socket.userId]
      io.emit('online-users', Object.keys(onlineUsers))
    }
  })
})

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected')
    server.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`))
  })
  .catch(err => { console.error('MongoDB connection error:', err); process.exit(1) })
