require('dotenv').config()
const { Pool } = require('pg')

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

const DOCTOR_CLERK_ID = process.env.DOCTOR_CLERK_ID
if (!DOCTOR_CLERK_ID) {
  console.error('ERROR: Add DOCTOR_CLERK_ID=user_xxxx to your .env file')
  process.exit(1)
}

const today = new Date()
today.setHours(0, 0, 0, 0)
const d = (n) => { const x = new Date(today); x.setDate(x.getDate() + n); return x.toISOString().split('T')[0] }

const patients = [
  { clerkId: 'patient_seed_1', firstName: 'Sarah',   lastName: 'Johnson', email: 'sarah.johnson@email.com',  phone: '555-0101', gender: 'Female', dob: '1990-04-12' },
  { clerkId: 'patient_seed_2', firstName: 'Mark',    lastName: 'Williams',email: 'mark.williams@email.com',  phone: '555-0102', gender: 'Male',   dob: '1985-08-23' },
  { clerkId: 'patient_seed_3', firstName: 'Emily',   lastName: 'Davis',   email: 'emily.davis@email.com',    phone: '555-0103', gender: 'Female', dob: '1995-01-30' },
  { clerkId: 'patient_seed_4', firstName: 'James',   lastName: 'Brown',   email: 'james.brown@email.com',    phone: '555-0104', gender: 'Male',   dob: '1978-11-05' },
  { clerkId: 'patient_seed_5', firstName: 'Alice',   lastName: 'Turner',  email: 'alice.turner@email.com',   phone: '555-0105', gender: 'Female', dob: '2000-06-18' },
  { clerkId: 'patient_seed_6', firstName: 'Robert',  lastName: 'King',    email: 'robert.king@email.com',    phone: '555-0106', gender: 'Male',   dob: '1970-03-27' },
  { clerkId: 'patient_seed_7', firstName: 'Nina',    lastName: 'Patel',   email: 'nina.patel@email.com',     phone: '555-0107', gender: 'Female', dob: '1993-09-14' },
  { clerkId: 'patient_seed_8', firstName: 'Carlos',  lastName: 'Mendez',  email: 'carlos.mendez@email.com',  phone: '555-0108', gender: 'Male',   dob: '1988-12-02' },
]

const extraDoctors = [
  { clerkId: 'doctor_seed_1', firstName: 'Priya',  lastName: 'Sharma',  title: 'Dr.', designation: 'Consultant',         email: 'priya.sharma@mediconnect.com',   specialty: 'Cardiologist',       experience: 12, location: 'Mumbai, India',   phone: '555-0201', bio: 'Specialist in heart diseases and cardiac rehabilitation.' },
  { clerkId: 'doctor_seed_2', firstName: 'James',  lastName: 'Carter',  title: 'Dr.', designation: 'Senior Consultant',   email: 'james.carter@mediconnect.com',   specialty: 'Neurologist',        experience: 15, location: 'London, UK',      phone: '555-0202', bio: 'Expert in neurological disorders including epilepsy and stroke.' },
  { clerkId: 'doctor_seed_3', firstName: 'Aisha',  lastName: 'Khan',    title: 'Dr.', designation: 'Consultant',         email: 'aisha.khan@mediconnect.com',     specialty: 'Dermatologist',      experience: 8,  location: 'Dubai, UAE',      phone: '555-0203', bio: 'Specializes in skin, hair and nail conditions.' },
  { clerkId: 'doctor_seed_4', firstName: 'Carlos', lastName: 'Rivera',  title: 'Dr.', designation: 'Associate Professor', email: 'carlos.rivera@mediconnect.com',  specialty: 'Orthopedic Surgeon', experience: 18, location: 'Miami, USA',      phone: '555-0204', bio: 'Bone and joint specialist with expertise in sports injuries.' },
  { clerkId: 'doctor_seed_5', firstName: 'Emily',  lastName: 'Chen',    title: 'Dr.', designation: 'Consultant',         email: 'emily.chen@mediconnect.com',     specialty: 'Pediatrician',       experience: 9,  location: 'Toronto, Canada', phone: '555-0205', bio: 'Dedicated to child health from newborns to adolescents.' },
  { clerkId: 'doctor_seed_6', firstName: 'Omar',   lastName: 'Hassan',  title: 'Dr.', designation: 'Senior Consultant',   email: 'omar.hassan@mediconnect.com',    specialty: 'Psychiatrist',       experience: 11, location: 'Cairo, Egypt',    phone: '555-0206', bio: 'Mental health specialist focusing on anxiety and depression.' },
  { clerkId: 'doctor_seed_7', firstName: 'Sofia',  lastName: 'Rossi',   title: 'Dr.', designation: 'Consultant',         email: 'sofia.rossi@mediconnect.com',    specialty: 'Gynecologist',       experience: 14, location: 'Rome, Italy',     phone: '555-0207', bio: 'Women health specialist with focus on reproductive medicine.' },
  { clerkId: 'doctor_seed_8', firstName: 'Raj',    lastName: 'Patel',   title: 'Dr.', designation: 'Consultant',         email: 'raj.patel@mediconnect.com',      specialty: 'Endocrinologist',    experience: 10, location: 'Chicago, USA',    phone: '555-0208', bio: 'Diabetes and thyroid disorder specialist.' },
  { clerkId: 'doctor_seed_9', firstName: 'Yuki',   lastName: 'Tanaka',  title: 'Dr.', designation: 'Senior Consultant',   email: 'yuki.tanaka@mediconnect.com',    specialty: 'Ophthalmologist',    experience: 13, location: 'Tokyo, Japan',    phone: '555-0209', bio: 'Eye care specialist with expertise in cataract and LASIK surgery.' },
]

