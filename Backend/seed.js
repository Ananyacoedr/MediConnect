require('dotenv').config()
const mongoose = require('mongoose')
const Doctor = require('./src/models/Doctor')
const Patient = require('./src/models/Patient')
const Appointment = require('./src/models/Appointment')

const DOCTOR_CLERK_ID = process.env.DOCTOR_CLERK_ID

if (!DOCTOR_CLERK_ID) {
  console.error('ERROR: Add DOCTOR_CLERK_ID=user_xxxx to your .env file')
  process.exit(1)
}

const patients = [
  { clerkId: 'patient_seed_1', firstName: 'Sarah',   lastName: 'Johnson', email: 'sarah.johnson@email.com',  phone: '555-0101', gender: 'Female' },
  { clerkId: 'patient_seed_2', firstName: 'Mark',    lastName: 'Williams',email: 'mark.williams@email.com',  phone: '555-0102', gender: 'Male'   },
  { clerkId: 'patient_seed_3', firstName: 'Emily',   lastName: 'Davis',   email: 'emily.davis@email.com',    phone: '555-0103', gender: 'Female' },
  { clerkId: 'patient_seed_4', firstName: 'James',   lastName: 'Brown',   email: 'james.brown@email.com',    phone: '555-0104', gender: 'Male'   },
  { clerkId: 'patient_seed_5', firstName: 'Alice',   lastName: 'Turner',  email: 'alice.turner@email.com',   phone: '555-0105', gender: 'Female' },
  { clerkId: 'patient_seed_6', firstName: 'Robert',  lastName: 'King',    email: 'robert.king@email.com',    phone: '555-0106', gender: 'Male'   },
  { clerkId: 'patient_seed_7', firstName: 'Nina',    lastName: 'Patel',   email: 'nina.patel@email.com',     phone: '555-0107', gender: 'Female' },
  { clerkId: 'patient_seed_8', firstName: 'Carlos',  lastName: 'Mendez',  email: 'carlos.mendez@email.com',  phone: '555-0108', gender: 'Male'   },
]

const today = new Date()
today.setHours(0, 0, 0, 0)

const daysFromNow = (n) => {
  const d = new Date(today)
  d.setDate(d.getDate() + n)
  return d
}

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('MongoDB connected')

  // Clear existing seed data
  await Appointment.deleteMany({})
  await Patient.deleteMany({ clerkId: { $regex: /^patient_seed_/ } })
  await Doctor.deleteMany({ clerkId: DOCTOR_CLERK_ID })

  // Create doctor linked to your real Clerk account
  const doctor = await Doctor.create({
    clerkId:   DOCTOR_CLERK_ID,
    firstName: 'John',
    lastName:  'Smith',
    email:     'dr.john.smith@mediconnect.com',
    specialty: 'General Physician',
    phone:     '555-0200',
    bio:       'Experienced general physician with 10+ years of practice.',
    availability: [
      { day: 'Monday',    startTime: '09:00', endTime: '17:00', isAvailable: true },
      { day: 'Tuesday',   startTime: '09:00', endTime: '17:00', isAvailable: true },
      { day: 'Wednesday', startTime: '09:00', endTime: '13:00', isAvailable: true },
      { day: 'Thursday',  startTime: '09:00', endTime: '17:00', isAvailable: true },
      { day: 'Friday',    startTime: '09:00', endTime: '15:00', isAvailable: true },
      { day: 'Saturday',  startTime: '10:00', endTime: '13:00', isAvailable: false },
      { day: 'Sunday',    startTime: '00:00', endTime: '00:00', isAvailable: false },
    ],
  })
  console.log('Doctor created:', doctor.firstName, doctor.lastName)

  // Create patients
  const createdPatients = await Patient.insertMany(patients)
  console.log(`${createdPatients.length} patients created`)

  // Create appointments
  const appointments = [
    // Today - various statuses
    { patient: createdPatients[0]._id, date: daysFromNow(0), time: '09:00 AM', status: 'Confirmed', reason: 'Annual checkup'       },
    { patient: createdPatients[1]._id, date: daysFromNow(0), time: '10:30 AM', status: 'Pending',   reason: 'Fever and cold'        },
    { patient: createdPatients[2]._id, date: daysFromNow(0), time: '12:00 PM', status: 'Confirmed', reason: 'Follow-up visit'       },
    { patient: createdPatients[3]._id, date: daysFromNow(0), time: '02:00 PM', status: 'Cancelled', reason: 'Back pain'             },
    // Upcoming - pending requests
    { patient: createdPatients[4]._id, date: daysFromNow(1), time: '11:00 AM', status: 'Pending',   reason: 'Headache and dizziness'},
    { patient: createdPatients[5]._id, date: daysFromNow(3), time: '03:00 PM', status: 'Pending',   reason: 'Diabetes follow-up'    },
    { patient: createdPatients[6]._id, date: daysFromNow(4), time: '09:30 AM', status: 'Pending',   reason: 'Blood pressure check'  },
    // Past confirmed
    { patient: createdPatients[0]._id, date: daysFromNow(-5), time: '10:00 AM', status: 'Confirmed', reason: 'Skin rash'            },
    { patient: createdPatients[1]._id, date: daysFromNow(-3), time: '11:00 AM', status: 'Confirmed', reason: 'Routine blood test'   },
    { patient: createdPatients[2]._id, date: daysFromNow(-2), time: '02:00 PM', status: 'Confirmed', reason: 'Vaccination'          },
    { patient: createdPatients[3]._id, date: daysFromNow(-1), time: '09:00 AM', status: 'Confirmed', reason: 'Eye checkup'          },
    { patient: createdPatients[7]._id, date: daysFromNow(-1), time: '04:00 PM', status: 'Completed', reason: 'Chest pain evaluation'},
  ]

  await Appointment.insertMany(
    appointments.map(a => ({ ...a, doctor: doctor._id }))
  )
  console.log(`${appointments.length} appointments created`)

  console.log('\n✅ Seed complete!')
  console.log(`   Total Patients:          ${createdPatients.length}`)
  console.log(`   Today Appointments:      4`)
  console.log(`   Pending Requests:        3`)
  console.log(`   Confirmed (past):        5`)
  await mongoose.disconnect()
}

seed().catch(err => { console.error(err); process.exit(1) })
