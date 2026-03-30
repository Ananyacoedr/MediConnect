require('dotenv').config()
const { Pool } = require('pg')

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

const SPECIALTIES = [
  'Cardiology', 'Neurology', 'Orthopedics', 'Ophthalmology',
  'ENT Specialist', 'Pediatrics', 'General Medicine', 'Dermatology',
  'Endocrinology', 'Pulmonology', 'Psychiatry', 'Oncology',
  'Dentistry', 'Urology',
]
const FIRST_NAMES = ['Arjun','Priya','James','Sofia','Liam','Aisha','Carlos','Yuki','Omar','Emily','Raj','Nina','David','Fatima','Lucas','Mei','Samuel','Layla','Ethan','Zara']
const LAST_NAMES  = ['Sharma','Patel','Carter','Rossi','Johnson','Khan','Rivera','Tanaka','Hassan','Chen','Gupta','Williams','Brown','Ali','Martinez','Lee','Davis','Singh','Wilson','Ahmed']
const DESIGNATIONS = ['Consultant','Senior Consultant','Associate Professor','Resident Doctor','Specialist','Surgeon']
const LOCATIONS    = ['New York, USA','London, UK','Mumbai, India','Dubai, UAE','Toronto, Canada','Sydney, Australia','Tokyo, Japan','Paris, France','Singapore','Berlin, Germany']

const DEFAULT_AVAILABILITY = JSON.stringify([
  { day: 'Monday',    startTime: '09:00', endTime: '17:00', isAvailable: true  },
  { day: 'Tuesday',   startTime: '09:00', endTime: '17:00', isAvailable: true  },
  { day: 'Wednesday', startTime: '09:00', endTime: '13:00', isAvailable: true  },
  { day: 'Thursday',  startTime: '09:00', endTime: '17:00', isAvailable: true  },
  { day: 'Friday',    startTime: '09:00', endTime: '15:00', isAvailable: true  },
  { day: 'Saturday',  startTime: '10:00', endTime: '13:00', isAvailable: false },
  { day: 'Sunday',    startTime: '00:00', endTime: '00:00', isAvailable: false },
])

const rand    = (arr) => arr[Math.floor(Math.random() * arr.length)]
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

async function seedDoctors() {
  const client = await pool.connect()
  try {
    let inserted = 0
    for (let sIdx = 0; sIdx < SPECIALTIES.length; sIdx++) {
      const specialty = SPECIALTIES[sIdx]
      for (let i = 1; i <= 10; i++) {
        const firstName   = FIRST_NAMES[(sIdx * 10 + i - 1) % FIRST_NAMES.length]
        const lastName    = LAST_NAMES[(sIdx * 10 + i - 1) % LAST_NAMES.length]
        const exp         = randInt(2, 27)
        const clerkId     = `doctor_bulk_${specialty.toLowerCase().replace(/\s+/g, '_')}_${i}`
        const email       = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${sIdx}${i}@mediconnect.com`
        const profileImage = `https://i.pravatar.cc/150?u=${clerkId}`

        const { rowCount } = await client.query(
          `INSERT INTO doctors (clerk_id, first_name, last_name, title, designation, email, specialty, experience, location, phone, bio, profile_image, availability)
           VALUES ($1,$2,$3,'Dr.',$4,$5,$6,$7,$8,$9,$10,$11,$12)
           ON CONFLICT DO NOTHING`,
          [clerkId, firstName, lastName, rand(DESIGNATIONS), email, specialty, exp,
           rand(LOCATIONS), `555-${String(sIdx * 100 + i).padStart(4, '0')}`,
           `${exp}-year experienced specialist in ${specialty}. Committed to evidence-based, patient-centered care.`,
           profileImage, DEFAULT_AVAILABILITY]
        )
        if (rowCount > 0) inserted++
      }
    }
    console.log(`\n✅ Done! Inserted ${inserted} new doctors across ${SPECIALTIES.length} specialties.`)
    console.log(`   Skipped ${SPECIALTIES.length * 10 - inserted} (already existed).`)
  } finally {
    client.release()
    await pool.end()
  }
}

seedDoctors().catch(err => { console.error('❌ Error:', err.message); process.exit(1) })
