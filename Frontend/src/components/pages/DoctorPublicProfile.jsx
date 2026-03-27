import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  HeartPulse, ArrowLeft, MapPin, Phone, Mail,
  CalendarPlus, Video, Mic, User, CheckCircle, Loader2,
  Clock, Upload, FileText, Stethoscope, Award, CalendarDays,
  Star, BadgeCheck, Building2
} from 'lucide-react'

const BASE = import.meta.env.VITE_API_URL || '/api'

const TIMES = [
  '09:00 AM','09:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM',
  '12:00 PM','12:30 PM','02:00 PM','02:30 PM','03:00 PM','03:30 PM',
  '04:00 PM','04:30 PM','05:00 PM',
]

const inp = 'w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'

const DoctorPublicProfile = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getToken, isSignedIn } = useAuth()

  const [doctor, setDoctor]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const [bookStep, setBookStep]   = useState(0)
  const [form, setForm]           = useState({ date: '', time: '', reason: '', symptoms: '', consultationType: 'video' })
  const [booking, setBooking]     = useState(false)
  const [bookError, setBookError] = useState(null)

  const [uploadFile, setUploadFile]       = useState(null)
  const [uploadNote, setUploadNote]       = useState('')
  const [uploading, setUploading]         = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploadError, setUploadError]     = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch(`${BASE}/doctors/${id}`)
      .then(async r => {
        const text = await r.text()
        try { return JSON.parse(text) }
        catch { throw new Error('Backend not reachable. Please make sure the server is running.') }
      })
      .then(data => {
        if (data.error) throw new Error(data.error)
        setDoctor(data)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  const setF = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleBook = async () => {
    setBooking(true); setBookError(null)
    try {
      const token = await getToken()
      const res = await fetch(`${BASE}/patients/appointments/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ doctorId: id, ...form }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Booking failed')
      setBookStep(3)
    } catch (err) { setBookError(err.message) }
    finally { setBooking(false) }
  }

  const handleUpload = async () => {
    if (!uploadFile) return setUploadError('Please select a file.')
    setUploading(true); setUploadError(null)
    const reader = new FileReader()
    reader.onload = async e => {
      try {
        const token = await getToken()
        const res = await fetch(`${BASE}/patients/reports/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ doctorId: id, fileName: uploadFile.name, fileData: e.target.result, note: uploadNote }),
        })
        if (!res.ok) throw new Error('Upload failed')
        setUploadSuccess(true); setUploadFile(null); setUploadNote('')
      } catch (err) { setUploadError(err.message) }
      finally { setUploading(false) }
    }
    reader.readAsDataURL(uploadFile)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center space-y-3">
        <Loader2 size={40} className="animate-spin text-blue-600 mx-auto" />
        <p className="text-sm text-gray-500">Loading doctor profile...</p>
      </div>
    </div>
  )

  if (error || !doctor) return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <header className="flex items-center justify-between px-6 py-4 border-b bg-white dark:bg-gray-800 shadow-sm">
        <div className="flex items-center gap-2 text-blue-600 font-bold text-xl"><HeartPulse size={24} /> MediConnect</div>
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600"><ArrowLeft size={16} /> Back</button>
      </header>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4 px-4">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
            <Stethoscope size={28} className="text-red-400" />
          </div>
          <p className="text-gray-700 dark:text-gray-300 font-medium">Could not load doctor profile</p>
          <p className="text-sm text-red-500 max-w-sm">{error}</p>
          <p className="text-xs text-gray-400">Make sure the backend server is running on port 5000</p>
          <Button onClick={() => navigate(-1)} className="flex items-center gap-2 mx-auto">
            <ArrowLeft size={14} /> Go Back
          </Button>
        </div>
      </div>
    </div>
  )

  const availableDays = doctor.availability?.filter(a => a.isAvailable) || []

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <div className="flex items-center gap-2 text-blue-600 font-bold text-xl"><HeartPulse size={24} /> MediConnect</div>
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 transition-colors">
          <ArrowLeft size={16} /> Back
        </button>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* ── Hero ── */}
        <Card>
          <CardContent className="pt-6 pb-6">
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Avatar */}
              {doctor.profileImage
                ? <img src={doctor.profileImage} alt="doctor" className="w-32 h-32 rounded-2xl object-cover border-2 border-blue-100 shrink-0" />
                : <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-4xl shrink-0">
                    {doctor.firstName?.[0]}{doctor.lastName?.[0]}
                  </div>
              }

              <div className="flex-1 space-y-3">
                {/* Name + designation */}
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {doctor.title} {doctor.firstName} {doctor.lastName}
                  </h1>
                  {doctor.designation && (
                    <p className="text-blue-600 dark:text-blue-400 font-medium text-sm mt-0.5 flex items-center gap-1">
                      <BadgeCheck size={14} /> {doctor.designation}
                    </p>
                  )}
                </div>

                {/* Specialty */}
                {doctor.specialty && (
                  <span className="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-semibold">
                    <Stethoscope size={12} /> {doctor.specialty}
                  </span>
                )}

                {/* Info chips */}
                <div className="flex flex-wrap gap-3 text-sm text-gray-500 dark:text-gray-400">
                  {doctor.experience > 0 && (
                    <span className="flex items-center gap-1.5 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2.5 py-1 rounded-lg text-xs font-medium">
                      <Award size={13} /> {doctor.experience} yrs experience
                    </span>
                  )}
                  {doctor.location && (
                    <span className="flex items-center gap-1.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2.5 py-1 rounded-lg text-xs font-medium">
                      <MapPin size={13} /> {doctor.location}
                    </span>
                  )}
                  {doctor.phone && (
                    <span className="flex items-center gap-1.5 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2.5 py-1 rounded-lg text-xs font-medium">
                      <Phone size={13} /> {doctor.phone}
                    </span>
                  )}
                  {doctor.email && (
                    <span className="flex items-center gap-1.5 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2.5 py-1 rounded-lg text-xs font-medium">
                      <Mail size={13} /> {doctor.email}
                    </span>
                  )}
                </div>

                {/* Bio */}
                {doctor.bio && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed border-l-4 border-blue-300 dark:border-blue-600 pl-3 italic">
                    "{doctor.bio}"
                  </p>
                )}
              </div>

              <Button className="shrink-0 flex items-center gap-2 h-fit"
                onClick={() => { if (!isSignedIn) return navigate('/login'); setBookStep(1) }}>
                <CalendarPlus size={16} /> Book Appointment
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LEFT COLUMN ── */}
          <div className="space-y-5">

            {/* All Doctor Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Star size={15} className="text-yellow-500" /> Doctor Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-0">
                {[
                  { icon: User,       label: 'Full Name',    value: `${doctor.title || ''} ${doctor.firstName} ${doctor.lastName}`.trim() },
                  { icon: Stethoscope,label: 'Specialty',    value: doctor.specialty   || '—' },
                  { icon: BadgeCheck, label: 'Designation',  value: doctor.designation || '—' },
                  { icon: Award,      label: 'Experience',   value: doctor.experience ? `${doctor.experience} years` : '—' },
                  { icon: Building2,  label: 'Location',     value: doctor.location    || '—' },
                  { icon: Phone,      label: 'Phone',        value: doctor.phone       || '—' },
                  { icon: Mail,       label: 'Email',        value: doctor.email       || '—' },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3 py-2.5 border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <Icon size={14} className="text-blue-500 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400">{label}</p>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 break-words">{value}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Availability */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock size={15} className="text-blue-600" /> Availability
                </CardTitle>
              </CardHeader>
              <CardContent>
                {availableDays.length === 0 ? (
                  <p className="text-sm text-gray-400">No availability set.</p>
                ) : (
                  <div className="space-y-2">
                    {availableDays.map(slot => (
                      <div key={slot.day} className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-gray-700 last:border-0">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{slot.day}</span>
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-900 px-2 py-0.5 rounded-full">
                          {slot.startTime} – {slot.endTime}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Book Appointment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CalendarDays size={15} className="text-blue-600" /> Book Appointment
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!isSignedIn ? (
                  <div className="text-center py-8 space-y-3">
                    <CalendarPlus size={36} className="text-gray-300 mx-auto" />
                    <p className="text-sm text-gray-500">Sign in to book an appointment with {doctor.title} {doctor.lastName}</p>
                    <Button onClick={() => navigate('/login')}>Sign In to Book</Button>
                  </div>
                ) : bookStep === 0 ? (
                  <div className="text-center py-8 space-y-3">
                    <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-900 flex items-center justify-center mx-auto">
                      <CalendarPlus size={24} className="text-blue-600" />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Book a consultation with <strong>{doctor.title} {doctor.firstName} {doctor.lastName}</strong></p>
                    <Button onClick={() => setBookStep(1)} className="flex items-center gap-2 mx-auto">
                      <CalendarPlus size={15} /> Book Now
                    </Button>
                  </div>
                ) : bookStep === 1 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">Date *</label>
                        <input type="date" min={new Date().toISOString().split('T')[0]} className={inp} value={form.date} onChange={setF('date')} />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">Time *</label>
                        <select className={inp} value={form.time} onChange={setF('time')}>
                          <option value="">Select time</option>
                          {TIMES.map(t => <option key={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">Consultation Type</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[{v:'video',icon:Video,label:'Video'},{v:'audio',icon:Mic,label:'Audio'},{v:'in-person',icon:User,label:'In-Person'}].map(({v,icon:Icon,label}) => (
                          <button key={v} type="button" onClick={() => setForm(f => ({...f, consultationType: v}))}
                            className={`flex flex-col items-center gap-1 py-3 rounded-xl border text-xs font-medium transition-all ${
                              form.consultationType === v ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 text-blue-600' : 'border-gray-200 dark:border-gray-600 text-gray-500 hover:border-blue-300'
                            }`}>
                            <Icon size={16} strokeWidth={1.8} />{label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">Reason for Visit</label>
                      <input type="text" placeholder="e.g. Routine checkup" className={inp} value={form.reason} onChange={setF('reason')} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">Symptoms (optional)</label>
                      <textarea rows={2} placeholder="Describe your symptoms..." className={`${inp} resize-none`} value={form.symptoms} onChange={setF('symptoms')} />
                    </div>
                    {bookError && <p className="text-red-500 text-xs bg-red-50 dark:bg-red-900 px-3 py-2 rounded-lg">{bookError}</p>}
                    <div className="flex gap-3">
                      <button onClick={() => setBookStep(0)} className="flex-1 py-2.5 border rounded-lg text-sm text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
                      <button onClick={() => { if (!form.date || !form.time) return setBookError('Please select date and time.'); setBookError(null); setBookStep(2) }}
                        className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Next →</button>
                    </div>
                  </div>
                ) : bookStep === 2 ? (
                  <div className="space-y-4">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Confirm your appointment</p>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 space-y-2.5 text-sm">
                      {[
                        ['Doctor',    `${doctor.title} ${doctor.firstName} ${doctor.lastName}`],
                        ['Specialty', doctor.specialty || '—'],
                        ['Date',      new Date(form.date).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',year:'numeric'})],
                        ['Time',      form.time],
                        ['Type',      form.consultationType],
                        form.reason ? ['Reason', form.reason] : null,
                      ].filter(Boolean).map(([label, value]) => (
                        <div key={label} className="flex justify-between">
                          <span className="text-gray-500">{label}</span>
                          <span className="font-medium text-gray-800 dark:text-gray-200 capitalize text-right ml-4">{value}</span>
                        </div>
                      ))}
                    </div>
                    {bookError && <p className="text-red-500 text-xs">{bookError}</p>}
                    <div className="flex gap-3">
                      <button onClick={() => setBookStep(1)} className="flex-1 py-2.5 border rounded-lg text-sm text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">← Back</button>
                      <button onClick={handleBook} disabled={booking}
                        className="flex-1 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60 flex items-center justify-center gap-2">
                        {booking ? <><Loader2 size={14} className="animate-spin" /> Booking...</> : 'Confirm Booking'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 space-y-3">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                      <CheckCircle size={32} className="text-green-500" />
                    </div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-lg">Appointment Booked!</p>
                    <p className="text-sm text-gray-500">Request sent to <strong>{doctor.firstName} {doctor.lastName}</strong>. You'll be notified once confirmed.</p>
                    <div className="bg-blue-50 dark:bg-blue-900 rounded-xl p-3 text-xs text-blue-700 dark:text-blue-300 text-left space-y-1 max-w-xs mx-auto">
                      <p>📅 {new Date(form.date).toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}</p>
                      <p>🕐 {form.time} · <span className="capitalize">{form.consultationType}</span></p>
                    </div>
                    <button onClick={() => setBookStep(0)} className="w-full max-w-xs py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 mx-auto block">Done</button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upload Report */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Upload size={15} className="text-blue-600" /> Upload Medical Report
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!isSignedIn ? (
                  <div className="text-center py-6 space-y-2">
                    <Upload size={28} className="text-gray-300 mx-auto" />
                    <p className="text-sm text-gray-500">Sign in to upload reports.</p>
                  </div>
                ) : uploadSuccess ? (
                  <div className="text-center py-6 space-y-2">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                      <CheckCircle size={24} className="text-green-500" />
                    </div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Report uploaded successfully!</p>
                    <button onClick={() => setUploadSuccess(false)} className="text-xs text-blue-600 hover:underline">Upload another</button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <label className={`flex items-center gap-3 cursor-pointer border-2 border-dashed rounded-xl px-4 py-5 transition-colors ${
                      uploadFile ? 'border-blue-400 bg-blue-50 dark:bg-blue-900' : 'border-gray-200 dark:border-gray-600 hover:border-blue-300'
                    }`}>
                      <FileText size={22} className={uploadFile ? 'text-blue-500' : 'text-gray-400'} />
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {uploadFile ? uploadFile.name : 'Click to choose file'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {uploadFile ? `${(uploadFile.size / 1024).toFixed(1)} KB` : 'PDF, JPG, PNG up to 5MB'}
                        </p>
                      </div>
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                        onChange={e => { setUploadFile(e.target.files[0]); setUploadError(null) }} />
                    </label>
                    <div>
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">Note (optional)</label>
                      <textarea rows={2} placeholder="e.g. Blood test from last week..."
                        className={`${inp} resize-none`} value={uploadNote} onChange={e => setUploadNote(e.target.value)} />
                    </div>
                    {uploadError && <p className="text-red-500 text-xs bg-red-50 dark:bg-red-900 px-3 py-2 rounded-lg">{uploadError}</p>}
                    <Button onClick={handleUpload} disabled={uploading || !uploadFile} className="w-full flex items-center gap-2">
                      {uploading ? <><Loader2 size={14} className="animate-spin" /> Uploading...</> : <><Upload size={14} /> Upload Report</>}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  )
}

export default DoctorPublicProfile
