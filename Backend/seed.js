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

const today = new Date()
today.setHours(0, 0, 0, 0)
const d = (n) => { const x = new Date(today); x.setDate(x.getDate() + n); return x }

const patients = [
  { clerkId: 'patient_seed_1', firstName: 'Sarah',   lastName: 'Johnson', email: 'sarah.johnson@email.com',  phone: '555-0101', gender: 'Female', dob: new Date('1990-04-12') },
  { clerkId: 'patient_seed_2', firstName: 'Mark',    lastName: 'Williams',email: 'mark.williams@email.com',  phone: '555-0102', gender: 'Male',   dob: new Date('1985-08-23') },
  { clerkId: 'patient_seed_3', firstName: 'Emily',   lastName: 'Davis',   email: 'emily.davis@email.com',    phone: '555-0103', gender: 'Female', dob: new Date('1995-01-30') },
  { clerkId: 'patient_seed_4', firstName: 'James',   lastName: 'Brown',   email: 'james.brown@email.com',    phone: '555-0104', gender: 'Male',   dob: new Date('1978-11-05') },
  { clerkId: 'patient_seed_5', firstName: 'Alice',   lastName: 'Turner',  email: 'alice.turner@email.com',   phone: '555-0105', gender: 'Female', dob: new Date('2000-06-18') },
  { clerkId: 'patient_seed_6', firstName: 'Robert',  lastName: 'King',    email: 'robert.king@email.com',    phone: '555-0106', gender: 'Male',   dob: new Date('1970-03-27') },
  { clerkId: 'patient_seed_7', firstName: 'Nina',    lastName: 'Patel',   email: 'nina.patel@email.com',     phone: '555-0107', gender: 'Female', dob: new Date('1993-09-14') },
  { clerkId: 'patient_seed_8', firstName: 'Carlos',  lastName: 'Mendez',  email: 'carlos.mendez@email.com',  phone: '555-0108', gender: 'Male',   dob: new Date('1988-12-02') },
]

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('MongoDB connected')

  await Appointment.deleteMany({})
  await Patient.deleteMany({ clerkId: { $regex: /^patient_seed_/ } })
  await Doctor.deleteMany({ clerkId: DOCTOR_CLERK_ID })

  const doctor = await Doctor.create({
    clerkId:     DOCTOR_CLERK_ID,
    firstName:   'John',
    lastName:    'Smith',
    title:       'Dr.',
    designation: 'Senior Consultant',
    email:       'dr.john.smith@mediconnect.com',
    specialty:   'General Physician',
    experience:  10,
    location:    'New York, USA',
    phone:       '555-0200',
    bio:         'Experienced general physician with 10+ years of practice in internal medicine and preventive care.',
    availability: [
      { day: 'Monday',    startTime: '09:00', endTime: '17:00', isAvailable: true  },
      { day: 'Tuesday',   startTime: '09:00', endTime: '17:00', isAvailable: true  },
      { day: 'Wednesday', startTime: '09:00', endTime: '13:00', isAvailable: true  },
      { day: 'Thursday',  startTime: '09:00', endTime: '17:00', isAvailable: true  },
      { day: 'Friday',    startTime: '09:00', endTime: '15:00', isAvailable: true  },
      { day: 'Saturday',  startTime: '10:00', endTime: '13:00', isAvailable: false },
      { day: 'Sunday',    startTime: '00:00', endTime: '00:00', isAvailable: false },
    ],
  })
  console.log('✔ Doctor created:', doctor.firstName, doctor.lastName)

  const p = await Patient.insertMany(patients)
  console.log(`✔ ${p.length} patients created`)

  const appointments = [
    // ── TODAY (shows in Today's Schedule + Consultations section) ──
    {
      patient: p[0]._id, date: d(0), time: '09:00 AM', status: 'Confirmed',
      reason: 'Annual checkup', consultationType: 'video',
      symptoms: 'Routine annual checkup, no specific complaints.',
      medicalHistory: 'No known allergies. Mild hypertension managed with diet.',
      patientAge: 34, patientGender: 'Female',
    },
    {
      patient: p[1]._id, date: d(0), time: '10:30 AM', status: 'Confirmed',
      reason: 'Fever and cold', consultationType: 'audio',
      symptoms: 'High fever (102°F), runny nose, sore throat for 3 days.',
      medicalHistory: 'Seasonal allergies. No chronic conditions.',
      patientAge: 39, patientGender: 'Male',
    },
    {
      patient: p[2]._id, date: d(0), time: '12:00 PM', status: 'Pending',
      reason: 'Follow-up visit', consultationType: 'video',
      symptoms: 'Follow-up for previously prescribed antibiotics.',
      medicalHistory: 'Completed antibiotic course for UTI last week.',
      patientAge: 29, patientGender: 'Female',
    },

    // ── UPCOMING PENDING REQUESTS (shows in Upcoming Requests card) ──
    {
      patient: p[3]._id, date: d(1), time: '11:00 AM', status: 'Pending',
      reason: 'Headache and dizziness',
      symptoms: 'Persistent headache for 5 days, occasional dizziness.',
      medicalHistory: 'No significant history.',
      patientAge: 46, patientGender: 'Male',
    },
    {
      patient: p[4]._id, date: d(2), time: '03:00 PM', status: 'Pending',
      reason: 'Diabetes follow-up',
      symptoms: 'Elevated blood sugar readings at home.',
      medicalHistory: 'Type 2 Diabetes diagnosed 3 years ago. On Metformin.',
      patientAge: 24, patientGender: 'Female',
    },
    {
      patient: p[5]._id, date: d(4), time: '09:30 AM', status: 'Pending',
      reason: 'Blood pressure check',
      symptoms: 'Occasional chest tightness, BP readings 145/90 at home.',
      medicalHistory: 'Hypertension. On Amlodipine 5mg.',
      patientAge: 54, patientGender: 'Male',
    },

    // ── COMPLETED CONSULTATIONS (shows in Past Consultations section) ──
    {
      patient: p[6]._id, date: d(-3), time: '10:00 AM', status: 'Completed',
      reason: 'Migraine evaluation', consultationType: 'video',
      consultationEnded: true,
      symptoms: 'Severe migraine episodes twice a week.',
      medicalHistory: 'Chronic migraines since age 20.',
      patientAge: 31, patientGender: 'Female',
      consultationNotes: 'Patient reports migraines triggered by stress and screen time. Advised lifestyle changes.',
      diagnosis: 'Chronic Migraine — Tension type',
      prescription: [
        { medicine: 'Sumatriptan', dosage: '50mg', duration: '5 days', notes: 'Take at onset of migraine' },
        { medicine: 'Propranolol', dosage: '40mg', duration: '30 days', notes: 'Once daily, preventive' },
      ],
      consultationFee: 120, feePaid: true,
    },
    {
      patient: p[7]._id, date: d(-5), time: '02:00 PM', status: 'Completed',
      reason: 'Chest pain evaluation', consultationType: 'audio',
      consultationEnded: true,
      symptoms: 'Intermittent chest pain, shortness of breath on exertion.',
      medicalHistory: 'Smoker for 10 years, quit 2 years ago.',
      patientAge: 36, patientGender: 'Male',
      consultationNotes: 'ECG normal. Likely musculoskeletal. Referred for stress test as precaution.',
      diagnosis: 'Musculoskeletal chest pain — rule out cardiac',
      prescription: [
        { medicine: 'Ibuprofen', dosage: '400mg', duration: '7 days', notes: 'After meals' },
        { medicine: 'Omeprazole', dosage: '20mg', duration: '7 days', notes: 'Before breakfast' },
      ],
      consultationFee: 150, feePaid: true,
    },
    {
      patient: p[0]._id, date: d(-7), time: '11:00 AM', status: 'Completed',
      reason: 'Skin rash', consultationType: 'video',
      consultationEnded: true,
      symptoms: 'Red itchy rash on forearms and neck for 1 week.',
      medicalHistory: 'No known drug allergies.',
      patientAge: 34, patientGender: 'Female',
      consultationNotes: 'Contact dermatitis likely from new detergent. Advised to switch products.',
      diagnosis: 'Contact Dermatitis',
      prescription: [
        { medicine: 'Hydrocortisone cream', dosage: '1%', duration: '10 days', notes: 'Apply twice daily on affected area' },
        { medicine: 'Cetirizine', dosage: '10mg', duration: '7 days', notes: 'Once daily at night' },
      ],
      consultationFee: 100, feePaid: false,
    },
  ]

  await Appointment.insertMany(appointments.map(a => ({ ...a, doctor: doctor._id })))
  console.log(`✔ ${appointments.length} appointments created`)

  console.log('\n✅ Seed complete!')
  console.log('   Today (Confirmed/Pending): 3')
  console.log('   Pending Requests:          3')
  console.log('   Completed Consultations:   3')
  await mongoose.disconnect()
}

seed().catch(err => { console.error(err); process.exit(1) })
