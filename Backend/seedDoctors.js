require('dotenv').config()
const mongoose = require('mongoose')
const Doctor = require('./src/models/Doctor')

const doctors = [
  {
    clerkId: 'doctor_seed_1',
    firstName: 'Arjun', lastName: 'Sharma',
    title: 'Dr.', designation: 'Senior Consultant',
    email: 'arjun.sharma@mediconnect.com',
    specialty: 'Cardiologist', experience: 15,
    location: 'Mumbai, Maharashtra', phone: '9820011001',
    bio: 'Renowned cardiologist at Kokilaben Hospital with 15 years of expertise in interventional cardiology and heart failure management.',
  },
  {
    clerkId: 'doctor_seed_2',
    firstName: 'Priya', lastName: 'Nair',
    title: 'Dr.', designation: 'Consultant',
    email: 'priya.nair@mediconnect.com',
    specialty: 'Gynaecologist', experience: 12,
    location: 'Kochi, Kerala', phone: '9847022002',
    bio: 'Specialist in high-risk pregnancies and minimally invasive gynaecological surgeries at Amrita Institute of Medical Sciences.',
  },
  {
    clerkId: 'doctor_seed_3',
    firstName: 'Rajesh', lastName: 'Iyer',
    title: 'Dr.', designation: 'Professor & HOD',
    email: 'rajesh.iyer@mediconnect.com',
    specialty: 'Neurologist', experience: 20,
    location: 'Chennai, Tamil Nadu', phone: '9444033003',
    bio: 'Head of Neurology at Apollo Hospitals Chennai. Pioneer in stroke management and epilepsy treatment with over 200 published papers.',
  },
  {
    clerkId: 'doctor_seed_4',
    firstName: 'Sunita', lastName: 'Gupta',
    title: 'Dr.', designation: 'Senior Specialist',
    email: 'sunita.gupta@mediconnect.com',
    specialty: 'Dermatologist', experience: 10,
    location: 'Delhi, NCR', phone: '9810044004',
    bio: 'Expert in cosmetic dermatology, acne management, and skin cancer screening at AIIMS Delhi. Known for patient-centric approach.',
  },
  {
    clerkId: 'doctor_seed_5',
    firstName: 'Vikram', lastName: 'Patel',
    title: 'Dr.', designation: 'Consultant Surgeon',
    email: 'vikram.patel@mediconnect.com',
    specialty: 'Orthopedic Surgeon', experience: 18,
    location: 'Ahmedabad, Gujarat', phone: '9979055005',
    bio: 'Specialises in joint replacement and sports injury rehabilitation at Sterling Hospital. Has performed over 3000 successful knee replacements.',
  },
  {
    clerkId: 'doctor_seed_6',
    firstName: 'Meera', lastName: 'Reddy',
    title: 'Dr.', designation: 'Associate Professor',
    email: 'meera.reddy@mediconnect.com',
    specialty: 'Paediatrician', experience: 14,
    location: 'Hyderabad, Telangana', phone: '9848066006',
    bio: 'Dedicated paediatrician at Rainbow Children\'s Hospital with expertise in neonatal care and childhood immunisation programs.',
  },
  {
    clerkId: 'doctor_seed_7',
    firstName: 'Anil', lastName: 'Verma',
    title: 'Dr.', designation: 'Senior Consultant',
    email: 'anil.verma@mediconnect.com',
    specialty: 'Gastroenterologist', experience: 16,
    location: 'Lucknow, Uttar Pradesh', phone: '9415077007',
    bio: 'Expert in advanced endoscopy and inflammatory bowel disease at Medanta Hospital. Trained at PGIMER Chandigarh.',
  },
  {
    clerkId: 'doctor_seed_8',
    firstName: 'Kavitha', lastName: 'Krishnamurthy',
    title: 'Dr.', designation: 'Consultant',
    email: 'kavitha.krishnamurthy@mediconnect.com',
    specialty: 'Endocrinologist', experience: 11,
    location: 'Bengaluru, Karnataka', phone: '9880088008',
    bio: 'Specialises in diabetes management, thyroid disorders, and hormonal imbalances at Manipal Hospital Bengaluru.',
  },
  {
    clerkId: 'doctor_seed_9',
    firstName: 'Suresh', lastName: 'Menon',
    title: 'Dr.', designation: 'Director',
    email: 'suresh.menon@mediconnect.com',
    specialty: 'Oncologist', experience: 22,
    location: 'Thiruvananthapuram, Kerala', phone: '9447099009',
    bio: 'Director of Oncology at Regional Cancer Centre. Specialises in breast and lung cancer with a focus on targeted therapy and immunotherapy.',
  },
  {
    clerkId: 'doctor_seed_10',
    firstName: 'Pooja', lastName: 'Singh',
    title: 'Dr.', designation: 'Consultant',
    email: 'pooja.singh@mediconnect.com',
    specialty: 'Psychiatrist', experience: 9,
    location: 'Jaipur, Rajasthan', phone: '9414010010',
    bio: 'Compassionate psychiatrist at Fortis Hospital Jaipur specialising in anxiety disorders, depression, and adolescent mental health.',
  },
  {
    clerkId: 'doctor_seed_11',
    firstName: 'Deepak', lastName: 'Bose',
    title: 'Dr.', designation: 'Senior Consultant',
    email: 'deepak.bose@mediconnect.com',
    specialty: 'Pulmonologist', experience: 13,
    location: 'Kolkata, West Bengal', phone: '9830011011',
    bio: 'Pulmonologist at AMRI Hospitals Kolkata with expertise in asthma, COPD, and sleep apnoea. Active researcher in respiratory medicine.',
  },
  {
    clerkId: 'doctor_seed_12',
    firstName: 'Ananya', lastName: 'Chakraborty',
    title: 'Dr.', designation: 'Consultant',
    email: 'ananya.chakraborty@mediconnect.com',
    specialty: 'Ophthalmologist', experience: 8,
    location: 'Bhubaneswar, Odisha', phone: '9437012012',
    bio: 'Eye specialist at AIIMS Bhubaneswar with expertise in cataract surgery, glaucoma management, and diabetic retinopathy.',
  },
  {
    clerkId: 'doctor_seed_13',
    firstName: 'Ramesh', lastName: 'Pillai',
    title: 'Dr.', designation: 'Chief Consultant',
    email: 'ramesh.pillai@mediconnect.com',
    specialty: 'Nephrologist', experience: 19,
    location: 'Coimbatore, Tamil Nadu', phone: '9442013013',
    bio: 'Chief of Nephrology at PSG Hospitals. Expert in kidney transplantation and chronic kidney disease management with 19 years of experience.',
  },
  {
    clerkId: 'doctor_seed_14',
    firstName: 'Nisha', lastName: 'Agarwal',
    title: 'Dr.', designation: 'Consultant',
    email: 'nisha.agarwal@mediconnect.com',
    specialty: 'Rheumatologist', experience: 10,
    location: 'Pune, Maharashtra', phone: '9823014014',
    bio: 'Rheumatologist at Ruby Hall Clinic Pune specialising in rheumatoid arthritis, lupus, and autoimmune joint disorders.',
  },
  {
    clerkId: 'doctor_seed_15',
    firstName: 'Karthik', lastName: 'Subramanian',
    title: 'Dr.', designation: 'Senior Registrar',
    email: 'karthik.subramanian@mediconnect.com',
    specialty: 'General Surgeon', experience: 7,
    location: 'Madurai, Tamil Nadu', phone: '9443015015',
    bio: 'General and laparoscopic surgeon at Meenakshi Mission Hospital. Specialises in minimally invasive abdominal surgeries.',
  },
  {
    clerkId: 'doctor_seed_16',
    firstName: 'Shweta', lastName: 'Joshi',
    title: 'Dr.', designation: 'Consultant',
    email: 'shweta.joshi@mediconnect.com',
    specialty: 'Dentist', experience: 6,
    location: 'Nagpur, Maharashtra', phone: '9822016016',
    bio: 'Dental surgeon specialising in orthodontics and cosmetic dentistry at Orange City Hospital. Certified Invisalign provider.',
  },
  {
    clerkId: 'doctor_seed_17',
    firstName: 'Mohan', lastName: 'Das',
    title: 'Dr.', designation: 'Professor',
    email: 'mohan.das@mediconnect.com',
    specialty: 'Haematologist', experience: 17,
    location: 'Bhopal, Madhya Pradesh', phone: '9425017017',
    bio: 'Professor of Haematology at AIIMS Bhopal. Expert in blood disorders, bone marrow transplantation, and haemophilia management.',
  },
  {
    clerkId: 'doctor_seed_18',
    firstName: 'Lakshmi', lastName: 'Venkataraman',
    title: 'Dr.', designation: 'Senior Consultant',
    email: 'lakshmi.venkataraman@mediconnect.com',
    specialty: 'Radiologist', experience: 14,
    location: 'Visakhapatnam, Andhra Pradesh', phone: '9848018018',
    bio: 'Diagnostic and interventional radiologist at King George Hospital. Expert in MRI, CT-guided biopsies, and vascular interventions.',
  },
  {
    clerkId: 'doctor_seed_19',
    firstName: 'Rohit', lastName: 'Malhotra',
    title: 'Dr.', designation: 'Consultant',
    email: 'rohit.malhotra@mediconnect.com',
    specialty: 'Urologist', experience: 12,
    location: 'Chandigarh, Punjab', phone: '9815019019',
    bio: 'Urologist at PGI Chandigarh specialising in robotic-assisted surgeries, kidney stones, and prostate disorders.',
  },
  {
    clerkId: 'doctor_seed_20',
    firstName: 'Divya', lastName: 'Rajan',
    title: 'Dr.', designation: 'Consultant',
    email: 'divya.rajan@mediconnect.com',
    specialty: 'Physiotherapist', experience: 8,
    location: 'Mysuru, Karnataka', phone: '9886020020',
    bio: 'Sports physiotherapist at JSS Hospital Mysuru. Works with national-level athletes and post-surgical rehabilitation patients.',
  },
  {
    clerkId: 'doctor_seed_21',
    firstName: 'Sanjay', lastName: 'Kulkarni',
    title: 'Dr.', designation: 'Senior Consultant',
    email: 'sanjay.kulkarni@mediconnect.com',
    specialty: 'Cardiologist', experience: 21,
    location: 'Nashik, Maharashtra', phone: '9822021021',
    bio: 'Interventional cardiologist at Wockhardt Hospital Nashik. Specialises in angioplasty, pacemaker implantation, and cardiac rehabilitation.',
  },
  {
    clerkId: 'doctor_seed_22',
    firstName: 'Geeta', lastName: 'Pandey',
    title: 'Dr.', designation: 'Consultant',
    email: 'geeta.pandey@mediconnect.com',
    specialty: 'Nutritionist', experience: 5,
    location: 'Varanasi, Uttar Pradesh', phone: '9415022022',
    bio: 'Clinical nutritionist at BHU Hospital specialising in therapeutic diets for diabetes, obesity, and renal disease management.',
  },
  {
    clerkId: 'doctor_seed_23',
    firstName: 'Harish', lastName: 'Nambiar',
    title: 'Dr.', designation: 'Associate Consultant',
    email: 'harish.nambiar@mediconnect.com',
    specialty: 'ENT Specialist', experience: 9,
    location: 'Kozhikode, Kerala', phone: '9847023023',
    bio: 'ENT surgeon at Baby Memorial Hospital Kozhikode. Expert in cochlear implants, sinus surgeries, and head & neck oncology.',
  },
  {
    clerkId: 'doctor_seed_24',
    firstName: 'Tanvi', lastName: 'Shah',
    title: 'Dr.', designation: 'Consultant',
    email: 'tanvi.shah@mediconnect.com',
    specialty: 'Allergist', experience: 7,
    location: 'Surat, Gujarat', phone: '9825024024',
    bio: 'Allergy and immunology specialist at New Civil Hospital Surat. Focuses on food allergies, asthma, and immunotherapy treatments.',
  },
  {
    clerkId: 'doctor_seed_25',
    firstName: 'Prakash', lastName: 'Rao',
    title: 'Dr.', designation: 'Chief of Surgery',
    email: 'prakash.rao@mediconnect.com',
    specialty: 'Neurosurgeon', experience: 24,
    location: 'Bengaluru, Karnataka', phone: '9880025025',
    bio: 'Chief Neurosurgeon at NIMHANS Bengaluru. Internationally trained with expertise in brain tumour resection, spinal cord surgery, and deep brain stimulation.',
  },
]

