import { useUser, useClerk, useAuth } from '@clerk/clerk-react'
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { usePatientDashboard } from '@/hooks/usePatientDashboard'
import { useSyncUser } from '@/hooks/useSyncUser'
import { apiFetch } from '@/lib/api'
import {
  HeartPulse, Search, CalendarPlus, Video, FileText,
  Pill, Truck, Bell, History, CalendarDays, CheckCircle,
  Clock, ChevronRight, Loader2, Camera, UserCircle, X, MapPin,
  Stethoscope, Copy, MessageSquare
} from 'lucide-react'

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'

const TIMES = ['09:00 AM','09:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM',
  '12:00 PM','12:30 PM','02:00 PM','02:30 PM','03:00 PM','03:30 PM','04:00 PM','04:30 PM']

const defaultForm = { doctorId: '', date: '', time: '', reason: '', symptoms: '', consultationType: 'in-person' }

const statusStyle = {
  Confirmed: 'bg-green-100 text-green-700',
  Pending:   'bg-yellow-100 text-yellow-700',
  Cancelled: 'bg-red-100 text-red-700',
  Completed: 'bg-blue-100 text-blue-700',
}

const StatCard = ({ icon: Icon, label, value, color, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full text-left rounded-2xl border transition-all bg-white ${
      active ? 'border-blue-400 shadow-md ring-2 ring-blue-100' : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
    }`}
  >
    <div className="flex items-center gap-4 p-5">
      <div className={`p-3 rounded-full ${color}`}>
        <Icon size={22} strokeWidth={1.5} />
      </div>
      <div className="flex-1">
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
      </div>
      <ChevronRight size={16} className={`text-gray-300 transition-transform ${active ? 'rotate-90 text-blue-400' : ''}`} />
    </div>
  </button>
)

const AppointmentPanel = ({ title, appointments, onClose }) => (
  <div className="col-span-2 lg:col-span-3 bg-blue-50 border border-blue-100 rounded-2xl p-4">
    <div className="flex items-center justify-between mb-3">
      <p className="text-sm font-semibold text-blue-700">{title}</p>
      <button onClick={onClose} className="text-blue-400 hover:text-blue-600"><X size={15} /></button>
    </div>
    {appointments.length === 0 ? (
      <p className="text-sm text-gray-400 py-2">No appointments in this category.</p>
    ) : (
      <div className="flex flex-col gap-2">
        {appointments.map(appt => (
          <div key={appt._id} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-blue-100">
            <div>
              <p className="text-sm font-medium text-gray-900">Dr. {appt.doctor?.firstName} {appt.doctor?.lastName}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {appt.doctor?.specialty && <span className="mr-2">{appt.doctor.specialty}</span>}
                {new Date(appt.date).toLocaleDateString()} — {appt.time}
              </p>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusStyle[appt.status]}`}>{appt.status}</span>
          </div>
        ))}
      </div>
    )}
  </div>
)

const quickActions = [
  { icon: Search,       label: 'Find My Doctors',   color: 'bg-indigo-50 text-indigo-600'},
  { icon: Video,        label: 'Join Consultation', color: 'bg-purple-50 text-purple-600'},
  { icon: FileText,     label: 'Upload Reports',    color: 'bg-orange-50 text-orange-600'},
  { icon: Pill,         label: 'My Prescriptions',  color: 'bg-pink-50 text-pink-600'    },
  { icon: Truck,        label: 'Order Medicines',   color: 'bg-teal-50 text-teal-600'    },
  { icon: Bell,         label: 'Reminders',         color: 'bg-yellow-50 text-yellow-600'},
  { icon: History,      label: 'History',           color: 'bg-gray-100 text-gray-600'   },
  { icon: CalendarPlus, label: 'Book Appointment',  color: 'bg-green-50 text-green-600'  },
  { icon: MessageSquare,label: 'Chat',              color: 'bg-blue-50 text-blue-600'    },
]

