import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { apiFetch } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { HeartPulse, Search, MapPin, Briefcase, ArrowLeft, Loader2, UserCircle, X } from 'lucide-react'

const SPECIALTIES = ['All', 'General Physician', 'Cardiologist', 'Neurologist', 'Dermatologist',
  'Orthopedic Surgeon', 'Pediatrician', 'Psychiatrist', 'Gynecologist', 'Endocrinologist', 'Ophthalmologist']

const TIMES = ['09:00 AM','09:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM',
  '12:00 PM','12:30 PM','02:00 PM','02:30 PM','03:00 PM','03:30 PM','04:00 PM','04:30 PM']

const defaultForm = { date: '', time: '', reason: '', symptoms: '', consultationType: 'in-person' }

const FindDoctors = () => {
  const navigate = useNavigate()
  const { user } = useUser()
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [specialty, setSpecialty] = useState('All')

  const [selectedDoc, setSelectedDoc] = useState(null)
  const [form, setForm] = useState(defaultForm)
  const [booking, setBooking] = useState(false)
  const [bookError, setBookError] = useState(null)
  const [bookSuccess, setBookSuccess] = useState(false)

  useEffect(() => {
    apiFetch('/doctors/list', null)
      .then(setDoctors)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = doctors.filter(d => {
    const matchSearch = `${d.firstName} ${d.lastName} ${d.specialty} ${d.location}`
      .toLowerCase().includes(search.toLowerCase())
    const matchSpecialty = specialty === 'All' || d.specialty === specialty
    return matchSearch && matchSpecialty
  })

  const openModal = (doc) => {
    setSelectedDoc(doc)
    setForm(defaultForm)
    setBookError(null)
    setBookSuccess(false)
  }

  const closeModal = () => { setSelectedDoc(null); setBookSuccess(false) }

  const handleBook = async (e) => {
    e.preventDefault()
    if (!form.date || !form.time) return setBookError('Please select a date and time.')
    setBooking(true)
    setBookError(null)
    try {
      await apiFetch('/patients/appointments/book', user.id, {
        method: 'POST',
        body: JSON.stringify({
          doctorId: selectedDoc._id,
          date: form.date,
          time: form.time,
          reason: form.reason,
          symptoms: form.symptoms,
          consultationType: form.consultationType,
        }),
      })
      setBookSuccess(true)
    } catch (err) {
      setBookError(err.message)
    } finally {
      setBooking(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="flex items-center justify-between px-8 py-4 border-b bg-white shadow-sm">
        <div className="flex items-center gap-2 text-blue-600 font-bold text-xl">
          <HeartPulse size={24} /> MediConnect
        </div>
        <button onClick={() => navigate('/patient-dashboard')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600">
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
      </header>

      <main className="flex-1 px-6 py-8 max-w-6xl mx-auto w-full space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Find Doctors</h1>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="Search by name, specialty, location..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            value={specialty}
            onChange={e => setSpecialty(e.target.value)}
          >
            {SPECIALTIES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-gray-400 py-10 justify-center">
            <Loader2 size={18} className="animate-spin" /> Loading doctors...
          </div>
        )}
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {!loading && !error && filtered.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-10">No doctors found.</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(doc => (
            <Card key={doc._id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-5 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  {doc.profileImage
                    ? <img src={doc.profileImage} alt="profile" className="w-12 h-12 rounded-full object-cover border" />
                    : <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center"><UserCircle size={28} className="text-blue-300" /></div>
                  }
                  <div>
                    <p className="font-semibold text-gray-900">{doc.title} {doc.firstName} {doc.lastName}</p>
                    <p className="text-xs text-blue-600">{doc.specialty}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><MapPin size={12} /> {doc.location || '—'}</span>
                  <span className="flex items-center gap-1"><Briefcase size={12} /> {doc.experience} yrs experience</span>
                </div>
                {doc.bio && <p className="text-xs text-gray-400 line-clamp-2">{doc.bio}</p>}
                <button
                  onClick={() => openModal(doc)}
                  className="mt-1 w-full py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Book Appointment
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      {/* Booking Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <p className="font-semibold text-gray-900">
                  {selectedDoc.title} {selectedDoc.firstName} {selectedDoc.lastName}
                </p>
                <p className="text-xs text-blue-600">{selectedDoc.specialty}</p>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            {bookSuccess ? (
              <div className="px-6 py-10 text-center space-y-3">
                <div className="text-green-500 text-4xl">✓</div>
                <p className="font-semibold text-gray-900">Appointment Booked!</p>
                <p className="text-sm text-gray-500">Your appointment request has been sent. You'll be notified once confirmed.</p>
                <button onClick={closeModal} className="mt-2 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleBook} className="px-6 py-5 space-y-4">
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
                  <button type="button" onClick={closeModal} className="flex-1 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">
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
      )}
    </div>
  )
}

export default FindDoctors