async function seed() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Clean up seed data
    await client.query('DELETE FROM appointments')
    await client.query("DELETE FROM patients WHERE clerk_id LIKE 'patient_seed_%'")
    await client.query(`DELETE FROM doctors WHERE clerk_id = '${DOCTOR_CLERK_ID}'`)
    await client.query("DELETE FROM doctors WHERE clerk_id LIKE 'doctor_seed_%'")

    // Create main doctor
    const { rows: [doctor] } = await client.query(
      `INSERT INTO doctors (clerk_id, first_name, last_name, title, designation, email, specialty, experience, location, phone, bio, availability)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [DOCTOR_CLERK_ID, 'John', 'Smith', 'Dr.', 'Senior Consultant', 'dr.john.smith@mediconnect.com',
       'General Physician', 10, 'New York, USA', '555-0200',
       'Experienced general physician with 10+ years of practice in internal medicine and preventive care.',
       JSON.stringify([
         { day: 'Monday',    startTime: '09:00', endTime: '17:00', isAvailable: true  },
         { day: 'Tuesday',   startTime: '09:00', endTime: '17:00', isAvailable: true  },
         { day: 'Wednesday', startTime: '09:00', endTime: '13:00', isAvailable: true  },
         { day: 'Thursday',  startTime: '09:00', endTime: '17:00', isAvailable: true  },
         { day: 'Friday',    startTime: '09:00', endTime: '15:00', isAvailable: true  },
         { day: 'Saturday',  startTime: '10:00', endTime: '13:00', isAvailable: false },
         { day: 'Sunday',    startTime: '00:00', endTime: '00:00', isAvailable: false },
       ])]
    )
    console.log('✔ Doctor created:', doctor.first_name, doctor.last_name)

    for (const doc of extraDoctors) {
      await client.query(
        `INSERT INTO doctors (clerk_id, first_name, last_name, title, designation, email, specialty, experience, location, phone, bio)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT DO NOTHING`,
        [doc.clerkId, doc.firstName, doc.lastName, doc.title, doc.designation, doc.email, doc.specialty, doc.experience, doc.location, doc.phone, doc.bio]
      )
    }
    console.log(`✔ ${extraDoctors.length} extra doctors created`)

    const patientIds = []
    for (const p of patients) {
      const { rows: [pat] } = await client.query(
        `INSERT INTO patients (clerk_id, first_name, last_name, email, phone, gender, dob)
         VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (clerk_id) DO UPDATE SET updated_at = NOW() RETURNING id`,
        [p.clerkId, p.firstName, p.lastName, p.email, p.phone, p.gender, p.dob]
      )
      patientIds.push(pat.id)
    }
    console.log(`✔ ${patientIds.length} patients created`)

    const appointments = [
      { pIdx: 0, date: d(0),  time: '09:00 AM', status: 'Confirmed', reason: 'Annual checkup',       consultationType: 'video',  symptoms: 'Routine annual checkup, no specific complaints.',          medicalHistory: 'No known allergies. Mild hypertension managed with diet.',  patientAge: 34, patientGender: 'Female' },
      { pIdx: 1, date: d(0),  time: '10:30 AM', status: 'Confirmed', reason: 'Fever and cold',        consultationType: 'audio',  symptoms: 'High fever (102°F), runny nose, sore throat for 3 days.',  medicalHistory: 'Seasonal allergies. No chronic conditions.',                patientAge: 39, patientGender: 'Male'   },
      { pIdx: 2, date: d(0),  time: '12:00 PM', status: 'Pending',   reason: 'Follow-up visit',       consultationType: 'video',  symptoms: 'Follow-up for previously prescribed antibiotics.',          medicalHistory: 'Completed antibiotic course for UTI last week.',            patientAge: 29, patientGender: 'Female' },
      { pIdx: 3, date: d(1),  time: '11:00 AM', status: 'Pending',   reason: 'Headache and dizziness',consultationType: 'video',  symptoms: 'Persistent headache for 5 days, occasional dizziness.',    medicalHistory: 'No significant history.',                                   patientAge: 46, patientGender: 'Male'   },
      { pIdx: 4, date: d(2),  time: '03:00 PM', status: 'Pending',   reason: 'Diabetes follow-up',    consultationType: 'video',  symptoms: 'Elevated blood sugar readings at home.',                    medicalHistory: 'Type 2 Diabetes diagnosed 3 years ago. On Metformin.',     patientAge: 24, patientGender: 'Female' },
      { pIdx: 5, date: d(4),  time: '09:30 AM', status: 'Pending',   reason: 'Blood pressure check',  consultationType: 'video',  symptoms: 'Occasional chest tightness, BP readings 145/90 at home.',  medicalHistory: 'Hypertension. On Amlodipine 5mg.',                          patientAge: 54, patientGender: 'Male'   },
      {
        pIdx: 6, date: d(-3), time: '10:00 AM', status: 'Completed', reason: 'Migraine evaluation', consultationType: 'video',
        consultationEnded: true, symptoms: 'Severe migraine episodes twice a week.', medicalHistory: 'Chronic migraines since age 20.',
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
        pIdx: 7, date: d(-5), time: '02:00 PM', status: 'Completed', reason: 'Chest pain evaluation', consultationType: 'audio',
        consultationEnded: true, symptoms: 'Intermittent chest pain, shortness of breath on exertion.', medicalHistory: 'Smoker for 10 years, quit 2 years ago.',
        patientAge: 36, patientGender: 'Male',
        consultationNotes: 'ECG normal. Likely musculoskeletal. Referred for stress test as precaution.',
        diagnosis: 'Musculoskeletal chest pain — rule out cardiac',
        prescription: [
          { medicine: 'Ibuprofen',   dosage: '400mg', duration: '7 days', notes: 'After meals' },
          { medicine: 'Omeprazole',  dosage: '20mg',  duration: '7 days', notes: 'Before breakfast' },
        ],
        consultationFee: 150, feePaid: true,
      },
      {
        pIdx: 0, date: d(-7), time: '11:00 AM', status: 'Completed', reason: 'Skin rash', consultationType: 'video',
        consultationEnded: true, symptoms: 'Red itchy rash on forearms and neck for 1 week.', medicalHistory: 'No known drug allergies.',
        patientAge: 34, patientGender: 'Female',
        consultationNotes: 'Contact dermatitis likely from new detergent. Advised to switch products.',
        diagnosis: 'Contact Dermatitis',
        prescription: [
          { medicine: 'Hydrocortisone cream', dosage: '1%',  duration: '10 days', notes: 'Apply twice daily on affected area' },
          { medicine: 'Cetirizine',           dosage: '10mg', duration: '7 days',  notes: 'Once daily at night' },
        ],
        consultationFee: 100, feePaid: false,
      },
    ]

    for (const a of appointments) {
      await client.query(
        `INSERT INTO appointments
          (doctor_id, patient_id, date, time, status, reason, consultation_type, symptoms, medical_history,
           patient_age, patient_gender, consultation_notes, diagnosis, prescription, consultation_fee, fee_paid, consultation_ended)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
        [doctor.id, patientIds[a.pIdx], a.date, a.time, a.status, a.reason, a.consultationType || 'video',
         a.symptoms || '', a.medicalHistory || '', a.patientAge || null, a.patientGender || '',
         a.consultationNotes || '', a.diagnosis || '', JSON.stringify(a.prescription || []),
         a.consultationFee || 0, a.feePaid || false, a.consultationEnded || false]
      )
    }
    console.log(`✔ ${appointments.length} appointments created`)

    await client.query('COMMIT')
    console.log('\n✅ Seed complete!')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('❌ Seed failed:', err.message)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

seed()
