require('dotenv').config()
const express = require('express')
const cors    = require('cors')
const http    = require('http')
const { Server } = require('socket.io')
const pool    = require('./src/db')

const doctorRoutes       = require('./src/routes/doctor')
const appointmentRoutes  = require('./src/routes/appointment')
const consultationRoutes = require('./src/routes/consultation')
const patientRoutes      = require('./src/routes/patient')
const cartRoutes         = require('./src/routes/cart')
const productRoutes      = require('./src/routes/product')
const orderRoutes        = require('./src/routes/order')
const wishlistRoutes     = require('./src/routes/wishlist')
const aiRoutes           = require('./src/routes/aiRoute')
const uploadRoutes       = require('./src/routes/upload')

const app    = express()
const server = http.createServer(app)
const io     = new Server(server, { cors: { origin: '*' } })

app.use(cors({ origin: true, credentials: true }))
app.use(express.json({ limit: '10mb' }))

app.use('/api/doctors',       doctorRoutes)
app.use('/api/appointments',  appointmentRoutes)
app.use('/api/consultations', consultationRoutes)
app.use('/api/patients',      patientRoutes)
app.use('/api/cart',          cartRoutes)
app.use('/api/products',      productRoutes)
app.use('/api/orders',        orderRoutes)
app.use('/api/wishlist',      wishlistRoutes)
app.use('/api/ai',            aiRoutes)
app.use('/api/upload',        uploadRoutes)

// ── Socket.io Real-time Signaling ──────────────────────────────────────────
const onlineUsers = {}

// make io accessible to controllers
app.set('io', io)
app.set('onlineUsers', onlineUsers)

app.get('/health', (_, res) => res.json({ status: 'ok' }))

io.on('connection', (socket) => {

  socket.on('register', (userId) => {
    onlineUsers[userId] = socket.id
    socket.userId = userId
    console.log(`[Socket] Registered: ${userId} -> ${socket.id}`)
    io.emit('online-users', Object.keys(onlineUsers))
  })

  socket.on('call-user', ({ to, from, fromName, offer, type }) => {
    const targetSocket = onlineUsers[to]
    if (targetSocket) io.to(targetSocket).emit('incoming-call', { from, fromName, offer, type })
  })

  socket.on('call-answer', ({ to, answer }) => {
    const targetSocket = onlineUsers[to]
    if (targetSocket) io.to(targetSocket).emit('call-answered', { answer })
  })

  socket.on('ice-candidate', ({ to, candidate }) => {
    const targetSocket = onlineUsers[to]
    if (targetSocket) io.to(targetSocket).emit('ice-candidate', { candidate })
  })

  socket.on('call-rejected', ({ to }) => {
    const targetSocket = onlineUsers[to]
    if (targetSocket) io.to(targetSocket).emit('call-rejected')
  })

  socket.on('call-ended', ({ to }) => {
    const targetSocket = onlineUsers[to]
    if (targetSocket) io.to(targetSocket).emit('call-ended')
  })

  socket.on('disconnect', () => {
    if (socket.userId) {
      delete onlineUsers[socket.userId]
      io.emit('online-users', Object.keys(onlineUsers))
    }
  })

  socket.on('join-chat', (roomId) => socket.join(roomId))

  socket.on('chat-message', ({ roomId, message }) => {
    io.to(roomId).emit('chat-message', message)
  })

  socket.on('typing', ({ roomId, name }) => socket.to(roomId).emit('typing', { name }))

  socket.on('stop-typing', ({ roomId }) => socket.to(roomId).emit('stop-typing'))
})

pool.connect()
  .then(client => {
    client.release()
    console.log('PostgreSQL connected')
    server.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`))
  })
  .catch(err => { console.error('PostgreSQL connection error:', err); process.exit(1) })
