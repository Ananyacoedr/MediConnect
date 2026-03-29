import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { apiFetch } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  HeartPulse, ArrowLeft, Search, Loader2, X,
  MapPin, Stethoscope, Star, CalendarPlus,
  Video, Mic, User, CheckCircle, Copy, Check
} from 'lucide-react'

const SPECIALTIES = [
  'All', 'General Medicine', 'Cardiology', 'Neurology', 'Dermatology',
  'Orthopedics', 'Pediatrics', 'Psychiatry', 'Gynecology', 'Endocrinology',
  'Ophthalmology', 'ENT Specialist', 'Gastroenterology', 'Pulmonology',
  'Urology', 'Dentistry',
]

const TIMES = [
  '09:00 AM','09:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM',
  '12:00 PM','12:30 PM','02:00 PM','02:30 PM','03:00 PM','03:30 PM',
  '04:00 PM','04:30 PM','05:00 PM',
]

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white'

const BookingModal = ({ doctor, userId, onClose }) => {
  const [step, setStep]       = useState(1)
  const [form, setForm]       = useState({ date: '', time: '', reason: '', symptoms: '', consultationType: 'video' })
  const [booking, setBooking] = useState(false)
  const [error, setError]     = useState(null)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleBook = async () => {
    setBooking(true)
    setError(null)
    try {
      await apiFetch('/patients/appointments/book', userId, {
        method: 'POST',
        body: JSON.stringify({
          doctorId: doctor.id,
          date: form.date,
          time: form.time,
          reason: form.reason,
          symptoms: form.symptoms,
          consultationType: form.consultationType,
        }),
      })
      setStep(3)
    } catch (err) {
      setError(err.message)
    } finally {
      setBooking(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            {doctor.profileImage
              ? <img src={doctor.profileImage} className="w-9 h-9 rounded-full object-cover border" alt="doc" />
              : <div className="w-9 h-9 rounded-full bg-blue-50 border flex items-center justify-center text-blue-500 font-bold text-sm">{doctor.firstName?.[0]}{doctor.lastName?.[0]}</div>
            }
            <div>
              <p className="text-sm font-semibold text-gray-900">{doctor.title} {doctor.firstName} {doctor.lastName}</p>
              <p className="text-xs text-blue-600">{doctor.specialty}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        {/* Step indicators */}
        {step < 3 && (
          <div className="flex items-center gap-2 px-6 pt-4">
            {['Details', 'Confirm'].map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step > i + 1 ? 'bg-green-500 text-white' : step === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'
                }`}>{step > i + 1 ? '✓' : i + 1}</div>
                <span className={`text-xs font-medium ${step === i + 1 ? 'text-blue-600' : 'text-gray-400'}`}>{label}</span>
                {i < 1 && <div className="w-8 h-px bg-gray-200 mx-1" />}
              </div>
            ))}
          </div>
        )}

        {/* Step 1 — Details */}
        {step === 1 && (
          <div className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Date *</label>
                <input type="date" min={new Date().toISOString().split('T')[0]}
                  className={inputCls} value={form.date} onChange={set('date')} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Time *</label>
                <select className={inputCls} value={form.time} onChange={set('time')}>
                  <option value="">Select time</option>
                  {TIMES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Consultation Type</label>
              <div className="grid grid-cols-3 gap-2">
                {[{v:'video',icon:Video,label:'Video'},{v:'audio',icon:Mic,label:'Audio'},{v:'in-person',icon:User,label:'In-Person'}].map(({v,icon:Icon,label}) => (
                  <button key={v} type="button" onClick={() => setForm(f => ({...f, consultationType: v}))}
                    className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-medium transition-colors ${
                      form.consultationType === v ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-500 hover:border-blue-300'
                    }`}>
                    <Icon size={16} strokeWidth={1.8} />{label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Reason for Visit</label>
              <input type="text" placeholder="e.g. Routine checkup" className={inputCls} value={form.reason} onChange={set('reason')} />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Symptoms (optional)</label>
              <textarea rows={2} placeholder="Describe your symptoms..." className={`${inputCls} resize-none`} value={form.symptoms} onChange={set('symptoms')} />
            </div>

            {error && <p className="text-red-500 text-xs text-center">{error}</p>}

            <div className="flex gap-3 pt-1">
              <button onClick={onClose} className="flex-1 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button
                onClick={() => {
                  if (!form.date || !form.time) return setError('Please select date and time.')
                  setError(null)
                  setStep(2)
                }}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >Next →</button>
            </div>
          </div>
        )}

        {/* Step 2 — Confirm */}
        {step === 2 && (
          <div className="px-6 py-5 space-y-4">
            <p className="text-sm font-semibold text-gray-700">Confirm your appointment</p>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Doctor</span><span className="font-medium">{doctor.title} {doctor.firstName} {doctor.lastName}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Specialty</span><span className="font-medium">{doctor.specialty}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Date</span><span className="font-medium">{new Date(form.date).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',year:'numeric'})}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Time</span><span className="font-medium">{form.time}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Type</span><span className="font-medium capitalize">{form.consultationType}</span></div>
              {form.reason && <div className="flex justify-between"><span className="text-gray-500">Reason</span><span className="font-medium">{form.reason}</span></div>}
            </div>
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">← Back</button>
              <button
                onClick={handleBook} disabled={booking}
                className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {booking ? <><Loader2 size={14} className="animate-spin" /> Booking...</> : 'Confirm Booking'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Success */}
        {step === 3 && (
          <div className="px-6 py-10 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <CheckCircle size={32} className="text-green-500" />
            </div>
            <p className="font-semibold text-gray-900 text-lg">Appointment Booked!</p>
            <p className="text-sm text-gray-500">Your request has been sent to <strong>{doctor.firstName} {doctor.lastName}</strong>. You'll be notified once confirmed.</p>
            <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700 text-left space-y-1">
              <p>📅 {new Date(form.date).toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}</p>
              <p>🕐 {form.time} · <span className="capitalize">{form.consultationType}</span></p>
            </div>
            <button onClick={onClose} className="mt-2 w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">Done</button>
          </div>
        )}
      </div>
    </div>
  )
}

const FindDoctors = () => {
  const navigate = useNavigate()
  const { userId } = useAuth()
  const [searchParams] = useSearchParams()
  const [doctors, setDoctors]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [specialty, setSpecialty]   = useState(searchParams.get('specialty') || 'All')

  const fetchDoctors = (q = '', spec = '') => {
    setLoading(true)
    const params = new URLSearchParams()
    if (q) params.set('search', q)
    if (spec && spec !== 'All') params.set('specialty', spec)
    apiFetch(`/doctors/list?${params}`, null)
      .then(setDoctors)
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchDoctors() }, [])

  useEffect(() => {
    const t = setTimeout(() => fetchDoctors(search, specialty), 300)
    return () => clearTimeout(t)
  }, [search, specialty])

  const filtered = doctors

  // Group by specialty
  const grouped = filtered.reduce((acc, doc) => {
    const key = doc.specialty || 'Other'
    if (!acc[key]) acc[key] = []
    acc[key].push(doc)
    return acc
  }, {})

  const specialtyKeys = Object.keys(grouped).sort()

  // Unique specialties from actual DB data for filter pills
  const dbSpecialties = ['All', ...Array.from(new Set(doctors.map(d => d.specialty).filter(Boolean))).sort()]

  const DoctorCard = ({ doc }) => {
    const [copied, setCopied] = useState(false)

    const roomURL = `${window.location.origin}/video/room_${doc.id}`

    const copyLink = () => {
      navigator.clipboard.writeText(roomURL)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }

    return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-5 pb-5">
        <div className="flex items-start gap-3 cursor-pointer" onClick={() => navigate(`/doctor/${doc.id}`)}>
          {doc.profileImage
            ? <img src={doc.profileImage} alt="doctor" className="w-12 h-12 rounded-full object-cover border-2 border-blue-100 shrink-0" />
            : <div className="w-12 h-12 rounded-full bg-blue-50 border-2 border-blue-100 flex items-center justify-center text-blue-500 font-bold text-base shrink-0">
                {doc.firstName?.[0]}{doc.lastName?.[0]}
              </div>
          }
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{doc.title} {doc.firstName} {doc.lastName}</p>
            {doc.designation && <p className="text-xs text-gray-400 truncate">{doc.designation}</p>}
            <div className="flex flex-wrap gap-2 mt-1.5">
              {doc.experience > 0 && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Star size={11} className="text-yellow-400" /> {doc.experience} yrs
                </span>
              )}
              {doc.location && (
                <span className="text-xs text-gray-500 flex items-center gap-1 truncate">
                  <MapPin size={11} /> {doc.location}
                </span>
              )}
            </div>
            {doc.bio && <p className="text-xs text-gray-400 mt-1.5 line-clamp-2">{doc.bio}</p>}
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <Button size="sm" className="flex-1 flex items-center gap-1.5"
            onClick={() => navigate(`/doctor/${doc.id}`)}>
            <CalendarPlus size={13} /> Book
          </Button>
          <button
            onClick={() => navigate(`/video/room_${doc.id}?name=${encodeURIComponent(`${doc.title || ''} ${doc.firstName} ${doc.lastName}`.trim())}`)}
            className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            <Video size={13} /> Video Call
          </button>
          <button
            onClick={copyLink}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              copied ? 'bg-green-500 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy Link</>}
          </button>
        </div>
      </CardContent>
    </Card>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <header className="flex items-center justify-between px-8 py-4 border-b bg-white dark:bg-gray-800 shadow-sm">
        <div className="flex items-center gap-2 text-blue-600 font-bold text-xl">
          <HeartPulse size={24} /> MediConnect
        </div>
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 transition-colors">
          <ArrowLeft size={16} /> Back
        </button>
      </header>

      <main className="flex-1 px-6 py-8 max-w-6xl mx-auto w-full space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Find Doctors</h1>
          <p className="text-sm text-gray-500 mt-1">Browse verified specialists and book an appointment.</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email or specialty..."
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400" />
        </div>

        {/* Specialty filter pills from DB */}
        <div className="flex gap-2 flex-wrap">
          {dbSpecialties.map(s => (
            <button key={s} onClick={() => setSpecialty(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                specialty === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-blue-400'
              }`}>{s}</button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-gray-400 py-12 justify-center">
            <Loader2 size={20} className="animate-spin" /> Loading doctors...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-gray-400 gap-2">
            <Stethoscope size={40} strokeWidth={1} />
            <p className="text-sm">No doctors found.</p>
          </div>
        ) : specialty !== 'All' ? (
          // ── Filtered by specialty: flat grid ──
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{specialty}</span>
              <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">
                {filtered.length} doctor{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(doc => <DoctorCard key={doc.id} doc={doc} />)}
            </div>
          </div>
        ) : (
          // ── All: grouped by specialization ──
          <div className="space-y-10">
            {specialtyKeys.map(spec => (
              <div key={spec}>
                {/* Section header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Stethoscope size={18} className="text-blue-600" />
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{spec}</h2>
                  </div>
                  <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">
                    {grouped[spec].length} doctor{grouped[spec].length !== 1 ? 's' : ''}
                  </span>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                  <button onClick={() => setSpecialty(spec)}
                    className="text-xs text-blue-600 hover:underline shrink-0">View all →</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {grouped[spec].map(doc => <DoctorCard key={doc.id} doc={doc} />)}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default FindDoctors
