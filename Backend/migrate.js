require('dotenv').config()
const mongoose = require('mongoose')

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const Doctor = require('./src/models/Doctor')
  const Appointment = require('./src/models/Appointment')

  const yourDoctor = await Doctor.findOne({ clerkId: 'user_3BNoXIb8JwCmRKvcGZrcZ8wN2Bo' })
  const seededDoctor = await Doctor.findOne({ clerkId: 'user_3BNhCkg1qHbt6iyCqDsceLSCFcO' })

  console.log('Your doctor:', yourDoctor?._id, yourDoctor?.firstName)
  console.log('Seeded doctor:', seededDoctor?._id, seededDoctor?.firstName)

  const result = await Appointment.updateMany(
    { doctor: seededDoctor._id },
    { $set: { doctor: yourDoctor._id } }
  )
  console.log('Appointments moved:', result.modifiedCount)

  await Doctor.findByIdAndUpdate(yourDoctor._id, {
    $set: {
      title: seededDoctor.title,
      designation: seededDoctor.designation,
      specialty: seededDoctor.specialty,
      experience: seededDoctor.experience,
      location: seededDoctor.location,
      phone: seededDoctor.phone,
      bio: seededDoctor.bio,
      availability: seededDoctor.availability,
    }
  })
  console.log('Profile updated.')

  const count = await Appointment.countDocuments({ doctor: yourDoctor._id })
  console.log('Total appointments now:', count)

  process.exit(0)
}).catch(err => { console.error(err); process.exit(1) })
