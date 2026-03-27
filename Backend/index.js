require('dotenv').config()
const express = require('express')
const cors    = require('cors')
const pool    = require('./src/db')

const doctorRoutes       = require('./src/routes/doctor')
const appointmentRoutes  = require('./src/routes/appointment')
const consultationRoutes = require('./src/routes/consultation')
const patientRoutes      = require('./src/routes/patient')
const cartRoutes         = require('./src/routes/cart')

const app = express()

app.use(cors({ origin: 'http://localhost:5173', credentials: true }))
app.use(express.json({ limit: '10mb' }))

app.use('/api/doctors',       doctorRoutes)
app.use('/api/appointments',  appointmentRoutes)
app.use('/api/consultations', consultationRoutes)
app.use('/api/patients',      patientRoutes)
app.use('/api/cart',          cartRoutes)

app.get('/health', (_, res) => res.json({ status: 'ok' }))

pool.connect()
  .then(client => {
    client.release()
    console.log('PostgreSQL connected')
    app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`))
  })
  .catch(err => { console.error('PostgreSQL connection error:', err); process.exit(1) })