const availability = [
  { day: 'Monday',    startTime: '09:00', endTime: '17:00', isAvailable: true  },
  { day: 'Tuesday',   startTime: '09:00', endTime: '17:00', isAvailable: true  },
  { day: 'Wednesday', startTime: '09:00', endTime: '13:00', isAvailable: true  },
  { day: 'Thursday',  startTime: '09:00', endTime: '17:00', isAvailable: true  },
  { day: 'Friday',    startTime: '09:00', endTime: '15:00', isAvailable: true  },
  { day: 'Saturday',  startTime: '10:00', endTime: '13:00', isAvailable: false },
  { day: 'Sunday',    startTime: '00:00', endTime: '00:00', isAvailable: false },
]

async function seedDoctors() {
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('MongoDB connected')

  await Doctor.deleteMany({ clerkId: { $regex: /^doctor_seed_/ } })

  const created = await Doctor.insertMany(
    doctors.map(d => ({ ...d, availability }))
  )

  console.log(`\n✅ ${created.length} Indian doctors seeded successfully!\n`)
  created.forEach(d => console.log(`   ${d.title} ${d.firstName} ${d.lastName} — ${d.specialty} — ${d.location}`))

  await mongoose.disconnect()
}

seedDoctors().catch(err => { console.error(err); process.exit(1) })
