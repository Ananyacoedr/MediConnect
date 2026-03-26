require('dotenv').config()
const mongoose = require('mongoose')
const Doctor = require('./src/models/Doctor')

const SPECIALTIES = [
  'Cardiology', 'Neurology', 'Orthopedics', 'Ophthalmology',
  'ENT Specialist', 'Pediatrics', 'General Medicine', 'Dermatology',
  'Endocrinology', 'Pulmonology', 'Psychiatry', 'Oncology',
  'Dentistry', 'Urology',
]

const FIRST_NAMES = [
  'Arjun', 'Priya', 'James', 'Sofia', 'Liam', 'Aisha', 'Carlos', 'Yuki',
  'Omar', 'Emily', 'Raj', 'Nina', 'David', 'Fatima', 'Lucas', 'Mei',
  'Samuel', 'Layla', 'Ethan', 'Zara',
]

const LAST_NAMES = [
  'Sharma', 'Patel', 'Carter', 'Rossi', 'Johnson', 'Khan', 'Rivera', 'Tanaka',
  'Hassan', 'Chen', 'Gupta', 'Williams', 'Brown', 'Ali', 'Martinez', 'Lee',
  'Davis', 'Singh', 'Wilson', 'Ahmed',
]

const DESIGNATIONS = [
  'Consultant', 'Senior Consultant', 'Associate Professor',
  'Resident Doctor', 'Specialist', 'Surgeon',
]

const LOCATIONS = [
  'New York, USA', 'London, UK', 'Mumbai, India', 'Dubai, UAE',
  'Toronto, Canada', 'Sydney, Australia', 'Tokyo, Japan', 'Paris, France',
  'Singapore', 'Berlin, Germany',
]

const DEFAULT_AVAILABILITY = [
  { day: 'Monday',    startTime: '09:00', endTime: '17:00', isAvailable: true  },
  { day: 'Tuesday',   startTime: '09:00', endTime: '17:00', isAvailable: true  },
  { day: 'Wednesday', startTime: '09:00', endTime: '13:00', isAvailable: true  },
  { day: 'Thursday',  startTime: '09:00', endTime: '17:00', isAvailable: true  },
  { day: 'Friday',    startTime: '09:00', endTime: '15:00', isAvailable: true  },
  { day: 'Saturday',  startTime: '10:00', endTime: '13:00', isAvailable: false },
  { day: 'Sunday',    startTime: '00:00', endTime: '00:00', isAvailable: false },
]

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)]
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

async function seedDoctors() {
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('MongoDB connected')

  const allDoctors = []

  SPECIALTIES.forEach((specialty, sIdx) => {
    for (let i = 1; i <= 10; i++) {
      const firstName = FIRST_NAMES[(sIdx * 10 + i - 1) % FIRST_NAMES.length]
      const lastName  = LAST_NAMES[(sIdx * 10 + i - 1) % LAST_NAMES.length]
      const exp       = randInt(2, 27)
      const clerkId   = `doctor_bulk_${specialty.toLowerCase().replace(/\s+/g, '_')}_${i}`
      const email     = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${sIdx}${i}@mediconnect.com`

      allDoctors.push({
        clerkId,
        firstName,
        lastName,
        title:        'Dr.',
        designation:  rand(DESIGNATIONS),
        email,
        specialty,
        experience:   exp,
        location:     rand(LOCATIONS),
        phone:        `555-${String(sIdx * 100 + i).padStart(4, '0')}`,
        bio:          `${exp}-year experienced specialist in ${specialty}. Committed to evidence-based, patient-centered care.`,
        profileImage: `https://i.pravatar.cc/150?u=${clerkId}`,
        availability: DEFAULT_AVAILABILITY,
      })
    }
  })

  // Only insert doctors whose clerkId doesn't already exist
  let inserted = 0
  for (const doc of allDoctors) {
    const exists = await Doctor.findOne({ $or: [{ clerkId: doc.clerkId }, { email: doc.email }] })
    if (!exists) {
      await Doctor.create(doc)
      inserted++
    }
  }

  console.log(`\n✅ Done! Inserted ${inserted} new doctors across ${SPECIALTIES.length} specialties.`)
  console.log(`   Skipped ${allDoctors.length - inserted} (already existed).`)
  await mongoose.disconnect()
}

seedDoctors().catch(err => { console.error('❌ Error:', err.message); process.exit(1) })