const HistoryModal = ({ onClose }) => {
  const { getToken } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  const FILTERS = ['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled']

  useEffect(() => {
    apiFetch('/patients/appointments', getToken)
      .then(setAppointments)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'All' ? appointments : appointments.filter(a => a.status === filter)
  const counts = FILTERS.reduce((acc, f) => {
    acc[f] = f === 'All' ? appointments.length : appointments.filter(a => a.status === f).length
    return acc
  }, {})

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <p className="font-semibold text-gray-900">My Appointment History</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="flex gap-2 px-6 pt-4 flex-wrap">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                filter === f ? 'bg-blue-600 text-white' : 'border border-gray-200 text-gray-600 hover:border-blue-400'
              }`}>
              {f} ({counts[f]})
            </button>
          ))}
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-3">
          {loading && <div className="flex items-center gap-2 text-gray-400 py-8 justify-center"><Loader2 size={16} className="animate-spin" /> Loading...</div>}
          {!loading && filtered.length === 0 && <p className="text-sm text-gray-400 text-center py-8">No appointments found.</p>}
          {!loading && filtered.map(appt => (
            <div key={appt._id} className="border rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {appt.doctor?.profileImage
                    ? <img src={appt.doctor.profileImage} className="w-9 h-9 rounded-full object-cover border" alt="doc" />
                    : <div className="w-9 h-9 rounded-full bg-blue-50 border flex items-center justify-center"><UserCircle size={20} className="text-blue-300" /></div>
                  }
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{appt.doctor?.title} {appt.doctor?.firstName} {appt.doctor?.lastName}</p>
                    <p className="text-xs text-blue-600">{appt.doctor?.specialty}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyle[appt.status]}`}>{appt.status}</span>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1"><CalendarDays size={11} /> {new Date(appt.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                <span className="flex items-center gap-1"><Clock size={11} /> {appt.time}</span>
                <span className="capitalize">· {appt.consultationType}</span>
              </div>
              {appt.reason && <p className="text-xs text-gray-500">Reason: {appt.reason}</p>}
              {appt.diagnosis && <p className="text-xs text-gray-500">Diagnosis: {appt.diagnosis}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const PrescriptionsModal = ({ onClose }) => {
  const { getToken } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch('/patients/appointments', getToken)
      .then(data => setAppointments(data.filter(a => a.prescription?.length > 0)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <p className="font-semibold text-gray-900">My Prescriptions</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          {loading && <div className="flex items-center gap-2 text-gray-400 py-8 justify-center"><Loader2 size={16} className="animate-spin" /> Loading...</div>}
          {!loading && appointments.length === 0 && <p className="text-sm text-gray-400 text-center py-8">No prescriptions yet.</p>}
          {!loading && appointments.map(appt => (
            <div key={appt._id} className="border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{appt.doctor?.title} {appt.doctor?.firstName} {appt.doctor?.lastName}</p>
                  <p className="text-xs text-gray-400">{new Date(appt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {appt.doctor?.specialty}</p>
                </div>
                {appt.diagnosis && <p className="text-xs text-gray-500 max-w-[140px] text-right">{appt.diagnosis}</p>}
              </div>
              <div className="space-y-2">
                {appt.prescription.map((p, i) => (
                  <div key={i} className="bg-blue-50 rounded-lg px-3 py-2 grid grid-cols-2 gap-x-4 gap-y-1">
                    <p className="text-xs font-semibold text-blue-800 col-span-2">{p.medicine}</p>
                    {p.dosage && <p className="text-xs text-gray-500">Dosage: {p.dosage}</p>}
                    {p.duration && <p className="text-xs text-gray-500">Duration: {p.duration}</p>}
                    {p.notes && <p className="text-xs text-gray-400 col-span-2">{p.notes}</p>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const JoinConsultationModal = ({ onClose, navigate }) => {
  const { getToken } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch('/patients/appointments', getToken)
      .then(data => setAppointments(data.filter(a => a.status === 'Confirmed')))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <Video size={18} className="text-purple-600" />
            <p className="font-semibold text-gray-900">Join Consultation</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-3">
          {loading && <div className="flex items-center gap-2 text-gray-400 py-8 justify-center"><Loader2 size={16} className="animate-spin" /> Loading...</div>}
          {!loading && appointments.length === 0 && (
            <div className="text-center py-8 space-y-2">
              <Video size={32} className="text-gray-300 mx-auto" />
              <p className="text-sm text-gray-400">No confirmed consultations available.</p>
              <p className="text-xs text-gray-400">Appointments must be confirmed by the doctor before joining.</p>
            </div>
          )}
          {!loading && appointments.map(appt => (
            <div key={appt._id} className="border rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                {appt.doctor?.profileImage
                  ? <img src={appt.doctor.profileImage} className="w-10 h-10 rounded-full object-cover border" alt="doc" />
                  : <div className="w-10 h-10 rounded-full bg-purple-50 border flex items-center justify-center"><UserCircle size={22} className="text-purple-300" /></div>
                }
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{appt.doctor?.title} {appt.doctor?.firstName} {appt.doctor?.lastName}</p>
                  <p className="text-xs text-gray-400">{new Date(appt.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · {appt.time}</p>
                  <p className="text-xs text-purple-600 capitalize">{appt.consultationType}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { onClose(); navigate(`/video/${appt._id}`) }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 font-medium"
                >
                  <Video size={13} /> Video Call
                </button>
                <button
                  onClick={() => { onClose(); navigate(`/consultation/${appt._id}`) }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 font-medium"
                >
                  Join Consultation
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}


const UploadReportsModal = ({ onClose }) => {
  const { getToken } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading]           = useState(true)
  const [selectedId, setSelectedId]     = useState('')
  const [files, setFiles]               = useState([])
  const [uploading, setUploading]       = useState(false)
  const [success, setSuccess]           = useState(false)
  const [error, setError]               = useState(null)
  const inputRef = useRef(null)

  useEffect(() => {
    apiFetch('/patients/appointments', getToken)
      .then(data => setAppointments(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files)
    setFiles(selected)
    setSuccess(false)
    setError(null)
  }

  const handleUpload = async () => {
    if (!selectedId) return setError('Please select an appointment.')
    if (files.length === 0) return setError('Please select at least one file.')
    setUploading(true)
    setError(null)
    try {
      const base64s = await Promise.all(files.map(file => new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })))
      await apiFetch(`/patients/appointments/${selectedId}/reports`, getToken, {
        method: 'POST',
        body: JSON.stringify({ reports: base64s }),
      })
      setSuccess(true)
      setFiles([])
      if (inputRef.current) inputRef.current.value = ''
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-orange-500" />
            <p className="font-semibold text-gray-900">Upload Reports</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Select appointment */}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Link to Appointment</label>
            {loading ? (
              <div className="flex items-center gap-2 text-gray-400 text-sm"><Loader2 size={14} className="animate-spin" /> Loading...</div>
            ) : (
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={selectedId}
                onChange={e => setSelectedId(e.target.value)}
              >
                <option value="">Select an appointment (optional)</option>
                {appointments.map(a => (
                  <option key={a._id} value={a._id}>
                    Dr. {a.doctor?.firstName} {a.doctor?.lastName} — {new Date(a.date).toLocaleDateString()} {a.time}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* File picker */}
          <div
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
          >
            <FileText size={28} className="text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">
              {files.length > 0
                ? <span className="text-blue-600 font-medium">{files.length} file{files.length > 1 ? 's' : ''} selected</span>
                : 'Click to select files'}
            </p>
            <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG supported</p>
            <input ref={inputRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFiles} />
          </div>

          {/* Selected file names */}
          {files.length > 0 && (
            <ul className="space-y-1">
              {files.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-1.5">
                  <FileText size={12} className="text-orange-400 shrink-0" />
                  <span className="truncate">{f.name}</span>
                  <span className="text-gray-400 shrink-0">({(f.size / 1024).toFixed(0)} KB)</span>
                </li>
              ))}
            </ul>
          )}

          {error && <p className="text-red-500 text-xs">{error}</p>}
          {success && <p className="text-green-600 text-xs font-medium">✓ Reports uploaded successfully!</p>}

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">Close</button>
            <button
              onClick={handleUpload}
              disabled={uploading || files.length === 0}
              className="flex-1 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {uploading ? <><Loader2 size={14} className="animate-spin" /> Uploading...</> : 'Upload Reports'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const BookingModal = ({ onClose, onBooked }) => {
  const { getToken } = useAuth()
  const [doctors, setDoctors] = useState([])
  const [loadingDocs, setLoadingDocs] = useState(true)
  const [form, setForm] = useState(defaultForm)
  const [booking, setBooking] = useState(false)
  const [bookError, setBookError] = useState(null)
  const [bookedAppt, setBookedAppt] = useState(null)

  useEffect(() => {
    apiFetch('/doctors/list', null)
      .then(setDoctors)
      .finally(() => setLoadingDocs(false))
  }, [])

  const handleBook = async (e) => {
    e.preventDefault()
    if (!form.doctorId || !form.date || !form.time) return setBookError('Please fill all required fields.')
    setBooking(true)
    setBookError(null)
    try {
      const appt = await apiFetch('/patients/appointments/book', getToken, {
        method: 'POST',
        body: JSON.stringify({
          doctorId: form.doctorId,
          date: form.date,
          time: form.time,
          reason: form.reason,
          symptoms: form.symptoms,
          consultationType: form.consultationType,
        }),
      })
      setBookedAppt(appt)
      onBooked()
    } catch (err) {
      setBookError(err.message)
    } finally {
      setBooking(false)
    }
  }

  const roomLink = bookedAppt ? `${window.location.origin}/video/${bookedAppt._id}` : null
  const [copied, setCopied] = useState(false)
  const copyLink = () => {
    navigator.clipboard.writeText(roomLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <p className="font-semibold text-gray-900">Book Appointment</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        {bookedAppt ? (
          <div className="px-6 py-8 space-y-4">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle size={28} className="text-green-500" />
              </div>
              <p className="font-semibold text-gray-900">Appointment Booked!</p>
              <p className="text-sm text-gray-500">Your request has been sent. You'll be notified once confirmed.</p>
            </div>

            {(form.consultationType === 'video' || form.consultationType === 'audio') && roomLink && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-purple-700 flex items-center gap-1.5">
                  <Video size={13} /> Video Call Room Link
                </p>
                <p className="text-xs text-purple-800 font-mono break-all">{roomLink}</p>
                <p className="text-xs text-gray-500">Share this link with your doctor so you can both join the call instantly.</p>
                <div className="flex gap-2">
                  <button
                    onClick={copyLink}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
                      copied ? 'bg-green-500 text-white' : 'bg-white border border-purple-300 text-purple-600 hover:bg-purple-50'
                    }`}
                  >
                    {copied ? '✓ Copied!' : 'Copy Link'}
                  </button>
                  <a
                    href={roomLink}
                    target="_blank"
                    rel="noreferrer"
                    onClick={onClose}
                    className="flex-1 py-2 text-xs font-semibold rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-center"
                  >
                    Join Now
                  </a>
                </div>
              </div>
            )}

            <button onClick={onClose} className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">Done</button>
          </div>
        ) : (
          <form onSubmit={handleBook} className="px-6 py-5 space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Select Doctor *</label>
              {loadingDocs ? (
                <div className="flex items-center gap-2 text-gray-400 text-sm"><Loader2 size={14} className="animate-spin" /> Loading doctors...</div>
              ) : (
                <select
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  value={form.doctorId}
                  onChange={e => setForm(f => ({ ...f, doctorId: e.target.value }))}
                  required
                >
                  <option value="">Choose a doctor</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.title} {d.firstName} {d.lastName}{d.specialty ? ` — ${d.specialty}` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Date *</label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Time *</label>
                <select
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  value={form.time}
                  onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                  required
                >
                  <option value="">Select time</option>
                  {TIMES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Consultation Type</label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                value={form.consultationType}
                onChange={e => setForm(f => ({ ...f, consultationType: e.target.value }))}
              >
                <option value="in-person">In-Person</option>
                <option value="video">Video</option>
                <option value="audio">Audio</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Reason for Visit</label>
              <input
                type="text"
                placeholder="e.g. Routine checkup"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                value={form.reason}
                onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Symptoms (optional)</label>
              <textarea
                rows={2}
                placeholder="Describe your symptoms..."
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                value={form.symptoms}
                onChange={e => setForm(f => ({ ...f, symptoms: e.target.value }))}
              />
            </div>

            {bookError && <p className="text-red-500 text-xs">{bookError}</p>}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose} className="flex-1 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button
                type="submit"
                disabled={booking}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {booking && <Loader2 size={14} className="animate-spin" />}
                {booking ? 'Booking...' : 'Confirm Booking'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

const parseApptDateTime = (date, time) => {
  // time like "09:00 AM" or "02:30 PM"
  const base = new Date(date)
  const [timePart, meridiem] = time.split(' ')
  let [hours, minutes] = timePart.split(':').map(Number)
  if (meridiem === 'PM' && hours !== 12) hours += 12
  if (meridiem === 'AM' && hours === 12) hours = 0
  base.setHours(hours, minutes, 0, 0)
  return base
}

const playAlarm = () => {
  const ctx = new (window.AudioContext || window.webkitAudioContext)()
  const beep = (freq, start, duration) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = freq
    osc.type = 'sine'
    gain.gain.setValueAtTime(0.4, ctx.currentTime + start)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration)
    osc.start(ctx.currentTime + start)
    osc.stop(ctx.currentTime + start + duration)
  }
  beep(880, 0,    0.2)
  beep(880, 0.25, 0.2)
  beep(880, 0.5,  0.2)
  beep(1100, 0.8, 0.4)
}

const DoctorBookingModal = ({ doctor, userId, onClose }) => {
  const TIMES_LIST = ['09:00 AM','09:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM',
    '12:00 PM','12:30 PM','02:00 PM','02:30 PM','03:00 PM','03:30 PM','04:00 PM','04:30 PM']
  const [step, setStep]     = useState(1)
  const [form, setForm]     = useState({ date: '', time: '', reason: '', symptoms: '', consultationType: 'video' })
  const [booking, setBooking] = useState(false)
  const [error, setError]   = useState(null)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleBook = async () => {
    setBooking(true); setError(null)
    try {
      await apiFetch('/patients/appointments/book', userId, {
        method: 'POST',
        body: JSON.stringify({ doctorId: doctor.id, ...form }),
      })
      setStep(3)
    } catch (err) { setError(err.message) }
    finally { setBooking(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
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

        {step === 1 && (
          <div className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Date *</label>
                <input type="date" min={new Date().toISOString().split('T')[0]}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={form.date} onChange={set('date')} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Time *</label>
                <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={form.time} onChange={set('time')}>
                  <option value="">Select time</option>
                  {TIMES_LIST.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Consultation Type</label>
              <div className="grid grid-cols-3 gap-2">
                {[{v:'video',label:'Video'},{v:'audio',label:'Audio'},{v:'in-person',label:'In-Person'}].map(({v,label}) => (
                  <button key={v} type="button" onClick={() => setForm(f => ({...f, consultationType: v}))}
                    className={`py-2 rounded-xl border text-xs font-medium transition-colors ${
                      form.consultationType === v ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-500 hover:border-blue-300'
                    }`}>{label}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Reason</label>
              <input type="text" placeholder="e.g. Routine checkup"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={form.reason} onChange={set('reason')} />
            </div>
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={() => { if (!form.date || !form.time) return setError('Select date and time.'); setError(null); setStep(2) }}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Next →</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="px-6 py-5 space-y-4">
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Doctor</span><span className="font-medium">{doctor.title} {doctor.firstName} {doctor.lastName}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Date</span><span className="font-medium">{new Date(form.date).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Time</span><span className="font-medium">{form.time}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Type</span><span className="font-medium capitalize">{form.consultationType}</span></div>
            </div>
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">← Back</button>
              <button onClick={handleBook} disabled={booking}
                className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60 flex items-center justify-center gap-2">
                {booking ? <><Loader2 size={14} className="animate-spin" /> Booking...</> : 'Confirm'}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="px-6 py-10 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <CheckCircle size={28} className="text-green-500" />
            </div>
            <p className="font-semibold text-gray-900">Appointment Booked!</p>
            <p className="text-sm text-gray-500">Request sent to {doctor.firstName} {doctor.lastName}.</p>
            <button onClick={onClose} className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">Done</button>
          </div>
        )}
      </div>
    </div>
  )
}

const FindMyDoctorsModal = ({ onClose, navigate }) => {
  const { userId } = useAuth()
  const [doctors, setDoctors]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [specialty, setSpecialty] = useState('All')
  const [booking, setBooking]     = useState(null)

  const fetchDoctors = (q = '', spec = '') => {
    setLoading(true)
    const params = new URLSearchParams()
    if (q) params.set('search', q)
    if (spec && spec !== 'All') params.set('specialty', spec)
    apiFetch(`/doctors/list?${params}`, null)
      .then(setDoctors)
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchDoctors() }, [])

  useEffect(() => {
    const t = setTimeout(() => fetchDoctors(search, specialty), 300)
    return () => clearTimeout(t)
  }, [search, specialty])

  const dbSpecialties = ['All', ...Array.from(new Set(doctors.map(d => d.specialty).filter(Boolean))).sort()]

  const grouped = doctors.reduce((acc, doc) => {
    const key = doc.specialty || 'General'
    if (!acc[key]) acc[key] = []
    acc[key].push(doc)
    return acc
  }, {})
  const specialtyKeys = Object.keys(grouped).sort()

  const DoctorCard = ({ doc }) => {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 hover:shadow-md transition-shadow p-4">
        <div className="flex items-start gap-3 cursor-pointer" onClick={() => { onClose(); navigate(`/doctor/${doc.id}`) }}>
          {doc.profileImage
            ? <img src={doc.profileImage} alt="doctor" className="w-11 h-11 rounded-full object-cover border-2 border-blue-100 shrink-0" />
            : <div className="w-11 h-11 rounded-full bg-blue-50 border-2 border-blue-100 flex items-center justify-center text-blue-500 font-bold text-sm shrink-0">
                {doc.firstName?.[0]}{doc.lastName?.[0]}
              </div>
          }
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{doc.title} {doc.firstName} {doc.lastName}</p>
            <p className="text-xs text-blue-600">{doc.specialty}</p>
            {doc.experience > 0 && <p className="text-xs text-gray-400 mt-0.5">{doc.experience} yrs experience</p>}
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setBooking(doc)}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            <CalendarPlus size={12} /> Book
          </button>
          <button
            onClick={() => { onClose(); navigate(`/video/room_${doc.id}`) }}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            <Video size={12} /> Video Call
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-50 rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-white rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Stethoscope size={18} className="text-blue-600" />
            <p className="font-semibold text-gray-900">Find My Doctors</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        {/* Search + filter */}
        <div className="px-6 pt-4 pb-3 bg-white border-b space-y-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or specialty..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {dbSpecialties.map(s => (
              <button key={s} onClick={() => setSpecialty(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  specialty === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'
                }`}>{s}</button>
            ))}
          </div>
        </div>

        {/* Doctor list */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          {loading ? (
            <div className="flex items-center gap-2 text-gray-400 py-12 justify-center">
              <Loader2 size={18} className="animate-spin" /> Loading doctors...
            </div>
          ) : doctors.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-gray-400 gap-2">
              <Stethoscope size={36} strokeWidth={1} />
              <p className="text-sm">No doctors found.</p>
            </div>
          ) : specialty !== 'All' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {doctors.map(doc => <DoctorCard key={doc._id} doc={doc} />)}
            </div>
          ) : (
            <div className="space-y-6">
              {specialtyKeys.map(spec => (
                <div key={spec}>
                  <div className="flex items-center gap-2 mb-3">
                    <Stethoscope size={14} className="text-blue-600" />
                    <p className="text-sm font-bold text-gray-800">{spec}</p>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{grouped[spec].length}</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {grouped[spec].map(doc => <DoctorCard key={doc._id} doc={doc} />)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Inline booking modal */}
      {booking && (
        <DoctorBookingModal
          doctor={booking}
          userId={userId}
          onClose={() => setBooking(null)}
        />
      )}
    </div>
  )
}

const ChatStartModal = ({ onClose, navigate, user }) => {
  const [friendName, setFriendName] = useState('')
  const [friendEmail, setFriendEmail] = useState('')
  const [copied, setCopied] = useState(false)

  const roomId = `chat_${user?.id?.slice(-8) || Math.random().toString(36).slice(2, 8)}`
  const myName = user?.firstName || 'Me'
  const chatLink = `${window.location.origin}/chat/${roomId}?name=${encodeURIComponent(friendName || 'Friend')}`

  const copyLink = () => {
    navigator.clipboard.writeText(chatLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const startChat = () => {
    onClose()
    navigate(`/chat/${roomId}?name=${encodeURIComponent(myName)}`)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <MessageSquare size={18} className="text-blue-600" />
            <p className="font-semibold text-gray-900">Start a Chat</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-gray-500">Enter your friend's details, share the link, and start chatting instantly.</p>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Friend's Name *</label>
            <input
              type="text"
              placeholder="e.g. Dr. John"
              value={friendName}
              onChange={e => setFriendName(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Friend's Email (optional)</label>
            <input
              type="email"
              placeholder="e.g. friend@gmail.com"
              value={friendEmail}
              onChange={e => setFriendEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {friendName && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-2">
              <p className="text-xs text-blue-600 font-medium">Share this link with {friendName}:</p>
              <p className="text-xs text-blue-800 font-mono break-all">{chatLink}</p>
              <button
                onClick={copyLink}
                className={`w-full py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  copied ? 'bg-green-500 text-white' : 'bg-white border border-blue-300 text-blue-600 hover:bg-blue-50'
                }`}
              >
                {copied ? '✓ Copied!' : 'Copy Link'}
              </button>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
            <button
              onClick={startChat}
              disabled={!friendName.trim()}
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <MessageSquare size={14} /> Start Chat
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const PatientDashboard = () => {
  const { user }    = useUser()
  const { signOut } = useClerk()
  const { getToken } = useAuth()
  const navigate = useNavigate()
  const { data, loading, error, refetch } = usePatientDashboard()
  const [profileImage, setProfileImage] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [showBooking, setShowBooking]               = useState(false)
  const [showReminders, setShowReminders]           = useState(false)
  const [showHistory, setShowHistory]               = useState(false)
  const [showPrescriptions, setShowPrescriptions]   = useState(false)
  const [showJoinConsultation, setShowJoinConsultation] = useState(false)
  const [showUploadReports, setShowUploadReports]   = useState(false)
  const [showFindDoctors, setShowFindDoctors]       = useState(false)
  const [showChat, setShowChat]                     = useState(false)
  const [reminders, setReminders] = useState([])
  const [loadingReminders, setLoadingReminders] = useState(false)
  const [alarmAppt, setAlarmAppt] = useState(null)
  const [activePanel, setActivePanel] = useState(null)
  const [apptNotification, setApptNotification] = useState(null) // { status, doctorName, roomLink }
  const firedRef = useRef(new Set())
  const fileInputRef = useRef(null)
  const socketRef = useRef(null)
  useSyncUser()

  // Register patient with socket for real-time notifications
  useEffect(() => {
    if (!user?.id) return
    console.log('[Patient] Connecting socket with userId:', user.id)
    const socket = io(SOCKET_URL, { transports: ['websocket'] })
    socketRef.current = socket
    socket.on('connect', () => {
      console.log('[Patient] Socket connected:', socket.id)
      socket.emit('register', user.id)
    })
    socket.on('appointment-status', (data) => {
      console.log('[Patient] Appointment status received:', data)
      setApptNotification(data)
      refetch()
    })
    socket.on('connect_error', (err) => console.log('[Patient] Socket error:', err.message))
    return () => socket.disconnect()
  }, [user?.id])

  useEffect(() => {
    apiFetch('/patients/reminders', getToken)
      .then(setReminders)
      .catch(() => {})
  }, [getToken])

  useEffect(() => {
    if (!reminders.length) return
    const check = () => {
      const now = new Date()
      reminders.forEach(appt => {
        if (firedRef.current.has(appt._id)) return
        const apptTime = parseApptDateTime(appt.date, appt.time)
        const diff = Math.abs(now - apptTime)
        if (diff <= 60000) {
          firedRef.current.add(appt._id)
          playAlarm()
          setAlarmAppt(appt)
        }
      })
    }
    check()
    const interval = setInterval(check, 60000)
    return () => clearInterval(interval)
  }, [reminders])

  const handleImageChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = async () => {
      const base64 = reader.result
      setProfileImage(base64)
      try {
        setUploading(true)
        await apiFetch('/patients/profile-image', getToken, {
          method: 'PATCH',
          body: JSON.stringify({ profileImage: base64 }),
        })
      } finally {
        setUploading(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleQuickAction = async (label) => {
    if (label === 'Book Appointment') setShowBooking(true)
    if (label === 'Join Consultation') setShowJoinConsultation(true)
    if (label === 'Upload Reports') setShowUploadReports(true)
    if (label === 'My Prescriptions') setShowPrescriptions(true)
    if (label === 'Order Medicines') navigate('/pharmacy')
    if (label === 'History') setShowHistory(true)
    if (label === 'Find My Doctors') setShowFindDoctors(true)
    if (label === 'Chat') setShowChat(true)
    if (label === 'Reminders') {
      setShowReminders(true)
      setLoadingReminders(true)
      try {
        const data = await apiFetch('/patients/reminders', getToken)
        setReminders(data)
      } catch {}
      finally { setLoadingReminders(false) }
    }
  }

  const avatarSrc = profileImage || user?.imageUrl

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      <header className="flex items-center justify-between px-8 py-4 border-b bg-white shadow-sm">
        <div className="flex items-center gap-2 text-blue-600 font-bold text-xl">
          <HeartPulse size={24} />
          MediConnect
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm px-3 py-1 rounded-full bg-green-100 text-green-700 font-medium">Patient</span>

          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current.click()}>
            {avatarSrc
              ? <img src={avatarSrc} alt="profile" className="w-9 h-9 rounded-full object-cover border-2 border-blue-200" />
              : <UserCircle size={36} className="text-gray-400" />
            }
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {uploading ? <Loader2 size={14} className="text-white animate-spin" /> : <Camera size={14} className="text-white" />}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </div>
          <Button
            variant="outline" size="sm"
            onClick={() => { localStorage.removeItem('mediconnect_role'); signOut({ redirectUrl: '/' }) }}
          >
            Sign Out
          </Button>
        </div>
      </header>

      <main className="flex-1 px-6 py-8 max-w-6xl mx-auto w-full space-y-8">

        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, <span className="text-blue-600">{data?.patient?.firstName || user?.firstName}!</span>
          </h1>
          <p className="text-gray-500 mt-1">
            {data?.patient?.email && (
              <span className="text-xs text-gray-400 mr-3">{data.patient.email}</span>
            )}
            How are you feeling today?
          </p>
        </div>


        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {quickActions.map(({ icon: Icon, label, color, path }) => (
              <button
                key={label}
                onClick={() => handleQuickAction(label)}
                className="flex flex-col items-center gap-3 p-5 bg-white rounded-2xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className={`p-3 rounded-full ${color}`}><Icon size={22} strokeWidth={1.5} /></div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 text-center">{label}</span>
              </button>
            ))}
          </div>
        </section>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            Failed to load dashboard: {error}
          </div>
        )}

        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Overview</h2>
          {loading ? (
            <div className="flex items-center gap-2 text-gray-400 py-6">
              <Loader2 size={18} className="animate-spin" /> Loading...
            </div>
          ) : (() => {
            const recent = data?.recentAppointments || []
            const panelData = {
              total:     { title: 'All Appointments',       appointments: recent },
              completed: { title: 'Completed Appointments', appointments: recent.filter(a => a.status === 'Completed') },
              pending:   { title: 'Pending Appointments',   appointments: recent.filter(a => a.status === 'Pending') },
            }
            return (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard
                  icon={CalendarDays} label="Total Appointments" value={data?.stats?.total}
                  color="bg-blue-50 text-blue-600"
                  active={activePanel === 'total'}
                  onClick={() => setActivePanel(p => p === 'total' ? null : 'total')}
                />
                <StatCard
                  icon={CheckCircle} label="Completed" value={data?.stats?.completed}
                  color="bg-green-50 text-green-600"
                  active={activePanel === 'completed'}
                  onClick={() => setActivePanel(p => p === 'completed' ? null : 'completed')}
                />
                <StatCard
                  icon={Clock} label="Pending" value={data?.stats?.pending}
                  color="bg-yellow-50 text-yellow-600"
                  active={activePanel === 'pending'}
                  onClick={() => setActivePanel(p => p === 'pending' ? null : 'pending')}
                />
                {activePanel && (
                  <AppointmentPanel
                    title={panelData[activePanel].title}
                    appointments={panelData[activePanel].appointments}
                    onClose={() => setActivePanel(null)}
                  />
                )}
              </div>
            )
          })()}
        </section>


        {!loading && (
          <section>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Appointments</CardTitle>
                  <button
                    onClick={() => setShowHistory(true)}
                    className="text-xs text-blue-600 flex items-center gap-1 hover:underline">
                    View all <ChevronRight size={14} />
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                {data?.recentAppointments?.length === 0 && (
                  <p className="text-sm text-gray-400 py-2">No appointments yet.</p>
                )}
                {data?.recentAppointments?.map(appt => (
                  <div key={appt._id} className="flex items-center justify-between py-3 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Dr. {appt.doctor?.firstName} {appt.doctor?.lastName}
                      </p>
                      <p className="text-xs text-gray-400">
                        {appt.doctor?.specialty && <span className="mr-2">{appt.doctor.specialty}</span>}
                        {new Date(appt.date).toLocaleDateString()} — {appt.time}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusStyle[appt.status]}`}>
                      {appt.status}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        )}
      </main>

      {apptNotification && (
        <div className="fixed top-5 right-5 z-[70] bg-white border-2 border-green-400 rounded-2xl shadow-2xl p-4 w-80 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <Bell size={18} className={`shrink-0 ${apptNotification.status === 'Confirmed' ? 'text-green-500' : 'text-red-500'}`} />
              <div>
                <p className="font-semibold text-gray-900 text-sm">Appointment {apptNotification.status}!</p>
                <p className="text-xs text-gray-600 mt-0.5">{apptNotification.doctorName}</p>
                {apptNotification.status === 'Confirmed' && apptNotification.roomLink && (
                  <p className="text-xs text-green-600 mt-1">Your video call room is ready!</p>
                )}
              </div>
            </div>
            <button onClick={() => setApptNotification(null)} className="text-gray-400 hover:text-gray-600 shrink-0"><X size={15} /></button>
          </div>
          {apptNotification.status === 'Confirmed' && apptNotification.roomLink && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 font-mono break-all">{apptNotification.roomLink}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => navigator.clipboard.writeText(apptNotification.roomLink)}
                  className="flex-1 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
                >
                  Copy Link
                </button>
                <a
                  href={apptNotification.roomLink}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setApptNotification(null)}
                  className="flex-1 py-1.5 text-xs font-semibold rounded-lg bg-green-500 hover:bg-green-600 text-white text-center"
                >
                  Join Call
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {alarmAppt && (
        <div className="fixed top-24 right-5 z-[60] bg-white border-2 border-yellow-400 rounded-2xl shadow-2xl p-4 w-80">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <Bell size={20} className="text-yellow-500 shrink-0" />
              <div>
                <p className="font-semibold text-gray-900 text-sm">Appointment Now!</p>
                <p className="text-xs text-gray-600 mt-0.5">{alarmAppt.doctor.title} {alarmAppt.doctor.firstName} {alarmAppt.doctor.lastName}</p>
                <p className="text-xs text-blue-600">{alarmAppt.doctor.specialty}</p>
                <p className="text-xs text-gray-400 mt-1">{alarmAppt.time} · {alarmAppt.consultationType}</p>
              </div>
            </div>
            <button onClick={() => setAlarmAppt(null)} className="text-gray-400 hover:text-gray-600 shrink-0"><X size={16} /></button>
          </div>
        </div>
      )}
      {showJoinConsultation && <JoinConsultationModal onClose={() => setShowJoinConsultation(false)} navigate={navigate} />}
      {showUploadReports && <UploadReportsModal onClose={() => setShowUploadReports(false)} />}
      {showHistory && <HistoryModal onClose={() => setShowHistory(false)} />}
      {showPrescriptions && <PrescriptionsModal onClose={() => setShowPrescriptions(false)} />}

      {showChat && <ChatStartModal onClose={() => setShowChat(false)} navigate={navigate} user={user} />}

      {showFindDoctors && <FindMyDoctorsModal onClose={() => setShowFindDoctors(false)} navigate={navigate} />}

      {showBooking && (
        <BookingModal
          onClose={() => setShowBooking(false)}
          onBooked={refetch}
        />
      )}

      {showReminders && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div className="flex items-center gap-2">
                <Bell size={18} className="text-yellow-500" />
                <p className="font-semibold text-gray-900">Upcoming Consultations</p>
              </div>
              <button onClick={() => setShowReminders(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-3">
              {loadingReminders && (
                <div className="flex items-center gap-2 text-gray-400 py-6 justify-center">
                  <Loader2 size={16} className="animate-spin" /> Loading reminders...
                </div>
              )}
              {!loadingReminders && reminders.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-6">No upcoming appointments.</p>
              )}
              {!loadingReminders && reminders.map(appt => {
                const apptDate = new Date(appt.date)
                const today = new Date()
                today.setHours(0,0,0,0)
                const diffDays = Math.ceil((apptDate - today) / (1000 * 60 * 60 * 24))
                const urgency = diffDays === 0 ? 'bg-red-50 border-red-200' : diffDays <= 2 ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'
                const badge = diffDays === 0 ? 'Today' : diffDays === 1 ? 'Tomorrow' : `In ${diffDays} days`
                const badgeColor = diffDays === 0 ? 'bg-red-100 text-red-700' : diffDays <= 2 ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
                return (
                  <div key={appt._id} className={`rounded-xl border p-4 ${urgency}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        {appt.doctor.profileImage
                          ? <img src={appt.doctor.profileImage} className="w-10 h-10 rounded-full object-cover border" alt="doc" />
                          : <div className="w-10 h-10 rounded-full bg-white border flex items-center justify-center"><UserCircle size={22} className="text-blue-300" /></div>
                        }
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{appt.doctor.title} {appt.doctor.firstName} {appt.doctor.lastName}</p>
                          <p className="text-xs text-blue-600">{appt.doctor.specialty}</p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${badgeColor}`}>{badge}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><CalendarDays size={12} /> {apptDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                      <span className="flex items-center gap-1"><Clock size={12} /> {appt.time}</span>
                      <span className="flex items-center gap-1"><MapPin size={12} /> {appt.consultationType}</span>
                    </div>
                    {appt.reason && <p className="mt-2 text-xs text-gray-400">Reason: {appt.reason}</p>}
                    <div className="mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyle[appt.status]}`}>{appt.status}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PatientDashboard
